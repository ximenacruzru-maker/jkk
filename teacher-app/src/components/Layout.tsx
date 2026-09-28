import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.jpg'
import logoHalloween from '../assets/logo-halloween.jpg'
import { timeAgo } from '../lib/format'
import { fullName, initials } from '../lib/model'
import { firstName, useProfile } from '../lib/profile'
import { useDB, useSaveState } from '../lib/store'
import { getLook, onLook } from '../lib/theme'
import { Icon } from './icons'

type Item = { h: string } | { div: true } | { to: string; label: string; icon: string; also?: string[] }

/** The app shell, laid out like Declara: one sidebar in four sections, a top bar with search on the left and
 *  status, quick actions and the account menu on the right. */
export default function Layout({ children }: { children: ReactNode }) {
  const prof = useProfile()
  const { pathname, search } = useLocation()
  const go = useNavigate()
  const [menu, setMenu] = useState(false)
  const [qa, setQa] = useState(false)
  // On phones the sidebar is a drawer behind the ☰ button.
  const [drawer, setDrawer] = useState(false)
  // The seasonal Halloween theme has its own logo; every other theme shows the DECLARA tile.
  const [theme, setTheme] = useState(getLook().theme)
  useEffect(() => onLook((l) => setTheme(l.theme)), [])
  useEffect(() => { setMenu(false); setQa(false); setDrawer(false) }, [pathname, search])
  // Each new page starts at the top (the page area scrolls on its own, so the browser doesn't reset it).
  const main = useRef<HTMLElement>(null)
  useEffect(() => { main.current?.scrollTo(0, 0); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawer(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  const first = firstName(prof)
  const nav: Item[] = [
    { h: 'Workspace' },
    { to: '/', label: first ? `${first}’s Dashboard` : 'Dashboard', icon: 'today' },
    { to: '/planner', label: 'Calendar & Tasks', icon: 'calendar' },
    { div: true },
    { h: 'Classroom' },
    { to: '/classes', label: 'Classes', icon: 'training' },
    { to: '/students', label: 'Students', icon: 'proteges' },
    { to: '/attendance', label: 'Attendance', icon: 'attendance' },
    { h: 'Learning' },
    { to: '/assignments', label: 'Assignments', icon: 'tickets' },
    { to: '/grades', label: 'Gradebook', icon: 'compare' },
    { to: '/goals', label: 'Goals & Skills', icon: 'target' },
    { h: 'Records' },
    { to: '/notes', label: 'Notes', icon: 'note' },
    { to: '/reports', label: 'Reports', icon: 'reports' },
    { div: true },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ]
  const isOn = (n: { to: string }) => n.to === '/' ? pathname === '/' : pathname === n.to || pathname.startsWith(n.to + '/')
  const who = prof.teacherName || 'Teacher'
  const ini = who.replace(/^(mr|mrs|ms|mx|dr|miss)\.?\s+/i, '').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase() || 'T'
  const role = [prof.grade && (/grade|^k/i.test(prof.grade) ? prof.grade : `Grade ${prof.grade}`), prof.subject].filter(Boolean).join(' · ') || 'Teacher'

  return (
    <div className="shell">
      {drawer && <div className="side-scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
      <aside className={'side' + (drawer ? ' open' : '')} id="side-nav">
        <div className="side-brand">
          <div className="brand-tile"><img className="brand-logo" src={theme === 'halloween' ? logoHalloween : logo} alt="Declara" /></div>
          <p className="side-for">Teacher Edition · For</p>
          <p className="side-sub">{prof.school || (first ? `${first}’s classroom` : 'Your classroom')}</p>
        </div>
        <nav className="nav">
          {nav.map((n, i) => ('h' in n ? <div key={n.h} className="nav-h" data-sec={n.h}>{n.h}</div>
            : 'div' in n ? <div key={'d' + i} className="nav-div" />
              : (
                <button key={n.to} className={isOn(n) ? 'active' : ''} onClick={() => go(n.to)} aria-current={isOn(n) ? 'page' : undefined}>
                  <Icon name={n.icon} /><span>{n.label}</span>
                </button>
              )))}
        </nav>
        <div className="side-foot">
          <button className="logout" onClick={() => go('/settings?tab=privacy')} title="How your data is kept private"><Icon name="lock" width={1.5} /><span>Private · on this device</span></button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="hd-burger" aria-label="Menu" aria-controls="side-nav" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><span /><span /><span /></button>
          <img className="hd-logo" src={theme === 'halloween' ? logoHalloween : logo} alt="Declara" />
          <GlobalSearch />
          <div className="hd-right">
            <SaveStatus />
            <div className="hd-qa">
              <button className="hd-kai" onClick={() => setQa(!qa)} aria-haspopup="menu" aria-expanded={qa}><Icon name="plus" width={2.4} /><span>Quick add</span></button>
              {qa && (
                <div className="hd-menu" role="menu" onMouseLeave={() => setQa(false)}>
                  <button role="menuitem" onClick={() => go('/students?new=1')}>New student</button>
                  <button role="menuitem" onClick={() => go('/assignments?new=1')}>New assignment</button>
                  <button role="menuitem" onClick={() => go('/attendance')}>Take attendance</button>
                  <button role="menuitem" onClick={() => go('/planner?new=task')}>New task or event</button>
                  <button role="menuitem" onClick={() => go('/goals?new=1')}>New learning goal</button>
                  <button role="menuitem" onClick={() => go('/notes?new=1')}>New note</button>
                  <button role="menuitem" onClick={() => go('/classes?new=1')}>New class</button>
                </div>
              )}
            </div>
            <div className="hd-user">
              <span className="hd-av" role="button" tabIndex={0} aria-label="Account menu" onClick={() => setMenu(!menu)} onKeyDown={(e) => e.key === 'Enter' && setMenu(!menu)}>{ini}</span>
              <span className="hd-un"><b>{who}</b><em>{role}</em></span>
              <button className="hd-chev" aria-label="Account menu" onClick={() => setMenu(!menu)}><Icon name="chev" width={2} /></button>
              {menu && (
                <div className="hd-menu" onMouseLeave={() => setMenu(false)}>
                  <button onClick={() => go('/settings')}>Settings &amp; appearance</button>
                  <button onClick={() => go('/settings?tab=data')}>Backup &amp; restore</button>
                  <button onClick={() => go('/settings?tab=privacy')}>Privacy</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page" ref={main}>
          <StorageWarning />
          {children}
        </main>
      </div>
    </div>
  )
}

/** Declara's sync pill, repurposed: shows that every change is saved on this device. */
function SaveStatus() {
  const s = useSaveState()
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(t) }, [])
  const label = s.status === 'saving' ? 'Saving…' : s.status === 'error' ? 'Not saved' : s.status === 'memory' ? 'Not saving' : 'Saved'
  const title = s.status === 'saved' ? `Everything is saved on this device${s.at ? ' · last change ' + timeAgo(s.at) : ''}` : s.error || label
  return (
    <span className={'tsync-pill' + (s.status === 'error' || s.status === 'memory' ? ' bad' : '')} title={title} role="status" aria-live="polite">
      <span className="sync-dot" data-state={s.status} /><span className="tsync-l">{label}</span>
    </span>
  )
}

function StorageWarning() {
  const s = useSaveState()
  if (s.status !== 'memory' && s.status !== 'error') return null
  return (
    <div className="alert alert-warn" style={{ marginTop: 12 }}>
      <div className="alert-bar">
        <span className="alert-ico">!</span>
        <div className="alert-msg">{s.status === 'memory'
          ? <><b>This browser isn’t letting the app save.</b> You can look around, but changes will be lost when you close the tab. This usually happens in a private window — open the app in a regular window instead.</>
          : <><b>Your last change couldn’t be saved.</b> {s.error} Try again, and download a backup from Settings › Data &amp; backup to be safe.</>}</div>
      </div>
    </div>
  )
}

/* ---------- search: students, classes, assignments and goals ---------- */
interface Hit { group: string; label: string; sub: string; to: string; av?: { text: string; color?: string }; score: number }
const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

function GlobalSearch() {
  const go = useNavigate()
  const d = useDB()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const off = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [])
  const hits = useMemo<Hit[]>(() => {
    const n = norm(q)
    if (n.length < 2) return []
    const out: Hit[] = []
    const cls = (id: string | null) => d.get('classes', id)
    const add = (hay: string, h: Omit<Hit, 'score'>) => { const i = norm(hay).indexOf(n); if (i >= 0) out.push({ ...h, score: i }) }
    for (const s of d.list('students')) {
      const c = cls(s.classIds[0] || null)
      add(`${s.firstName} ${s.lastName} ${s.lastName} ${s.firstName} ${s.studentCode} ${s.tags.join(' ')}`, { group: 'Students', label: fullName(s), sub: [c?.name, s.studentCode].filter(Boolean).join(' · '), to: `/students?open=${s.id}`, av: { text: initials(s), color: c?.color } })
    }
    for (const c of d.list('classes')) add(`${c.name} ${c.subject} ${c.room}`, { group: 'Classes', label: c.name, sub: [c.subject, c.room && 'Room ' + c.room].filter(Boolean).join(' · '), to: `/classes/${c.id}` })
    for (const a of d.list('assignments')) add(`${a.title} ${a.category}`, { group: 'Assignments', label: a.title, sub: [cls(a.classId)?.name, a.category].filter(Boolean).join(' · '), to: `/assignments?open=${a.id}` })
    for (const g of d.list('goals')) add(g.title, { group: 'Goals', label: g.title, sub: g.scope === 'class' ? cls(g.classId)?.name || 'Class goal' : fullName(d.get('students', g.studentId) || { firstName: 'Student', lastName: '' }), to: `/goals?open=${g.id}` })
    const order = ['Students', 'Classes', 'Assignments', 'Goals']
    return out.sort((x, y) => order.indexOf(x.group) - order.indexOf(y.group) || x.score - y.score).slice(0, 30)
  }, [q, d])
  const pick = (h: Hit) => { setOpen(false); setQ(''); go(h.to) }
  let last = ''
  return (
    <div className="gsearch" ref={box}>
      <span className="gsearch-ico"><Icon name="search" width={1.7} /></span>
      <input className="gq" type="text" autoComplete="off" spellCheck={false} placeholder="Search students, classes, assignments…" aria-label="Search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setSel(0); setOpen(true) }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur() }
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
          if (e.key === 'Enter' && hits[sel]) pick(hits[sel])
        }} />
      {q && <button className="gclear" onClick={() => { setQ(''); setOpen(false) }} title="Clear search">×</button>}
      {open && norm(q).length >= 2 && (
        <div className="gres">
          {!hits.length ? <div className="gempty">Nothing matches that.</div>
            : hits.map((h, i) => {
              const head = h.group !== last ? (last = h.group) : null
              return (
                <div key={h.to + i}>
                  {head && <div className="ghead">{head}</div>}
                  <button className={'gitem' + (i === sel ? ' sel' : '')} onMouseEnter={() => setSel(i)} onClick={() => pick(h)}>
                    <span>{h.av && <span className="av" style={{ background: h.av.color }}>{h.av.text}</span>}<span><span className="gname">{h.label}</span><span className="gsub">{h.sub}</span></span></span>
                  </button>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
