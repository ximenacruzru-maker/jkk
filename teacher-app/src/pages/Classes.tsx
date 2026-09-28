import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClassForm } from '../components/forms'
import { Drawer, EmptyHero, PageHead, Tabs } from '../components/ui'
import { pct, plural, schoolDays, today } from '../lib/format'
import { showAverage } from '../lib/grading'
import { useProfile } from '../lib/profile'
import { allClasses, classAverage, studentsIn, tally, useParam } from '../lib/queries'
import { useDB } from '../lib/store'

export default function Classes() {
  const d = useDB()
  const prof = useProfile()
  const go = useNavigate()
  const [isNew, setNew] = useParam('new')
  const [created, setCreated] = useState<string | null>(null)
  const [show, setShow] = useState<'active' | 'archived'>('active')
  const all = allClasses(d)
  const list = all.filter((c) => (show === 'active' ? !c.archived : c.archived))
  const recent = new Set(schoolDays(today(), 10))
  const close = () => { setNew(null); if (created) go(`/classes/${created}`); setCreated(null) }

  return (
    <>
      <PageHead kicker="Classroom" title="Classes" sub={`${plural(all.filter((c) => !c.archived).length, 'active class', 'active classes')}${all.some((c) => c.archived) ? ` · ${all.filter((c) => c.archived).length} archived` : ''}`}
        right={<button className="btn-primary" onClick={() => setNew('1')}>+ New class</button>} />
      {all.some((c) => c.archived) && <Tabs value={show} onChange={setShow} tabs={[{ key: 'active', label: 'Active' }, { key: 'archived', label: 'Archived' }]} />}
      {list.length ? (
        <div className="cards">
          {list.map((c) => {
            const n = studentsIn(d, c.id).length, avg = classAverage(d, c.id)
            const att = tally(d.list('attendance').filter((r) => r.classId === c.id && recent.has(r.date)))
            return (
              <div key={c.id} className="card class-card" style={{ '--c': c.color } as React.CSSProperties} role="button" tabIndex={0}
                onClick={() => go(`/classes/${c.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/classes/${c.id}`)}>
                <div className="card-t">{c.name}</div>
                <div className="card-s">{[c.subject, c.grade && (/^k$/i.test(c.grade) ? 'Kindergarten' : /grade/i.test(c.grade) ? c.grade : `Grade ${c.grade}`), c.room && `Room ${c.room}`, c.schoolYear].filter(Boolean).join(' · ')}</div>
                {c.description && <div className="card-s" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>}
                <div className="stats">
                  <div><b>{n}</b><small>Students</small></div>
                  <div><b>{avg == null ? '—' : showAverage(avg, { ...prof, gradeDisplay: prof.gradeDisplay === 'letter' ? 'letter' : prof.gradeDisplay === 'mastery' ? 'mastery' : 'percent', showLetters: false }).split(' · ')[0]}</b><small>Average</small></div>
                  <div><b>{pct(att.rate)}</b><small>Attendance</small></div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="panel"><EmptyHero title={show === 'active' ? 'No classes yet' : 'No archived classes'} action={show === 'active' && <button className="btn-primary" onClick={() => setNew('1')}>Create your first class</button>}>
          {show === 'active' && <div>A class holds its students, assignments, attendance, goals and notes — e.g. “1st Grade Reading”.</div>}</EmptyHero></div>
      )}
      <Drawer open={!!isNew} onClose={close} title="New class" sub="Type a name and it’s saved — no Save button needed.">
        <ClassForm id={created} onCreate={setCreated} />
        {created && <div className="row" style={{ marginTop: 16 }}><button className="btn-primary" onClick={close}>Open the class</button></div>}
      </Drawer>
    </>
  )
}
