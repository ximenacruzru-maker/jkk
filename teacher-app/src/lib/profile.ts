import { DEFAULT_LETTERS, type Profile } from './model'
import { db, saveRecord, useDB } from './store'

export const APP_NAME = 'Declara Teacher'
/** Backups are named "<prefix>-YYYY-MM-DD.json". */
export const BACKUP_PREFIX = 'Teacher-App-Backup'

export function schoolYearFor(d = new Date()) {
  const y = d.getFullYear()
  return d.getMonth() >= 6 ? `${y}–${y + 1}` : `${y - 1}–${y}`
}

export const DEFAULT_PROFILE: Omit<Profile, 'createdAt' | 'updatedAt'> = {
  id: 'profile', teacherName: '', school: '', grade: '', subject: '', schoolYear: schoolYearFor(),
  gradeDisplay: 'percent', showLetters: true, letterScale: DEFAULT_LETTERS, passingPercent: 70,
  notifyInApp: true, notifyBrowser: false, upcomingDays: 7, setupDone: false, sampleData: false, lastBackupAt: null,
}

export function useProfile(): Profile {
  const d = useDB()
  return { createdAt: '', updatedAt: '', ...DEFAULT_PROFILE, ...d.get('settings', 'profile') } as Profile
}
export function getProfile(): Profile {
  return { createdAt: '', updatedAt: '', ...DEFAULT_PROFILE, ...db().get('settings', 'profile') } as Profile
}
export function saveProfile(patch: Partial<Profile>) {
  saveRecord('settings', { ...getProfile(), ...patch, id: 'profile' })
}
/** How the app addresses the teacher: "Ms. Rivera" stays as it is, "Taylor Rivera" becomes "Taylor". */
export const firstName = (p: Profile) => /^(mr|mrs|ms|mx|dr|miss|mrs)\.?\s+/i.test(p.teacherName.trim()) ? p.teacherName.trim() : p.teacherName.trim().split(' ')[0] || ''
