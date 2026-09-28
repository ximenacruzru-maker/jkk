// Students: a searchable, filterable list, and a detailed profile in Declara's record drawer (as Books of Business
// opens an account with ?open=<id>).
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirmDialog, toast } from '../components/dialogs'
import { GoalForm, StudentForm } from '../components/forms'
import { GradeFlag, GradeInput } from '../components/GradeEditor'
import NotesPanel, { NoteCard } from '../components/NotesPanel'
import { Drawer, EmptyHero, KV, PageHead, Panel, Search, Tabs, Tile, Tiles } from '../components/ui'
import { downloadCsv, pct, plural, schoolDays, shortDate, today } from '../lib/format'
import { gradeId, isMissing, pillFor, showAverage, tone } from '../lib/grading'
import { ATTENDANCE, fullName, initials, type ID } from '../lib/model'
import { useProfile } from '../lib/profile'
import { allClasses, avgFor, byName, goalHealth, HEALTH, tally, useParam } from '../lib/queries'
import { removeRecord, useDB } from '../lib/store'
import { BulkStudents } from './ClassDetail'

export default function Students() {
  const d = useDB()
  const prof = useProfile()
  const [open, setOpen] = useParam('open')
  const [isNew, setNew] = useParam('new')
  const [created, setCreated] = useState<ID | null>(null)
  const [bulk, setBulk] = useState(false)
  const [cls, setCls] = useState('all')
  const [tag, setTag] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'name' | 'avg' | 'att'>('name')
  const recent = useMemo(() => new Set(schoolDays(today(), 10)), [])

  const rows = useMemo(() => d.list('students')
    .filter((s) => cls === 'all' || (cls === 'none' ? !s.classIds.length : s.classIds.includes(cls)))
    .filter((s) => tag === 'all' || s.tags.includes(tag))
    .filter((s) => !q || `${s.firstName} ${s.lastName} ${s.studentCode} ${s.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .map((s) => ({ s, avg: avgFor(d, s), att: tally(d.list('attendance').filter((r) => r.studentId === s.id && recent.has(r.date))), goals: d.list('goals').filter((g) => g.studentId === s.id && g.status !== 'achieved').length }))
    .sort((a, b) => sort === 'avg' ? (a.avg.pct ?? 2) - (b.avg.pct ?? 2) : sort === 'att' ? (a.att.rate ?? 2) - (b.att.rate ?? 2) : byName(a.s, b.s)), [d, cls, tag, q, sort, recent])
  const all = d.list('students')
  const tags = [...new Set(all.flatMap((s) => s.tags))].sort()
  const avgAll = rows.map((r) => r.avg.pct).filter((x): x is number => x != null)
  const support = rows.filter((r) => r.avg.pct != null && r.avg.pct * 100 < prof.passingPercent).length
  const attAll = tally(d.list('attendance').filter((r) => recent.has(r.date)))
  const closeNew = () => { setNew(null); if (created) setOpen(created); setCreated(null) }

  return (
    <>
      <PageHead kicker="Classroom" title="Students" sub={plural(all.length, 'student')}
        right={<><button className="btn-primary" onClick={() => setNew('1')}>+ Student</button><button className="btn-ghost" onClick={() => setBulk(true)}>Add several</button></>} />
      <Tiles>
        <Tile label="Students" value={all.length} sub={`${d.list('classes').filter((c) => !c.archived).length} active classes`} />
        <Tile label="Average" value={avgAll.length ? showAverage(avgAll.reduce((a, b) => a + b, 0) / avgAll.length, prof).split(' · ')[0] : '—'} sub="across shown students" />
        <Tile label="Attendance" value={pct(attAll.rate)} sub="last 10 school days" tone={attAll.rate != null && attAll.rate >= 0.95 ? 'good' : undefined} />
        <Tile label="May need support" value={support} sub={`below ${prof.passingPercent}%`} tone={support ? 'warn' : 'good'} />
      </Tiles>
      <Panel title="All students" sub={`${rows.length} shown`} right={
        <div className="filters">
          <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class"><option value="all">All classes</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="none">Not in a class</option></select>
          {tags.length > 0 && <select value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Tag"><option value="all">All tags</option>{tags.map((t) => <option key={t}>{t}</option>)}</select>}
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort"><option value="name">Sort by name</option><option value="avg">Lowest average first</option><option value="att">Lowest attendance first</option></select>
          <Search value={q} onChange={setQ} placeholder="Search students" />
          <button className="btn-ghost" onClick={() => downloadCsv(`students-${today()}.csv`, [['First name', 'Last name', 'Student ID', 'Classes', 'Grade', 'Tags', 'Average', 'Attendance (10 days)'],
            ...rows.map(({ s, avg, att }) => [s.firstName, s.lastName, s.studentCode, s.classIds.map((c) => d.get('classes', c)?.name).join('; '), s.grade, s.tags.join('; '), avg.pct == null ? '' : Math.round(avg.pct * 100) + '%', att.rate == null ? '' : Math.round(att.rate * 100) + '%'])])}>CSV</button>
        </div>}>
        {rows.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Student</th><th>Classes</th><th>Average</th><th>Attendance</th><th>Goals</th><th>Tags</th></tr></thead>
            <tbody>{rows.map(({ s, avg, att, goals }) => {
              const c = d.get('classes', s.classIds[0])
              return (
                <tr key={s.id} className="clickable" onClick={() => setOpen(s.id)}>
                  <td><div className="who"><span className="av" style={{ background: c?.color }}>{initials(s)}</span><div><div className="strong">{fullName(s)}</div>{s.studentCode && <div className="sub">{s.studentCode}</div>}</div></div></td>
                  <td className="sub">{s.classIds.map((x) => d.get('classes', x)?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td><span className={pillFor(avg.pct, prof.passingPercent)}>{showAverage(avg.pct, prof, avg)}</span></td>
                  <td className="mono">{pct(att.rate)}</td>
                  <td className="mono">{goals || '—'}</td>
                  <td><div className="chips">{s.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div></td>
                </tr>
              )
            })}</tbody>
          </table></div>
        ) : all.length ? <div className="empty">No students match.</div>
          : <EmptyHero title="No students yet" action={<button className="btn-primary" onClick={() => setBulk(true)}>Add your class list</button>}>Add students one at a time, or paste a list of names.</EmptyHero>}
      </Panel>

      <Drawer open={!!isNew} onClose={closeNew} title="New student" sub="Type a name and it’s saved — no Save button needed.">
        <StudentForm id={created} classId={cls !== 'all' && cls !== 'none' ? cls : d.list('classes').length === 1 ? d.list('classes')[0].id : null} onCreate={setCreated} />
        {created && <div className="row" style={{ marginTop: 16 }}><button className="btn-primary" onClick={closeNew}>Open profile</button><button className="btn-ghost" onClick={() => setCreated(null)}>Add another</button></div>}
      </Drawer>
      <Drawer open={bulk} onClose={() => setBulk(false)} title="Add several students"><BulkStudents classId={cls !== 'all' && cls !== 'none' ? cls : null} onDone={() => setBulk(false)} /></Drawer>
      {open && d.get('students', open) && <StudentProfile id={open} onClose={() => setOpen(null)} />}
    </>
  )
}

type PTab = 'overview' | 'grades' | 'attendance' | 'goals' | 'notes' | 'details'

export function StudentProfile({ id, onClose }: { id: ID; onClose: () => void }) {
  const d = useDB()
  const prof = useProfile()
  const go = useNavigate()
  const [tab, setTab] = useState<PTab>('overview')
  const [goalId, setGoalId] = useState<ID | null | 'new'>(null)
  const s = d.get('students', id)
  if (!s) return null
  const t = today()
  const classes = s.classIds.map((c) => d.get('classes', c)).filter((c): c is NonNullable<typeof c> => !!c)
  const color = classes[0]?.color
  const avg = avgFor(d, s)
  const att = d.list('attendance').filter((r) => r.studentId === id).sort((a, b) => (a.date < b.date ? 1 : -1))
  const attT = tally(att)
  const assignments = d.list('assignments').filter((a) => s.classIds.includes(a.classId)).sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
  const missing = assignments.filter((a) => isMissing(d.get('grades', gradeId(a.id, id)), a))
  const goals = d.list('goals').filter((g) => g.studentId === id || (g.scope === 'class' && g.classId && s.classIds.includes(g.classId)))
  const pinned = d.list('notes').filter((n) => n.parentType === 'student' && n.parentId === id && n.pinned)
  const del = async () => {
    if (!await confirmDialog({ title: `Delete ${fullName(s)}?`, danger: true, confirm: 'Delete student', body: `This permanently deletes ${s.firstName}’s grades, attendance, goals and notes from this device.`, typed: 'DELETE' })) return
    removeRecord('students', id, `Deleted student ${fullName(s)}`)
    toast('Student deleted')
    onClose()
  }

  return (
    <Drawer open onClose={onClose} title={fullName(s) || 'Student'} sub={[classes.map((c) => c.name).join(', '), s.studentCode].filter(Boolean).join(' · ')}>
      <div className="rec-head">
        <span className="av av-lg" style={{ background: color }}>{initials(s)}</span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <KV rows={[['Classes', classes.map((c) => c.name).join(', ') || 'Not in a class'], ['Grade', s.grade], ['Student ID', s.studentCode], ['Tags', s.tags.length ? <div className="chips">{s.tags.map((x) => <span key={x} className="chip">{x}</span>)}</div> : '']]} />
        </div>
      </div>
      <Tiles>
        <Tile label="Average" value={showAverage(avg.pct, prof, avg).split(' · ')[0]} sub={`${plural(avg.count, 'graded item')}`} tone={tone(avg.pct, prof.passingPercent) === 'good' ? 'good' : tone(avg.pct, prof.passingPercent) ? 'warn' : undefined} />
        <Tile label="Attendance" value={pct(attT.rate)} sub={`${attT.absent} absent · ${attT.tardy} tardy`} />
        <Tile label="Missing" value={missing.length} tone={missing.length ? 'warn' : 'good'} />
        <Tile label="Goals" value={goals.filter((g) => g.status !== 'achieved').length} sub={`${goals.filter((g) => g.status === 'achieved').length} achieved`} />
      </Tiles>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'overview', label: 'Overview' }, { key: 'grades', label: 'Grades' }, { key: 'attendance', label: 'Attendance' }, { key: 'goals', label: 'Goals' }, { key: 'notes', label: 'Notes' }, { key: 'details', label: 'Edit details' }]} />

      {tab === 'overview' && <>
        {s.about && <div className="note-box">{s.about}</div>}
        {pinned.map((n) => <NoteCard key={n.id} n={n} />)}
        <Panel title="Progress by class">
          {classes.length ? classes.map((c) => { const a = avgFor(d, s, c.id); return (
            <div key={c.id} className="mtr"><div className="mtr-top"><span className="mtr-l"><span className="dot" style={{ background: c.color, marginRight: 8 }} />{c.name}</span><span className="mtr-v">{showAverage(a.pct, prof, a)}</span></div>
              <div className="mtr-track"><div className="mtr-fill" style={{ width: ((a.pct ?? 0) * 100) + '%', background: c.color }} /></div></div>
          ) }) : <div className="sub">Not in a class yet.</div>}
        </Panel>
        {missing.length > 0 && <Panel title="Missing work">{missing.map((a) => <div key={a.id} className="list-row"><div><b>{a.title}</b><div className="sub">{d.get('classes', a.classId)?.name} · due {shortDate(a.dueDate)}</div></div><span className="pill pill-bad">Missing</span></div>)}</Panel>}
        <Panel title="Goals">{goals.filter((g) => g.status !== 'achieved').length ? goals.filter((g) => g.status !== 'achieved').map((g) => { const h = goalHealth(g, t); return (
          <div key={g.id} className="list-row"><div><b>{g.title}</b><div className="sub">{g.scope === 'class' ? 'Class goal' : 'Personal goal'}{g.targetDate ? ` · target ${shortDate(g.targetDate)}` : ''}</div><div className="progress" style={{ marginTop: 6 }}><i style={{ width: g.progress + '%' }} className={h === 'behind' || h === 'overdue' ? 'behind' : ''} /></div></div><span className={'exc-b exc-' + HEALTH[h].tone} style={{ padding: '3px 8px' }}>{HEALTH[h].label}</span></div>
        ) }) : <div className="sub">No active goals.</div>}</Panel>
      </>}

      {tab === 'grades' && (
        assignments.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Assignment</th><th>Due</th><th>Grade</th><th>Turned in</th></tr></thead>
            <tbody>{assignments.map((a) => { const g = d.get('grades', gradeId(a.id, id)); return (
              <tr key={a.id}>
                <td><button className="linkbtn" style={{ fontWeight: 700, textAlign: 'left' }} onClick={() => go(`/assignments?open=${a.id}`)}>{a.title}</button><div className="sub">{d.get('classes', a.classId)?.name} · {a.category}{a.gradingType === 'points' ? ` · of ${a.pointsPossible}` : ''}</div></td>
                <td style={{ whiteSpace: 'nowrap' }}>{shortDate(a.dueDate)}</td>
                <td style={{ minWidth: 120 }}><GradeInput a={a} s={s} g={g} /></td>
                <td style={{ minWidth: 130 }}><GradeFlag a={a} s={s} g={g} /></td>
              </tr>
            ) })}</tbody>
          </table></div>
        ) : <div className="empty">No assignments in {s.firstName}’s classes yet.</div>
      )}

      {tab === 'attendance' && <>
        <div className="counts"><div>Present: <b>{attT.present}</b></div><div>Tardy: <b>{attT.tardy}</b></div><div>Absent: <b>{attT.absent}</b></div><div>Excused: <b>{attT.excused}</b></div><div>Rate: <b>{pct(attT.rate)}</b></div></div>
        {att.length ? <div className="tbl-wrap"><table className="tbl"><tbody>{att.slice(0, 60).map((r) => (
          <tr key={r.id}><td>{shortDate(r.date, true)}</td><td className="sub">{d.get('classes', r.classId)?.name}</td><td><span className={'pill pill-' + r.status}>{ATTENDANCE[r.status]}</span></td><td className="sub">{r.note}</td></tr>
        ))}</tbody></table></div> : <div className="empty">No attendance recorded yet.</div>}
      </>}

      {tab === 'goals' && <>
        {goalId ? <Panel title={goalId === 'new' ? `New goal for ${s.firstName}` : 'Edit goal'} right={<button className="btn-ghost" onClick={() => setGoalId(null)}>Done</button>}>
          <GoalForm id={goalId === 'new' ? null : goalId} studentId={id} onCreate={(nid) => setGoalId(nid)} /></Panel>
          : <div className="row" style={{ marginBottom: 12 }}><button className="btn-primary" onClick={() => setGoalId('new')}>+ Goal for {s.firstName}</button></div>}
        {goals.map((g) => { const h = goalHealth(g, t); return (
          <div key={g.id} className="list-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => g.scope === 'student' ? setGoalId(g.id) : go(`/goals?open=${g.id}`)} onKeyDown={(e) => e.key === 'Enter' && setGoalId(g.id)}>
            <div><b>{g.title}</b><div className="sub">{g.scope === 'class' ? 'Class goal' : 'Personal goal'} · {g.progress}%{g.targetDate ? ` · target ${shortDate(g.targetDate)}` : ''}</div></div>
            <span className={'exc-b exc-' + HEALTH[h].tone} style={{ padding: '3px 8px' }}>{HEALTH[h].label}</span>
          </div>
        ) })}
        {!goals.length && !goalId && <div className="sub">No goals yet.</div>}
      </>}

      {tab === 'notes' && <NotesPanel parentType="student" parentId={id} />}

      {tab === 'details' && <>
        <StudentForm id={id} />
        <div className="plan" style={{ marginTop: 18 }}>
          <div className="plan-l" style={{ color: 'var(--bad)' }}>Delete student</div>
          <p className="sub" style={{ marginTop: 0 }}>Removes {s.firstName} and all of their grades, attendance, goals and notes. To keep their record but take them out of a class, untick the class above.</p>
          <button className="btn-danger" onClick={del}>Delete {s.firstName}…</button>
        </div>
      </>}
    </Drawer>
  )
}
