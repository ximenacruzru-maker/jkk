// Scores, averages and how they are shown. Each assignment keeps its own grading type (points, a mastery level,
// or simply complete / not yet), and every grade can be turned into a 0–1 score so different approaches still
// average together. Teachers choose how averages are displayed: percent, letter, points or mastery level.
import { MASTERY, MASTERY_ORDER, type Assignment, type Grade, type Mastery, type Profile } from './model'

export const gradeId = (assignmentId: string, studentId: string) => `${assignmentId}:${studentId}`

/** 0–1, or null when there is nothing to count (not graded yet, or excused). A missing assignment counts as 0. */
export function score(g: Grade | undefined, a: Assignment): number | null {
  if (!g || g.excused) return null
  if (a.gradingType === 'points') {
    if (g.points != null && a.pointsPossible > 0) return Math.max(0, g.points / a.pointsPossible)
  } else if (a.gradingType === 'mastery') {
    if (g.mastery) return (MASTERY_ORDER.indexOf(g.mastery) + 1) / 4
  } else if (g.complete != null) return g.complete ? 1 : 0
  return g.missing ? 0 : null
}

/** Missing: flagged by the teacher, or the assignment is marked Graded and this student has no grade. */
export function isMissing(g: Grade | undefined, a: Assignment) {
  if (g?.excused) return false
  if (g?.missing) return true
  return a.status === 'graded' && score(g, a) == null
}

export function average(scores: (number | null)[]) {
  const s = scores.filter((x): x is number => x != null)
  return s.length ? s.reduce((a, b) => a + b, 0) / s.length : null
}

/** A student's average over the given assignments. */
export function studentAverage(studentId: string, assignments: Assignment[], grades: (id: string) => Grade | undefined) {
  let earned = 0, possible = 0
  const all: number[] = []
  let mixed = false
  for (const a of assignments) {
    const g = grades(gradeId(a.id, studentId)), s = score(g, a)
    if (s == null) continue
    all.push(s)
    if (a.gradingType === 'points') { earned += s * a.pointsPossible; possible += a.pointsPossible } else mixed = true
  }
  if (!all.length) return { pct: null as number | null, earned, possible, count: 0 }
  // All points: weight by points, like a paper gradebook. Mixed approaches: every assignment counts the same.
  return { pct: !mixed && possible ? earned / possible : average(all), earned, possible, count: all.length }
}

export function letterFor(p: number | null, scale: Profile['letterScale']) {
  if (p == null) return '—'
  const v = p * 100
  return [...scale].sort((a, b) => b.min - a.min).find((l) => v >= l.min)?.letter || scale[scale.length - 1]?.letter || '—'
}

export function masteryFor(p: number | null): Mastery | null {
  if (p == null) return null
  return p >= 0.875 ? 'advanced' : p >= 0.625 ? 'proficient' : p >= 0.375 ? 'developing' : 'beginning'
}

/** An average, shown the way the teacher chose in Settings › Grading. */
export function showAverage(p: number | null, prof: Profile, avg?: { earned: number; possible: number }) {
  if (p == null) return '—'
  const per = `${Math.round(p * 100)}%`
  switch (prof.gradeDisplay) {
    case 'letter': return `${letterFor(p, prof.letterScale)} · ${per}`
    case 'points': return avg && avg.possible ? `${+avg.earned.toFixed(1)}/${avg.possible}` : per
    case 'mastery': return MASTERY[masteryFor(p)!]
    default: return prof.showLetters ? `${per} · ${letterFor(p, prof.letterScale)}` : per
  }
}

/** One grade as it appears in a gradebook cell. */
export function showGrade(g: Grade | undefined, a: Assignment) {
  if (!g) return ''
  if (g.excused) return 'EX'
  if (a.gradingType === 'points' && g.points != null) return `${g.points}/${a.pointsPossible}`
  if (a.gradingType === 'mastery' && g.mastery) return MASTERY[g.mastery]
  if (a.gradingType === 'complete' && g.complete != null) return g.complete ? 'Complete' : 'Not yet'
  return g.missing ? 'Missing' : ''
}

export const pillFor = (p: number | null, passing: number) => 'pill pill-' + (tone(p, passing) || 'muted')

export const tone = (p: number | null, passing: number): 'good' | 'warn' | 'bad' | undefined =>
  p == null ? undefined : p * 100 >= passing + 10 ? 'good' : p * 100 >= passing ? 'warn' : 'bad'
