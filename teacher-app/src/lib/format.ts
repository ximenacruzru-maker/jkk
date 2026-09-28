// Formatting helpers (carried over from Declara, with the agency's Pacific-time "working day" swapped for the
// teacher's own local date).

export const pct = (n: number | null | undefined, digits = 0) => (n == null || isNaN(n) ? '—' : `${(n * 100).toFixed(digits)}%`)

/** "2026-09-23" -> "Sep 23" (or with year) without timezone drift. */
export function shortDate(iso: string, withYear = false) {
  if (!iso) return ''
  const d = new Date(iso.slice(0, 10) + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}), timeZone: 'UTC' })
}
export function longDate(iso: string) {
  return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
}
export function weekday(iso: string, style: 'long' | 'short' | 'narrow' = 'short') {
  return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' })
}
export function mdy(iso: string) {
  return iso ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : ''
}

/** Today's date on this device as YYYY-MM-DD. */
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 86400000)
}
export const isWeekend = (iso: string) => { const d = new Date(iso + 'T12:00:00Z').getUTCDay(); return d === 0 || d === 6 }

/** The last n school days (Mon–Fri) up to and including `end`. */
export function schoolDays(end: string, n: number) {
  const out: string[] = []
  for (let d = end; out.length < n; d = addDays(d, -1)) if (!isWeekend(d)) out.unshift(d)
  return out
}

export function timeAgo(ts: string | null) {
  if (!ts) return 'never'
  const mins = Math.round((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.round(h / 24)
  return d === 1 ? 'yesterday' : `${d} days ago`
}

export function time12(t: string) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`

/** Hands the browser a file to save. Built on this device; nothing is uploaded. */
export function downloadFile(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  downloadFile(filename, rows.map((r) => r.map(esc).join(',')).join('\r\n'), 'text/csv;charset=utf-8;')
}
