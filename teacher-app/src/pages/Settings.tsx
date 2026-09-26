// Settings, laid out like Declara's: a band with the current look, underlined tabs, then the section.
import { useEffect, useState } from 'react'
import { BackupPanel, ResetPanel, RestorePanel } from '../components/BackupTools'
import { toast } from '../components/dialogs'
import { AutoNumber, AutoText, Field, PageHead } from '../components/ui'
import { DB_NAME } from '../lib/db'
import { plural } from '../lib/format'
import { DEFAULT_LETTERS, STORES, type Profile } from '../lib/model'
import { askNotificationPermission } from '../lib/notify'
import { saveProfile, useProfile } from '../lib/profile'
import { useParam } from '../lib/queries'
import { exportAll, isPersistent, useDB } from '../lib/store'
import { availableThemes, FONTS, getLook, onLook, saveLook, THEMES, type Look } from '../lib/theme'

type Tab = 'profile' | 'grading' | 'appearance' | 'notifications' | 'data' | 'privacy'
const TABS: [Tab, string][] = [['profile', 'Profile'], ['grading', 'Grading'], ['appearance', 'Appearance'], ['notifications', 'Notifications'], ['data', 'Data & backup'], ['privacy', 'Privacy']]

export default function Settings() {
  const d = useDB()
  const [tabQ, setTab] = useParam('tab')
  const tab = (TABS.some(([k]) => k === tabQ) ? tabQ : 'profile') as Tab
  const [look, setLookState] = useState<Look>(getLook())
  useEffect(() => onLook(setLookState), [])
  return (
    <>
      <PageHead kicker="Administration" title="Settings" sub={`${THEMES[look.theme]?.name || 'Talavera'} theme · everything saved on this device`} />
      <div className="set-band">
        <div><div className="eye">Classroom configuration</div><h2>Settings</h2></div>
        <div className="set-stats">
          <div><small>Theme</small><b>{THEMES[look.theme]?.name}</b></div>
          <div><small>Typeface</small><b>{FONTS[look.font]?.name.split(' ')[0]}</b></div>
          <div><small>Students</small><b>{d.list('students').length}</b></div>
        </div>
      </div>
      <div className="set-tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k === 'profile' ? null : k)}>{l}</button>)}</div>
      <div className="set-page">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'grading' && <GradingTab />}
        {tab === 'appearance' && <Appearance look={look} />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'data' && <DataTab />}
        {tab === 'privacy' && <PrivacyTab />}
      </div>
    </>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-h"><div><div className="panel-t">{title}</div>{sub && <div className="panel-s">{sub}</div>}</div></div><div className="panel-b">{children}</div></section>
}

function ProfileTab() {
  const p = useProfile()
  const f = (k: keyof Profile) => (v: string) => saveProfile({ [k]: v.trim() } as Partial<Profile>)
  return (
    <Section title="About you" sub="Shown on your dashboard and printed reports. Changes save as you type.">
      <div className="form-grid">
        <Field label="Your name"><AutoText value={p.teacherName} placeholder="e.g. Ms. Rivera" onSave={f('teacherName')} /></Field>
        <Field label="School"><AutoText value={p.school} onSave={f('school')} /></Field>
        <Field label="Grade"><AutoText value={p.grade} placeholder="e.g. 2nd Grade" onSave={f('grade')} /></Field>
        <Field label="Subject"><AutoText value={p.subject} placeholder="e.g. Math" onSave={f('subject')} /></Field>
        <Field label="School year"><AutoText value={p.schoolYear} onSave={f('schoolYear')} /></Field>
      </div>
    </Section>
  )
}

const DISPLAY: [Profile['gradeDisplay'], string, string][] = [
  ['percent', 'Percentage', 'Averages as a percent, e.g. 87%'],
  ['letter', 'Letter grade', 'Averages as a letter from your scale below, e.g. B · 87%'],
  ['points', 'Points', 'Points earned out of points possible, e.g. 174/200'],
  ['mastery', 'Mastery level', 'Beginning, Developing, Proficient or Advanced — good for younger students'],
]

function GradingTab() {
  const p = useProfile()
  const scale = [...p.letterScale].sort((a, b) => b.min - a.min)
  const setScale = (s: Profile['letterScale']) => saveProfile({ letterScale: s })
  return (
    <div className="p2">
      <Section title="How averages are shown" sub="Each assignment still keeps its own type: points, a mastery level, or complete / not yet">
        {DISPLAY.map(([k, n, s]) => (
          <div key={k} className={'th-r' + (p.gradeDisplay === k ? ' th-on' : '')} tabIndex={0} role="button" onClick={() => saveProfile({ gradeDisplay: k })} onKeyDown={(e) => e.key === 'Enter' && saveProfile({ gradeDisplay: k })}>
            <div className="th-n">{n}<span className="th-s">{s}</span></div><div className="th-c">{p.gradeDisplay === k ? 'In use' : 'Use'}</div>
          </div>
        ))}
        <label className="check" style={{ marginTop: 8 }}><input type="checkbox" checked={p.showLetters} onChange={(e) => saveProfile({ showLetters: e.target.checked })} /><div><div className="check-t">Show a letter next to percentages</div><div className="sub">e.g. 87% · B</div></div></label>
        <div className="form-grid" style={{ marginTop: 12 }}>
          <Field label="On-track line (%)" hint="Students below this are flagged as needing support"><AutoNumber value={p.passingPercent} min={0} max={100} step={1} onSave={(v) => saveProfile({ passingPercent: v ?? 70 })} /></Field>
        </div>
      </Section>
      <div>
        <Section title="Letter scale" sub="The lowest percentage for each letter">
          {scale.map((l, i) => (
            <div key={i} className="row" style={{ marginBottom: 6 }}>
              <input className="fld" style={{ width: 80 }} value={l.letter} aria-label="Letter" onChange={(e) => setScale(scale.map((x, j) => (j === i ? { ...x, letter: e.target.value } : x)))} />
              <span className="sub">from</span>
              <input className="fld" style={{ width: 90 }} type="number" min={0} max={100} value={l.min} aria-label={`Minimum for ${l.letter}`} onChange={(e) => setScale(scale.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) || 0 } : x)))} />
              <span className="sub">%</span>
              <button className="linkbtn" style={{ color: 'var(--bad)' }} onClick={() => setScale(scale.filter((_, j) => j !== i))} disabled={scale.length <= 2}>remove</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setScale([...scale, { letter: '?', min: 0 }])}>+ Add letter</button>
            <button className="btn-ghost" onClick={() => setScale(DEFAULT_LETTERS)}>Reset to A–F</button>
            <button className="btn-ghost" onClick={() => setScale([{ letter: 'A+', min: 97 }, { letter: 'A', min: 93 }, { letter: 'A−', min: 90 }, { letter: 'B+', min: 87 }, { letter: 'B', min: 83 }, { letter: 'B−', min: 80 }, { letter: 'C+', min: 77 }, { letter: 'C', min: 73 }, { letter: 'C−', min: 70 }, { letter: 'D', min: 60 }, { letter: 'F', min: 0 }])}>Use +/− grades</button>
          </div>
        </Section>
        <Section title="Mastery levels" sub="How scores turn into levels, for mastery-graded work and the Skills view">
          <div className="counts" style={{ gridTemplateColumns: '1fr 1fr' }}><div><b>Beginning</b> · below 38%</div><div><b>Developing</b> · 38–62%</div><div><b>Proficient</b> · 63–87%</div><div><b>Advanced</b> · 88% and up</div></div>
          <p className="hint">A mastery grade counts as 25% (Beginning), 50%, 75% or 100% (Advanced) when it’s averaged with other work.</p>
        </Section>
      </div>
    </div>
  )
}

function Appearance({ look }: { look: Look }) {
  return (
    <>
      <div className="p2">
        <section className="panel">
          <div className="panel-h"><div><div className="panel-t">Colour theme</div><div className="panel-s">Changes the whole app, on this device</div></div></div>
          <div className="panel-b">
            {availableThemes().map(([k, t]) => (
              <div key={k} className={'th-r' + (look.theme === k ? ' th-on' : '')} tabIndex={0} role="button"
                onClick={() => saveLook({ ...look, theme: k })} onKeyDown={(e) => e.key === 'Enter' && saveLook({ ...look, theme: k })}>
                <div className="th-sw">{t.swatch.map((c) => <i key={c} style={{ background: c }} />)}</div>
                <div className="th-n">{t.name}{t.note && <span className="th-s">{t.note}</span>}</div>
                <div className="th-c">{look.theme === k ? 'In use' : 'Use'}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-h"><div><div className="panel-t">Typeface</div><div className="panel-s">Display face for names, headings and figures</div></div></div>
          <div className="panel-b">
            {Object.entries(FONTS).map(([k, f]) => (
              <div key={k} className={'th-r' + (look.font === k ? ' th-on' : '')} tabIndex={0} role="button"
                onClick={() => saveLook({ ...look, font: k })} onKeyDown={(e) => e.key === 'Enter' && saveLook({ ...look, font: k })}>
                <div className="th-fp" style={{ fontFamily: f.serif }}>Aa</div>
                <div className="th-n">{f.name}<span className="th-s">{f.note}</span></div>
                <div className="th-c">{look.font === k ? 'In use' : 'Use'}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="band-note">Your theme and typeface are saved in this browser, so the app opens looking the way you left it.</div>
    </>
  )
}

function NotificationsTab() {
  const p = useProfile()
  const [perm, setPerm] = useState(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const toggleBrowser = async (on: boolean) => {
    if (!on) { saveProfile({ notifyBrowser: false }); return }
    const r = await askNotificationPermission()
    setPerm(r)
    if (r === 'granted') { saveProfile({ notifyBrowser: true }); toast('Browser reminders are on') } else toast('The browser didn’t allow notifications')
  }
  return (
    <Section title="Reminders" sub="Worked out on this device from your own tasks and data — nothing is sent anywhere">
      <div className="access-grid">
        <label className="access-item"><input type="checkbox" checked={p.notifyInApp} onChange={(e) => saveProfile({ notifyInApp: e.target.checked })} />
          <span><b>Reminders in the app</b><small>Backup reminders and alerts on your dashboard.</small></span></label>
        <label className={'access-item' + (perm === 'unsupported' || perm === 'denied' ? ' locked' : '')}><input type="checkbox" disabled={perm === 'unsupported'} checked={p.notifyBrowser && perm === 'granted'} onChange={(e) => toggleBrowser(e.target.checked)} />
          <span><b>Browser notification each morning</b><small>{perm === 'unsupported' ? 'This browser doesn’t support notifications.' : perm === 'denied' ? 'Notifications are blocked for this site in your browser settings.' : 'When you open the app, one notification lists today’s tasks and events.'}</small></span></label>
      </div>
      <div className="form-grid" style={{ marginTop: 14, maxWidth: 420 }}>
        <Field label="“Upcoming” means the next…"><select className="fld" value={p.upcomingDays} onChange={(e) => saveProfile({ upcomingDays: Number(e.target.value) })}>{[3, 5, 7, 14, 30].map((n) => <option key={n} value={n}>{n} days</option>)}</select></Field>
      </div>
    </Section>
  )
}

function DataTab() {
  const d = useDB()
  const [est, setEst] = useState<{ usage?: number; quota?: number; persisted?: boolean } | null>(null)
  useEffect(() => {
    Promise.all([navigator.storage?.estimate?.().catch(() => ({})), navigator.storage?.persisted?.().catch(() => false)])
      .then(([e, persisted]) => setEst({ ...e, persisted: !!persisted }))
  }, [d.v])
  const keep = async () => { const ok = await navigator.storage?.persist?.(); setEst((x) => ({ ...x, persisted: !!ok })); toast(ok ? 'The browser will keep your data' : 'The browser decided for itself — keep downloading backups') }
  const counts = exportAll()
  const n = STORES.filter((s) => s !== 'activity' && s !== 'settings').reduce((a, s) => a + counts[s].length, 0)
  return (
    <div className="p2">
      <div>
        <Section title="Download backup" sub="Your safety net — the app has no copy of your data anywhere else"><BackupPanel /></Section>
        <Section title="Storage on this device">
          <div className="counts" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>Records saved: <b>{n.toLocaleString()}</b></div>
            <div>Space used: <b>{est?.usage != null ? (est.usage / 1048576).toFixed(1) + ' MB' : '—'}</b></div>
            <div>Saving: <b>{isPersistent() ? 'automatic' : 'not available'}</b></div>
            <div>Protected from clean-up: <b>{est?.persisted ? 'yes' : 'not yet'}</b></div>
          </div>
          {!est?.persisted && <div className="row" style={{ marginTop: 8 }}><button className="btn-ghost" onClick={keep}>Ask the browser to keep my data</button></div>}
          <p className="hint" style={{ marginTop: 8 }}>Saved in this browser’s IndexedDB database “{DB_NAME}”. Clearing this site’s data in the browser’s settings deletes it, and other browsers or computers can’t see it — use a backup to move it.</p>
        </Section>
      </div>
      <div>
        <Section title="Restore a backup" sub="Replaces what’s here with a backup file. You’ll see what’s in it and confirm first."><RestorePanel /></Section>
        <Section title="Reset the app" sub="Start over with nothing"><ResetPanel /></Section>
      </div>
    </div>
  )
}

function PrivacyTab() {
  const d = useDB()
  return (
    <div className="p2">
      <Section title="Your classroom data stays with you" sub="How the app is built">
        <ul className="privacy-list">
          <li><b>Saved only on this device.</b> Students, grades, attendance, goals, notes and assignments live in this browser’s own database. There’s no account and no server holding a copy.</li>
          <li><b>Nothing is uploaded.</b> The app contains no analytics, tracking, ads or cookies, and it makes no network requests with your data — its security policy blocks them outright.</li>
          <li><b>The app’s maker can’t see it.</b> Not your students’ names, not grades, not notes. There’s simply nowhere for it to go.</li>
          <li><b>Works offline.</b> Fonts and images are part of the app, so it doesn’t contact other websites.</li>
          <li><b>Backups are yours.</b> They’re saved where you choose. Encrypted backups are locked with your password on this device; nobody can open them without it.</li>
        </ul>
      </Section>
      <Section title="Good habits" sub="Keeping student information safe">
        <ul className="privacy-list">
          <li>Download a backup regularly — if this browser’s data is cleared, the backup is the only copy.</li>
          <li>On a shared computer, use your own browser profile or user account so others can’t open the app’s data.</li>
          <li>Use an encrypted backup if you store it in a cloud folder or on a USB drive.</li>
          <li>Follow your school’s rules for storing student information.</li>
        </ul>
        <p className="hint">Right now this browser holds {plural(d.list('students').length, 'student')} and {plural(d.list('notes').length, 'note')}. You can erase everything any time in Data &amp; backup.</p>
      </Section>
    </div>
  )
}
