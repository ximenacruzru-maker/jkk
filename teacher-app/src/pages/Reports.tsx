// Reports: a class summary and printable student progress reports. Printing and CSV export happen on this device.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyHero, PageHead, Panel, Tabs, Tile, Tiles, KV } from '../components/ui'
import { addDays, downloadCsv, longDate, pct, plural, shortDate, today } from '../lib/format'
import { average, gradeId, isMissing, letterFor, masteryFor, score, showAverage, showGrade } from '../lib/grading'
import { GOAL_STATUS, MASTERY, fullName, type ClassRoom, type Student } from '../lib/model'
import { useProfile } from '../lib/profile'
import { activeClasses, allClasses, assignmentsOf, avgFor, classAverage, goalHealth, HEALTH, studentsIn, tally, useParam } from '../lib/queries'
import { useDB } from '../lib/store'

export default function Reports() {
  const d = useDB()
  const [classQ, setClassQ] = useParam('class')
  const [kind, setKind] = useState<'class' | 'student'>('class')
  const [who, setWho] = useState('all')
  const [range, setRange] = useState('all')
  const classes = activeClasses(d)
  const c = d.get('classes', classQ) || classes[0]
  if (!c) return <><PageHead kicker="Records" title="Reports" /><Panel title="No classes yet"><EmptyHero title="Create a class to see reports" action={<Link className="btn-primary" to="/classes?new=1">New class</Link>} /></Panel></>
  const kids = studentsIn(d, c.id)
  const since = range === 'all' ? '' : addDays(today(), -Number(range))
  const shown = kind === 'student' ? (who === 'all' ? kids : kids.filter((s) => s.id === who)) : []

  return (
    <>
      <PageHead kicker="Records" title="Reports" sub={`${c.name}${since ? ` · since ${shortDate(since, true)}` : ' · whole year'}`}
        right={<button className="btn-primary no-print" onClick={() => window.print()}>Print</button>} />
      <div className="filters no-print" style={{ marginBottom: 14 }}>
        <Tabs value={kind} onChange={setKind} tabs={[{ key: 'class', label: 'Class summary' }, { key: 'student', label: 'Student progress reports' }]} />
        <select className="fld" style={{ width: 'auto' }} value={c.id} onChange={(e) => { setClassQ(e.target.value); setWho('all') }} aria-label="Class">{allClasses(d).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        {kind === 'student' && <select className="fld" style={{ width: 'auto' }} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Student"><option value="all">Every student ({kids.length})</option>{kids.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}</select>}
        <select className="fld" style={{ width: 'auto' }} value={range} onChange={(e) => setRange(e.target.value)} aria-label="Period"><option value="all">Whole year</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>
      </div>
      {kind === 'class' ? <ClassSummary c={c} since={since} /> : shown.length
        ? shown.map((s, i) => <StudentReport key={s.id} s={s} c={c} since={since} breakAfter={i < shown.length - 1} />)
        : <Panel title="No students"><div className="empty">Add students to this class to print progress reports.</div></Panel>}
    </>
  )
}

function ClassSummary({ c, since }: { c: ClassRoom; since: string }) {
  const d = useDB()
  const prof = useProfile()
  const kids = studentsIn(d, c.id)
  const as = assignmentsOf(d, c.id).filter((a) => !since || a.dueDate >= since)
  const att = d.list('attendance').filter((r) => r.classId === c.id && (!since || r.date >= since))
  const rows = kids.map((s) => {
    const avg = avgFor(d, s, c.id), p = since ? average(as.map((a) => score(d.get('grades', gradeId(a.id, s.id)), a))) : avg.pct
    const goals = d.list('goals').filter((g) => g.studentId === s.id)
    return { s, p, avg, tl: tally(att.filter((r) => r.studentId === s.id)), missing: as.filter((a) => isMissing(d.get('grades', gradeId(a.id, s.id)), a)).length, goals: `${goals.filter((g) => g.status === 'achieved').length}/${goals.length}` }
  })
  const classAvg = since ? average(rows.map((r) => r.p)) : classAverage(d, c.id)
  const tl = tally(att)
  const csv = () => downloadCsv(`class-summary-${c.name.replace(/\W+/g, '-')}-${today()}.csv`, [['Student', 'Student ID', 'Average', 'Letter', 'Mastery', 'Attendance', 'Absent', 'Tardy', 'Missing', 'Goals achieved'],
    ...rows.map((r) => [fullName(r.s), r.s.studentCode, r.p == null ? '' : Math.round(r.p * 100) + '%', r.p == null ? '' : letterFor(r.p, prof.letterScale), r.p == null ? '' : MASTERY[masteryFor(r.p)!], r.tl.rate == null ? '' : Math.round(r.tl.rate * 100) + '%', r.tl.absent, r.tl.tardy, r.missing, r.goals])])
  return (
    <>
      <div className="print-only" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>{c.name} — class summary</h2><div className="sub">{[prof.teacherName, prof.school, prof.schoolYear, longDate(today())].filter(Boolean).join(' · ')}</div></div>
      <Tiles>
        <Tile label="Students" value={kids.length} />
        <Tile label="Class average" value={showAverage(classAvg, prof).split(' · ')[0]} />
        <Tile label="Attendance" value={pct(tl.rate)} sub={`${tl.absent} absences · ${tl.tardy} tardies`} />
        <Tile label="Assignments" value={as.length} sub={`${as.filter((a) => a.status === 'graded').length} graded`} />
      </Tiles>
      <Panel title="Class summary" sub={`${c.name} · ${plural(as.length, 'assignment')}`} right={<button className="btn-ghost no-print" onClick={csv}>CSV</button>}>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Student</th><th>Average</th><th>Mastery</th><th className="r">Attendance</th><th className="r">Missing</th><th className="r">Goals achieved</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.s.id}><td className="strong">{fullName(r.s)}</td><td>{showAverage(r.p, prof, since ? undefined : r.avg)}</td><td>{r.p == null ? '—' : MASTERY[masteryFor(r.p)!]}</td><td className="r mono">{pct(r.tl.rate)}</td><td className="r mono">{r.missing || '—'}</td><td className="r mono">{r.goals}</td></tr>
          ))}</tbody>
        </table></div>
      </Panel>
    </>
  )
}

function StudentReport({ s, c, since, breakAfter }: { s: Student; c: ClassRoom; since: string; breakAfter: boolean }) {
  const d = useDB()
  const prof = useProfile()
  const as = assignmentsOf(d, c.id).filter((a) => !since || a.dueDate >= since)
  const graded = as.filter((a) => score(d.get('grades', gradeId(a.id, s.id)), a) != null || isMissing(d.get('grades', gradeId(a.id, s.id)), a))
  const p = average(as.map((a) => score(d.get('grades', gradeId(a.id, s.id)), a)))
  const tl = tally(d.list('attendance').filter((r) => r.classId === c.id && r.studentId === s.id && (!since || r.date >= since)))
  const skills = d.list('skills').filter((k) => as.some((a) => a.skillIds.includes(k.id)))
  const goals = d.list('goals').filter((g) => g.studentId === s.id || (g.scope === 'class' && g.classId === c.id))
  return (
    <section className="panel" style={breakAfter ? { breakAfter: 'page' } : undefined}>
      <div className="panel-h"><div><div className="panel-t">{fullName(s)} — progress report</div><div className="panel-s">{[c.name, prof.teacherName, prof.school, prof.schoolYear].filter(Boolean).join(' · ')} · {longDate(today())}</div></div></div>
      <div className="panel-b">
        <KV rows={[['Overall', showAverage(p, prof)], ['Mastery', p == null ? '—' : MASTERY[masteryFor(p)!]], ['Attendance', `${pct(tl.rate)} (${tl.absent} absent, ${tl.tardy} tardy)`], ['Student ID', s.studentCode]]} />
        {skills.length > 0 && <>
          <div className="plan-l" style={{ marginTop: 10 }}>Skills</div>
          <div className="counts">{skills.map((k) => { const m = masteryFor(average(as.filter((a) => a.skillIds.includes(k.id)).map((a) => score(d.get('grades', gradeId(a.id, s.id)), a)))); return <div key={k.id}>{k.name}: <b>{m ? MASTERY[m] : '—'}</b></div> })}</div>
        </>}
        {goals.length > 0 && <>
          <div className="plan-l" style={{ marginTop: 10 }}>Goals</div>
          {goals.map((g) => <div key={g.id} className="list-row"><div><b>{g.title}</b><div className="sub">{g.scope === 'class' ? 'Class goal' : 'Personal goal'} · {GOAL_STATUS[g.status]}{g.targetDate ? ` · target ${shortDate(g.targetDate, true)}` : ''}</div><div className="progress" style={{ marginTop: 6 }}><i style={{ width: g.progress + '%' }} /></div></div><span className="sub">{g.progress}% · {HEALTH[goalHealth(g)].label}</span></div>)}
        </>}
        <div className="plan-l" style={{ marginTop: 10 }}>Assignments</div>
        {graded.length ? <table className="tbl inner"><thead><tr><th>Assignment</th><th>Due</th><th>Grade</th><th>Comment</th></tr></thead>
          <tbody>{graded.map((a) => { const g = d.get('grades', gradeId(a.id, s.id)); return <tr key={a.id}><td>{a.title}</td><td>{shortDate(a.dueDate)}</td><td>{showGrade(g, a) || (isMissing(g, a) ? 'Missing' : '—')}</td><td className="sub">{g?.comment}</td></tr> })}</tbody></table>
          : <div className="sub">No graded work in this period.</div>}
      </div>
    </section>
  )
}
