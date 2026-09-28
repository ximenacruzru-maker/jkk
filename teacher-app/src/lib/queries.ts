// Read-side helpers shared by the screens: who is in a class, averages, attendance rates, how goals are going.
import { useSearchParams } from 'react-router-dom'
import { addDays, daysBetween, today } from './format'
import { gradeId, isMissing, score, studentAverage } from './grading'
import { fullName, type Assignment, type Attendance, type AttendanceStatus, type Goal, type ID, type Student } from './model'
import type { Snapshot } from './store'

export const byName = (a: Student, b: Student) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)
export const studentsIn = (d: Snapshot, classId: ID | null | undefined) =>
  d.list('students').filter((s) => !classId || s.classIds.includes(classId)).sort(byName)
export const assignmentsOf = (d: Snapshot, classId: ID | null | undefined) =>
  d.list('assignments').filter((a) => !classId || a.classId === classId).sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : a.title.localeCompare(b.title)))
export const activeClasses = (d: Snapshot) => d.list('classes').filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
export const allClasses = (d: Snapshot) => [...d.list('classes')].sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name, undefined, { numeric: true }))

export const gradeOf = (d: Snapshot) => (id: string) => d.get('grades', id)

/** A student's average across all their classes (or one class). */
export function avgFor(d: Snapshot, s: Student, classId?: ID) {
  const as = d.list('assignments').filter((a) => (classId ? a.classId === classId : s.classIds.includes(a.classId)))
  return studentAverage(s.id, as, gradeOf(d))
}

/** Class average: the mean of its students' averages. */
export function classAverage(d: Snapshot, classId: ID) {
  const as = assignmentsOf(d, classId), g = gradeOf(d)
  const avgs = studentsIn(d, classId).map((s) => studentAverage(s.id, as, g).pct).filter((x): x is number => x != null)
  return avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : null
}

export function missingFor(d: Snapshot, a: Assignment) {
  return studentsIn(d, a.classId).filter((s) => isMissing(d.get('grades', gradeId(a.id, s.id)), a))
}
export function gradedCount(d: Snapshot, a: Assignment) {
  return studentsIn(d, a.classId).filter((s) => score(d.get('grades', gradeId(a.id, s.id)), a) != null).length
}

/* ---------- attendance ---------- */
export function tally(rows: Attendance[]) {
  const t: Record<AttendanceStatus, number> = { present: 0, absent: 0, tardy: 0, excused: 0 }
  for (const r of rows) t[r.status]++
  const total = rows.length
  // Tardy still counts as attending; excused absences are left out of the rate.
  const counted = total - t.excused
  return { ...t, total, rate: counted ? (t.present + t.tardy) / counted : null }
}
export const attendanceId = (classId: ID, studentId: ID, date: string) => `${classId}:${studentId}:${date}`

/* ---------- goals ---------- */
export type Health = 'achieved' | 'overdue' | 'behind' | 'due_soon' | 'on_track' | 'paused' | 'not_started'
export function expectedProgress(g: Goal, t = today()) {
  const total = daysBetween(g.startDate || t, g.targetDate || t)
  if (total <= 0) return 100
  return Math.max(0, Math.min(100, (daysBetween(g.startDate || t, t) / total) * 100))
}
export function goalHealth(g: Goal, t = today()): Health {
  if (g.status === 'achieved' || g.progress >= 100) return 'achieved'
  if (g.status === 'paused') return 'paused'
  if (g.targetDate && g.targetDate < t) return 'overdue'
  if (g.progress < expectedProgress(g, t) - 15) return 'behind'
  if (g.targetDate && g.targetDate <= addDays(t, 7)) return 'due_soon'
  if (g.status === 'not_started' && g.progress === 0) return 'not_started'
  return 'on_track'
}
export const HEALTH: Record<Health, { label: string; tone: 'critical' | 'serious' | 'warning' | 'ok' }> = {
  overdue: { label: 'Overdue', tone: 'critical' }, behind: { label: 'Behind', tone: 'serious' }, due_soon: { label: 'Due soon', tone: 'warning' },
  not_started: { label: 'Not started', tone: 'warning' }, on_track: { label: 'On track', tone: 'ok' }, achieved: { label: 'Achieved', tone: 'ok' }, paused: { label: 'Paused', tone: 'warning' },
}
export const goalWho = (d: Snapshot, g: Goal) => g.scope === 'class' ? d.get('classes', g.classId)?.name || 'Class goal' : (() => { const s = d.get('students', g.studentId); return s ? fullName(s) : 'Student' })()

/* ---------- URL state: ?open=<id>, ?new=1, ?tab=… (like Declara's ?open= on Books of Business) ---------- */
export function useParam(name: string): [string | null, (v: string | null) => void] {
  const [sp, setSp] = useSearchParams()
  return [sp.get(name), (v) => setSp((prev) => {
    const next = new URLSearchParams(prev)
    if (v == null) next.delete(name); else next.set(name, v)
    return next
  }, { replace: true })]
}
