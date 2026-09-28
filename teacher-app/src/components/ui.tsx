// Declara's building blocks (page head, tiles, panels, drawer, tabs, search, key/value list), unchanged, plus the
// autosaving fields every form in the teacher app uses: they save a moment after typing stops and on leaving the
// field, so there is never a Save button to forget.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { onFlush } from '../lib/store'

export function PageHead({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {kicker && <div className="kicker">{kicker}</div>}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {right && <div className="head-right row">{right}</div>}
    </div>
  )
}

export function Tile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'good' | 'warn' }) {
  return (
    <div className={'tile' + (tone ? ' tile-' + tone : '')}>
      <div className="tile-l">{label}</div>
      <div className="tile-v">{value}</div>
      {sub && <div className="tile-s">{sub}</div>}
    </div>
  )
}

export function Panel({ title, sub, children, right, id }: { title: string; sub?: ReactNode; children: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <section className="panel" id={id}>
      <div className="panel-h">
        <div>
          <div className="panel-t">{title}</div>
          {sub && <div className="panel-s">{sub}</div>}
        </div>
        {right}
      </div>
      <div className="panel-b">{children}</div>
    </section>
  )
}

export function Loading({ what = 'Loading' }: { what?: string }) {
  return <div className="loading">{what}…</div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function EmptyHero({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="empty-hero"><b>{title}</b>{children}{action && <div>{action}</div>}</div>
}

export function Drawer({ open, onClose, title, sub, children }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.modal-bg')) onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="drawer-bg" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="drawer-h">
          <div>
            <div className="panel-t">{title}</div>
            {sub && <div className="panel-s">{sub}</div>}
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="drawer-b">{children}</div>
      </aside>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { key: T; label: ReactNode }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} className={value === t.key ? 'on' : ''} onClick={() => onChange(t.key)}>{t.label}</button>
      ))}
    </div>
  )
}

export function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className="search" type="search" value={value} placeholder={placeholder || 'Search'} aria-label={placeholder || 'Search'} onChange={(e) => onChange(e.target.value)} />
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!shown.length) return null
  return <dl className="kv">{shown.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
}

export function Tiles({ children }: { children: ReactNode }) {
  return <div className="tiles">{children}</div>
}

/* ---------- autosaving fields ---------- */
type TextProps = {
  value: string; onSave: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number
  type?: 'text' | 'email' | 'search'; className?: string; autoFocus?: boolean; delay?: number; ariaLabel?: string; maxLength?: number; list?: string
}
/** A text box that saves itself ~0.4s after typing stops, on blur, and before the page is closed. */
export function AutoText({ value, onSave, multiline, delay = 400, className = 'fld', ariaLabel, ...rest }: TextProps) {
  const [v, setV] = useState(value)
  const dirty = useRef(false), timer = useRef<number | undefined>(undefined), latest = useRef(v), save = useRef(onSave)
  save.current = onSave
  useEffect(() => { if (!dirty.current) setV(value) }, [value])
  const flush = () => { window.clearTimeout(timer.current); if (dirty.current) { dirty.current = false; save.current(latest.current) } }
  useEffect(() => onFlush(flush), [])
  useEffect(() => () => flush(), [])
  const change = (x: string) => {
    setV(x); latest.current = x; dirty.current = true
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, delay)
  }
  const common = { className, value: v, onBlur: flush, 'aria-label': ariaLabel, ...rest }
  return multiline
    ? <textarea {...common} rows={rest.rows || 3} onChange={(e) => change(e.target.value)} />
    : <input {...common} type={rest.type || 'text'} onChange={(e) => change(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
}

/** A number box that saves itself; empty means "no value" (null). */
export function AutoNumber({ value, onSave, className = 'fld', min, max, step, placeholder, ariaLabel }: { value: number | null; onSave: (v: number | null) => void; className?: string; min?: number; max?: number; step?: number; placeholder?: string; ariaLabel?: string }) {
  return <AutoText className={className} value={value == null ? '' : String(value)} placeholder={placeholder} ariaLabel={ariaLabel}
    onSave={(s) => {
      const t = s.trim()
      if (!t) return onSave(null)
      let n = Number(t.replace(',', '.'))
      if (isNaN(n)) return
      if (min != null) n = Math.max(min, n)
      if (max != null) n = Math.min(max, n)
      onSave(step && step >= 1 ? Math.round(n) : n)
    }} />
}

/** A labelled form field. Use `group` for sets of buttons (a <label> would make its text click the first button). */
export function Field({ label, children, span, hint, group }: { label: string; children: ReactNode; span?: 2 | 'all'; hint?: ReactNode; group?: boolean }) {
  const cls = [span === 2 ? 'span2' : span === 'all' ? 'span-all' : '', group ? 'fgroup' : ''].filter(Boolean).join(' ') || undefined
  return group
    ? <div className={cls} role="group" aria-label={label}><span>{label}</span>{children}{hint && <span className="hint">{hint}</span>}</div>
    : <label className={cls}>{label}{children}{hint && <span className="hint">{hint}</span>}</label>
}
