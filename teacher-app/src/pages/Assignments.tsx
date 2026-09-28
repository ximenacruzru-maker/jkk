import { useMemo, useState } from 'react'
import { confirmDialog, toast } from '../components/dialogs'
import { AssignmentForm } from '../components/forms'
import { GradeRow, saveGrade } from '../components/GradeEditor'
import NotesPanel from '../components/NotesPanel'
import { Drawer, EmptyHero, KV, PageHead, Panel, Search, Tabs, Tile, Tiles } from '../components/ui'
import { addDays, downloadCsv, plural, shortDate, today, weekday } from '../lib/format'
import { average, gradeId, score, showAverage } from '../lib/grading'
import { ASSIGNMENT_STATUS, GRADING_TYPE, type AssignmentStatus, type ID } from '../lib/model'
import { useProfile } from '../lib/profile'
import { allClasses, gradedCount, missingFor, studentsIn, useParam } from '../lib/queries'
import { removeRecord, saveRecord, useDB } from '../lib/store'

const WHEN: Record<string, string> = { all: 'Any date', overdue: 'Past due', today: 'Due today', week: 'Next 7 days', month: 'Next 30 days', past: 'Earlier', custom: 'Custom range' }
export const statusPill = (s: AssignmentStatus) => 'pill ' + (s === 'graded' ? 'pill-good' : s === 'completed' ? 'pill-warn' : s === 'in_progress' ? 'pill-blue' : 'pill-muted')

export default function Assignments() {
  const d = useDB()
  const t = today()
  const [open, setOpen] = useParam('open')
  const [isNew, setNew] = useParam('new')
  const [classQ, setClassQ] = useParam('class')
  const [created, setCreated] = useState<ID | null>(null)
  const [subject, setSubject] = useState('all')
  const [status, setStatus] = useState('all')
  const [when, setWhen] = useState('all')
  const [from, setFrom] = useState(''), [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const cls = classQ || 'all'

  const all = d.list('assignments')
  const subjects = [...new Set(all.map((a) => a.subject).filter(Boolean))].sort()
  const rows = useMemo(() => all
    .filter((a) => cls === 'all' || a.classId === cls)
    .filter((a) => subject === 'all' || a.subject === subject)
    .filter((a) => status === 'all' || (status === 'open' ? a.status !== 'graded' : a.status === status))
    .filter((a) => when === 'all' ? true : when === 'overdue' ? a.dueDate < t && a.status !== 'graded' : when === 'today' ? a.dueDate === t
      : when === 'week' ? a.dueDate >= t && a.dueDate <= addDays(t, 7) : when === 'month' ? a.dueDate >= t && a.dueDate <= addDays(t, 30)
        : when === 'past' ? a.dueDate < t : (!from || a.dueDate >= from) && (!to || a.dueDate <= to))
    .filter((a) => !q || `${a.title} ${a.category} ${a.description}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.dueDate < b.dueDate ? 1 : a.dueDate > b.dueDate ? -1 : a.title.localeCompare(b.title))), [all, cls, subject, status, when, from, to, q, t])

  const week = all.filter((a) => a.dueDate >= t && a.dueDate <= addDays(t, 7))
  const toGrade = all.filter((a) => a.status === 'completed' || (a.dueDate < t && a.status !== 'graded'))
  const missing = all.reduce((n, a) => n + missingFor(d, a).length, 0)
  const closeNew = () => { setNew(null); if (created) setOpen(created); setCreated(null) }

  return (
    <>
      <PageHead kicker="Learning" title="Assignments" sub={plural(all.length, 'assignment')} right={<button className="btn-primary" onClick={() => setNew('1')}>+ Assignment</button>} />
      <Tiles>
        <Tile label="Due in 7 days" value={week.length} sub={`${all.filter((a) => a.dueDate === t).length} due today`} />
        <Tile label="Waiting to grade" value={toGrade.length} tone={toGrade.length ? 'warn' : 'good'} sub="completed or past due" />
        <Tile label="Missing work" value={missing} tone={missing ? 'warn' : 'good'} sub="student assignments" />
        <Tile label="Graded" value={all.filter((a) => a.status === 'graded').length} sub={`of ${all.length}`} tone="good" />
      </Tiles>
      <Panel title="All assignments" sub={`${rows.length} shown`} right={
        <div className="filters">
          <select value={cls} onChange={(e) => setClassQ(e.target.value === 'all' ? null : e.target.value)} aria-label="Class"><option value="all">All classes</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject"><option value="all">All subjects</option>{subjects.map((s) => <option key={s}>{s}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">Any status</option><option value="open">Not graded yet</option>{Object.entries(ASSIGNMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Due date">{Object.entries(WHEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {when === 'custom' && <span className="date-range"><label>From<input className="fld" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input className="fld" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label></span>}
          <Search value={q} onChange={setQ} placeholder="Search assignments" />
          <button className="btn-ghost" onClick={() => downloadCsv(`assignments-${t}.csv`, [['Title', 'Class', 'Subject', 'Category', 'Due', 'Graded by', 'Points possible', 'Status', 'Graded', 'Missing'],
            ...rows.map((a) => [a.title, d.get('classes', a.classId)?.name, a.subject, a.category, a.dueDate, GRADING_TYPE[a.gradingType], a.gradingType === 'points' ? a.pointsPossible : '', ASSIGNMENT_STATUS[a.status], gradedCount(d, a), missingFor(d, a).length])])}>CSV</button>
        </div>}>
        {rows.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Assignment</th><th>Class</th><th>Due</th><th>Status</th><th className="r">Graded</th><th className="r">Missing</th></tr></thead>
            <tbody>{rows.map((a) => {
              const c = d.get('classes', a.classId), n = studentsIn(d, a.classId).length, m = missingFor(d, a).length
              return (
                <tr key={a.id} className="clickable" onClick={() => setOpen(a.id)}>
                  <td><div className="strong">{a.title}</div><div className="sub">{[a.category, a.subject, a.gradingType === 'points' ? `${a.pointsPossible} pts` : GRADING_TYPE[a.gradingType]].filter(Boolean).join(' · ')}</div></td>
                  <td><span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}><span className="dot" style={{ background: c?.color }} />{c?.name}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.dueDate === t ? <b>Today</b> : `${weekday(a.dueDate)} ${shortDate(a.dueDate)}`}{a.dueDate < t && a.status !== 'graded' && <> <span className="pill pill-warn">past due</span></>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className="fld" style={{ width: 'auto', padding: '5px 8px' }} value={a.status} aria-label={`Status of ${a.title}`}
                      onChange={(e) => saveRecord('assignments', { id: a.id, status: e.target.value as AssignmentStatus }, ['updated', `Marked “${a.title}” ${ASSIGNMENT_STATUS[e.target.value as AssignmentStatus]}`])}>
                      {Object.entries(ASSIGNMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  </td>
                  <td className="r mono">{gradedCount(d, a)}/{n}</td>
                  <td className="r">{m ? <span className="pill pill-bad">{m}</span> : <span className="sub">—</span>}</td>
                </tr>
              )
            })}</tbody>
          </table></div>
        ) : all.length ? <div className="empty">No assignments match these filters.</div>
          : <EmptyHero title="No assignments yet" action={<button className="btn-primary" onClick={() => setNew('1')}>Create an assignment</button>}>Assignments can be graded with points, mastery levels (Beginning → Advanced) or simply complete / not yet.</EmptyHero>}
      </Panel>
      <Drawer open={!!isNew} onClose={closeNew} title="New assignment" sub="Type a title and it’s saved — no Save button needed.">
        <AssignmentForm id={created} classId={cls !== 'all' ? cls : null} onCreate={setCreated} />
        {created && <div className="row" style={{ marginTop: 16 }}><button className="btn-primary" onClick={closeNew}>Enter grades</button><button className="btn-ghost" onClick={() => setCreated(null)}>Add another</button></div>}
      </Drawer>
      {open && d.get('assignments', open) && <AssignmentDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function AssignmentDrawer({ id, onClose }: { id: ID; onClose: () => void }) {
  const d = useDB()
  const prof = useProfile()
  const [tab, setTab] = useState<'grades' | 'details' | 'notes'>('grades')
  const a = d.get('assignments', id)!
  const c = d.get('classes', a.classId)
  const kids = studentsIn(d, a.classId)
  const scores = kids.map((s) => score(d.get('grades', gradeId(a.id, s.id)), a))
  const avg = average(scores)
  const ungraded = kids.filter((s) => { const g = d.get('grades', gradeId(a.id, s.id)); return score(g, a) == null && !g?.excused && !g?.missing })
  const del = async () => {
    if (!await confirmDialog({ title: `Delete “${a.title}”?`, danger: true, confirm: 'Delete assignment', body: `This deletes the assignment and ${plural(scores.filter((x) => x != null).length, 'grade')} entered for it.` })) return
    removeRecord('assignments', a.id, `Deleted assignment “${a.title}”`)
    toast('Assignment deleted')
    onClose()
  }
  return (
    <Drawer open onClose={onClose} title={a.title} sub={`${c?.name || 'No class'} · due ${shortDate(a.dueDate, true)}`}>
      <KV rows={[['Status', <span className={statusPill(a.status)}>{ASSIGNMENT_STATUS[a.status]}</span>], ['Graded by', a.gradingType === 'points' ? `${a.pointsPossible} points` : GRADING_TYPE[a.gradingType]],
        ['Category', a.category], ['Class average', showAverage(avg, prof)], ['Graded', `${scores.filter((x) => x != null).length} of ${kids.length}`], ['Missing', missingFor(d, a).length || '']]} />
      {a.description && <div className="note-box">{a.description}</div>}
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'grades', label: 'Grades' }, { key: 'details', label: 'Edit details' }, { key: 'notes', label: 'Notes' }]} />
      {tab === 'grades' && (kids.length ? <>
        {ungraded.length > 0 && a.dueDate < today() && <div className="row" style={{ marginBottom: 8 }}>
          <button className="btn-ghost" onClick={() => { ungraded.forEach((s) => saveGrade(a, s, { missing: true })); toast(`${plural(ungraded.length, 'student')} marked missing`) }}>Mark {plural(ungraded.length, 'ungraded student')} missing</button></div>}
        {kids.map((s) => <GradeRow key={s.id} a={a} s={s} g={d.get('grades', gradeId(a.id, s.id))} />)}
        <p className="hint" style={{ marginTop: 10 }}>Grades save as you type. When everyone has a grade, the assignment is marked Graded.</p>
      </> : <div className="empty">No students in {c?.name || 'this class'} yet.</div>)}
      {tab === 'details' && <>
        <AssignmentForm id={a.id} />
        <div className="plan" style={{ marginTop: 18 }}><div className="plan-l" style={{ color: 'var(--bad)' }}>Delete assignment</div><button className="btn-danger" onClick={del}>Delete this assignment…</button></div>
      </>}
      {tab === 'notes' && <NotesPanel parentType="assignment" parentId={a.id} />}
    </Drawer>
  )
}
