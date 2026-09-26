import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DialogHost } from './components/dialogs'
import Layout from './components/Layout'
import { Loading } from './components/ui'
import { remindToday } from './lib/notify'
import { useProfile } from './lib/profile'
import Welcome from './pages/Welcome'

// Each page is its own file, downloaded the first time it's opened, so the first load stays small (as in Declara).
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Classes = lazy(() => import('./pages/Classes'))
const ClassDetail = lazy(() => import('./pages/ClassDetail'))
const Students = lazy(() => import('./pages/Students'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Gradebook = lazy(() => import('./pages/Gradebook'))
const Attendance = lazy(() => import('./pages/Attendance'))
const Goals = lazy(() => import('./pages/Goals'))
const Notes = lazy(() => import('./pages/Notes'))
const Planner = lazy(() => import('./pages/Planner'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))

function Gate() {
  const prof = useProfile()
  useEffect(() => { if (prof.setupDone) remindToday() }, [prof.setupDone])
  if (!prof.setupDone) return <Welcome />
  return (
    <Layout>
      <Suspense fallback={<div className="center"><Loading what="Loading" /></div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/:id" element={<ClassDetail />} />
          <Route path="/students" element={<Students />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/grades" element={<Gradebook />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Gate />
      <DialogHost />
    </HashRouter>
  )
}
