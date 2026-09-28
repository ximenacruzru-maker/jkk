// First run, laid out like Declara's sign-in screen — but there is no account: the teacher sets up their classroom
// (or loads the sample, or restores a backup) and everything stays in this browser.
import { useState } from 'react'
import logo from '../assets/login-logo.jpg'
import { RestorePanel } from '../components/BackupTools'
import { Icon } from '../components/icons'
import { CLASS_COLORS } from '../lib/model'
import { DEFAULT_PROFILE, schoolYearFor } from '../lib/profile'
import { sampleData } from '../lib/sample'
import { batch, replaceData } from '../lib/store'

export default function Welcome() {
  const [step, setStep] = useState<'choose' | 'setup' | 'restore'>('choose')
  const [f, setF] = useState({ teacherName: '', school: '', grade: '', subject: '', schoolYear: schoolYearFor(), className: '' })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const start = () => {
    batch((b) => {
      b.save('settings', { ...DEFAULT_PROFILE, teacherName: f.teacherName.trim(), school: f.school.trim(), grade: f.grade.trim(), subject: f.subject.trim(), schoolYear: f.schoolYear.trim(), setupDone: true })
      if (f.className.trim()) {
        const c = b.save('classes', { name: f.className.trim(), grade: f.grade.trim(), subject: f.subject.trim(), schoolYear: f.schoolYear.trim(), room: '', description: '', color: CLASS_COLORS[0], archived: false })
        b.log('created', 'classes', c.id, `Created class “${c.name}”`)
      }
    })
  }
  const sample = async () => {
    setBusy(true)
    await replaceData(sampleData(f.teacherName.trim() ? { teacherName: f.teacherName.trim(), school: f.school.trim() } : undefined))
  }

  return (
    <div className="login welcome">
      <div className="login-card">
        <img className="login-logo" src={logo} alt="Declara" />
        <div className="login-sub">Teacher Edition</div>
        {step === 'choose' && <>
          <h1>Welcome to your classroom</h1>
          <p>Classes, students, grades, attendance, goals and notes — in one place, saved automatically.</p>
          <div className="choice">
            <button onClick={() => setStep('setup')}><b>Set up my classroom</b><small>Start fresh with your name, school and first class.</small></button>
            <button onClick={sample} disabled={busy}><b>{busy ? 'Loading the sample…' : 'Explore with sample data'}</b><small>A made-up classroom (Emma Garcia, Liam Johnson…) to try everything. Clear it any time.</small></button>
            <button onClick={() => setStep('restore')}><b>Restore a backup</b><small>Moving to a new computer? Load a backup file you downloaded before.</small></button>
          </div>
        </>}
        {step === 'setup' && <>
          <h1>About you</h1>
          <p>All of this is optional and can be changed later in Settings.</p>
          <label>Your name<input autoFocus placeholder="e.g. Ms. Rivera" value={f.teacherName} onChange={set('teacherName')} /></label>
          <label>School<input placeholder="e.g. Maple Grove Elementary" value={f.school} onChange={set('school')} /></label>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label style={{ color: 'var(--blue)' }}>Grade<input className="fld" placeholder="e.g. 2nd Grade" value={f.grade} onChange={set('grade')} /></label>
            <label style={{ color: 'var(--blue)' }}>Subject<input className="fld" placeholder="e.g. Math" value={f.subject} onChange={set('subject')} /></label>
          </div>
          <label>School year<input value={f.schoolYear} onChange={set('schoolYear')} /></label>
          <label>First class <span className="hint">(optional)</span><input placeholder="e.g. 2nd Grade Math" value={f.className} onChange={set('className')} onKeyDown={(e) => e.key === 'Enter' && start()} /></label>
          <button className="btn-primary" onClick={start}>Open my classroom</button>
          <button className="linkbtn" onClick={() => setStep('choose')}>← Back</button>
        </>}
        {step === 'restore' && <>
          <h1>Restore a backup</h1>
          <p>Choose the backup file you saved. Encrypted backups will ask for their password.</p>
          <RestorePanel />
          <button className="linkbtn" onClick={() => setStep('choose')}>← Back</button>
        </>}
        <div className="lock"><Icon name="lock" width={1.8} /><span><b>Private by design.</b> Everything you enter is saved only in this browser, on this device. Nothing is uploaded — not to us, not to anyone. Download a backup from Settings to keep a copy.</span></div>
      </div>
    </div>
  )
}
