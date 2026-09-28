// The teacher's data model. Everything here lives only in this browser (IndexedDB); see db.ts and store.ts.
// Records reference each other by id. Grades and attendance use ids built from what they belong to, so saving the
// same student/assignment (or student/class/day) twice updates one record instead of creating duplicates.

export type ID = string

export interface Base { id: ID; createdAt: string; updatedAt: string }

/** One per device. Held in the "settings" store under the id "profile". */
export interface Profile extends Base {
  teacherName: string
  school: string
  grade: string
  subject: string
  schoolYear: string
  /** How averages are shown across the app. Every assignment still keeps its own grading type. */
  gradeDisplay: 'percent' | 'letter' | 'points' | 'mastery'
  showLetters: boolean
  /** Lowest percentage for each letter, highest first. */
  letterScale: { letter: string; min: number }[]
  /** Percent that counts as "on track" on dashboards and reports. */
  passingPercent: number
  notifyInApp: boolean
  notifyBrowser: boolean
  /** Days ahead that count as "upcoming" on the dashboard. */
  upcomingDays: number
  setupDone: boolean
  sampleData: boolean
  lastBackupAt: string | null
}

export interface ClassRoom extends Base {
  name: string
  grade: string
  subject: string
  schoolYear: string
  room: string
  description: string
  color: string
  archived: boolean
}

export interface Student extends Base {
  firstName: string
  lastName: string
  studentCode: string
  classIds: ID[]
  grade: string
  tags: string[]
  /** Short private summary shown on the profile; longer notes live in the notes store. */
  about: string
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'graded'
export type GradingType = 'points' | 'mastery' | 'complete'

export interface Assignment extends Base {
  classId: ID
  title: string
  description: string
  subject: string
  category: string
  dueDate: string
  pointsPossible: number
  gradingType: GradingType
  status: AssignmentStatus
  skillIds: ID[]
}

export type Mastery = 'beginning' | 'developing' | 'proficient' | 'advanced'

/** id = `${assignmentId}:${studentId}` */
export interface Grade extends Base {
  assignmentId: ID
  studentId: ID
  points: number | null
  mastery: Mastery | null
  complete: boolean | null
  missing: boolean
  excused: boolean
  comment: string
}

export type AttendanceStatus = 'present' | 'absent' | 'tardy' | 'excused'

/** id = `${classId}:${studentId}:${date}` */
export interface Attendance extends Base {
  classId: ID
  studentId: ID
  date: string
  status: AttendanceStatus
  note: string
}

export interface Skill extends Base {
  name: string
  subject: string
  description: string
}

export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'paused'

export interface Goal extends Base {
  scope: 'student' | 'class'
  studentId: ID | null
  classId: ID | null
  title: string
  description: string
  subject: string
  skillId: ID | null
  startDate: string
  targetDate: string
  progress: number
  status: GoalStatus
}

export type NoteParent = 'student' | 'class' | 'assignment' | 'goal' | 'general'

export interface Note extends Base {
  parentType: NoteParent
  parentId: ID | null
  body: string
  pinned: boolean
}

export type TaskKind = 'lesson_prep' | 'grading' | 'parent_meeting' | 'activity' | 'test' | 'project' | 'school_event' | 'personal'

export interface Task extends Base {
  title: string
  kind: TaskKind
  date: string
  time: string
  classId: ID | null
  studentId: ID | null
  notes: string
  done: boolean
  /** Events (a meeting, a school event) sit on the calendar; tasks are things to tick off. */
  isEvent: boolean
}

export interface Activity extends Base {
  kind: 'created' | 'updated' | 'deleted' | 'graded' | 'attendance' | 'progress' | 'completed' | 'restored'
  entity: StoreName
  entityId: ID | null
  summary: string
}

export interface Tables {
  settings: Profile
  classes: ClassRoom
  students: Student
  assignments: Assignment
  grades: Grade
  attendance: Attendance
  skills: Skill
  goals: Goal
  notes: Note
  tasks: Task
  activity: Activity
}
export type StoreName = keyof Tables
export const STORES: StoreName[] = ['settings', 'classes', 'students', 'assignments', 'grades', 'attendance', 'skills', 'goals', 'notes', 'tasks', 'activity']

/* ---------- labels ---------- */
export const ASSIGNMENT_STATUS: Record<AssignmentStatus, string> = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed', graded: 'Graded' }
export const GRADING_TYPE: Record<GradingType, string> = { points: 'Points', mastery: 'Mastery level', complete: 'Complete / not yet' }
export const MASTERY: Record<Mastery, string> = { beginning: 'Beginning', developing: 'Developing', proficient: 'Proficient', advanced: 'Advanced' }
export const MASTERY_ORDER: Mastery[] = ['beginning', 'developing', 'proficient', 'advanced']
export const ATTENDANCE: Record<AttendanceStatus, string> = { present: 'Present', absent: 'Absent', tardy: 'Tardy', excused: 'Excused' }
export const ATTENDANCE_ORDER: AttendanceStatus[] = ['present', 'absent', 'tardy', 'excused']
export const GOAL_STATUS: Record<GoalStatus, string> = { not_started: 'Not Started', in_progress: 'In Progress', achieved: 'Achieved', paused: 'Paused' }
export const TASK_KIND: Record<TaskKind, string> = {
  lesson_prep: 'Lesson prep', grading: 'Grading', parent_meeting: 'Parent meeting', activity: 'Classroom activity',
  test: 'Test', project: 'Project', school_event: 'School event', personal: 'Personal',
}
export const NOTE_PARENT: Record<NoteParent, string> = { student: 'Student', class: 'Class', assignment: 'Assignment', goal: 'Goal', general: 'General' }
export const CATEGORIES = ['Classwork', 'Homework', 'Quiz', 'Test', 'Project', 'Reading log', 'Participation', 'Assessment']
export const CLASS_COLORS = ['#23359A', '#B4461E', '#1F7A57', '#7A3FB8', '#C08438', '#0E7490', '#BE185D', '#4D60FF']
export const DEFAULT_LETTERS = [{ letter: 'A', min: 90 }, { letter: 'B', min: 80 }, { letter: 'C', min: 70 }, { letter: 'D', min: 60 }, { letter: 'F', min: 0 }]

export const fullName = (s: Pick<Student, 'firstName' | 'lastName'>) => `${s.firstName} ${s.lastName}`.trim()
export const initials = (s: Pick<Student, 'firstName' | 'lastName'>) => ((s.firstName[0] || '') + (s.lastName[0] || '')).toUpperCase() || '?'
