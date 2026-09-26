// Backups: the whole local database as one JSON file the teacher saves wherever they like. Optionally encrypted with
// a password using the browser's built-in Web Crypto (PBKDF2 → AES-GCM). The password and the key never leave this
// device, and nobody (including the app's seller) can open an encrypted backup without the password.
import { STORES, type StoreName } from './model'
import { BACKUP_PREFIX, APP_NAME } from './profile'
import { today } from './format'

export const FORMAT = 'declara-teacher-backup'
export const FORMAT_ENC = 'declara-teacher-backup-encrypted'
export const SCHEMA_VERSION = 1
const ITERATIONS = 600_000

export interface Backup {
  format: typeof FORMAT
  schemaVersion: number
  app: string
  exportedAt: string
  counts: Partial<Record<StoreName, number>>
  data: Partial<Record<StoreName, any[]>>
}
export interface EncryptedBackup {
  format: typeof FORMAT_ENC
  schemaVersion: number
  app: string
  exportedAt: string
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  cipher: { name: 'AES-GCM'; iv: string }
  data: string
}

export const backupName = (encrypted = false) => `${BACKUP_PREFIX}-${today()}${encrypted ? '-encrypted' : ''}.json`

export function makeBackup(data: Record<StoreName, any[]>): Backup {
  return {
    format: FORMAT, schemaVersion: SCHEMA_VERSION, app: APP_NAME, exportedAt: new Date().toISOString(),
    counts: Object.fromEntries(STORES.map((s) => [s, data[s].length])), data,
  }
}

/* ---------- encryption ---------- */
const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s) }
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function keyFrom(password: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function encryptBackup(b: Backup, password: string): Promise<EncryptedBackup> {
  if (!crypto?.subtle) throw new Error('Encryption needs a secure page (https or a local file). Use a regular backup instead.')
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await keyFrom(password, salt, ITERATIONS)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(b)))
  return {
    format: FORMAT_ENC, schemaVersion: SCHEMA_VERSION, app: APP_NAME, exportedAt: b.exportedAt,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS, salt: b64(salt) }, cipher: { name: 'AES-GCM', iv: b64(iv) }, data: b64(new Uint8Array(ct)),
  }
}

export async function decryptBackup(e: EncryptedBackup, password: string): Promise<unknown> {
  const key = await keyFrom(password, unb64(e.kdf.salt), e.kdf.iterations)
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.cipher.iv) }, key, unb64(e.data))
    return JSON.parse(new TextDecoder().decode(pt))
  } catch {
    throw new Error('That password doesn’t open this backup. Check it and try again.')
  }
}

/* ---------- reading a file ---------- */
export type Parsed = { kind: 'plain'; backup: Backup } | { kind: 'encrypted'; enc: EncryptedBackup }

export function parseFile(text: string): Parsed {
  let j: any
  try { j = JSON.parse(text) } catch { throw new Error('This file isn’t a backup from this app (it isn’t readable JSON).') }
  if (j?.format === FORMAT_ENC) {
    if (!j.kdf?.salt || !j.cipher?.iv || typeof j.data !== 'string') throw new Error('This encrypted backup is incomplete or damaged.')
    return { kind: 'encrypted', enc: j }
  }
  return { kind: 'plain', backup: validate(j) }
}

const REQUIRED: Record<StoreName, string[]> = {
  settings: [], classes: ['name'], students: ['firstName', 'lastName'], assignments: ['classId', 'title'],
  grades: ['assignmentId', 'studentId'], attendance: ['classId', 'studentId', 'date', 'status'], skills: ['name'],
  goals: ['title', 'scope'], notes: ['body', 'parentType'], tasks: ['title', 'date'], activity: ['summary'],
}
const ARRAYS: Partial<Record<StoreName, string[]>> = { students: ['classIds', 'tags'], assignments: ['skillIds'] }

/** Checks a backup's shape before anything is replaced. Throws with a plain-English reason if it can't be used. */
export function validate(j: any): Backup {
  if (!j || typeof j !== 'object' || j.format !== FORMAT) throw new Error('This file isn’t a backup from this app.')
  if (typeof j.schemaVersion !== 'number' || j.schemaVersion > SCHEMA_VERSION) throw new Error('This backup was made by a newer version of the app. Update the app, then restore it.')
  if (!j.data || typeof j.data !== 'object') throw new Error('This backup has no data in it.')
  const data: Partial<Record<StoreName, any[]>> = {}
  for (const s of STORES) {
    const rows = j.data[s] ?? []
    if (!Array.isArray(rows)) throw new Error(`The “${s}” section of this backup is damaged.`)
    rows.forEach((r: any, i: number) => {
      if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id) throw new Error(`Record ${i + 1} in “${s}” has no id.`)
      for (const f of REQUIRED[s]) if (r[f] == null) throw new Error(`Record ${i + 1} in “${s}” is missing “${f}”.`)
      for (const f of ARRAYS[s] || []) if (!Array.isArray(r[f] ?? [])) throw new Error(`Record ${i + 1} in “${s}” has a damaged “${f}”.`)
    })
    data[s] = rows
  }
  return { ...j, data }
}

/** Records that point at something not in the backup (kept out on restore), reported so the teacher knows. */
export function orphans(b: Backup) {
  const ids = (s: StoreName) => new Set((b.data[s] || []).map((r) => r.id))
  const cls = ids('classes'), stu = ids('students'), asg = ids('assignments')
  const bad = {
    assignments: (b.data.assignments || []).filter((a) => !cls.has(a.classId)).length,
    grades: (b.data.grades || []).filter((g) => !asg.has(g.assignmentId) || !stu.has(g.studentId)).length,
    attendance: (b.data.attendance || []).filter((a) => !cls.has(a.classId) || !stu.has(a.studentId)).length,
  }
  return { ...bad, total: bad.assignments + bad.grades + bad.attendance }
}

export function cleaned(b: Backup): Partial<Record<StoreName, any[]>> {
  const ids = (s: StoreName) => new Set((b.data[s] || []).map((r) => r.id))
  const cls = ids('classes'), stu = ids('students')
  const assignments = (b.data.assignments || []).filter((a) => cls.has(a.classId))
  const asg = new Set(assignments.map((a) => a.id))
  return {
    ...b.data,
    assignments,
    grades: (b.data.grades || []).filter((g) => asg.has(g.assignmentId) && stu.has(g.studentId)),
    attendance: (b.data.attendance || []).filter((a) => cls.has(a.classId) && stu.has(a.studentId)),
    students: (b.data.students || []).map((s) => ({ tags: [], ...s, classIds: (s.classIds || []).filter((c: string) => cls.has(c)) })),
  }
}
