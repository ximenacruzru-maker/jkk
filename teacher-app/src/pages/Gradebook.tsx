// The gradebook: every student against every assignment in a class, typed straight into the grid (saves as you go),
// plus a skills view that turns graded work into mastery levels per skill.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GradeInput } from '../components/GradeEditor'
import { EmptyHero, PageHead, Panel, Tabs } from '../components/ui'
import { downloadCsv, shortDate, today } from '../lib/format'
import { average, gradeId, isMissing, masteryFor, score, showAverage, showGrade, studentAverage, tone } from '../lib/grading'
import { MASTERY, fullName } from '../lib/model'
import { useProfile } from '../lib/profile'
import { activeClasses, allClasses, assignmentsOf, gradeOf, studentsIn, useParam } from '../lib/queries'
import { useDB } from '../lib/store'

const MASTERY_PILL: Record<string, string> = { beginning: 'pill-bad', developing: 'pill-warn', proficient: 'pill-good', advanced: 'pill-blue' }

export default function Gradebook() {
  const d = useDB()
  const prof = useProfile()
  const go = useNavigate()
  const [classQ, setClassQ] = useParam('class')
  const [view, setView] = useState<'scores' | 'skills'>('scores')
  const [cat, setCat] = useState('all')
  const [upcoming, setUpcoming] = useState(false)
  const classes = activeClasses(d)
  const c = d.get('classes', classQ) || classes[0]
  const head = <PageHead kicker="Learning" title="Gradebook" sub={c ? `${c.name}` : undefined}
    right={c && <select className="fld" style={{ width: 'auto' }} value={c.id} onChange={(e) => setClassQ(e.target.value)} aria-label="Class">{allClasses(d).map((x) => <option key={x.id} value={x.id}>{x.name}{x.archived ? ' (archived)' : ''}</option>)}</select>} />
  if (!c) return <>{head}<Panel title="No classes yet"><EmptyHero title="Create a class to start a gradebook" action={<Link className="btn-primary" to="/classes?new=1">New class</Link>} /></Panel></>

  const t = today()
  const kids = studentsIn(d, c.id)
  const allA = assignmentsOf(d, c.id)
  const cats = [...new Set(allA.map((a) => a.category).filter(Boolean))].sort()
  const cols = allA.filter((a) => (cat === 'all' || a.category === cat) && (upcoming || a.dueDate <= t || a.status === 'graded' || a.status === 'completed'))
  const g = gradeOf(d)
  const skills = d.list('skills').filter((k) => allA.some((a) => a.skillIds.includes(k.id))).sort((a, b) => a.name.localeCompare(b.name))

  const csv = () => downloadCsv(`gradebook-${c.name.replace(/\W+/g, '-')}-${t}.csv`, [
    ['Student', 'Student ID', ...cols.map((a) => `${a.title} (${a.gradingType === 'points' ? a.pointsPossible + ' pts' : a.gradingType})`), 'Average'],
    ...kids.map((s) => { const avg = studentAverage(s.id, cols, g); return [fullName(s), s.studentCode, ...cols.map((a) => showGrade(g(gradeId(a.id, s.id)), a)), avg.pct == null ? '' : Math.round(avg.pct * 100) + '%'] }),
  ])

  return (
    <>
      {head}
      <Panel title={view === 'scores' ? 'Scores' : 'Skills & mastery'} sub={view === 'scores' ? 'Type a grade and move on — it saves by itself. Tab and Shift+Tab move between cells.' : 'Average of graded work tagged with each skill, shown as a mastery level'}
        right={<div className="filters">
          <Tabs value={view} onChange={setView} tabs={[{ key: 'scores', label: 'Scores' }, { key: 'skills', label: 'Skills' }]} />
          {view === 'scores' && <>
            {cats.length > 1 && <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{cats.map((x) => <option key={x}>{x}</option>)}</select>}
            <label className="picker"><input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Show upcoming</label>
            <button className="btn-ghost" onClick={csv}>CSV</button>
          </>}
        </div>}>
        {!kids.length ? <EmptyHero title="No students in this class" action={<Link className="btn-primary" to={`/classes/${c.id}`}>Add students</Link>} />
          : view === 'scores' ? (!cols.length ? <EmptyHero title="No assignments to grade yet" action={<Link className="btn-primary" to={`/assignments?new=1&class=${c.id}`}>New assignment</Link>}>{allA.length ? 'Tick “Show upcoming” to see assignments that aren’t due yet.' : ''}</EmptyHero> : (
            <div className="gb-wrap">
              <table className="gb">
                <thead><tr>
                  <th>Student</th>
                  {cols.map((a) => <th key={a.id} title={a.title}><button className="linkbtn a-t" onClick={() => go(`/assignments?open=${a.id}`)}>{a.title}</button>{shortDate(a.dueDate)} · {a.gradingType === 'points' ? `${a.pointsPossible} pts` : a.gradingType === 'mastery' ? 'mastery' : 'done?'}</th>)}
                  <th>Average</th>
                </tr></thead>
                <tbody>
                  {kids.map((s) => {
                    const avg = studentAverage(s.id, cols, g)
                    return (
                      <tr key={s.id}>
                        <td><button className="linkbtn" style={{ color: 'var(--ink)', fontWeight: 700 }} onClick={() => go(`/students?open=${s.id}`)}>{fullName(s)}</button></td>
                        {cols.map((a) => { const gr = g(gradeId(a.id, s.id)); const miss = isMissing(gr, a); return (
                          <td key={a.id} className={miss ? 'miss' : gr?.excused ? 'ex' : ''} title={gr?.comment || (miss ? 'Missing' : gr?.excused ? 'Excused' : '')}>
                            <GradeInput a={a} s={s} g={gr} className="cell" />{miss && <span className="flag">M</span>}{gr?.excused && <span className="flag" style={{ color: 'var(--muted)' }}>EX</span>}
                          </td>
                        ) })}
                        <td className="avg"><span className={tone(avg.pct, prof.passingPercent) === 'bad' ? 'pill pill-bad' : ''}>{showAverage(avg.pct, prof, avg)}</span></td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td className="sub" style={{ fontWeight: 800 }}>Class average</td>
                    {cols.map((a) => <td key={a.id} className="sub mono" style={{ fontWeight: 700 }}>{showAverage(average(kids.map((s) => score(g(gradeId(a.id, s.id)), a))), { ...prof, gradeDisplay: 'percent', showLetters: false })}</td>)}
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )) : (!skills.length ? <EmptyHero title="No skills linked yet" action={<Link className="btn-ghost" to="/goals?tab=skills">Manage skills</Link>}>Add skills in Goals &amp; Skills, then tag assignments with them to see mastery here.</EmptyHero> : (
            <div className="gb-wrap">
              <table className="gb">
                <thead><tr><th>Student</th>{skills.map((k) => <th key={k.id}><span className="a-t">{k.name}</span>{k.subject}</th>)}</tr></thead>
                <tbody>{kids.map((s) => (
                  <tr key={s.id}>
                    <td className="strong">{fullName(s)}</td>
                    {skills.map((k) => {
                      const m = masteryFor(average(allA.filter((a) => a.skillIds.includes(k.id)).map((a) => score(g(gradeId(a.id, s.id)), a))))
                      return <td key={k.id}>{m ? <span className={'pill ' + MASTERY_PILL[m]}>{MASTERY[m]}</span> : <span className="sub">—</span>}</td>
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
      </Panel>
      {classes.length > 1 && <p className="note">Tip: open a student’s name for their full profile, or an assignment’s title to add comments and mark work missing or excused.</p>}
    </>
  )
}
