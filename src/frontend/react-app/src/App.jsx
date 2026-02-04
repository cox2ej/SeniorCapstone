import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import InstructorDashboard from './pages/InstructorDashboard.jsx'
import GiveFeedback from './pages/GiveFeedback.jsx'
import FeedbackGuidelines from './pages/FeedbackGuidelines.jsx'
import FeedbackConfirmation from './pages/FeedbackConfirmation.jsx'
import MyFeedback from './pages/MyFeedback.jsx'
import FeedbackHistory from './pages/FeedbackHistory.jsx'
import SelfAssessment from './pages/SelfAssessment.jsx'
import Notifications from './pages/Notifications.jsx'
import AboutHelp from './pages/AboutHelp.jsx'
import Profile from './pages/Profile.jsx'
import PrivacySettings from './pages/PrivacySettings.jsx'
import CreateEvaluation from './pages/CreateEvaluation.jsx'
import ManageCoursesGroups from './pages/ManageCoursesGroups.jsx'
import AggregatedReports from './pages/AggregatedReports.jsx'
import ReportsExport from './pages/ReportsExport.jsx'
import PeerMatching from './pages/PeerMatching.jsx'
import AdminAnalytics from './pages/AdminAnalytics.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import Login from './pages/Login.jsx'
import Registration from './pages/Registration.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import { MockStoreProvider } from './store/mockStore.jsx'
import { isBackendEnabled, apiGet, apiPost } from './api/client.js'

function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">Skip to main content</a>
  )
}

function RouteAnnouncer() {
  const location = useLocation()
  const [msg, setMsg] = useState('')
  const firstLoadRef = useRef(true)
  useEffect(() => {
    // Prefer first h1 text as the title; fallback to pathname
    const h1 = document.querySelector('h1')
    const pageTitle = h1?.textContent?.trim() || location.pathname.replaceAll('/', ' ').trim() || 'Home'
    document.title = `${pageTitle} - Peer Feedback App`
    setMsg(`Navigated to ${pageTitle}`)
    // Move focus to main landmark if present
    if (firstLoadRef.current) {
      firstLoadRef.current = false
      return
    }
    const main = document.getElementById('main-content')
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus()
    }
  }, [location])
  return (
    <div id="route-announcer" className="sr-only" role="status" aria-live="polite" aria-atomic="true">{msg}</div>
  )
}

function Placeholder({ title }) {
  return (
    <section className="tile" aria-labelledby="placeholder-title">
      <h1 id="placeholder-title">{title}</h1>
      <div className="tile-content">
        <p>Prototype placeholder.</p>
      </div>
    </section>
  )
}

function LogoutCard() {
  const backendEnabled = isBackendEnabled()
  const [message, setMessage] = useState(backendEnabled ? 'Signing you out…' : 'You have been logged out.')

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function signOut() {
      try {
        await apiPost('/auth/logout/', {})
        if (!cancelled) setMessage('You have been logged out.')
      } catch (error) {
        if (!cancelled) {
          const detail = error?.responseText || error?.message || 'Unable to confirm logout.'
          setMessage(detail)
        }
      }
    }
    signOut()
    return () => { cancelled = true }
  }, [backendEnabled])

  return (
    <main id="main-content" className="auth-shell" tabIndex="-1">
      <section className="auth-card" aria-labelledby="logout-title">
        <h1 id="logout-title">Session timed out</h1>
        <p>{message}</p>
        <div className="actions">
          <Link to="/login" className="btn primary" aria-label="Go to Login">Log in again</Link>
          <Link to="/" className="btn" aria-label="Return to Home">Home</Link>
        </div>
        <p><small className="muted">Please sign in again to continue.</small></p>
      </section>
    </main>
  )
}

function RequireAuth({ children }) {
  const [authState, setAuthState] = useState({ checked: false, authenticated: false })
  const backendEnabled = isBackendEnabled()

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!backendEnabled) {
        setAuthState({ checked: true, authenticated: true })
        return
      }
      try {
        await apiGet('/users/me/')
        if (!cancelled) setAuthState({ checked: true, authenticated: true })
      } catch (error) {
        if (!cancelled) {
          if (error?.status !== 401) {
            console.warn('Unable to verify session', error)
          }
          setAuthState({ checked: true, authenticated: false })
        }
      }
    }
    check()
    return () => { cancelled = true }
  }, [backendEnabled])

  if (!authState.checked) {
    return (
      <main id="main-content" className="auth-shell" tabIndex="-1">
        <section className="auth-card" aria-busy="true">
          <h1>Checking session…</h1>
        </section>
      </main>
    )
  }

  if (!authState.authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <>
      <SkipLink />
      <RouteAnnouncer />
      <MockStoreProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/student-dashboard" replace />} />
          {/* Auth routes (no sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
            <Route path="/give-feedback" element={<GiveFeedback />} />
            <Route path="/feedback-guidelines" element={<FeedbackGuidelines />} />
            <Route path="/feedback-confirmation" element={<FeedbackConfirmation />} />
            <Route path="/my-feedback" element={<MyFeedback />} />
            <Route path="/feedback-history" element={<FeedbackHistory />} />
            <Route path="/self-assessment" element={<SelfAssessment />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/about-help" element={<AboutHelp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/privacy-settings" element={<PrivacySettings />} />
            <Route path="/create-evaluation" element={<CreateEvaluation />} />
            <Route path="/manage-courses-groups" element={<ManageCoursesGroups />} />
            <Route path="/aggregated-reports" element={<AggregatedReports />} />
            <Route path="/reports-export" element={<ReportsExport />} />
            <Route path="/peer-matching" element={<PeerMatching />} />
            <Route path="/admin-analytics" element={<AdminAnalytics />} />
            <Route path="/admin-settings" element={<AdminSettings />} />
          </Route>
          <Route path="/logout" element={<LogoutCard />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </MockStoreProvider>
    </>
  )
}
