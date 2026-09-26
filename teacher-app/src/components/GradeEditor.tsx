// Entering one grade. Points, a mastery level, or complete / not yet, depending on the assignment — plus
// missing / excused and a comment. Every change saves at once.
import { gradeId, score } from '../lib/grading'
import { MASTERY, MASTERY_ORDER, fullName, type Assignment, type Grade, type Mastery, type Student } from '../lib/model'
import { batch, db } from '../lib/store'
import { AutoNumber, AutoText } from './ui'

const lastLog = new Map<string, number>()

export function saveGrade(a: Assignment, s: Student, patch: Partial<Grade>) {
  const d = db(), id = gradeId(a.id, s.id), prev = d.get('grades', id)
  batch((b) => {
    b.save('grades', { assignmentId: a.id, studentId: s.id, points: null, mastery: null, complete: null, missing: false, excused: false, comment: '', ...prev, ...patch, id })
    // One activity entry per assignment every 10 minutes, not one per keystroke.
    if (Date.now() - (lastLog.get(a.id) || 0) > 600000) { lastLog.set(a.id, Date.now()); b.log('graded', 'grades', id, `Entered grades for “${a.title}”`) }
    // Once everyone in the class has a grade, the assignment is Graded.
    const kids = d.list('students').filter((x) => x.classIds.includes(a.classId))
    const done = (k: Student) => { const gg = d.get('grades', gradeId(a.id, k.id)); return !!gg?.excused || score(gg, a) != null }
    if (a.status !== 'graded' && kids.length && kids.every(done)) {
      b.save('assignments', { id: a.id, status: 'graded' })
      b.log('graded', 'assignments', a.id, `Finished grading “${a.title}”`)
    }
  })
}

export function GradeInput({ a, s, g, className = 'fld' }: { a: Assignment; s: Student; g?: Grade; className?: string }) {
  const label = `${a.title} grade for ${fullName(s)}`
  if (a.gradingType === 'points') return <AutoNumber className={className} value={g?.points ?? null} min={0} placeholder={g?.missing ? 'M' : g?.excused ? 'EX' : '—'} ariaLabel={label}
    onSave={(v) => saveGrade(a, s, { points: v, ...(v != null ? { missing: false, excused: false } : {}) })} />
  if (a.gradingType === 'mastery') return (
    <select className={className} value={g?.mastery || ''} aria-label={label} onChange={(e) => saveGrade(a, s, { mastery: (e.target.value || null) as Mastery | null, ...(e.target.value ? { missing: false, excused: false } : {}) })}>
      <option value="">—</option>{MASTERY_ORDER.map((m) => <option key={m} value={m}>{MASTERY[m]}</option>)}
    </select>
  )
  return (
    <select className={className} value={g?.complete == null ? '' : g.complete ? 'y' : 'n'} aria-label={label} onChange={(e) => saveGrade(a, s, { complete: e.target.value === '' ? null : e.target.value === 'y', ...(e.target.value ? { missing: false, excused: false } : {}) })}>
      <option value="">—</option><option value="y">Complete</option><option value="n">Not yet</option>
    </select>
  )
}

export function GradeFlag({ a, s, g }: { a: Assignment; s: Student; g?: Grade }) {
  return (
    <select className="fld" value={g?.excused ? 'ex' : g?.missing ? 'miss' : ''} aria-label={`Missing or excused: ${fullName(s)}`} onChange={(e) => saveGrade(a, s, { missing: e.target.value === 'miss', excused: e.target.value === 'ex' })}>
      <option value="">Turned in</option><option value="miss">Missing</option><option value="ex">Excused</option>
    </select>
  )
}

/** A full row: student, grade, comment, missing/excused. */
export function GradeRow({ a, s, g }: { a: Assignment; s: Student; g?: Grade }) {
  return (
    <div className="grade-row">
      <div className="strong">{fullName(s)}{a.gradingType === 'points' && g?.points != null && a.pointsPossible > 0 && <span className="sub"> · {Math.round((g.points / a.pointsPossible) * 100)}%</span>}</div>
      <GradeInput a={a} s={s} g={g} />
      <AutoText value={g?.comment || ''} placeholder="Comment" ariaLabel={`Comment for ${fullName(s)}`} onSave={(v) => saveGrade(a, s, { comment: v })} />
      <GradeFlag a={a} s={s} g={g} />
    </div>
  )
}
