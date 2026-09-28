// Data management: download a backup (plain or password-encrypted), restore one, or erase everything.
// All of it happens in this browser: files are built and read locally and never uploaded.
import { useRef, useState } from 'react'
import { cleaned, backupName, decryptBackup, encryptBackup, makeBackup, orphans, parseFile, validate, type Backup, type EncryptedBackup } from '../lib/backup'
import { downloadFile, plural, shortDate, timeAgo } from '../lib/format'
import { STORES, type StoreName } from '../lib/model'
import { getProfile, saveProfile } from '../lib/profile'
import { batch, exportAll, flushAll, replaceData } from '../lib/store'
import { LOOK_KEY } from '../lib/theme'
import { sampleData } from '../lib/sample'
import { confirmDialog, toast } from './dialogs'
import { Icon } from './icons'

const LABEL: Record<StoreName, string> = {
  settings: 'Settings', classes: 'Classes', students: 'Students', assignments: 'Assignments', grades: 'Grades', attendance: 'Attendance records',
  skills: 'Skills', goals: 'Goals', notes: 'Notes', tasks: 'Tasks & events', activity: 'Activity entries',
}
const SHOWN: StoreName[] = ['classes', 'students', 'assignments', 'grades', 'attendance', 'goals', 'notes', 'tasks']

export function Counts({ counts }: { counts: Partial<Record<StoreName, number>> }) {
  return <div className="counts">{SHOWN.map((s) => <div key={s}>{LABEL[s]}: <b>{counts[s] || 0}</b></div>)}</div>
}
const countsOf = (d: Partial<Record<StoreName, any[]>>) => Object.fromEntries(STORES.map((s) => [s, d[s]?.length || 0])) as Record<StoreName, number>

export function downloadBackup() {
  flushAll()
  const b = makeBackup(exportAll())
  downloadFile(backupName(), JSON.stringify(b, null, 1), 'application/json')
  saveProfile({ lastBackupAt: b.exportedAt })
  toast('Backup downloaded to this device')
}

export function BackupPanel() {
  const [pw, setPw] = useState(''), [pw2, setPw2] = useState(''), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const last = getProfile().lastBackupAt
  const encrypted = async () => {
    setErr('')
    if (pw.length < 8) { setErr('Use a password of at least 8 characters.'); return }
    if (pw !== pw2) { setErr('The two passwords don’t match.'); return }
    setBusy(true)
    try {
      flushAll()
      const b = makeBackup(exportAll())
      const e = await encryptBackup(b, pw)
      downloadFile(backupName(true), JSON.stringify(e), 'application/json')
      saveProfile({ lastBackupAt: b.exportedAt })
      setPw(''); setPw2('')
      toast('Encrypted backup downloaded')
    } catch (e: any) { setErr(String(e?.message || e)) } finally { setBusy(false) }
  }
  return (
    <div className="stack">
      <p className="sub" style={{ margin: 0 }}>A backup is one file with everything in the app: classes, students, grades, attendance, goals, notes, tasks and settings.
        Keep it somewhere safe, like a USB drive or your own cloud folder. {last ? <>Your last backup was <b>{timeAgo(last)}</b>.</> : <b>You haven’t made a backup yet.</b>}</p>
      <div className="row"><button className="btn-primary" onClick={downloadBackup}><span className="row" style={{ gap: 8 }}>Download backup</span></button><span className="hint">Saves {backupName()}</span></div>
      <div className="plan" style={{ marginTop: 6 }}>
        <div className="plan-l">Encrypted backup</div>
        <p className="sub" style={{ margin: '0 0 10px' }}>Locks the backup with a password, on this device, before it’s saved. Without the password nobody can open it — not even the app’s maker. <b>If you forget the password, the backup can’t be recovered.</b></p>
        <div className="form-grid">
          <label>Password<input className="fld" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label>Type it again<input className="fld" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && encrypted()} /></label>
          <div><button className="btn-ghost" disabled={busy} onClick={encrypted}>{busy ? 'Encrypting…' : 'Download encrypted backup'}</button></div>
        </div>
        {err && <div className="login-err" style={{ textAlign: 'left', marginTop: 8 }}>{err}</div>}
      </div>
    </div>
  )
}

/** Choose a backup file → check it → (password if encrypted) → see what's in it → confirm → replace. */
export function RestorePanel({ onDone }: { onDone?: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [err, setErr] = useState('')
  const [file, setFile] = useState('')
  const [enc, setEnc] = useState<EncryptedBackup | null>(null)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState<Backup | null>(null)

  const read = async (f: File | undefined) => {
    setErr(''); setEnc(null); setReady(null); setPw('')
    if (!f) return
    setFile(f.name)
    if (f.size > 200 * 1024 * 1024) { setErr('That file is too large to be a backup from this app.'); return }
    try {
      const p = parseFile(await f.text())
      if (p.kind === 'encrypted') setEnc(p.enc); else setReady(p.backup)
    } catch (e: any) { setErr(String(e?.message || e)) }
  }
  const unlock = async () => {
    if (!enc) return
    setBusy(true); setErr('')
    try { setReady(validate(await decryptBackup(enc, pw))); setEnc(null); setPw('') } catch (e: any) { setErr(String(e?.message || e)) } finally { setBusy(false) }
  }
  const restore = async () => {
    if (!ready) return
    const current = countsOf(exportAll())
    const hasData = SHOWN.some((s) => current[s] > 0)
    const ok = await confirmDialog({
      title: hasData ? 'Replace everything with this backup?' : 'Restore this backup?', danger: hasData, confirm: hasData ? 'Replace my data' : 'Restore',
      body: hasData ? <>
        <p>Everything currently in the app on this device will be <b>replaced</b> by the backup from {shortDate(ready.exportedAt, true)}. This can’t be undone.</p>
        <div className="plan-l">In the app now</div><Counts counts={current} />
        <div className="plan-l" style={{ marginTop: 8 }}>In the backup</div><Counts counts={countsOf(ready.data)} />
      </> : <p>The backup from {shortDate(ready.exportedAt, true)} will be loaded into the app.</p>,
      extra: hasData ? <p style={{ marginTop: 8 }}><button className="linkbtn" onClick={downloadBackup}>Download a backup of what’s here now first</button></p> : undefined,
    })
    if (!ok) return
    setBusy(true)
    try {
      await replaceData(cleaned(ready))
      batch((b) => b.log('restored', 'settings', null, `Restored a backup from ${shortDate(ready.exportedAt, true)}`))
      toast('Backup restored')
      setReady(null); setFile('')
      onDone?.()
    } catch (e: any) { setErr('The backup couldn’t be restored, so nothing was changed. ' + String(e?.message || e)) } finally { setBusy(false) }
  }
  const o = ready ? orphans(ready) : null

  return (
    <div className="stack">
      <div className={'drop' + (over ? ' over' : '')} role="button" tabIndex={0}
        onClick={() => input.current?.click()} onKeyDown={(e) => e.key === 'Enter' && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files[0]) }}>
        <Icon name="upload" width={1.6} />
        <b>{file || 'Choose a backup file'}</b>
        <span className="hint">or drop it here · {`${backupName().replace(/\d{4}-\d{2}-\d{2}/, 'YYYY-MM-DD')}`}</span>
        <input ref={input} type="file" accept=".json,application/json" hidden onChange={(e) => { read(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {err && <div className="error-box">{err}</div>}
      {enc && (
        <div className="plan">
          <div className="plan-l">This backup is encrypted</div>
          <div className="row"><input className="fld" style={{ maxWidth: 280 }} type="password" placeholder="Backup password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && unlock()} aria-label="Backup password" />
            <button className="btn-primary" disabled={busy || !pw} onClick={unlock}>{busy ? 'Unlocking…' : 'Unlock'}</button></div>
          <p className="hint" style={{ marginTop: 6 }}>The password is checked on this device only.</p>
        </div>
      )}
      {ready && (
        <div className="plan">
          <div className="plan-l">Backup checked — ready to restore</div>
          <div className="sub">Made {new Date(ready.exportedAt).toLocaleString()} {ready.app ? `· ${ready.app}` : ''}</div>
          <Counts counts={countsOf(ready.data)} />
          {o && o.total > 0 && <div className="band-note" style={{ marginTop: 6 }}>{plural(o.total, 'record')} in this backup point to a class, student or assignment that isn’t in it, and will be left out.</div>}
          <div className="row" style={{ marginTop: 10 }}><button className="btn-primary" disabled={busy} onClick={restore}>{busy ? 'Restoring…' : 'Restore this backup'}</button><button className="btn-ghost" onClick={() => { setReady(null); setFile('') }}>Cancel</button></div>
        </div>
      )}
    </div>
  )
}

export function ResetPanel() {
  const reset = async () => {
    const ok = await confirmDialog({
      title: 'Erase all data on this device?', danger: true, confirm: 'Erase everything', typed: 'RESET',
      body: <p>Every class, student, grade, attendance record, goal, note, task and setting will be permanently deleted from this browser. There is no copy anywhere else unless you downloaded a backup.</p>,
      extra: <p><button className="linkbtn" onClick={downloadBackup}>Download a backup first</button></p>,
    })
    if (!ok) return
    // The demo starts over with a fresh sample classroom instead of an empty app.
    await replaceData(__DEMO__ ? sampleData() : {})
    try { Object.keys(localStorage).filter((k) => k.startsWith('declara_teacher') && k !== LOOK_KEY).forEach((k) => localStorage.removeItem(k)) } catch { /* private mode */ }
    location.hash = '#/'
  }
  return (
    <div className="stack">
      <p className="sub" style={{ margin: 0 }}>{__DEMO__ ? 'Throws away every change and reloads a fresh sample classroom.' : 'Removes everything this app has saved in this browser and starts over at the welcome screen. Your theme choice is kept.'}</p>
      <div><button className="btn-danger" onClick={reset}><span className="row" style={{ gap: 8 }}>Reset the app…</span></button></div>
    </div>
  )
}
