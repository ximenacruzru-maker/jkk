// Confirmation dialogs and toasts, rendered once at the top of the app. Replaces the browser's own confirm() with a
// dialog in the app's theme, and can require typing a word (e.g. RESET) before a destructive action.
import { useEffect, useState, type ReactNode } from 'react'

interface Ask { title: string; body?: ReactNode; confirm?: string; cancel?: string; danger?: boolean; typed?: string; extra?: ReactNode; resolve: (ok: boolean) => void }
let push: ((a: Ask | null) => void) | null = null
let toastPush: ((m: string) => void) | null = null

export function confirmDialog(o: Omit<Ask, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => { if (push) push({ ...o, resolve }); else resolve(window.confirm(o.title)) })
}
export function toast(message: string) { toastPush?.(message) }

export function DialogHost() {
  const [ask, setAsk] = useState<Ask | null>(null)
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState<{ m: string; k: number } | null>(null)
  useEffect(() => { push = (a) => { setTyped(''); setAsk(a) }; toastPush = (m) => setMsg({ m, k: Date.now() }); return () => { push = null; toastPush = null } }, [])
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 2600); return () => clearTimeout(t) }, [msg])
  useEffect(() => {
    if (!ask) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  const close = (ok: boolean) => { ask?.resolve(ok); setAsk(null) }
  const blocked = !!ask?.typed && typed.trim().toUpperCase() !== ask.typed.toUpperCase()
  return (
    <>
      {ask && (
        <div className="modal-bg" onClick={() => close(false)}>
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h"><div className="panel-t" id="dlg-t">{ask.title}</div></div>
            <div className="modal-b">
              {typeof ask.body === 'string' ? <p>{ask.body}</p> : ask.body}
              {ask.extra}
              {ask.typed && (
                <label className="form-grid" style={{ display: 'block', marginTop: 8 }}>
                  <span className="hint">Type <b>{ask.typed}</b> to confirm</span>
                  <input className="fld" autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !blocked && close(true)} aria-label={`Type ${ask.typed} to confirm`} />
                </label>
              )}
            </div>
            <div className="modal-f">
              <button className="btn-ghost" onClick={() => close(false)} autoFocus={!ask.typed}>{ask.cancel || 'Cancel'}</button>
              <button className={ask.danger ? 'btn-danger' : 'btn-primary'} disabled={blocked} onClick={() => close(true)}>{ask.confirm || 'OK'}</button>
            </div>
          </div>
        </div>
      )}
      {msg && <div className="toast" key={msg.k} role="status">{msg.m}</div>}
    </>
  )
}
