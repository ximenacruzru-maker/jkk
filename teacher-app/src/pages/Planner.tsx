// Calendar & Tasks: Declara's work queue adapted for a teacher — a month calendar with events, tasks and assignment
// due dates, the selected day's agenda, and the full task list with filters.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { confirmDialog, toast } from '../components/dialogs'
import { TaskForm } from '../components/forms'
import { Drawer, Empty, PageHead, Panel, Search, Tile, Tiles } from '../components/ui'
import { addDays, downloadCsv, longDate, shortDate, time12, today } from '../lib/format'
import { TASK_KIND, fullName, type ID, type Task } from '../lib/model'
import { allClasses, useParam } from '../lib/queries'
import { removeRecord, saveRecord, useDB } from '../lib/store'

const KIND_COLOR: Record<string, string> = { lesson_prep: '#23359A', grading: '#1F7A57', parent_meeting: '#BE185D', activity: '#0E7490', test: '#B4461E', project: '#7A3FB8', school_event: '#C08438', personal: '#6b7280' }
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Planner() {
  const d = useDB()
  const go = useNavigate()
  const t = today()
  const [open, setOpen] = useParam('open')
  const [isNew, setNew] = useParam('new')
  const [created, setCreated] = useState<ID | null>(null)
  const [sel, setSel] = useState(t)
  const [month, setMonth] = useState(t.slice(0, 7))
  const [status, setStatus] = useState('open')
  const [kind, setKind] = useState('all')
  const [cls, setCls] = useState('all')
  const [q, setQ] = useState('')

  const tasks = d.list('tasks')
  const assignments = d.list('assignments')
  // Month grid: 6 weeks starting the Sunday on or before the 1st.
  const first = month + '-01'
  const start = addDays(first, -new Date(first + 'T12:00:00Z').getUTCDay())
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const onDay = (day: string) => ({
    items: tasks.filter((x) => x.date === day).sort((a, b) => Number(!a.isEvent) - Number(!b.isEvent) || (a.time || '99') .localeCompare(b.time || '99')),
    due: assignments.filter((a) => a.dueDate === day),
  })
  const shift = (n: number) => { const [y, m] = month.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(dt.toISOString().slice(0, 7)) }
  const monthLabel = new Date(first + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const day = onDay(sel)

  const list = useMemo(() => tasks
    .filter((x) => status === 'all' || (status === 'open' ? !x.done : status === 'done' ? x.done : status === 'overdue' ? !x.done && x.date < t : status === 'events' ? x.isEvent : !x.isEvent))
    .filter((x) => kind === 'all' || x.kind === kind)
    .filter((x) => cls === 'all' || x.classId === cls)
    .filter((x) => !q || `${x.title} ${x.notes}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1)), [tasks, status, kind, cls, q, t])
  const openT = tasks.filter((x) => !x.done && !x.isEvent)
  const closeNew = () => { setNew(null); setCreated(null) }
  const toggle = (x: Task, done: boolean) => saveRecord('tasks', { id: x.id, done }, done ? ['completed', `Finished “${x.title}”`] : undefined)

  return (
    <>
      <PageHead kicker="Workspace" title="Calendar & Tasks" sub="Lesson prep, grading, parent meetings, tests, projects and school events"
        right={<button className="btn-primary" onClick={() => setNew('task')}>+ Task or event</button>} />
      <Tiles>
        <Tile label="Open tasks" value={openT.length} sub={`across ${new Set(openT.map((x) => x.kind)).size} types`} />
        <Tile label="Overdue" value={openT.filter((x) => x.date < t).length} tone={openT.some((x) => x.date < t) ? 'warn' : 'good'} />
        <Tile label="Due today" value={openT.filter((x) => x.date === t).length} />
        <Tile label="Events this week" value={tasks.filter((x) => x.isEvent && x.date >= t && x.date <= addDays(t, 7)).length} />
      </Tiles>
      <div className="p21">
        <Panel title="Calendar" right={<div className="cal-top" style={{ margin: 0 }}>
          <button className="btn-ghost" onClick={() => shift(-1)} aria-label="Previous month">‹</button><h3>{monthLabel}</h3><button className="btn-ghost" onClick={() => shift(1)} aria-label="Next month">›</button>
          <button className="btn-ghost" onClick={() => { setMonth(t.slice(0, 7)); setSel(t) }}>Today</button></div>}>
          <div className="cal">
            {WEEK.map((w) => <div key={w} className="cal-h">{w}</div>)}
            {cells.map((c) => {
              const x = onDay(c), all = [...x.items.map((i) => ({ k: i.id, t: (i.time ? time12(i.time).replace(':00', '') + ' ' : '') + i.title, cls: i.done ? 'done' : '', col: KIND_COLOR[i.kind] })), ...x.due.map((a) => ({ k: a.id, t: 'Due: ' + a.title, cls: 'due', col: '' }))]
              return (
                <div key={c} className={'cal-d' + (c.slice(0, 7) !== month ? ' out' : '') + (c === t ? ' today' : '') + (c === sel ? ' sel' : '')} role="button" tabIndex={0}
                  aria-label={`${longDate(c)}: ${all.length} items`} onClick={() => setSel(c)} onKeyDown={(e) => e.key === 'Enter' && setSel(c)} onDoubleClick={() => { setSel(c); setNew('task') }}>
                  <span className="cal-n">{Number(c.slice(8))}</span>
                  {all.slice(0, 3).map((e) => <span key={e.k} className={'cal-e ' + e.cls} style={e.col ? { '--c': e.col } as React.CSSProperties : undefined}>{e.t}</span>)}
                  {all.length > 3 && <span className="cal-more">+{all.length - 3} more</span>}
                </div>
              )
            })}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Click a day to see it; double-click to add something on that day.</p>
        </Panel>
        <Panel title={sel === t ? 'Today' : longDate(sel)} sub={shortDate(sel, true)} right={<button className="btn-ghost" onClick={() => setNew('task')}>+ Add</button>}>
          {!day.items.length && !day.due.length && <div className="sub">Nothing on this day.</div>}
          {day.items.map((x) => (
            <label key={x.id} className={'check' + (x.done ? ' done' : '')}>
              {x.isEvent ? <span className="dot" style={{ background: KIND_COLOR[x.kind], margin: '6px 4px 0' }} /> : <input type="checkbox" checked={x.done} onChange={(e) => toggle(x, e.target.checked)} />}
              <div style={{ flex: 1 }}><div className="check-t">{x.title}</div><div className="sub">{[x.time && time12(x.time), TASK_KIND[x.kind], d.get('classes', x.classId)?.name, x.studentId && fullName(d.get('students', x.studentId) || { firstName: '', lastName: '' })].filter(Boolean).join(' · ')}</div></div>
              <button className="linkbtn" onClick={(e) => { e.preventDefault(); setOpen(x.id) }}>edit</button>
            </label>
          ))}
          {day.due.map((a) => (
            <div key={a.id} className="check"><span className="pill pill-warn">Due</span><div style={{ flex: 1 }}><div className="check-t">{a.title}</div><div className="sub">{d.get('classes', a.classId)?.name}</div></div><button className="linkbtn" onClick={() => go(`/assignments?open=${a.id}`)}>open</button></div>
          ))}
        </Panel>
      </div>
      <Panel title="Tasks & events" sub={`${list.length} shown`} right={
        <div className="filters">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="open">Open</option><option value="overdue">Overdue</option><option value="done">Done</option><option value="tasks">Tasks only</option><option value="events">Events only</option><option value="all">Everything</option></select>
          <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type"><option value="all">All types</option>{Object.entries(TASK_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class"><option value="all">All classes</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <Search value={q} onChange={setQ} />
          <button className="btn-ghost" onClick={() => downloadCsv(`tasks-${t}.csv`, [['Date', 'Time', 'Title', 'Type', 'Event', 'Class', 'Done', 'Notes'], ...list.map((x) => [x.date, x.time, x.title, TASK_KIND[x.kind], x.isEvent ? 'yes' : '', d.get('classes', x.classId)?.name, x.done ? 'yes' : '', x.notes])])}>CSV</button>
        </div>}>
        {list.length ? <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th style={{ width: 36 }} /><th>What</th><th>Type</th><th>When</th><th>Class / student</th><th /></tr></thead>
          <tbody>{list.map((x) => (
            <tr key={x.id}>
              <td>{x.isEvent ? <span className="dot" style={{ background: KIND_COLOR[x.kind] }} /> : <input type="checkbox" checked={x.done} aria-label={`Done: ${x.title}`} onChange={(e) => toggle(x, e.target.checked)} />}</td>
              <td><div className="strong" style={x.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{x.title}</div>{x.notes && <div className="sub">{x.notes}</div>}</td>
              <td><span className="pill pill-muted" style={{ color: KIND_COLOR[x.kind] }}>{TASK_KIND[x.kind]}{x.isEvent ? ' · event' : ''}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>{x.date === t ? 'Today' : shortDate(x.date)}{x.time && ` · ${time12(x.time)}`} {!x.done && !x.isEvent && x.date < t && <span className="pill pill-bad">late</span>}</td>
              <td className="sub">{[d.get('classes', x.classId)?.name, x.studentId && fullName(d.get('students', x.studentId) || { firstName: '', lastName: '' })].filter(Boolean).join(' · ')}</td>
              <td className="r" style={{ whiteSpace: 'nowrap' }}><button className="linkbtn" onClick={() => setOpen(x.id)}>Edit</button> · <button className="linkbtn" style={{ color: 'var(--bad)' }} onClick={async () => { if (await confirmDialog({ title: `Delete “${x.title}”?`, confirm: 'Delete', danger: true })) { removeRecord('tasks', x.id); toast('Deleted') } }}>Delete</button></td>
            </tr>
          ))}</tbody>
        </table></div> : <Empty>Nothing here.</Empty>}
      </Panel>
      <Drawer open={!!isNew} onClose={closeNew} title="New task or event" sub="Type what it is and it’s saved — no Save button needed."><TaskForm id={created} date={sel} onCreate={setCreated} /></Drawer>
      <Drawer open={!!open && !!d.get('tasks', open)} onClose={() => setOpen(null)} title="Edit task or event">{open && <TaskForm id={open} />}</Drawer>
    </>
  )
}
