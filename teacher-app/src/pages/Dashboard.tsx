// The teacher dashboard, built on the Executive Dashboard's structure: a row of score cards, then paired panels.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { downloadBackup } from '../components/BackupTools'
import { Bars, DayChart, Donut, ICO, Meter, ScoreCard } from '../components/charts'
import { confirmDialog } from '../components/dialogs'
import { EmptyHero, PageHead, Panel, Tabs } from '../components/ui'
import { addDays, daysBetween, isWeekend, longDate, plural, schoolDays, shortDate, time12, timeAgo, today, weekday } from '../lib/format'
import { masteryFor, showAverage, tone } from '../lib/grading'
import { ASSIGNMENT_STATUS, MASTERY, MASTERY_ORDER, TASK_KIND, fullName, type Assignment, type ClassRoom, type Student } from '../lib/model'
import { firstName, useProfile } from '../lib/profile'
import { activeClasses, avgFor, classAverage, goalHealth, goalWho, gradedCount, HEALTH, missingFor, studentsIn, tally } from '../lib/queries'
import { replaceData, saveRecord, useDB } from '../lib/store'

export default function Dashboard() {
  const d = useDB()
  const prof = useProfile()
  const go = useNavigate()
  const t = today()
  const first = firstName(prof)
  const classes = activeClasses(d)
  const students = d.list('students')
  const head = <PageHead kicker={first ? `${first}’s classroom` : 'Your classroom'} title={longDate(t)} sub={[prof.school, prof.schoolYear].filter(Boolean).join(' · ')}
    right={<><button className="btn-primary" onClick={() => go('/attendance')}>Take attendance</button><button className="btn-ghost" onClick={() => go('/assignments?new=1')}>+ Assignment</button></>} />

  if (!classes.length && !students.length) return (
    <>
      {head}
      <Panel title="Let’s set up your classroom" sub="Three quick steps. Everything saves by itself as you go.">
        <div className="tr-att">
          <div className="tr-att-i"><span className="tr-att-n">1</span><div><b>Create a class</b><small>Name, grade, subject and room.</small></div><button className="btn-primary" onClick={() => go('/classes?new=1')}>New class</button></div>
          <div className="tr-att-i"><span className="tr-att-n">2</span><div><b>Add your students</b><small>One at a time, or paste a whole list of names at once.</small></div><button className="btn-ghost" onClick={() => go('/students?new=1')}>Add students</button></div>
          <div className="tr-att-i"><span className="tr-att-n">3</span><div><b>Create an assignment</b><small>Points, mastery levels or simply complete / not yet.</small></div><button className="btn-ghost" onClick={() => go('/assignments?new=1')}>New assignment</button></div>
        </div>
      </Panel>
    </>
  )

  const horizon = addDays(t, prof.upcomingDays)
  const classIds = new Set(classes.map((c) => c.id))
  const assignments = d.list('assignments').filter((a) => classIds.has(a.classId))
  const dueToday = assignments.filter((a) => a.dueDate === t)
  const upcoming = assignments.filter((a) => a.dueDate > t && a.dueDate <= horizon).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
  const missing = assignments.map((a) => ({ a, who: missingFor(d, a) })).filter((x) => x.who.length).sort((x, y) => (x.a.dueDate < y.a.dueDate ? 1 : -1))
  const missingCount = missing.reduce((n, x) => n + x.who.length, 0)
  const graded = assignments.filter((a) => a.status === 'graded').sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 8)
  const toGrade = assignments.filter((a) => a.status === 'completed')

  // attendance
  const att = d.list('attendance')
  // On a weekend, the attendance card and panel show the last school day instead of an empty today.
  const attDay = isWeekend(t) ? schoolDays(t, 1)[0] : t
  const attLabel = attDay === t ? 'today' : weekday(attDay, 'short')
  const todays = att.filter((r) => r.date === attDay && classIds.has(r.classId))
  const takenFor = classes.filter((c) => todays.some((r) => r.classId === c.id))
  const today_ = tally(todays)
  const days = schoolDays(t, 10)
  const series = days.map((day) => { const x = tally(att.filter((r) => r.date === day && classIds.has(r.classId))); return { label: weekday(day, 'short').slice(0, 2) + ' ' + day.slice(8), value: x.rate == null ? 0 : x.rate * 100, text: x.rate == null ? 'not taken' : Math.round(x.rate * 100) + '%' } })

  // tasks & events
  const tasks = d.list('tasks')
  const events = tasks.filter((x) => x.isEvent && x.date >= t && x.date <= horizon).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
  const open = tasks.filter((x) => !x.isEvent && !x.done)
  const overdue = open.filter((x) => x.date < t)
  const openNow = open.filter((x) => x.date <= t)

  // progress
  const byClass = classes.map((c) => ({ c, avg: classAverage(d, c.id) }))
  const avgs = students.map((s) => ({ s, avg: avgFor(d, s) }))
  const mastery = MASTERY_ORDER.map((m) => ({ label: MASTERY[m], value: avgs.filter((x) => masteryFor(x.avg.pct) === m).length }))
  const support = avgs.filter((x) => x.avg.pct != null && x.avg.pct * 100 < prof.passingPercent).sort((a, b) => a.avg.pct! - b.avg.pct!)

  const goals = d.list('goals').map((g) => ({ g, h: goalHealth(g, t) }))
  const attention = goals.filter((x) => ['overdue', 'behind', 'due_soon', 'not_started'].includes(x.h))
    .sort((a, b) => ['overdue', 'behind', 'due_soon', 'not_started'].indexOf(a.h) - ['overdue', 'behind', 'due_soon', 'not_started'].indexOf(b.h))

  const hasData = students.length > 0
  const staleBackup = prof.notifyInApp && hasData && !prof.sampleData && (!prof.lastBackupAt || daysBetween(prof.lastBackupAt.slice(0, 10), t) > 14)
  const clearSample = async () => {
    if (await confirmDialog({ title: 'Clear the sample classroom?', body: 'All the made-up classes, students and grades are removed and you’ll start fresh from the welcome screen.', confirm: 'Clear sample data', danger: true })) await replaceData({})
  }

  return (
    <>
      {head}
      {prof.sampleData && !__DEMO__ && (
        <div className="alert alert-warn"><div className="alert-bar"><span className="alert-ico">i</span>
          <div className="alert-msg"><b>You’re exploring a sample classroom.</b> Every name here is made up. Try anything — when you’re ready, clear it and set up your own.</div>
          <button className="btn-ghost" onClick={clearSample}>Clear sample &amp; start fresh</button></div></div>
      )}
      {staleBackup && (
        <div className="alert alert-warn"><div className="alert-bar"><span className="alert-ico">!</span>
          <div className="alert-msg"><b>{prof.lastBackupAt ? `Your last backup was ${timeAgo(prof.lastBackupAt)}.` : 'You haven’t downloaded a backup yet.'}</b> Your classroom lives only in this browser, so keep a copy somewhere safe.</div>
          <button className="btn-primary" onClick={downloadBackup}>Download backup</button></div></div>
      )}

      <div className="scg">
        <ScoreCard icon={ICO.users} iconClass="i-blue" label="Students" display={students.length} goalLine={`in ${plural(classes.length, 'class', 'classes')}`}
          note={support.length ? `${support.length} below ${prof.passingPercent}%` : 'everyone on track'} delta={support.length ? { tone: 'down', value: 'Needs support' } : { tone: 'up', value: 'On track' }} onOpen={() => go('/students')} more="All students" />
        <ScoreCard icon={ICO.book} iconClass="i-purple" label="Classes" display={classes.length} goalLine={plural(assignments.length, 'assignment')}
          note={toGrade.length ? `${plural(toGrade.length, 'assignment')} to grade` : 'nothing waiting to grade'} onOpen={() => go('/classes')} more="All classes" />
        <ScoreCard icon={ICO.doc} iconClass="i-amber" label={`Due next ${prof.upcomingDays} days`} display={dueToday.length + upcoming.length} goalLine={`${dueToday.length} due today`}
          delta={missingCount ? { tone: 'down', value: `${missingCount} missing` } : { tone: 'up', value: 'None missing' }} note="across all classes" onOpen={() => go('/assignments')} more="Assignments" />
        <ScoreCard icon={ICO.check} iconClass="i-green" label={`Attendance ${attLabel}`} display={today_.rate == null ? '—' : Math.round(today_.rate * 100) + '%'}
          goalLine={`${takenFor.length} of ${classes.length} classes taken`} pct={today_.rate == null ? null : today_.rate * 100} tone={today_.rate == null ? undefined : today_.rate >= 0.95 ? 'good' : today_.rate >= 0.9 ? 'warn' : 'bad'}
          note={today_.total ? `${today_.absent} absent · ${today_.tardy} tardy` : 'not taken yet'} onOpen={() => go('/attendance')} more="Take attendance" />
        <ScoreCard icon={ICO.cal} iconClass="i-teal" label="Upcoming events" display={events.length} goalLine={events[0] ? `Next: ${events[0].title}` : 'Nothing scheduled'}
          note={events[0] ? `${events[0].date === t ? 'Today' : shortDate(events[0].date)}${events[0].time ? ' · ' + time12(events[0].time) : ''}` : `next ${prof.upcomingDays} days`} onOpen={() => go('/planner')} more="Calendar" />
        <ScoreCard icon={ICO.tasks} iconClass="i-red" label="Tasks" display={openNow.length} goalLine={overdue.length ? `${overdue.length} overdue` : 'due today'}
          delta={overdue.length ? { tone: 'down', value: 'Catch up' } : { tone: 'up', value: 'All caught up' }} note={`${open.length} open in total`} onOpen={() => go('/planner')} more="Tasks" />
      </div>

      <div className="p21">
        <ProgressPanel byClass={byClass} mastery={mastery} support={support} />
        <Panel title="Attendance" sub={today_.total ? `${attDay === t ? 'Today' : longDate(attDay)}: ${today_.present} present, ${today_.absent} absent, ${today_.tardy} tardy, ${today_.excused} excused` : `Not taken yet ${attLabel === 'today' ? 'today' : 'on ' + longDate(attDay)}`}
          right={<Link className="btn-ghost" to="/attendance">Take attendance</Link>}>
          {classes.map((c) => {
            const x = tally(todays.filter((r) => r.classId === c.id)), n = studentsIn(d, c.id).length
            return x.total
              ? <Meter key={c.id} label={c.name} num={x.present + x.tardy} den={x.total - x.excused} note={x.absent ? `${x.absent} absent` : 'all here'} tone={(x.rate ?? 1) >= 0.95 ? 'good' : (x.rate ?? 1) >= 0.9 ? 'warn' : 'bad'} />
              : <div key={c.id} className="mtr"><div className="mtr-top"><span className="mtr-l">{c.name}</span><Link to={`/attendance?class=${c.id}${attDay === t ? '' : '&date=' + attDay}`} className="linkbtn">Take now ›</Link></div><div className="mtr-s">Not taken yet · {plural(n, 'student')}</div></div>
          })}
          <div className="plan-l" style={{ marginTop: 14 }}>Last {days.length} school days</div>
          <DayChart series={series} max={100} />
        </Panel>
      </div>

      <div className="p21">
        <AssignmentsPanel dueToday={dueToday} upcoming={upcoming} missing={missing} graded={graded} />
        <Panel title="Goals needing attention" sub={attention.length ? `${attention.length} of ${goals.length} goals` : goals.length ? 'Every goal is on track' : 'No goals yet'} right={<Link className="btn-ghost" to="/goals">All goals</Link>}>
          {attention.length ? (
            <div className="exc">{attention.slice(0, 7).map(({ g, h }) => (
              <div key={g.id} className="exc-r exc-click" role="button" tabIndex={0} onClick={() => go(`/goals?open=${g.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/goals?open=${g.id}`)}>
                <span className={'exc-b exc-' + HEALTH[h].tone}>{HEALTH[h].label}</span>
                <div><div className="exc-w">{g.title}</div><div className="exc-y">{goalWho(d, g)}{g.targetDate ? ` · target ${shortDate(g.targetDate)}` : ''}</div></div>
                <span className="exc-a">{g.progress}%</span>
              </div>))}</div>
          ) : <EmptyHero title={goals.length ? 'All on track' : 'No goals yet'} action={<Link className="btn-ghost" to="/goals?new=1">+ New goal</Link>}>{goals.length ? 'Nice work — nothing is behind or due this week.' : 'Set learning goals for a student or a whole class.'}</EmptyHero>}
        </Panel>
      </div>

      <div className="grid2">
        <TasksPanel />
        <Panel title="Recent activity" sub="What changed in your classroom, newest first">
          {d.list('activity').length ? (
            <div>{[...d.list('activity')].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 9).map((x) => (
              <div key={x.id} className="list-row"><span className="dot" style={{ background: x.kind === 'deleted' ? 'var(--bad)' : x.kind === 'graded' ? 'var(--good)' : 'var(--blue)', marginTop: 6 }} /><div><div>{x.summary}</div><div className="sub">{timeAgo(x.createdAt)}</div></div></div>
            ))}</div>
          ) : <div className="sub">Nothing yet.</div>}
        </Panel>
      </div>
    </>
  )
}

function ProgressPanel({ byClass, mastery, support }: { byClass: { c: ClassRoom; avg: number | null }[]; mastery: { label: string; value: number }[]; support: { s: Student; avg: ReturnType<typeof avgFor> }[] }) {
  const d = useDB(), prof = useProfile(), go = useNavigate()
  const [tab, setTab] = useState<'class' | 'mastery'>('class')
  return (
    <Panel title="Student progress" sub="Class averages from graded work" right={<Tabs value={tab} onChange={setTab} tabs={[{ key: 'class', label: 'By class' }, { key: 'mastery', label: 'Mastery' }]} />}>
      {tab === 'class'
        ? <Bars max={1} items={byClass.map(({ c, avg }) => ({ label: c.name, sub: `${plural(studentsIn(d, c.id).length, 'student')} · ${c.subject || 'Class'}`, value: avg ?? 0, text: showAverage(avg, prof), color: c.color, go: () => go(`/classes/${c.id}`) }))} />
        : <Donut rows={mastery} colors={['#FE454E', '#F79009', '#12B76A', 'var(--blue)']} center={String(mastery.reduce((a, b) => a + b.value, 0))} centerSub="students" />}
      <div className="plan-l" style={{ marginTop: 16 }}>Students who may need support</div>
      {support.length ? support.slice(0, 5).map(({ s, avg }) => {
        const c = d.get('classes', s.classIds[0])
        return (
          <div key={s.id} className="list-row" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => go(`/students?open=${s.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/students?open=${s.id}`)}>
            <span className="av" style={{ background: c?.color }}>{(s.firstName[0] || '') + (s.lastName[0] || '')}</span>
            <div><b>{fullName(s)}</b><div className="sub">{c?.name}</div></div>
            <span className={'pill pill-' + (tone(avg.pct, prof.passingPercent) === 'bad' ? 'bad' : 'warn')}>{showAverage(avg.pct, prof, avg)}</span>
          </div>
        )
      }) : <div className="sub">No one is below {prof.passingPercent}% right now.</div>}
    </Panel>
  )
}

function AssignmentsPanel({ dueToday, upcoming, missing, graded }: { dueToday: Assignment[]; upcoming: Assignment[]; missing: { a: Assignment; who: Student[] }[]; graded: Assignment[] }) {
  const d = useDB(), go = useNavigate(), t = today()
  const [tab, setTab] = useState<'today' | 'upcoming' | 'missing' | 'graded'>(dueToday.length ? 'today' : 'upcoming')
  const rows = tab === 'today' ? dueToday : tab === 'upcoming' ? upcoming : tab === 'graded' ? graded : missing.map((m) => m.a)
  const miss = new Map(missing.map((m) => [m.a.id, m.who]))
  return (
    <Panel title="Assignments" right={<Link className="btn-ghost" to="/assignments">All assignments</Link>}>
      <Tabs value={tab} onChange={setTab} tabs={[
        { key: 'today', label: `Due today · ${dueToday.length}` }, { key: 'upcoming', label: `Upcoming · ${upcoming.length}` },
        { key: 'missing', label: `Missing · ${missing.reduce((n, m) => n + m.who.length, 0)}` }, { key: 'graded', label: 'Recently graded' },
      ]} />
      {rows.length ? (
        <div className="tbl-wrap"><table className="tbl"><tbody>{rows.slice(0, 8).map((a) => {
          const c = d.get('classes', a.classId), n = studentsIn(d, a.classId).length
          return (
            <tr key={a.id} className="clickable" onClick={() => go(`/assignments?open=${a.id}`)}>
              <td><div className="strong">{a.title}</div><div className="sub"><span className="dot" style={{ background: c?.color, width: 8, height: 8, marginRight: 6 }} />{c?.name} · {a.category}</div></td>
              <td>{tab === 'missing' ? <span className="sub">{miss.get(a.id)!.slice(0, 3).map(fullName).join(', ')}{miss.get(a.id)!.length > 3 ? ` +${miss.get(a.id)!.length - 3}` : ''}</span> : <span className={'pill ' + (a.status === 'graded' ? 'pill-good' : a.status === 'completed' ? 'pill-warn' : a.status === 'in_progress' ? 'pill-blue' : 'pill-muted')}>{ASSIGNMENT_STATUS[a.status]}</span>}</td>
              <td className="r" style={{ whiteSpace: 'nowrap' }}>{tab === 'graded' ? `${gradedCount(d, a)}/${n} graded` : tab === 'missing' ? <span className="pill pill-bad">{miss.get(a.id)!.length} missing</span> : a.dueDate === t ? 'Today' : `${weekday(a.dueDate)} ${shortDate(a.dueDate)}`}</td>
            </tr>
          )
        })}</tbody></table></div>
      ) : <div className="empty">{tab === 'missing' ? 'Nothing missing. 🎉' : tab === 'today' ? 'Nothing due today.' : tab === 'graded' ? 'Nothing graded yet.' : 'Nothing due soon.'}</div>}
    </Panel>
  )
}

/** Declara's daily checklist, repurposed: today's and overdue tasks, tick to finish, type to add. */
function TasksPanel() {
  const d = useDB()
  const go = useNavigate()
  const t = today()
  const [text, setText] = useState('')
  const list = d.list('tasks').filter((x) => !x.isEvent && (x.date <= addDays(t, 2)) && (!x.done || x.date === t)).sort((a, b) => Number(a.done) - Number(b.done) || (a.date < b.date ? -1 : 1))
  const done = list.filter((x) => x.done).length
  const pct = list.length ? Math.round((done / list.length) * 100) : 0
  const add = () => { if (!text.trim()) return; saveRecord('tasks', { title: text.trim(), kind: 'personal', date: t, time: '', classId: null, studentId: null, notes: '', done: false, isEvent: false }, ['created', `Added task “${text.trim()}”`]); setText('') }
  return (
    <Panel title="Tasks & reminders" sub="Today, overdue and the next two days" right={<Link className="btn-ghost" to="/planner">Calendar</Link>}>
      {list.length > 0 && <div className="prog-row"><span>{done} of {list.length}</span><div className="progress"><i style={{ width: pct + '%' }} /></div><span>{pct}%</span></div>}
      {list.slice(0, 9).map((x) => (
        <label key={x.id} className={'check' + (x.done ? ' done' : '')}>
          <input type="checkbox" checked={x.done} onChange={(e) => saveRecord('tasks', { id: x.id, done: e.target.checked }, e.target.checked ? ['completed', `Finished “${x.title}”`] : undefined)} />
          <div style={{ flex: 1 }}>
            <div className="check-t">{x.title}</div>
            <div className="sub">{[TASK_KIND[x.kind], x.date < t ? `overdue since ${shortDate(x.date)}` : x.date === t ? 'today' : weekday(x.date), d.get('classes', x.classId)?.name].filter(Boolean).join(' · ')}</div>
          </div>
          <button className="linkbtn" onClick={(e) => { e.preventDefault(); go(`/planner?open=${x.id}`) }}>edit</button>
        </label>
      ))}
      {!list.length && <div className="sub" style={{ padding: '6px 0' }}>Nothing due. Enjoy it!</div>}
      <div className="row-actions" style={{ marginTop: 10 }}>
        <input className="fld" placeholder="Add a task for today" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} aria-label="Add a task for today" />
        <button className="btn-ghost" onClick={add}>Add</button>
      </div>
    </Panel>
  )
}
