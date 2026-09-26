// Record forms. They edit the saved record directly: a new record is created the moment its first detail is typed,
// and every change after that saves itself. Closing the drawer is all a teacher ever has to do.
import { useEffect, useRef, useState } from 'react'
import { today } from '../lib/format'
import {
  ASSIGNMENT_STATUS, CATEGORIES, CLASS_COLORS, GOAL_STATUS, GRADING_TYPE, TASK_KIND, fullName,
  type AssignmentStatus, type GoalStatus, type GradingType, type ID, type StoreName, type Tables, type TaskKind,
} from '../lib/model'
import { useProfile } from '../lib/profile'
import { activeClasses, allClasses, byName } from '../lib/queries'
import { saveRecord, useDB } from '../lib/store'
import { AutoNumber, AutoText, Field } from './ui'

/** Edit a record, creating it on the first change. */
export function useEditor<K extends StoreName>(store: K, id: ID | null, defaults: () => Partial<Tables[K]>, label: (r: Tables[K]) => string, onCreate?: (r: Tables[K]) => void) {
  const d = useDB()
  const rid = useRef<ID | null>(id)
  const [, bump] = useState(0)
  useEffect(() => { rid.current = id; bump((n) => n + 1) }, [id])
  const rec = rid.current ? d.get(store, rid.current) : undefined
  const view = { ...defaults(), ...rec } as Tables[K]
  const update = (patch: Partial<Tables[K]>) => {
    if (rid.current && d.get(store, rid.current)) { saveRecord(store, { ...patch, id: rid.current } as any); return }
    const r = saveRecord(store, { ...defaults(), ...patch } as any)
    saveRecord('activity', { kind: 'created', entity: store, entityId: r.id, summary: label(r) })
    rid.current = r.id
    bump((n) => n + 1)
    onCreate?.(r)
  }
  return { rec: view, exists: !!rec, update, id: rid.current }
}

export function Saved({ exists }: { exists: boolean }) {
  return <span className="saved-hint">{exists ? '✓ Saved automatically' : ''}</span>
}

/* ---------- class ---------- */
export function ClassForm({ id, onCreate }: { id: ID | null; onCreate?: (id: ID) => void }) {
  const prof = useProfile()
  const d = useDB()
  const { rec: c, update, exists } = useEditor('classes', id,
    () => ({ name: '', grade: prof.grade, subject: prof.subject, schoolYear: prof.schoolYear, room: '', description: '', color: CLASS_COLORS[d.list('classes').length % CLASS_COLORS.length], archived: false }),
    (r) => `Created class “${r.name}”`, (r) => onCreate?.(r.id))
  return (
    <div className="form-grid">
      <Field label="Class name" span="all"><AutoText value={c.name} autoFocus={!exists} placeholder="e.g. 2nd Grade Math" onSave={(v) => (v.trim() || exists) && update({ name: v.trim() || 'Untitled class' })} /></Field>
      <Field label="Grade"><AutoText value={c.grade} placeholder="e.g. 2" onSave={(v) => update({ grade: v })} /></Field>
      <Field label="Subject"><AutoText value={c.subject} placeholder="e.g. Math" onSave={(v) => update({ subject: v })} /></Field>
      <Field label="School year"><AutoText value={c.schoolYear} onSave={(v) => update({ schoolYear: v })} /></Field>
      <Field label="Room"><AutoText value={c.room} placeholder="e.g. 112" onSave={(v) => update({ room: v })} /></Field>
      <Field label="Colour" span="all" group>
        <div className="swatches">{CLASS_COLORS.map((col) => <button key={col} type="button" aria-label={'Colour ' + col} className={c.color === col ? 'on' : ''} style={{ background: col }} onClick={() => update({ color: col })} />)}</div>
      </Field>
      <Field label="Description" span="all"><AutoText multiline value={c.description} placeholder="What this class covers, schedule, anything useful" onSave={(v) => update({ description: v })} /></Field>
      {exists && <label className="check" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--ink)', flexDirection: 'row' }}>
        <input type="checkbox" checked={c.archived} onChange={(e) => update({ archived: e.target.checked })} /> Archived (hidden from the dashboard and pickers; nothing is deleted)</label>}
      <div className="span-all"><Saved exists={exists} /></div>
    </div>
  )
}

/* ---------- student ---------- */
export function StudentForm({ id, classId, onCreate }: { id: ID | null; classId?: ID | null; onCreate?: (id: ID) => void }) {
  const d = useDB()
  const { rec: s, update, exists } = useEditor('students', id,
    () => ({ firstName: '', lastName: '', studentCode: '', classIds: classId ? [classId] : [], grade: d.get('classes', classId)?.grade || '', tags: [], about: '' }),
    (r) => `Added student ${fullName(r)}`, (r) => onCreate?.(r.id))
  const [tag, setTag] = useState('')
  const allTags = [...new Set(d.list('students').flatMap((x) => x.tags))].sort()
  const addTag = () => { const t = tag.trim(); if (t && !s.tags.includes(t)) update({ tags: [...s.tags, t] }); setTag('') }
  return (
    <div className="form-grid">
      <Field label="First name"><AutoText value={s.firstName} autoFocus={!exists} onSave={(v) => (v.trim() || exists) && update({ firstName: v.trim() })} /></Field>
      <Field label="Last name"><AutoText value={s.lastName} onSave={(v) => (v.trim() || exists) && update({ lastName: v.trim() })} /></Field>
      <Field label="Student ID" hint="Optional"><AutoText value={s.studentCode} onSave={(v) => update({ studentCode: v.trim() })} /></Field>
      <Field label="Grade"><AutoText value={s.grade} onSave={(v) => update({ grade: v })} /></Field>
      <Field label="Classes" span="all" group>
        <div className="chips">
          {allClasses(d).map((c) => {
            const on = s.classIds.includes(c.id)
            return <button key={c.id} type="button" className="chip" style={on ? { background: c.color, color: '#fff' } : { background: 'var(--soft)', color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
              aria-pressed={on} onClick={() => update({ classIds: on ? s.classIds.filter((x) => x !== c.id) : [...s.classIds, c.id] })}>{on ? '✓ ' : ''}{c.name}</button>
          })}
          {!d.list('classes').length && <span className="hint">Create a class first to add students to it.</span>}
        </div>
      </Field>
      <Field label="Tags" span="all" group>
        <div className="chips" style={{ marginBottom: 6 }}>{s.tags.map((t) => <span key={t} className="chip">{t}<button type="button" aria-label={'Remove ' + t} onClick={() => update({ tags: s.tags.filter((x) => x !== t) })}>×</button></span>)}</div>
        <div className="row"><input className="fld" style={{ maxWidth: 260 }} list="tag-list" placeholder="Add a tag (e.g. Group A)" value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
          <button type="button" className="btn-ghost" onClick={addTag} disabled={!tag.trim()}>Add</button></div>
        <datalist id="tag-list">{allTags.map((t) => <option key={t} value={t} />)}</datalist>
      </Field>
      <Field label="About" span="all" hint="Private. Stays on this device."><AutoText multiline value={s.about} placeholder="Interests, what helps them learn, reminders" onSave={(v) => update({ about: v })} /></Field>
      <div className="span-all"><Saved exists={exists} /></div>
    </div>
  )
}

/* ---------- assignment ---------- */
export function AssignmentForm({ id, classId, onCreate }: { id: ID | null; classId?: ID | null; onCreate?: (id: ID) => void }) {
  const d = useDB()
  const classes = activeClasses(d)
  const first = d.get('classes', classId) || classes[0]
  const { rec: a, update, exists } = useEditor('assignments', id,
    () => ({ classId: first?.id || '', title: '', description: '', subject: first?.subject || '', category: 'Classwork', dueDate: today(), pointsPossible: 10, gradingType: 'points' as GradingType, status: 'not_started' as AssignmentStatus, skillIds: [] }),
    (r) => `Created assignment “${r.title}”`, (r) => onCreate?.(r.id))
  if (!classes.length && !exists) return <p className="sub">Create a class first, then add assignments to it.</p>
  const skills = d.list('skills').sort((x, y) => x.name.localeCompare(y.name))
  return (
    <div className="form-grid">
      <Field label="Title" span="all"><AutoText value={a.title} autoFocus={!exists} placeholder="e.g. Chapter 3 quiz" onSave={(v) => (v.trim() || exists) && update({ title: v.trim() || 'Untitled assignment' })} /></Field>
      <Field label="Class"><select className="fld" value={a.classId} onChange={(e) => { const c = d.get('classes', e.target.value); update({ classId: e.target.value, subject: a.subject || c?.subject || '' }) }}>
        {allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>)}</select></Field>
      <Field label="Subject"><AutoText value={a.subject} onSave={(v) => update({ subject: v })} /></Field>
      <Field label="Category"><AutoText list="cat-list" value={a.category} onSave={(v) => update({ category: v })} /></Field>
      <Field label="Due date"><input className="fld" type="date" value={a.dueDate} onChange={(e) => e.target.value && update({ dueDate: e.target.value })} /></Field>
      <Field label="Graded by"><select className="fld" value={a.gradingType} onChange={(e) => update({ gradingType: e.target.value as GradingType })}>
        {Object.entries(GRADING_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      {a.gradingType === 'points' && <Field label="Points possible"><AutoNumber value={a.pointsPossible} min={0} onSave={(v) => update({ pointsPossible: v ?? 0 })} /></Field>}
      <Field label="Status"><select className="fld" value={a.status} onChange={(e) => update({ status: e.target.value as AssignmentStatus })}>
        {Object.entries(ASSIGNMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      {skills.length > 0 && <Field label="Skills" span="all" group>
        <div className="chips">{skills.map((k) => { const on = a.skillIds.includes(k.id); return <button key={k.id} type="button" className="chip" aria-pressed={on} style={on ? undefined : { background: 'var(--soft)', color: 'var(--muted)', boxShadow: 'inset 0 0 0 1px var(--line)' }} onClick={() => update({ skillIds: on ? a.skillIds.filter((x) => x !== k.id) : [...a.skillIds, k.id] })}>{on ? '✓ ' : ''}{k.name}</button> })}</div>
      </Field>}
      <Field label="Description & notes" span="all"><AutoText multiline value={a.description} placeholder="Instructions, materials, anything to remember" onSave={(v) => update({ description: v })} /></Field>
      <datalist id="cat-list">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
      <div className="span-all"><Saved exists={exists} /></div>
    </div>
  )
}

/* ---------- goal ---------- */
export function GoalForm({ id, studentId, classId, onCreate }: { id: ID | null; studentId?: ID | null; classId?: ID | null; onCreate?: (id: ID) => void }) {
  const d = useDB()
  const t = today()
  const { rec: g, update, exists } = useEditor('goals', id,
    () => ({ scope: studentId ? 'student' as const : classId ? 'class' as const : 'student' as const, studentId: studentId || null, classId: classId || d.get('students', studentId)?.classIds[0] || null, title: '', description: '', subject: '', skillId: null, startDate: t, targetDate: '', progress: 0, status: 'not_started' as GoalStatus }),
    (r) => `Created goal “${r.title}”`, (r) => onCreate?.(r.id))
  const students = [...d.list('students')].sort(byName)
  return (
    <div className="form-grid">
      <Field label="Goal" span="all"><AutoText value={g.title} autoFocus={!exists} placeholder="e.g. Read 60 words per minute" onSave={(v) => (v.trim() || exists) && update({ title: v.trim() || 'Untitled goal' })} /></Field>
      <Field label="For"><select className="fld" value={g.scope} onChange={(e) => update({ scope: e.target.value as 'student' | 'class' })}><option value="student">One student</option><option value="class">A whole class</option></select></Field>
      {g.scope === 'student'
        ? <Field label="Student"><select className="fld" value={g.studentId || ''} onChange={(e) => { const s = d.get('students', e.target.value); update({ studentId: e.target.value || null, classId: s?.classIds[0] || g.classId }) }}>
          <option value="">Choose…</option>{students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}</select></Field>
        : <Field label="Class"><select className="fld" value={g.classId || ''} onChange={(e) => update({ classId: e.target.value || null })}>
          <option value="">Choose…</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
      <Field label="Subject"><AutoText value={g.subject} onSave={(v) => update({ subject: v })} /></Field>
      <Field label="Skill"><select className="fld" value={g.skillId || ''} onChange={(e) => update({ skillId: e.target.value || null })}>
        <option value="">None</option>{d.list('skills').sort((a, b) => a.name.localeCompare(b.name)).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></Field>
      <Field label="Start date"><input className="fld" type="date" value={g.startDate} onChange={(e) => update({ startDate: e.target.value })} /></Field>
      <Field label="Target date"><input className="fld" type="date" value={g.targetDate} onChange={(e) => update({ targetDate: e.target.value })} /></Field>
      <Field label="Status"><select className="fld" value={g.status} onChange={(e) => { const status = e.target.value as GoalStatus; update({ status, ...(status === 'achieved' ? { progress: 100 } : {}) }) }}>
        {Object.entries(GOAL_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label={`Progress · ${g.progress}%`} span="all">
        <input type="range" min={0} max={100} step={5} value={g.progress} aria-label="Progress" style={{ accentColor: 'var(--blue)' }}
          onChange={(e) => { const progress = Number(e.target.value); update({ progress, status: progress >= 100 ? 'achieved' : progress > 0 && g.status === 'not_started' ? 'in_progress' : g.status === 'achieved' && progress < 100 ? 'in_progress' : g.status }) }} />
      </Field>
      <Field label="Description" span="all"><AutoText multiline value={g.description} placeholder="How you’ll measure it, supports, next steps" onSave={(v) => update({ description: v })} /></Field>
      <div className="span-all"><Saved exists={exists} /></div>
    </div>
  )
}

/* ---------- task / event ---------- */
export function TaskForm({ id, date, onCreate }: { id: ID | null; date?: string; onCreate?: (id: ID) => void }) {
  const d = useDB()
  const { rec: t, update, exists } = useEditor('tasks', id,
    () => ({ title: '', kind: 'lesson_prep' as TaskKind, date: date || today(), time: '', classId: null, studentId: null, notes: '', done: false, isEvent: false }),
    (r) => `Added ${r.isEvent ? 'event' : 'task'} “${r.title}”`, (r) => onCreate?.(r.id))
  return (
    <div className="form-grid">
      <Field label="What" span="all"><AutoText value={t.title} autoFocus={!exists} placeholder="e.g. Grade spelling tests" onSave={(v) => (v.trim() || exists) && update({ title: v.trim() || 'Untitled' })} /></Field>
      <Field label="Type"><select className="fld" value={t.kind} onChange={(e) => { const kind = e.target.value as TaskKind; update({ kind, isEvent: exists ? t.isEvent : ['parent_meeting', 'school_event', 'test', 'activity'].includes(kind) }) }}>
        {Object.entries(TASK_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Show as"><select className="fld" value={t.isEvent ? 'event' : 'task'} onChange={(e) => update({ isEvent: e.target.value === 'event' })}><option value="task">Task to tick off</option><option value="event">Calendar event</option></select></Field>
      <Field label="Date"><input className="fld" type="date" value={t.date} onChange={(e) => e.target.value && update({ date: e.target.value })} /></Field>
      <Field label="Time" hint="Optional"><input className="fld" type="time" value={t.time} onChange={(e) => update({ time: e.target.value })} /></Field>
      <Field label="Class"><select className="fld" value={t.classId || ''} onChange={(e) => update({ classId: e.target.value || null })}><option value="">None</option>{allClasses(d).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Student"><select className="fld" value={t.studentId || ''} onChange={(e) => update({ studentId: e.target.value || null })}><option value="">None</option>{[...d.list('students')].sort(byName).map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}</select></Field>
      <Field label="Notes" span="all"><AutoText multiline value={t.notes} onSave={(v) => update({ notes: v })} /></Field>
      {exists && <label className="check" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--ink)', flexDirection: 'row' }}><input type="checkbox" checked={t.done} onChange={(e) => update({ done: e.target.checked })} /> Done</label>}
      <div className="span-all"><Saved exists={exists} /></div>
    </div>
  )
}
