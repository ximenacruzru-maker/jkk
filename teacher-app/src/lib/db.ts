// The local database: one IndexedDB database in this browser, one object store per kind of record.
// Nothing here talks to a network; the data never leaves the device unless the teacher downloads a backup.
import { STORES, type StoreName } from './model'

// The demo build keeps its sample classroom in a separate database, so it never mixes with a real classroom.
export const DB_NAME = __DEMO__ ? 'declara-teacher-demo' : 'declara-teacher'
export const DB_VERSION = 1

type Index = [name: string, keyPath: string | string[], opts?: IDBIndexParameters]
/** Indexes for lookups the screens make often. Records are keyed by their "id" field. */
export const INDEXES: Partial<Record<StoreName, Index[]>> = {
  students: [['classIds', 'classIds', { multiEntry: true }], ['lastName', 'lastName']],
  assignments: [['classId', 'classId'], ['dueDate', 'dueDate'], ['status', 'status']],
  grades: [['assignmentId', 'assignmentId'], ['studentId', 'studentId']],
  attendance: [['date', 'date'], ['studentId', 'studentId'], ['classId', 'classId'], ['classDate', ['classId', 'date']]],
  goals: [['studentId', 'studentId'], ['classId', 'classId'], ['status', 'status']],
  notes: [['parent', ['parentType', 'parentId']], ['updatedAt', 'updatedAt']],
  tasks: [['date', 'date']],
  activity: [['createdAt', 'createdAt']],
}

let dbp: Promise<IDBDatabase> | null = null

const req = <T,>(r: IDBRequest<T>) => new Promise<T>((ok, bad) => { r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error) })
const done = (tx: IDBTransaction) => new Promise<void>((ok, bad) => {
  tx.oncomplete = () => ok()
  tx.onerror = () => bad(tx.error)
  tx.onabort = () => bad(tx.error || new Error('The save was cancelled by the browser.'))
})

export function openDb(): Promise<IDBDatabase> {
  if (dbp) return dbp
  dbp = new Promise((ok, bad) => {
    if (typeof indexedDB === 'undefined') { bad(new Error('This browser has no IndexedDB.')); return }
    const r = indexedDB.open(DB_NAME, DB_VERSION)
    r.onupgradeneeded = () => {
      const db = r.result
      for (const s of STORES) {
        const os = db.objectStoreNames.contains(s) ? r.transaction!.objectStore(s) : db.createObjectStore(s, { keyPath: 'id' })
        for (const [name, keyPath, opts] of INDEXES[s] || []) if (!os.indexNames.contains(name)) os.createIndex(name, keyPath, opts)
      }
    }
    r.onsuccess = () => {
      const db = r.result
      // Another tab upgraded the database: close so it can finish, and reload into the new version.
      db.onversionchange = () => { db.close(); location.reload() }
      ok(db)
    }
    r.onerror = () => bad(r.error)
    r.onblocked = () => bad(new Error('Close the other tabs of this app, then reload.'))
  })
  dbp.catch(() => { dbp = null })
  return dbp
}

export async function readAll(stores: StoreName[] = STORES): Promise<Record<StoreName, any[]>> {
  const db = await openDb()
  const tx = db.transaction(stores, 'readonly')
  const out = {} as Record<StoreName, any[]>
  await Promise.all(stores.map(async (s) => { out[s] = await req(tx.objectStore(s).getAll()) }))
  return out
}

export interface WriteOp { store: StoreName; put?: any[]; del?: string[] }

/** Applies every change in one transaction: either all of it is saved or none of it is. */
export async function write(ops: WriteOp[]) {
  if (!ops.length) return
  const db = await openDb()
  const tx = db.transaction([...new Set(ops.map((o) => o.store))], 'readwrite')
  for (const o of ops) {
    const os = tx.objectStore(o.store)
    for (const r of o.put || []) os.put(r)
    for (const id of o.del || []) os.delete(id)
  }
  await done(tx)
}

/** Empties every store and writes the given records, all in one transaction (used by Restore and Reset). */
export async function replaceAll(data: Partial<Record<StoreName, any[]>>) {
  const db = await openDb()
  const tx = db.transaction(STORES, 'readwrite')
  for (const s of STORES) {
    const os = tx.objectStore(s)
    os.clear()
    for (const r of data[s] || []) os.put(r)
  }
  await done(tx)
}
