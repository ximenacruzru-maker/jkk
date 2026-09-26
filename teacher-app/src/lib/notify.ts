// Reminders, worked out on this device from the teacher's own tasks. Browser notifications (if the teacher turns
// them on) are shown by the browser itself; nothing is sent anywhere.
import { today } from './format'
import { getProfile } from './profile'
import { db } from './store'

const KEY = 'declara_teacher_reminded'

export function dueToday() {
  const t = today()
  return db().list('tasks').filter((x) => !x.done && x.date === t)
}

export async function askNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported' as const
  if (Notification.permission === 'granted') return 'granted' as const
  return await Notification.requestPermission()
}

/** Once a day, when the app opens: one browser notification listing today's tasks and events. */
export function remindToday() {
  const p = getProfile()
  if (!p.notifyBrowser || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const t = today()
  try { if (localStorage.getItem(KEY) === t) return; localStorage.setItem(KEY, t) } catch { return }
  const items = dueToday()
  if (!items.length) return
  new Notification(`Today: ${items.length} ${items.length === 1 ? 'thing' : 'things'} on your list`, {
    body: items.slice(0, 4).map((x) => (x.time ? x.time + ' ' : '') + x.title).join('\n'), tag: 'declara-teacher-today',
  })
}
