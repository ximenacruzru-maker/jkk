// Sample classroom for exploring the app. Every name and number here is made up; no real student information.
import { addDays, isWeekend, schoolDays, today } from './format'
import { gradeId } from './grading'
import { CLASS_COLORS, MASTERY_ORDER, type Assignment, type AttendanceStatus, type GradingType, type StoreName } from './model'
import { DEFAULT_PROFILE } from './profile'
import { uid } from './store'

/** Small seeded random generator so the sample looks the same every time. */
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const NAMES = [
  'Emma Garcia', 'Liam Johnson', 'Sofia Martinez', 'Noah Brown', 'Olivia Wilson', 'Ava Davis',
  'Mason Lee', 'Isabella Clark', 'Ethan Lewis', 'Mia Walker', 'Lucas Hall', 'Amelia Young',
  'James King', 'Harper Scott', 'Benjamin Green', 'Charlotte Adams', 'Elijah Baker', 'Evelyn Nelson',
  'Henry Carter', 'Abigail Mitchell', 'Jack Perez', 'Emily Roberts', 'Daniel Turner', 'Ella Phillips',
]
const TAGS = ['Group A', 'Group B', 'Class helper', 'Extra support', 'Early finisher', 'Bus rider']

type A = [title: string, days: number, type: GradingType, points: number, category: string, skill?: string]
const CLASSES: { name: string; grade: string; subject: string; room: string; description: string; work: A[] }[] = [
  { name: 'Kindergarten', grade: 'K', subject: 'All subjects', room: '101', description: 'Morning kindergarten: letters, numbers, shapes and a lot of curiosity.', work: [
    ['Letter sounds A–M', -18, 'mastery', 0, 'Assessment', 'Letter sounds'], ['Counting to 20', -12, 'mastery', 0, 'Assessment', 'Counting to 100'],
    ['Shapes scavenger hunt', -8, 'complete', 0, 'Classwork'], ['Letter sounds N–Z', -3, 'mastery', 0, 'Assessment', 'Letter sounds'],
    ['Name writing practice', -1, 'complete', 0, 'Classwork'], ['Counting to 50', 4, 'mastery', 0, 'Assessment', 'Counting to 100'], ['All about me poster', 9, 'complete', 0, 'Project'],
  ] },
  { name: '1st Grade Reading', grade: '1', subject: 'Reading', room: '104', description: 'Phonics, sight words and our first chapter books.', work: [
    ['Sight words list 1', -19, 'points', 10, 'Quiz', 'Sight words'], ['Short vowel sort', -14, 'points', 12, 'Classwork', 'Letter sounds'],
    ['Reading log — week 2', -9, 'complete', 0, 'Reading log'], ['Sight words list 2', -5, 'points', 10, 'Quiz', 'Sight words'],
    ['Fluency check', -2, 'mastery', 0, 'Assessment', 'Reading fluency'], ['Story retell', 0, 'points', 8, 'Classwork', 'Reading fluency'],
    ['Sight words list 3', 5, 'points', 10, 'Quiz', 'Sight words'], ['Book report: favorite animal', 11, 'points', 20, 'Project'],
  ] },
  { name: '2nd Grade Math', grade: '2', subject: 'Math', room: '112', description: 'Addition and subtraction within 100, place value and measurement.', work: [
    ['Addition facts to 20', -20, 'points', 20, 'Quiz', 'Addition within 20'], ['Place value worksheet', -15, 'points', 15, 'Homework', 'Place value'],
    ['Unit 1 test', -10, 'points', 50, 'Test', 'Addition within 20'], ['Skip counting by 5s', -6, 'points', 10, 'Classwork'],
    ['Two-digit addition', -2, 'points', 20, 'Homework', 'Place value'], ['Measuring with rulers', 0, 'points', 10, 'Classwork'],
    ['Unit 2 test', 6, 'points', 50, 'Test', 'Place value'], ['Math journal', 12, 'complete', 0, 'Classwork'],
  ] },
  { name: '3rd Grade Science', grade: '3', subject: 'Science', room: '118', description: 'Life cycles, weather and the scientific method.', work: [
    ['Plant parts diagram', -17, 'points', 20, 'Classwork', 'Scientific observation'], ['Butterfly life cycle', -11, 'points', 25, 'Quiz'],
    ['Weather journal', -7, 'mastery', 0, 'Project', 'Scientific observation'], ['States of matter lab', -3, 'points', 30, 'Classwork', 'Scientific observation'],
    ['Chapter 3 quiz', -1, 'points', 20, 'Quiz'], ['Seed experiment', 3, 'points', 40, 'Project', 'Scientific observation'], ['Science fair plan', 14, 'complete', 0, 'Project'],
  ] },
]
const SKILLS: [string, string][] = [
  ['Letter sounds', 'Reading'], ['Sight words', 'Reading'], ['Reading fluency', 'Reading'], ['Counting to 100', 'Math'],
  ['Addition within 20', 'Math'], ['Place value', 'Math'], ['Scientific observation', 'Science'],
]

export function sampleData(teacher?: { teacherName?: string; school?: string }): Partial<Record<StoreName, any[]>> {
  const r = rng(20260926), t0 = today(), stamp = new Date().toISOString()
  const base = () => ({ id: uid(), createdAt: stamp, updatedAt: stamp })
  const out: Record<string, any[]> = { settings: [], classes: [], students: [], assignments: [], grades: [], attendance: [], skills: [], goals: [], notes: [], tasks: [], activity: [] }

  out.settings.push({ ...DEFAULT_PROFILE, createdAt: stamp, updatedAt: stamp, teacherName: teacher?.teacherName || 'Ms. Rivera', school: teacher?.school || 'Maple Grove Elementary', grade: 'K–3', subject: 'Multi-grade', setupDone: true, sampleData: true })
  const skill: Record<string, string> = {}
  for (const [name, subject] of SKILLS) { const s = { ...base(), name, subject, description: '' }; skill[name] = s.id; out.skills.push(s) }

  const ability = new Map<string, number>()
  const sid: Record<string, string> = {}
  CLASSES.forEach((c, ci) => {
    const cls = { ...base(), name: c.name, grade: c.grade, subject: c.subject, schoolYear: DEFAULT_PROFILE.schoolYear, room: c.room, description: c.description, color: CLASS_COLORS[ci], archived: false }
    out.classes.push(cls)
    const kids = NAMES.slice(ci * 6, ci * 6 + 6).map((n, k) => {
      const [firstName, lastName] = n.split(' ')
      const s = { ...base(), firstName, lastName, studentCode: `S${1040 + ci * 6 + k}`, classIds: [cls.id], grade: c.grade, tags: r() < 0.5 ? [TAGS[Math.floor(r() * TAGS.length)]] : [], about: '' }
      ability.set(s.id, 0.55 + r() * 0.42)
      sid[n] = s.id
      out.students.push(s)
      return s
    })
    for (const [title, days, type, points, category, sk] of c.work) {
      const due = addDays(t0, days)
      const status = days < -1 ? 'graded' : days < 0 ? (ci % 2 ? 'completed' : 'graded') : days === 0 ? 'in_progress' : 'not_started'
      const a: Assignment = { ...base(), classId: cls.id, title, description: '', subject: c.subject, category, dueDate: due, pointsPossible: points, gradingType: type, status, skillIds: sk ? [skill[sk]] : [] }
      out.assignments.push(a)
      if (status !== 'graded') continue
      for (const k of kids) {
        const roll = r(), ab = Math.min(1, ability.get(k.id)! + (r() - 0.5) * 0.25)
        const g = { id: gradeId(a.id, k.id), createdAt: stamp, updatedAt: stamp, assignmentId: a.id, studentId: k.id, points: null as number | null, mastery: null as string | null, complete: null as boolean | null, missing: false, excused: false, comment: '' }
        if (roll < 0.04) g.missing = true
        else if (roll < 0.06) g.excused = true
        else if (type === 'points') g.points = Math.max(0, Math.round(ab * points))
        else if (type === 'mastery') g.mastery = MASTERY_ORDER[Math.min(3, Math.floor(ab * 4.2))]
        else g.complete = ab > 0.6
        out.grades.push(g)
      }
    }
    // Attendance for the last three weeks; today's is already taken for the first two classes only.
    const days = schoolDays(isWeekend(t0) ? addDays(t0, -1) : t0, 15).filter((d) => d !== t0 || ci < 2)
    for (const d of days) for (const k of kids) {
      const x = r(), status: AttendanceStatus = x < 0.9 ? 'present' : x < 0.95 ? 'tardy' : x < 0.985 ? 'absent' : 'excused'
      out.attendance.push({ id: `${cls.id}:${k.id}:${d}`, createdAt: stamp, updatedAt: stamp, classId: cls.id, studentId: k.id, date: d, status, note: '' })
    }
  })

  const cid = (n: string) => out.classes.find((c) => c.name === n)!.id
  const goal = (g: any) => out.goals.push({ ...base(), description: '', skillId: null, studentId: null, classId: null, ...g })
  goal({ scope: 'class', classId: cid('1st Grade Reading'), title: 'Read 20 minutes every day', subject: 'Reading', skillId: skill['Reading fluency'], startDate: addDays(t0, -30), targetDate: addDays(t0, 30), progress: 45, status: 'in_progress', description: 'Every student logs 20 minutes of reading at home or in class.' })
  goal({ scope: 'class', classId: cid('2nd Grade Math'), title: 'Master addition facts to 20', subject: 'Math', skillId: skill['Addition within 20'], startDate: addDays(t0, -40), targetDate: addDays(t0, 10), progress: 60, status: 'in_progress' })
  goal({ scope: 'student', studentId: sid['Noah Brown'], classId: cid('1st Grade Reading'), title: 'Read 60 words per minute', subject: 'Reading', skillId: skill['Reading fluency'], startDate: addDays(t0, -35), targetDate: addDays(t0, 5), progress: 40, status: 'in_progress', description: 'Currently around 38 wpm on grade-level passages.' })
  goal({ scope: 'student', studentId: sid['Liam Johnson'], classId: cid('Kindergarten'), title: 'Count to 100 by ones', subject: 'Math', skillId: skill['Counting to 100'], startDate: addDays(t0, -20), targetDate: addDays(t0, 40), progress: 55, status: 'in_progress' })
  goal({ scope: 'student', studentId: sid['Emma Garcia'], classId: cid('Kindergarten'), title: 'Recognize all letter sounds', subject: 'Reading', skillId: skill['Letter sounds'], startDate: addDays(t0, -45), targetDate: addDays(t0, -2), progress: 100, status: 'achieved' })
  goal({ scope: 'student', studentId: sid['Lucas Hall'], classId: cid('2nd Grade Math'), title: 'Two-digit addition with regrouping', subject: 'Math', skillId: skill['Place value'], startDate: addDays(t0, -25), targetDate: addDays(t0, 3), progress: 30, status: 'in_progress' })
  goal({ scope: 'student', studentId: sid['Harper Scott'], classId: cid('3rd Grade Science'), title: 'Write a hypothesis for each lab', subject: 'Science', skillId: skill['Scientific observation'], startDate: addDays(t0, -10), targetDate: addDays(t0, 50), progress: 20, status: 'in_progress' })
  goal({ scope: 'student', studentId: sid['Olivia Wilson'], classId: cid('1st Grade Reading'), title: 'Retell a story with beginning, middle and end', subject: 'Reading', startDate: addDays(t0, -5), targetDate: addDays(t0, 60), progress: 0, status: 'not_started' })

  const note = (parentType: string, parentId: string | null, body: string, pinned = false, ago = 1) =>
    out.notes.push({ ...base(), createdAt: new Date(Date.now() - ago * 86400000).toISOString(), updatedAt: new Date(Date.now() - ago * 86400000).toISOString(), parentType, parentId, body, pinned })
  note('student', sid['Emma Garcia'], 'Loves chapter books — suggest the next one in the series she’s reading.', true, 2)
  note('student', sid['Noah Brown'], 'Reads more confidently with a partner. Try buddy reading on Tuesdays.', false, 4)
  note('student', sid['Olivia Wilson'], 'Family asked for a quick check-in about reading at home. Meeting scheduled.', true, 1)
  note('class', cid('2nd Grade Math'), 'Most of the class is ready for regrouping. Plan a small group for those who aren’t.', false, 3)
  note('class', cid('3rd Grade Science'), 'Order more seed trays before the seed experiment.', false, 5)
  note('general', null, 'Ideas for next month: a class garden, a visit to the library, a reading challenge.', false, 6)
  const firstA = out.assignments.find((a) => a.title === 'Unit 1 test')
  if (firstA) note('assignment', firstA.id, 'Question 7 confused a lot of students. Reword it next year.', false, 8)

  const task = (title: string, kind: string, days: number, extra: any = {}) =>
    out.tasks.push({ ...base(), title, kind, date: addDays(t0, days), time: '', classId: null, studentId: null, notes: '', done: days < 0, isEvent: false, ...extra })
  task('Plan next week’s reading centers', 'lesson_prep', 0, { classId: cid('1st Grade Reading') })
  task('Grade Chapter 3 quiz', 'grading', 0, { classId: cid('3rd Grade Science'), done: false })
  task('Parent meeting — Olivia Wilson’s family', 'parent_meeting', 1, { time: '15:30', isEvent: true, studentId: sid['Olivia Wilson'] })
  task('Picture day', 'school_event', 3, { isEvent: true, time: '09:00' })
  task('Unit 2 math test', 'test', 6, { isEvent: true, classId: cid('2nd Grade Math') })
  task('Seed experiment — set up trays', 'project', 2, { classId: cid('3rd Grade Science') })
  task('Copy letter-sound flashcards', 'lesson_prep', 2, { classId: cid('Kindergarten') })
  task('Class read-aloud: new chapter book', 'activity', 1, { classId: cid('Kindergarten'), isEvent: true, time: '10:15' })
  task('Science fair kickoff', 'school_event', 12, { isEvent: true })
  task('Dentist appointment', 'personal', 8, { time: '16:30', isEvent: true })
  task('Update reading logs', 'grading', -2)
  task('Send weekly newsletter', 'personal', -1)

  const act = (summary: string, entity: string, mins: number, kind = 'created') =>
    out.activity.push({ ...base(), createdAt: new Date(Date.now() - mins * 60000).toISOString(), kind, entity, entityId: null, summary })
  act('Graded “Two-digit addition” for 2nd Grade Math', 'grades', 40, 'graded')
  act('Took attendance for 1st Grade Reading', 'attendance', 95, 'attendance')
  act('Updated Noah Brown’s goal “Read 60 words per minute” to 40%', 'goals', 180, 'progress')
  act('Added a note to Olivia Wilson', 'notes', 300)
  act('Created assignment “Seed experiment”', 'assignments', 1500)
  return out
}
