import { useMemo, useState } from 'react'
import { confirmDialog, toast } from '../components/dialogs'
import { GoalForm } from '../components/forms'
import NotesPanel from '../components/NotesPanel'
import { AutoText, Drawer, EmptyHero, PageHead, Panel, Search, Tabs, Tile, Tiles } from '../components/ui'
import { plural, shortDate, today } from '../lib/format'
import { GOAL_STATUS, type ID } from '../lib/model'
import { allClasses, expectedProgress, goalHealth, goalWho, HEALTH, useParam, type Health } from '../lib/queries'
import { removeRecord, saveRecord, useDB } from '../lib/store'

export default function Goals() {
  const d = useDB()
  const t = today()
  const [tab, setTab] = useParam('tab')
  const [open, setOpen] = useParam('open')
  const [isNew, setNew] = useParam('new')
  const [created, setCreated] = useState<ID | null>(null)
  const [cls, setCls] = useState('all')
  const [scope, setScope] = useState('all')
  const [health, setHealth] = useState('active')
  const [q, setQ] = useState('')
  const goals = d.list('goals')
  const rows = useMemo(() => goals.map((g) => ({ g, h: goalHealth(g, t) }))
    .filter(({ g }) => cls === 'all' || g.classId === cls)
    .filter(({ g }) => scope === 'all' || g.scope === scope)
    .filter(({ h }) => health === 'all' || (health === 'active' ? h !== 'achieved' : health === 'attention' ? ['overdue', 'behind', 'due_soon'].includes(h) : h === health))
    .filter(({ g }) => !q || `${g.title} ${g.subject} ${g.description} ${goalWho(d, g)}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.g.targetDate || '9') < (b.g.targetDate || '9') ? -1 : 1), [goals, cls, scope, health, q, t, d])
  const hs = goals.map((g) => goalHealth(g, t))
  const closeNew = () => { setNew(null); if (created) setOpen(created); setCreated(null) }

  return (
    <>
      <PageHead kicker="Learning" title="Goals & Skills" sub={`${plural(goals.length, 'goal')} · ${plural(d.list('skills').length, 'skill')}`}
        right={tab === 'skills' ? undefined : <button className="btn-primary" onClick={() => setNew('1')}>+ Goal</button>} />
      <Tabs value={tab === 'skills' ? 'skills' : 'goals'} onChange={(k) => setTab(k === 'goals' ? null : k)} tabs={[{ key: 'goals', label: 'Learning goals' }, { key: 'skills', label: 'Skills' }]} />
      {tab === 'skills' ? <Skills /> : <>
        <Tiles>
          <Tile label="Active goals" value={hs.filter((h) => h !== 'achieved').length} />
          <Tile label="On track" value={hs.filter((h) => h === 'on_track').length} tone="good" />
          <Tile label="Need attention" value={hs.filter((h) => ['overdue', 'behind', 'due_soon'].includes(h)).length} tone={hs.some((h) => ['overdue', 'behind'].includes(h)) ? 'warn' : undefined} />
          <Tile label="Achieved" value={hs.filter((h) => h === 'achieved').length} tone="good" />
        </Tiles>
        <Panel title="Goals" sub={`${rows.length} shown`} right={
          <div className="filters">
            <select value={health} onChange={(e) => setHealth(e.target.value)} aria-label="Status"><option value="active">Active</option><option value="attention">Needs attention</option>{(Object.keys(HEALTH) as Health[]).map((h) => <option key={h} value={h}>{HEALTH[h].label}</option>)}<option value="all">All goals</option></select>
            <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="For"><option value="all">Students &amp; classes</option><option value="student">Student goals</option><option value="class">Class goals</option></select>
            <select value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Class"><option value="all">All classes</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <Search value={q} onChange={setQ} placeholder="Search goals" />
          </div>}>
          {rows.length ? (
            <div className="cards">{rows.map(({ g, h }) => {
              const exp = Math.round(expectedProgress(g, t))
              return (
                <div key={g.id} className="card goal-card">
                  <div className="fu-top"><span className={'exc-b exc-' + HEALTH[h].tone} style={{ padding: '3px 8px' }}>{HEALTH[h].label}</span><span className="sub">{g.scope === 'class' ? 'Class goal' : 'Student goal'}</span></div>
                  <button className="linkbtn card-t" style={{ textAlign: 'left', fontSize: 16, color: 'var(--navy)' }} onClick={() => setOpen(g.id)}>{g.title}</button>
                  <div className="card-s">{goalWho(d, g)}{g.subject ? ` · ${g.subject}` : ''}{g.skillId ? ` · ${d.get('skills', g.skillId)?.name || ''}` : ''}</div>
                  <div className="prog-row" style={{ margin: '6px 0 0' }}><div className="progress"><i style={{ width: g.progress + '%' }} className={h === 'achieved' ? 'done' : h === 'behind' || h === 'overdue' ? 'behind' : ''} /></div><span>{g.progress}%</span></div>
                  <input type="range" min={0} max={100} step={5} value={g.progress} aria-label={`Progress for ${g.title}`}
                    onChange={(e) => { const p = Number(e.target.value); saveRecord('goals', { id: g.id, progress: p, status: p >= 100 ? 'achieved' : p > 0 && (g.status === 'not_started' || g.status === 'achieved') ? 'in_progress' : g.status }) }}
                    onPointerUp={() => saveRecord('activity', { kind: 'progress', entity: 'goals', entityId: g.id, summary: `Updated ${goalWho(d, g)}’s goal “${g.title}” to ${d.get('goals', g.id)?.progress}%` })} />
                  <div className="goal-meta"><span>{g.targetDate ? `Target ${shortDate(g.targetDate, true)}` : 'No target date'}</span>{h !== 'achieved' && g.targetDate && <span>Expected by now: {exp}%</span>}</div>
                </div>
              )
            })}</div>
          ) : goals.length ? <div className="empty">No goals match these filters.</div>
            : <EmptyHero title="No goals yet" action={<button className="btn-primary" onClick={() => setNew('1')}>Create a goal</button>}>Set a goal for one student (“Read 60 words per minute”) or a whole class (“Master addition facts to 20”), then track progress toward a target date.</EmptyHero>}
        </Panel>
      </>}
      <Drawer open={!!isNew} onClose={closeNew} title="New learning goal" sub="Type the goal and it’s saved — no Save button needed.">
        <GoalForm id={created} classId={cls !== 'all' ? cls : null} onCreate={setCreated} />
      </Drawer>
      {open && d.get('goals', open) && <GoalDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function GoalDrawer({ id, onClose }: { id: ID; onClose: () => void }) {
  const d = useDB()
  const [tab, setTab] = useState<'details' | 'notes'>('details')
  const g = d.get('goals', id)!
  const h = goalHealth(g)
  const del = async () => {
    if (!await confirmDialog({ title: `Delete the goal “${g.title}”?`, danger: true, confirm: 'Delete goal', body: 'The goal and its notes are removed from this device.' })) return
    removeRecord('goals', id, `Deleted goal “${g.title}”`); toast('Goal deleted'); onClose()
  }
  return (
    <Drawer open onClose={onClose} title={g.title} sub={`${goalWho(d, g)} · ${GOAL_STATUS[g.status]} · ${HEALTH[h].label}`}>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'details', label: 'Goal' }, { key: 'notes', label: 'Notes & check-ins' }]} />
      {tab === 'details' ? <>
        <GoalForm id={id} />
        <div className="plan" style={{ marginTop: 18 }}><div className="plan-l" style={{ color: 'var(--bad)' }}>Delete goal</div><button className="btn-danger" onClick={del}>Delete this goal…</button></div>
      </> : <NotesPanel parentType="goal" parentId={id} />}
    </Drawer>
  )
}

function Skills() {
  const d = useDB()
  const [name, setName] = useState('')
  const skills = [...d.list('skills')].sort((a, b) => a.subject.localeCompare(b.subject) || a.name.localeCompare(b.name))
  const add = () => { if (!name.trim()) return; saveRecord('skills', { name: name.trim(), subject: '', description: '' }, ['created', `Added skill “${name.trim()}”`]); setName('') }
  return (
    <Panel title="Skills" sub="Tag assignments and goals with skills to see mastery per skill in the Gradebook">
      <div className="row-actions" style={{ marginBottom: 12 }}>
        <input className="fld" style={{ maxWidth: 340 }} placeholder="New skill, e.g. Sight words" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} aria-label="New skill" />
        <button className="btn-primary" onClick={add} disabled={!name.trim()}>Add skill</button>
      </div>
      {skills.length ? <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Skill</th><th>Subject</th><th>Description</th><th className="r">Used in</th><th /></tr></thead>
        <tbody>{skills.map((k) => {
          const na = d.list('assignments').filter((a) => a.skillIds.includes(k.id)).length, ng = d.list('goals').filter((g) => g.skillId === k.id).length
          return (
            <tr key={k.id}>
              <td style={{ minWidth: 160 }}><AutoText value={k.name} ariaLabel="Skill name" onSave={(v) => v.trim() && saveRecord('skills', { id: k.id, name: v.trim() })} /></td>
              <td style={{ minWidth: 120 }}><AutoText value={k.subject} ariaLabel="Subject" placeholder="Subject" onSave={(v) => saveRecord('skills', { id: k.id, subject: v })} /></td>
              <td style={{ minWidth: 200 }}><AutoText value={k.description} ariaLabel="Description" placeholder="What mastery looks like" onSave={(v) => saveRecord('skills', { id: k.id, description: v })} /></td>
              <td className="r sub" style={{ whiteSpace: 'nowrap' }}>{plural(na, 'assignment')} · {plural(ng, 'goal')}</td>
              <td className="r"><button className="linkbtn" style={{ color: 'var(--bad)' }} onClick={async () => { if (await confirmDialog({ title: `Delete the skill “${k.name}”?`, body: 'Assignments and goals keep everything else; they just lose this tag.', confirm: 'Delete', danger: true })) removeRecord('skills', k.id, `Deleted skill “${k.name}”`) }}>Delete</button></td>
            </tr>
          )
        })}</tbody>
      </table></div> : <div className="empty">No skills yet. Add the skills you teach — letter sounds, place value, scientific observation…</div>}
    </Panel>
  )
}
