import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NewNote, NoteCard } from '../components/NotesPanel'
import { EmptyHero, PageHead, Panel, Search } from '../components/ui'
import { NOTE_PARENT, fullName, type ID, type Note, type NoteParent } from '../lib/model'
import { byName, useParam } from '../lib/queries'
import { useDB, type Snapshot } from '../lib/store'

export function noteTarget(d: Snapshot, n: Note): { label: string; to: string | null } {
  if (n.parentType === 'student') { const s = d.get('students', n.parentId); return { label: s ? fullName(s) : 'Deleted student', to: s ? `/students?open=${s.id}` : null } }
  if (n.parentType === 'class') { const c = d.get('classes', n.parentId); return { label: c?.name || 'Deleted class', to: c ? `/classes/${c.id}?tab=notes` : null } }
  if (n.parentType === 'assignment') { const a = d.get('assignments', n.parentId); return { label: a?.title || 'Deleted assignment', to: a ? `/assignments?open=${a.id}` : null } }
  if (n.parentType === 'goal') { const g = d.get('goals', n.parentId); return { label: g?.title || 'Deleted goal', to: g ? `/goals?open=${g.id}` : null } }
  return { label: 'General', to: null }
}

export default function Notes() {
  const d = useDB()
  const [isNew] = useParam('new')
  const [type, setType] = useState<'all' | NoteParent>('all')
  const [q, setQ] = useState('')
  const [target, setTarget] = useState<{ t: NoteParent; id: ID | null }>({ t: 'general', id: null })
  const [draft, setDraft] = useState<ID | null>(null)
  const notes = useMemo(() => d.list('notes')
    .filter((n) => n.id !== draft)
    .filter((n) => type === 'all' || n.parentType === type)
    .filter((n) => !q || `${n.body} ${noteTarget(d, n).label}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.updatedAt < b.updatedAt ? 1 : -1)), [d, type, q, draft])
  const options: Record<NoteParent, { id: ID; label: string }[]> = {
    general: [],
    student: [...d.list('students')].sort(byName).map((s) => ({ id: s.id, label: fullName(s) })),
    class: d.list('classes').map((c) => ({ id: c.id, label: c.name })),
    assignment: [...d.list('assignments')].sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1)).map((a) => ({ id: a.id, label: `${a.title} (${d.get('classes', a.classId)?.name || ''})` })),
    goal: d.list('goals').map((g) => ({ id: g.id, label: g.title })),
  }

  return (
    <>
      <PageHead kicker="Records" title="Notes" sub="Private notes — they never leave this device" />
      <div className="grid2" style={{ alignItems: 'start' }}>
        <Panel title="Write a note" sub="Attach it to a student, class, assignment or goal — or keep it general">
          <div className="form-grid" style={{ marginBottom: 10 }}>
            <label>About<select className="fld" value={target.t} onChange={(e) => setTarget({ t: e.target.value as NoteParent, id: null })}>{Object.entries(NOTE_PARENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            {target.t !== 'general' && <label>{NOTE_PARENT[target.t]}<select className="fld" value={target.id || ''} onChange={(e) => setTarget({ ...target, id: e.target.value || null })}><option value="">Choose…</option>{options[target.t].map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>}
          </div>
          {target.t === 'general' || target.id
            ? <NewNote key={target.t + target.id + (isNew || '')} parentType={target.t} parentId={target.id} onDraft={setDraft} />
            : <div className="sub">Choose who or what the note is about.</div>}
        </Panel>
        <Panel title="All notes" sub={`${notes.length} shown · pinned first`} right={
          <div className="filters">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Type"><option value="all">All notes</option>{Object.entries(NOTE_PARENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <Search value={q} onChange={setQ} placeholder="Search notes" />
          </div>}>
          {notes.length ? <div className="stack">{notes.map((n) => {
            const tg = noteTarget(d, n)
            return <NoteCard key={n.id} n={n} context={<>{NOTE_PARENT[n.parentType]}{n.parentType !== 'general' && <> · {tg.to ? <Link to={tg.to}>{tg.label}</Link> : tg.label}</>}</>} />
          })}</div> : d.list('notes').length ? <div className="empty">No notes match.</div> : <EmptyHero title="No notes yet">Write your first note on the left. Notes about a student also appear on their profile.</EmptyHero>}
        </Panel>
      </div>
    </>
  )
}
