// The app's data, held in memory for instant screens and written through to IndexedDB on every change.
// There is no Save button: every save() / remove() call is persisted straight away (in order, one transaction each),
// and the top bar shows "Saving…" until the browser confirms it is on disk.
import { useSyncExternalStore } from 'react'
import { readAll, replaceAll, write, type WriteOp } from './db'
import { STORES, type Activity, type ID, type StoreName, type Tables } from './model'

type Data = { [K in StoreName]: Map<ID, Tables[K]> }
const empty = (): Data => Object.fromEntries(STORES.map((s) => [s, new Map()])) as unknown as Data

let data: Data = empty()
const lists: Partial<{ [K in StoreName]: Tables[K][] }> = {}
const listeners = new Set<() => void>()

export interface Snapshot {
  v: number
  list<K extends StoreName>(s: K): Tables[K][]
  get<K extends StoreName>(s: K, id: ID | null | undefined): Tables[K] | undefined
}
const makeSnap = (v: number): Snapshot => ({
  v,
  list: (s) => (lists[s] ??= [...data[s].values()] as any) as any,
  get: (s, id) => (id ? data[s].get(id) : undefined) as any,
})
let snap = makeSnap(0)

function changed(stores: StoreName[]) {
  for (const s of stores) delete lists[s]
  snap = makeSnap(snap.v + 1)
  listeners.forEach((f) => f())
}
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
/** Re-renders the component whenever any record changes. */
export function useDB(): Snapshot { return useSyncExternalStore(subscribe, () => snap) }
export const db = () => snap

/* ---------- save status (shown in the top bar) ---------- */
export type SaveState = { status: 'loading' | 'saved' | 'saving' | 'error' | 'memory'; at: string | null; error: string | null }
let save: SaveState = { status: 'loading', at: null, error: null }
const saveListeners = new Set<() => void>()
const setSave = (s: Partial<SaveState>) => { save = { ...save, ...s }; saveListeners.forEach((f) => f()) }
export function useSaveState() { return useSyncExternalStore((f) => { saveListeners.add(f); return () => { saveListeners.delete(f) } }, () => save) }

let persistent = true
let queue: Promise<void> = Promise.resolve()
let pending = 0
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('declara-teacher') : null

function persist(ops: WriteOp[]) {
  if (!persistent || !ops.length) return
  pending++
  setSave({ status: 'saving' })
  queue = queue.then(() => write(ops)).then(
    () => {
      pending--
      if (!pending) setSave({ status: 'saved', at: new Date().toISOString(), error: null })
      channel?.postMessage({ stores: [...new Set(ops.map((o) => o.store))] })
      askToKeep()
    },
    (e) => { pending--; setSave({ status: 'error', error: String(e?.message || e) }) },
  )
}

/** Asks the browser to keep this site's storage even when the disk runs low (it may say no; data is still saved). */
let asked = false
export function askToKeep() {
  if (asked) return
  asked = true
  navigator.storage?.persist?.().catch(() => {})
}

/* ---------- loading ---------- */
export async function init() {
  try {
    const all = await readAll()
    data = empty()
    for (const s of STORES) for (const r of all[s] || []) (data[s] as Map<ID, any>).set(r.id, r)
    changed(STORES)
    setSave({ status: 'saved' })
    // Another tab of the app saved something: read those stores again so this tab shows it too.
    if (channel) channel.onmessage = async (e) => {
      const stores = (e.data?.stores || []) as StoreName[]
      if (!stores.length) return
      const fresh = await readAll(stores)
      for (const s of stores) { const m = new Map<ID, any>(); for (const r of fresh[s]) m.set(r.id, r); (data as any)[s] = m }
      changed(stores)
    }
  } catch (e: any) {
    // No IndexedDB (some private windows): the app still works, but nothing survives closing the tab.
    persistent = false
    setSave({ status: 'memory', error: String(e?.message || e) })
    changed(STORES)
  }
}
export const isPersistent = () => persistent

/* ---------- writing ---------- */
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2))
const now = () => new Date().toISOString()

type Input<K extends StoreName> = Partial<Tables[K]> & { id?: ID }
export interface Batch {
  save<K extends StoreName>(store: K, rec: Input<K>): Tables[K]
  remove(store: StoreName, id: ID): void
  log(kind: Activity['kind'], entity: StoreName, entityId: ID | null, summary: string): void
}

/** Groups several changes into one saved transaction. Returns whatever the callback returns. */
export function batch<T>(fn: (b: Batch) => T): T {
  const puts = new Map<StoreName, Map<ID, any>>(), dels = new Map<StoreName, Set<ID>>()
  const touch = (s: StoreName) => { if (!puts.has(s)) puts.set(s, new Map()); if (!dels.has(s)) dels.set(s, new Set()) }
  const b: Batch = {
    save(store, rec) {
      touch(store)
      const id = rec.id || uid(), t = now()
      const prev = data[store].get(id)
      const next = { ...(prev || { createdAt: t }), ...rec, id, updatedAt: t } as any
      ;(data[store] as Map<ID, any>).set(id, next)
      puts.get(store)!.set(id, next); dels.get(store)!.delete(id)
      return next
    },
    remove(store, id) {
      if (!data[store].has(id)) return
      touch(store)
      data[store].delete(id)
      puts.get(store)!.delete(id); dels.get(store)!.add(id)
    },
    log(kind, entity, entityId, summary) {
      b.save('activity', { kind, entity, entityId, summary })
      // Keep the activity feed to its most recent 400 entries.
      const all = [...data.activity.values()]
      if (all.length > 400) all.sort((a, c) => (a.createdAt < c.createdAt ? -1 : 1)).slice(0, all.length - 400).forEach((a) => b.remove('activity', a.id))
    },
  }
  const out = fn(b)
  const stores = [...new Set([...puts.keys(), ...dels.keys()])]
  if (stores.length) {
    changed(stores)
    persist(stores.map((s) => ({ store: s, put: [...(puts.get(s)?.values() || [])], del: [...(dels.get(s) || [])] })))
  }
  return out
}

export function saveRecord<K extends StoreName>(store: K, rec: Input<K>, log?: [Activity['kind'], string]): Tables[K] {
  return batch((b) => {
    const r = b.save(store, rec)
    if (log) b.log(log[0], store, r.id, log[1])
    return r
  })
}

/** Deletes a record and everything that only makes sense with it (a class's assignments and attendance, a student's grades…). */
export function removeRecord(store: StoreName, id: ID, summary?: string) {
  batch((b) => {
    cascade(b, store, id)
    if (summary) b.log('deleted', store, null, summary)
  })
}

function cascade(b: Batch, store: StoreName, id: ID) {
  const where = <K extends StoreName>(s: K, f: (r: Tables[K]) => boolean) => [...data[s].values()].filter(f)
  const notesOf = (t: string) => where('notes', (n) => n.parentType === t && n.parentId === id).forEach((n) => b.remove('notes', n.id))
  if (store === 'classes') {
    where('assignments', (a) => a.classId === id).forEach((a) => cascade(b, 'assignments', a.id))
    where('attendance', (a) => a.classId === id).forEach((a) => b.remove('attendance', a.id))
    where('goals', (g) => g.scope === 'class' && g.classId === id).forEach((g) => cascade(b, 'goals', g.id))
    where('goals', (g) => g.scope === 'student' && g.classId === id).forEach((g) => b.save('goals', { id: g.id, classId: null }))
    where('students', (s) => s.classIds.includes(id)).forEach((s) => b.save('students', { id: s.id, classIds: s.classIds.filter((c) => c !== id) }))
    where('tasks', (t) => t.classId === id).forEach((t) => b.save('tasks', { id: t.id, classId: null }))
    notesOf('class')
  }
  if (store === 'students') {
    where('grades', (g) => g.studentId === id).forEach((g) => b.remove('grades', g.id))
    where('attendance', (a) => a.studentId === id).forEach((a) => b.remove('attendance', a.id))
    where('goals', (g) => g.studentId === id).forEach((g) => cascade(b, 'goals', g.id))
    where('tasks', (t) => t.studentId === id).forEach((t) => b.save('tasks', { id: t.id, studentId: null }))
    notesOf('student')
  }
  if (store === 'assignments') {
    where('grades', (g) => g.assignmentId === id).forEach((g) => b.remove('grades', g.id))
    notesOf('assignment')
  }
  if (store === 'goals') notesOf('goal')
  if (store === 'skills') {
    where('goals', (g) => g.skillId === id).forEach((g) => b.save('goals', { id: g.id, skillId: null }))
    where('assignments', (a) => a.skillIds.includes(id)).forEach((a) => b.save('assignments', { id: a.id, skillIds: a.skillIds.filter((x) => x !== id) }))
  }
  b.remove(store, id)
}

/** Every record, grouped by store (for backups). */
export function exportAll(): Record<StoreName, any[]> {
  return Object.fromEntries(STORES.map((s) => [s, [...data[s].values()]])) as Record<StoreName, any[]>
}

/** Replaces all data at once (Restore, Reset, sample data). Resolves once it is safely on disk. */
export async function replaceData(next: Partial<Record<StoreName, any[]>>) {
  await queue.catch(() => {})
  if (persistent) {
    setSave({ status: 'saving' })
    try { await replaceAll(next) } catch (e: any) { setSave({ status: 'error', error: String(e?.message || e) }); throw e }
    setSave({ status: 'saved', at: now(), error: null })
    channel?.postMessage({ stores: STORES })
  }
  data = empty()
  for (const s of STORES) for (const r of next[s] || []) (data[s] as Map<ID, any>).set(r.id, r)
  changed(STORES)
}

/* ---------- typing: save shortly after the teacher stops, and before the page closes ---------- */
const flushers = new Set<() => void>()
export function onFlush(f: () => void) { flushers.add(f); return () => { flushers.delete(f) } }
export function flushAll() { flushers.forEach((f) => f()) }
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushAll)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll() })
}
