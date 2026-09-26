import { Link } from 'react-router-dom'
import { DayChart, Meter } from '../components/charts'
import { toast } from '../components/dialogs'
import { EmptyHero, PageHead, Panel, Tabs, Tile, Tiles, AutoText } from '../components/ui'
import { addDays, downloadCsv, isWeekend, longDate, pct, schoolDays, shortDate, today, weekday } from '../lib/format'
import { ATTENDANCE, ATTENDANCE_ORDER, fullName, initials, type Attendance as AttendanceRec, type AttendanceStatus, type ClassRoom } from '../lib/model'
import { activeClasses, allClasses, attendanceId, studentsIn, tally, useParam } from '../lib/queries'
import { batch, saveRecord, useDB } from '../lib/store'

type Tab = 'take' | 'date' | 'student' | 'summary'
const logged = new Set<string>()

export default function Attendance() {
  const d = useDB()
  const [tab, setTab] = useParam('tab')
  const [classQ, setClassQ] = useParam('class')
  const [dateQ, setDateQ] = useParam('date')
  const [range, setRange] = useParam('range')
  const classes = activeClasses(d)
  const c = d.get('classes', classQ) || classes[0]
  const t = today()
  // On a weekend, open on the last school day (usually Friday) — the day a teacher is most likely catching up on.
  const date = dateQ || (isWeekend(t) ? schoolDays(t, 1)[0] : t)
  const current = (tab || 'take') as Tab
  const days = Number(range || 30)

  if (!c) return <><PageHead kicker="Classroom" title="Attendance" /><Panel title="No classes yet"><EmptyHero title="Create a class first" action={<Link className="btn-primary" to="/classes?new=1">New class</Link>} /></Panel></>

  const classPick = <select className="fld" style={{ width: 'auto' }} value={c.id} onChange={(e) => setClassQ(e.target.value)} aria-label="Class">{allClasses(d).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
  const since = addDays(t, -days)
  const att = d.list('attendance')
  const inRange = att.filter((r) => r.date > since && r.date <= t)

  return (
    <>
      <PageHead kicker="Classroom" title="Attendance" sub={current === 'take' ? `${c.name} · ${longDate(date)}` : undefined} right={classPick} />
      <Tabs value={current} onChange={(k) => setTab(k)} tabs={[{ key: 'take', label: 'Take attendance' }, { key: 'date', label: 'By date' }, { key: 'student', label: 'By student' }, { key: 'summary', label: 'Summary' }]} />
      {current === 'take' && <Take c={c} date={date} setDate={(x) => setDateQ(x)} />}
      {current === 'date' && <ByDate c={c} onOpen={(x) => { setDateQ(x); setTab(null) }} />}
      {(current === 'student' || current === 'summary') && (
        <div className="filters" style={{ marginBottom: 12 }}>
          <select value={String(days)} onChange={(e) => setRange(e.target.value === '30' ? null : e.target.value)} aria-label="Period">
            <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option>
          </select>
        </div>
      )}
      {current === 'student' && <ByStudent c={c} rows={inRange.filter((r) => r.classId === c.id)} days={days} />}
      {current === 'summary' && <Summary classes={classes} rows={inRange} />}
    </>
  )
}

function Take({ c, date, setDate }: { c: ClassRoom; date: string; setDate: (d: string) => void }) {
  const d = useDB()
  const kids = studentsIn(d, c.id)
  const rec = (sid: string) => d.get('attendance', attendanceId(c.id, sid, date))
  const recs = kids.map((s) => rec(s.id)).filter((r): r is NonNullable<typeof r> => !!r)
  const tl = tally(recs)
  const log = (b: Parameters<Parameters<typeof batch>[0]>[0]) => { const k = c.id + date; if (!logged.has(k)) { logged.add(k); b.log('attendance', 'attendance', null, `Took attendance for ${c.name}${date === today() ? '' : ' on ' + shortDate(date)}`) } }
  const mark = (sid: string, status: AttendanceStatus) => batch((b) => { b.save('attendance', { id: attendanceId(c.id, sid, date), classId: c.id, studentId: sid, date, status, note: rec(sid)?.note || '' }); log(b) })
  const allPresent = () => {
    const todo = kids.filter((s) => !rec(s.id))
    batch((b) => { todo.forEach((s) => b.save('attendance', { id: attendanceId(c.id, s.id, date), classId: c.id, studentId: s.id, date, status: 'present', note: '' })); log(b) })
    toast(todo.length ? `${todo.length} marked present` : 'Everyone already has a mark')
  }
  const step = (n: number) => { let x = addDays(date, n); while (isWeekend(x)) x = addDays(x, n); setDate(x) }

  return (
    <Panel title="Take attendance" sub={recs.length ? `${recs.length} of ${kids.length} marked · ${tl.present} present, ${tl.absent} absent, ${tl.tardy} tardy, ${tl.excused} excused` : `${kids.length} students · tap a status — it saves instantly`}
      right={<div className="filters">
        <button className="btn-ghost" onClick={() => step(-1)} aria-label="Previous school day">‹</button>
        <input className="fld" type="date" style={{ width: 'auto' }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Date" />
        <button className="btn-ghost" onClick={() => step(1)} aria-label="Next school day">›</button>
        {date !== today() && <button className="btn-ghost" onClick={() => setDate(today())}>Today</button>}
        <button className="btn-primary" onClick={allPresent} disabled={!kids.length}>Mark the rest present</button>
      </div>}>
      {isWeekend(date) && <div className="band-note" style={{ marginTop: 0, marginBottom: 10 }}>{weekday(date, 'long')} is a weekend day. You can still record attendance for it.</div>}
      {kids.length ? kids.map((s) => {
        const r = rec(s.id)
        return (
          <div key={s.id} className="att-row">
            <div className="who"><span className="av" style={{ background: c.color }}>{initials(s)}</span><div><b>{fullName(s)}</b>{!r && <div className="sub">Not marked</div>}</div></div>
            <div className="row">
              <div className="seg" role="radiogroup" aria-label={`Attendance for ${fullName(s)}`}>
                {ATTENDANCE_ORDER.map((st) => <button key={st} role="radio" aria-checked={r?.status === st} data-s={st} className={r?.status === st ? 'on' : ''} onClick={() => mark(s.id, st)}>{ATTENDANCE[st]}</button>)}
              </div>
              {r && r.status !== 'present' && <AutoText className="fld" value={r.note} placeholder="Note (optional)" ariaLabel={`Note for ${fullName(s)}`} onSave={(v) => saveRecord('attendance', { id: r.id, note: v })} />}
            </div>
          </div>
        )
      }) : <EmptyHero title="No students in this class" action={<Link className="btn-primary" to={`/classes/${c.id}`}>Add students</Link>} />}
    </Panel>
  )
}

function ByDate({ c, onOpen }: { c: ClassRoom; onOpen: (d: string) => void }) {
  const d = useDB()
  const rows = d.list('attendance').filter((r) => r.classId === c.id)
  const dates = [...new Set(rows.map((r) => r.date))].sort().reverse()
  const n = studentsIn(d, c.id).length
  return (
    <Panel title="Attendance by date" sub={`${dates.length} days recorded for ${c.name}`} right={<button className="btn-ghost" onClick={() => downloadCsv(`attendance-${c.name.replace(/\W+/g, '-')}.csv`, [['Date', 'Student', 'Status', 'Note'], ...rows.sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => [r.date, fullName(d.get('students', r.studentId) || { firstName: '?', lastName: '' }), ATTENDANCE[r.status], r.note])])}>CSV</button>}>
      {dates.length ? <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Date</th><th className="r">Present</th><th className="r">Tardy</th><th className="r">Absent</th><th className="r">Excused</th><th className="r">Marked</th><th className="r">Rate</th></tr></thead>
        <tbody>{dates.map((x) => { const tl = tally(rows.filter((r) => r.date === x)); return (
          <tr key={x} className="clickable" onClick={() => onOpen(x)}><td className="strong">{weekday(x)} {shortDate(x, true)}</td><td className="r mono">{tl.present}</td><td className="r mono">{tl.tardy}</td><td className="r mono">{tl.absent}</td><td className="r mono">{tl.excused}</td><td className="r mono">{tl.total}/{n}</td><td className="r mono">{pct(tl.rate)}</td></tr>
        ) })}</tbody>
      </table></div> : <div className="empty">No attendance recorded for this class yet.</div>}
    </Panel>
  )
}

function ByStudent({ c, rows, days }: { c: ClassRoom; rows: AttendanceRec[]; days: number }) {
  const d = useDB()
  const kids = studentsIn(d, c.id).map((s) => ({ s, tl: tally(rows.filter((r) => r.studentId === s.id)) })).sort((a, b) => (a.tl.rate ?? 2) - (b.tl.rate ?? 2))
  return (
    <Panel title="Attendance by student" sub={`${c.name} · last ${days} days · lowest first`}>
      {kids.length ? <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Student</th><th className="r">Present</th><th className="r">Tardy</th><th className="r">Absent</th><th className="r">Excused</th><th className="r">Rate</th></tr></thead>
        <tbody>{kids.map(({ s, tl }) => (
          <tr key={s.id}><td><Link to={`/students?open=${s.id}`} className="strong">{fullName(s)}</Link></td><td className="r mono">{tl.present}</td><td className="r mono">{tl.tardy}</td><td className="r mono">{tl.absent}</td><td className="r mono">{tl.excused}</td>
            <td className="r">{tl.rate == null ? '—' : <span className={'pill ' + (tl.rate >= 0.95 ? 'pill-good' : tl.rate >= 0.9 ? 'pill-warn' : 'pill-bad')}>{pct(tl.rate)}</span>}</td></tr>
        ))}</tbody>
      </table></div> : <div className="empty">No students in this class.</div>}
    </Panel>
  )
}

function Summary({ classes, rows }: { classes: ClassRoom[]; rows: AttendanceRec[] }) {
  const d = useDB()
  const tl = tally(rows)
  const byStudent = new Map<string, AttendanceRec[]>()
  rows.forEach((r) => byStudent.set(r.studentId, [...(byStudent.get(r.studentId) || []), r]))
  const rates = [...byStudent.entries()].map(([sid, rs]) => ({ s: d.get('students', sid), tl: tally(rs) })).filter((x) => x.s)
  const low = rates.filter((x) => x.tl.rate != null && x.tl.rate < 0.9).sort((a, b) => a.tl.rate! - b.tl.rate!)
  const perfect = rates.filter((x) => x.tl.absent === 0 && x.tl.tardy === 0 && x.tl.total > 0).length
  const series = schoolDays(today(), 20).map((x) => { const y = tally(rows.filter((r) => r.date === x)); return { label: shortDate(x).replace(/^\w+ /, ''), value: y.rate == null ? 0 : y.rate * 100, text: y.rate == null ? 'not taken' : Math.round(y.rate * 100) + '%' } })
  return (
    <>
      <Tiles>
        <Tile label="Attendance rate" value={pct(tl.rate)} sub={`${tl.total} marks`} tone={tl.rate != null && tl.rate >= 0.95 ? 'good' : 'warn'} />
        <Tile label="Absences" value={tl.absent} sub={`${tl.excused} excused`} />
        <Tile label="Tardies" value={tl.tardy} />
        <Tile label="Perfect attendance" value={perfect} sub="no absences or tardies" tone="good" />
      </Tiles>
      <div className="p21">
        <Panel title="Daily attendance rate" sub="Last 20 school days, all classes"><DayChart series={series} max={100} /></Panel>
        <Panel title="By class">{classes.map((c) => { const x = tally(rows.filter((r) => r.classId === c.id)); return <Meter key={c.id} label={c.name} num={x.present + x.tardy} den={x.total - x.excused} note={`${x.absent} absent · ${x.tardy} tardy`} tone={(x.rate ?? 1) >= 0.95 ? 'good' : (x.rate ?? 1) >= 0.9 ? 'warn' : 'bad'} /> })}</Panel>
      </div>
      <Panel title="Students below 90%" sub="Worth a check-in">
        {low.length ? low.map(({ s, tl: x }) => (
          <div key={s!.id} className="list-row"><div><Link to={`/students?open=${s!.id}`} className="strong">{fullName(s!)}</Link><div className="sub">{x.absent} absent · {x.tardy} tardy · {x.excused} excused</div></div><span className="pill pill-bad">{pct(x.rate)}</span></div>
        )) : <div className="sub">Everyone is at 90% or above.</div>}
      </Panel>
    </>
  )
}
