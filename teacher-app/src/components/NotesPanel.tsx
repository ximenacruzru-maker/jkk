// Private notes attached to a student, class, assignment or goal (or general notes). Each note edits in place and
// saves itself; a new note is created as soon as something is typed.
import { useEffect, useRef, useState } from 'react'
import { timeAgo } from '../lib/format'
import type { ID, Note, NoteParent } from '../lib/model'
import { onFlush, removeRecord, saveRecord, useDB } from '../lib/store'
import { confirmDialog } from './dialogs'
import { AutoText } from './ui'

export function NoteCard({ n, context }: { n: Note; context?: React.ReactNode }) {
  return (
    <div className={'note-card' + (n.pinned ? ' pinned' : '')}>
      {context && <div className="sub" style={{ fontWeight: 700 }}>{context}</div>}
      <AutoText multiline className="" value={n.body} ariaLabel="Note" onSave={(v) => saveRecord('notes', { id: n.id, body: v })} />
      <div className="note-foot">
        <span>{n.updatedAt === n.createdAt ? 'Written' : 'Edited'} {timeAgo(n.updatedAt)}</span>
        <span className="row" style={{ gap: 12 }}>
          <button className="linkbtn" onClick={() => saveRecord('notes', { id: n.id, pinned: !n.pinned })}>{n.pinned ? 'Unpin' : 'Pin'}</button>
          <button className="linkbtn" style={{ color: 'var(--bad)' }} onClick={async () => { if (await confirmDialog({ title: 'Delete this note?', body: n.body.slice(0, 160) || 'This note is empty.', confirm: 'Delete', danger: true })) removeRecord('notes', n.id) }}>Delete</button>
        </span>
      </div>
    </div>
  )
}

/** New-note box: nothing is saved until the teacher types. The note is created on the first pause and keeps
 *  saving while they write; when they click away the box empties, ready for the next note. */
export function NewNote({ parentType, parentId, placeholder, onDraft }: { parentType: NoteParent; parentId: ID | null; placeholder?: string; onDraft?: (id: ID | null) => void }) {
  const [text, setText] = useState('')
  const id = useRef<ID | null>(null), timer = useRef<number | undefined>(undefined), latest = useRef('')
  const flush = () => {
    window.clearTimeout(timer.current)
    const v = latest.current
    if (!v.trim() && !id.current) return
    if (id.current) saveRecord('notes', { id: id.current, body: v })
    else { id.current = saveRecord('notes', { parentType, parentId, body: v, pinned: false }, ['created', 'Added a note']).id; onDraft?.(id.current) }
  }
  useEffect(() => onFlush(flush))
  const done = () => { flush(); id.current = null; latest.current = ''; setText(''); onDraft?.(null) }
  return (
    <div className="note-card" style={{ borderStyle: 'dashed' }}>
      <textarea value={text} aria-label="New note" placeholder={placeholder || 'Write a private note… it saves as you type'} rows={2}
        onChange={(e) => { setText(e.target.value); latest.current = e.target.value; window.clearTimeout(timer.current); timer.current = window.setTimeout(flush, 500) }}
        onBlur={done} />
    </div>
  )
}

export default function NotesPanel({ parentType, parentId }: { parentType: NoteParent; parentId: ID }) {
  const d = useDB()
  const [draft, setDraft] = useState<ID | null>(null)
  const notes = d.list('notes').filter((n) => n.parentType === parentType && n.parentId === parentId && n.id !== draft)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.updatedAt < b.updatedAt ? 1 : -1))
  return (
    <div className="stack">
      <NewNote parentType={parentType} parentId={parentId} onDraft={setDraft} />
      {notes.map((n) => <NoteCard key={n.id} n={n} />)}
      <p className="hint">Notes are private and stay on this device.</p>
    </div>
  )
}
