// Cards, meters and inline-SVG charts, ported from Declara's Executive Dashboard (src/pages/executive/parts.tsx):
// same markup and behaviour, with the money formatting swapped for whatever the teacher screen needs.
import type { ReactNode } from 'react'

/* ---------- icons ---------- */
const V = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' } as const
export const ICO: Record<string, ReactNode> = {
  users: <svg {...V}><circle cx="8.6" cy="8.4" r="3.4" /><path d="M2.6 20a6 6 0 0 1 12 0" /><path d="M16.2 5.4a3.1 3.1 0 0 1 0 6M21.4 20a5.6 5.6 0 0 0-3.4-4.6" /></svg>,
  book: <svg {...V}><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13" /></svg>,
  doc: <svg {...V}><rect x="5" y="2.8" width="14" height="18.4" rx="2.2" /><path d="M8.8 8h6.4M8.8 12h6.4M8.8 16h4.2" /></svg>,
  check: <svg {...V}><rect x="3.4" y="5" width="17.2" height="15.6" rx="2.2" /><path d="M3.4 10h17.2M8.4 3v4M15.6 3v4M8.5 15l2.3 2.2 4.7-4.7" /></svg>,
  cal: <svg {...V}><rect x="3.4" y="5" width="17.2" height="15.6" rx="2.2" /><path d="M3.4 10h17.2M8.4 3v4M15.6 3v4" /></svg>,
  tasks: <svg {...V}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17" /></svg>,
  target: <svg {...V}><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1.2" /></svg>,
  warn: <svg {...V}><path d="M12 3.6 2.4 20.4h19.2z" /><path d="M12 9.4v4.6" /><path d="M12 17.4v.05" /></svg>,
  trend: <svg {...V}><path d="M3.4 17.6 9.6 11l3.6 3.6 6.6-6.6" /><path d="M15.2 8h4.6v4.6" /></svg>,
  star: <svg {...V}><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z" /></svg>,
}

/* ---------- score card ---------- */
export type Tone = 'good' | 'warn' | 'bad'
export function Gauge({ pct, tone }: { pct: number; tone?: Tone }) {
  const p = Math.max(0, Math.min(100, pct || 0)), R = 26, C = 2 * Math.PI * R
  const col = tone === 'bad' ? '#EF4444' : tone === 'warn' ? '#F59E0B' : '#22C55E'
  return (
    <svg className="gg" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={R} fill="none" stroke="var(--track)" strokeWidth="7" />
      <circle cx="32" cy="32" r={R} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeDasharray={(C * p / 100).toFixed(1) + ' ' + C.toFixed(1)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" className="gg-t">{Math.round(p)}%</text>
    </svg>
  )
}

export interface CardProps {
  icon: ReactNode; iconClass?: string; label: string; display: ReactNode; goalLine?: ReactNode; pct?: number | null; tone?: Tone
  delta?: { tone?: string; value: string }; note?: ReactNode; onOpen?: () => void; more?: string
}
export function ScoreCard(o: CardProps) {
  const open = o.onOpen
  return (
    <div className={'sc' + (open ? ' sc-click' : '')} {...(open ? {
      tabIndex: 0, role: 'button', 'aria-label': o.more || 'Open ' + o.label, onClick: open,
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } },
    } : {})}>
      <div className="sc-top"><span className={'sc-i ' + (o.iconClass || '')}>{o.icon}</span><div className="sc-l">{o.label}</div></div>
      <div className="sc-body">
        <div className="sc-v">{o.display}</div>
        {o.goalLine && <div className="sc-goal">{o.goalLine}</div>}
        <div className="sc-foot">
          <div className="sc-g">{o.pct != null && <Gauge pct={o.pct} tone={o.tone} />}</div>
          <div className="sc-delta">
            {o.delta && <div className={'sc-dv ' + (o.delta.tone || '')}>{o.delta.value}</div>}
            <div className="sc-gt">{o.note || ''}</div>
          </div>
        </div>
      </div>
      {open && <div className="sc-more">{o.more || 'View details'}<span aria-hidden="true">&rsaquo;</span></div>}
    </div>
  )
}

/* ---------- bars and meters ---------- */
export interface Bar { label: string; sub?: string; value: number; text?: string; color?: string; go?: () => void }
/** Horizontal bars; values are 0–max, shown with their own text. */
export function Bars({ items, max }: { items: Bar[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <div className="hb">
      {items.map((it, n) => (
        <div key={it.label + n} className={'hb-row' + (it.go ? ' hb-click' : '')} {...(it.go ? { tabIndex: 0, role: 'button', onClick: it.go, onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && it.go!() } : {})}>
          <div className="hb-l" title={it.label}>{it.label}{it.sub && <span className="hb-sub">{it.sub}</span>}</div>
          <div className="hb-track"><div className="hb-fill" style={{ width: ((Math.max(0, it.value) / top) * 100).toFixed(1) + '%', background: it.color }} /></div>
          <div className="hb-v">{it.text ?? it.value}</div>
        </div>
      ))}
    </div>
  )
}

export function Meter({ label, num, den, note, tone }: { label: ReactNode; num: number; den: number; note?: ReactNode; tone: Tone }) {
  const pct = den ? (num / den) * 100 : 0
  const col = tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : 'var(--good)'
  return (
    <div className="mtr">
      <div className="mtr-top"><span className="mtr-l">{label}</span><span className="mtr-v">{den ? Math.round(pct) + '%' : '—'}</span></div>
      <div className="mtr-track"><div className="mtr-fill" style={{ width: pct.toFixed(1) + '%', background: col }} /></div>
      <div className="mtr-s">{num} of {den}{note ? <> &middot; {note}</> : ''}</div>
    </div>
  )
}

/* ---------- day chart and donut ---------- */
export function DayChart({ series, max }: { series: { label: string; value: number; text?: string }[]; max?: number }) {
  const top = max ?? Math.max(...series.map((x) => x.value || 0), 1)
  return (
    <div className="dchart" role="img" aria-label={series.map((x) => `${x.label}: ${x.text ?? x.value}`).join(', ')}>
      {series.map((x, i) => (
        <div key={x.label + i} className="dbar-w" title={x.label + ': ' + (x.text ?? String(x.value || 0))}>
          <div className="dbar" style={{ height: Math.max(2, ((x.value || 0) / top) * 100).toFixed(1) + '%' }} />
          <span className="dbar-l">{x.label}</span>
        </div>
      ))}
    </div>
  )
}

const DONUT = ['var(--ch1, #FE454E)', 'var(--ch2, #F79009)', 'var(--ch3, #01BCAF)', 'var(--ch4, #164fec)', 'var(--ch5, #12B76A)', 'var(--ch6, #8b5cf6)']
export function Donut({ rows, colors = DONUT, center, centerSub }: { rows: { label: string; value: number }[]; colors?: string[]; center?: string; centerSub?: string }) {
  const total = rows.reduce((a, r) => a + r.value, 0)
  const R = 42, C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="donut">
      <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label={rows.map((r) => `${r.label} ${r.value}`).join(', ')}>
        <circle r={R} cx="60" cy="60" fill="none" stroke="var(--track)" strokeWidth="16" />
        {total > 0 && rows.map((r, i) => {
          const f = r.value / total, dash = f * C, off = C * (1 - acc)
          acc += f
          return (
            <circle key={r.label + i} r={R} cx="60" cy="60" fill="none" stroke={colors[i % colors.length]} strokeWidth="16"
              strokeDasharray={dash.toFixed(2) + ' ' + (C - dash).toFixed(2)} strokeDashoffset={off.toFixed(2)} transform="rotate(-90 60 60)">
              <title>{r.label + ' ' + Math.round(f * 100) + '%'}</title>
            </circle>
          )
        })}
        <text x="60" y="60" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--donut-ink, var(--navy))">{center ?? total}</text>
        <text x="60" y="75" textAnchor="middle" fontSize="8.5" fill="var(--donut-sub, var(--muted))">{centerSub || ''}</text>
      </svg>
      <div className="donut-l">
        {rows.map((r, i) => (
          <div key={r.label + i} className="donut-r"><i style={{ background: colors[i % colors.length] }} /><span>{r.label}</span><b>{r.value}</b><em>{total ? Math.round((r.value / total) * 100) : 0}%</em></div>
        ))}
      </div>
    </div>
  )
}
