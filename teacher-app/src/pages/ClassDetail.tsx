import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { confirmDialog, toast } from '../components/dialogs'
import { AssignmentForm, ClassForm, GoalForm, StudentForm } from '../components/forms'
import NotesPanel from '../components/NotesPanel'
import { Drawer, EmptyHero, PageHead, Panel, Tabs, Tile, Tiles } from '../components/ui'
import { pct, plural, schoolDays, shortDate, today } from '../lib/format'
import { pillFor, showAverage, tone } from '../lib/grading'
import { ASSIGNMENT_STATUS, fullName, initials, type ID } from '../lib/model'
import { useProfile } from '../lib/profile'
import { assignmentsOf, avgFor, byName, classAverage, goalHealth, gradedCount, HEALTH, missingFor, studentsIn, tally, useParam } from '../lib/queries'
import { batch, removeRecord, saveRecord, useDB } from '../lib/store'

type Tab = 'students' | 'assignments' | 'attendance' | 'goals' | 'notes' | 'about'

export default function ClassDetail() {
  const { id = '' } = useParams()
  const d = useDB()
  const prof = useProfile()
  const go = useNavigate()
  const c = d.get('classes', id)
  const [tab, setTab] = useParam('tab')
  const [drawer, setDrawer] = useState<null | { kind: 'student' | 'assignment' | 'goal' | 'bulk'; id: ID | null }>(null)
  if (!c) return <><PageHead kicker="Classroom" title="Class not found" /><Panel title="This class isn’t here"><Link to="/classes">Back to classes</Link></Panel></>

  const t = today()
  const students = studentsIn(d, c.id)
  const assignments = assignmentsOf(d, c.id)
  const avg = classAverage(d, c.id)
  const recent = new Set(schoolDays(t, 10))
  const att = d.list('attendance').filter((r) => r.classId === c.id)
  const attRecent = tally(att.filter((r) => recent.has(r.date)))
  const goals = d.list('goals').filter((g) => g.classId === c.id)
  const current = (tab || 'students') as Tab

  const del = async () => {
    const n = assignments.length, a = att.length
    const ok = await confirmDialog({
      title: `Delete “${c.name}”?`, danger: true, confirm: 'Delete class', typed: n + a > 0 ? 'DELETE' : undefined,
      body: <p>This deletes the class, its <b>{plural(n, 'assignment')}</b> and their grades, <b>{plural(a, 'attendance record')}</b>, class goals and class notes. Students stay in the app (they’re just no longer in this class). To keep everything but hide it, archive the class instead.</p>,
    })
    if (!ok) return
    removeRecord('classes', c.id, `Deleted class “${c.name}”`)
    toast('Class deleted')
    go('/classes')
  }

  return (
    <>
      <PageHead kicker="Class" title={c.name} sub={[c.subject, c.grade && `Grade ${c.grade}`, c.room && `Room ${c.room}`, c.schoolYear, c.archived && 'Archived'].filter(Boolean).join(' · ')}
        right={<><Link className="btn-primary" to={`/attendance?class=${c.id}`}>Take attendance</Link><Link className="btn-ghost" to={`/grades?class=${c.id}`}>Gradebook</Link></>} />
      <Tiles>
        <Tile label="Students" value={students.length} sub={<button className="linkbtn" onClick={() => setDrawer({ kind: 'student', id: null })}>+ add a student</button>} />
        <Tile label="Class average" value={avg == null ? '—' : showAverage(avg, prof).split(' · ')[0]} sub={`${plural(assignments.filter((a) => a.status === 'graded').length, 'graded assignment')}`} tone={tone(avg, prof.passingPercent) === 'good' ? 'good' : tone(avg, prof.passingPercent) ? 'warn' : undefined} />
        <Tile label="Attendance" value={pct(attRecent.rate)} sub="last 10 school days" tone={attRecent.rate != null && attRecent.rate >= 0.95 ? 'good' : attRecent.rate != null ? 'warn' : undefined} />
        <Tile label="Goals" value={goals.filter((g) => g.status !== 'achieved').length} sub={`${goals.filter((g) => g.status === 'achieved').length} achieved`} />
      </Tiles>
      <Tabs value={current} onChange={(k) => setTab(k)} tabs={[
        { key: 'students', label: `Students · ${students.length}` }, { key: 'assignments', label: `Assignments · ${assignments.length}` },
        { key: 'attendance', label: 'Attendance' }, { key: 'goals', label: `Goals · ${goals.length}` }, { key: 'notes', label: 'Notes' }, { key: 'about', label: 'Class details' },
      ]} />

      {current === 'students' && (
        <Panel title="Students" sub="Averages and attendance for this class" right={<div className="filters"><button className="btn-primary" onClick={() => setDrawer({ kind: 'student', id: null })}>+ Student</button><button className="btn-ghost" onClick={() => setDrawer({ kind: 'bulk', id: null })}>Add several</button><AddExisting classId={c.id} /></div>}>
          {students.length ? (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Student</th><th>Average</th><th>Attendance</th><th>Missing</th><th>Tags</th></tr></thead>
              <tbody>{students.map((s) => {
                const a = avgFor(d, s, c.id), r = tally(att.filter((x) => x.studentId === s.id))
                const miss = assignments.filter((x) => missingFor(d, x).some((m) => m.id === s.id)).length
                return (
                  <tr key={s.id} className="clickable" onClick={() => go(`/students?open=${s.id}`)}>
                    <td><div className="who"><span className="av" style={{ background: c.color }}>{initials(s)}</span><div><div className="strong">{fullName(s)}</div>{s.studentCode && <div className="sub">{s.studentCode}</div>}</div></div></td>
                    <td><span className={pillFor(a.pct, prof.passingPercent)}>{showAverage(a.pct, prof, a)}</span></td>
                    <td className="mono">{pct(r.rate)}</td>
                    <td>{miss ? <span className="pill pill-bad">{miss}</span> : <span className="sub">—</span>}</td>
                    <td><div className="chips">{s.tags.map((x) => <span key={x} className="chip">{x}</span>)}</div></td>
                  </tr>
                )
              })}</tbody>
            </table></div>
          ) : <EmptyHero title="No students in this class yet" action={<button className="btn-primary" onClick={() => setDrawer({ kind: 'bulk', id: null })}>Add students</button>}>Add them one at a time, or paste a list of names.</EmptyHero>}
        </Panel>
      )}

      {current === 'assignments' && (
        <Panel title="Assignments" right={<div className="filters"><button className="btn-primary" onClick={() => setDrawer({ kind: 'assignment', id: null })}>+ Assignment</button><Link className="btn-ghost" to={`/grades?class=${c.id}`}>Open gradebook</Link></div>}>
          {assignments.length ? (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Assignment</th><th>Due</th><th>Status</th><th className="r">Graded</th></tr></thead>
              <tbody>{assignments.map((a) => (
                <tr key={a.id} className="clickable" onClick={() => go(`/assignments?open=${a.id}`)}>
                  <td><div className="strong">{a.title}</div><div className="sub">{a.category}{a.gradingType === 'points' ? ` · ${a.pointsPossible} pts` : a.gradingType === 'mastery' ? ' · mastery' : ' · complete/not yet'}</div></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{shortDate(a.dueDate)} {a.dueDate < t && a.status !== 'graded' && <span className="pill pill-warn">past due</span>}</td>
                  <td><span className={'pill ' + (a.status === 'graded' ? 'pill-good' : a.status === 'completed' ? 'pill-warn' : a.status === 'in_progress' ? 'pill-blue' : 'pill-muted')}>{ASSIGNMENT_STATUS[a.status]}</span></td>
                  <td className="r mono">{gradedCount(d, a)}/{students.length}</td>
                </tr>
              ))}</tbody>
            </table></div>
          ) : <EmptyHero title="No assignments yet" action={<button className="btn-primary" onClick={() => setDrawer({ kind: 'assignment', id: null })}>Create an assignment</button>} />}
        </Panel>
      )}

      {current === 'attendance' && (
        <Panel title="Attendance by student" sub="Every day recorded for this class" right={<Link className="btn-primary" to={`/attendance?class=${c.id}`}>Take attendance</Link>}>
          {students.length ? (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Student</th><th className="r">Present</th><th className="r">Tardy</th><th className="r">Absent</th><th className="r">Excused</th><th className="r">Rate</th></tr></thead>
              <tbody>{students.map((s) => { const r = tally(att.filter((x) => x.studentId === s.id)); return (
                <tr key={s.id}><td className="strong">{fullName(s)}</td><td className="r mono">{r.present}</td><td className="r mono">{r.tardy}</td><td className="r mono">{r.absent}</td><td className="r mono">{r.excused}</td><td className="r mono">{pct(r.rate)}</td></tr>
              ) })}</tbody>
            </table></div>
          ) : <div className="empty">Add students to take attendance.</div>}
        </Panel>
      )}

      {current === 'goals' && (
        <Panel title="Goals" sub="Class goals and goals for students in this class" right={<button className="btn-primary" onClick={() => setDrawer({ kind: 'goal', id: null })}>+ Class goal</button>}>
          {goals.length ? goals.map((g) => { const h = goalHealth(g, t); return (
            <div key={g.id} className="list-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => go(`/goals?open=${g.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/goals?open=${g.id}`)}>
              <div><b>{g.title}</b><div className="sub">{g.scope === 'class' ? 'Whole class' : fullName(d.get('students', g.studentId) || { firstName: '?', lastName: '' })}{g.targetDate ? ` · target ${shortDate(g.targetDate)}` : ''}</div>
                <div className="progress" style={{ marginTop: 6, maxWidth: 320 }}><i style={{ width: g.progress + '%' }} className={h === 'achieved' ? 'done' : h === 'behind' || h === 'overdue' ? 'behind' : ''} /></div></div>
              <span className={'exc-b exc-' + HEALTH[h].tone} style={{ padding: '3px 8px' }}>{HEALTH[h].label}</span>
            </div>
          ) }) : <EmptyHero title="No goals yet" action={<button className="btn-primary" onClick={() => setDrawer({ kind: 'goal', id: null })}>Set a class goal</button>} />}
        </Panel>
      )}

      {current === 'notes' && <Panel title="Class notes" sub="Private — only on this device"><NotesPanel parentType="class" parentId={c.id} /></Panel>}

      {current === 'about' && (
        <Panel title="Class details" sub="Changes save as you type">
          <ClassForm id={c.id} />
          <div className="plan" style={{ marginTop: 16, borderColor: 'var(--bad-bg)' }}>
            <div className="plan-l" style={{ color: 'var(--bad)' }}>Delete class</div>
            <p className="sub" style={{ marginTop: 0 }}>Removes the class with its assignments, grades and attendance. Consider archiving instead.</p>
            <button className="btn-danger" onClick={del}>Delete this class…</button>
          </div>
        </Panel>
      )}

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} title={drawer?.kind === 'student' ? 'New student' : drawer?.kind === 'assignment' ? 'New assignment' : drawer?.kind === 'goal' ? 'New class goal' : 'Add several students'} sub={drawer?.kind === 'bulk' ? undefined : 'Saved automatically as you type'}>
        {drawer?.kind === 'student' && <StudentForm id={drawer.id} classId={c.id} onCreate={(nid) => setDrawer({ kind: 'student', id: nid })} />}
        {drawer?.kind === 'assignment' && <AssignmentForm id={drawer.id} classId={c.id} onCreate={(nid) => setDrawer({ kind: 'assignment', id: nid })} />}
        {drawer?.kind === 'goal' && <GoalForm id={drawer.id} classId={c.id} onCreate={(nid) => setDrawer({ kind: 'goal', id: nid })} />}
        {drawer?.kind === 'bulk' && <BulkStudents classId={c.id} onDone={() => setDrawer(null)} />}
      </Drawer>
    </>
  )
}

function AddExisting({ classId }: { classId: ID }) {
  const d = useDB()
  const others = [...d.list('students')].filter((s) => !s.classIds.includes(classId)).sort(byName)
  if (!others.length) return null
  return (
    <select className="fld" style={{ width: 'auto' }} value="" aria-label="Add an existing student" onChange={(e) => { const s = d.get('students', e.target.value); if (s) { saveRecord('students', { id: s.id, classIds: [...s.classIds, classId] }); toast(`${fullName(s)} added`) } }}>
      <option value="">Add existing student…</option>
      {others.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
    </select>
  )
}

/** Paste a class list: one student per line, "First Last" or "Last, First". */
export function BulkStudents({ classId, onDone }: { classId: ID | null; onDone: () => void }) {
  const d = useDB()
  const [text, setText] = useState('')
  const [cls, setCls] = useState(classId || '')
  const names = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    if (l.includes(',')) { const [last, first] = l.split(',').map((x) => x.trim()); return { firstName: first || '', lastName: last || '' } }
    const parts = l.split(/\s+/); return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
  })
  const add = () => {
    const c = d.get('classes', cls)
    batch((b) => {
      names.forEach((n) => b.save('students', { ...n, studentCode: '', classIds: cls ? [cls] : [], grade: c?.grade || '', tags: [], about: '' }))
      b.log('created', 'students', null, `Added ${plural(names.length, 'student')}${c ? ` to ${c.name}` : ''}`)
    })
    toast(`${plural(names.length, 'student')} added`)
    onDone()
  }
  return (
    <div className="form-grid">
      <label className="span-all">Class<select className="fld" value={cls} onChange={(e) => setCls(e.target.value)}><option value="">No class</option>{d.list('classes').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="span-all">Names, one per line<textarea className="fld" rows={10} autoFocus placeholder={'Emma Garcia\nLiam Johnson\nMartinez, Sofia'} value={text} onChange={(e) => setText(e.target.value)} />
        <span className="hint">“First Last” or “Last, First”. Paste straight from a spreadsheet column. Nothing leaves this device.</span></label>
      <div className="span-all row"><button className="btn-primary" disabled={!names.length} onClick={add}>Add {plural(names.length, 'student')}</button></div>
    </div>
  )
}
