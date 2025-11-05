import { Routes, Route, Navigate, Link } from 'react-router-dom'
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
  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="logout-title">
        <h1 id="logout-title">Session timed out</h1>
        <p>You’ve been logged out due to inactivity.</p>
        <div className="actions">
          <Link to="/login" className="btn primary" aria-label="Go to Login">Log in again</Link>
          <Link to="/" className="btn" aria-label="Return to Home">Home</Link>
        </div>
        <p><small className="muted">Prototype only. No authentication occurs.</small></p>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/student-dashboard" replace />} />
      {/* Auth routes (no sidebar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/registration" element={<Registration />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout /> }>
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/give-feedback" element={<GiveFeedback />} />
        <Route path="/feedback-guidelines" element={<FeedbackGuidelines />} />
        <Route path="/feedback-confirmation" element={<FeedbackConfirmation />} />
        <Route path="/my-feedback" element={<MyFeedback />} />
        <Route path="/feedback-history" element={<FeedbackHistory />} />
        <Route path="/self-assessment" element={<SelfAssessment />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/privacy-settings" element={<PrivacySettings />} />
        <Route path="/about-help" element={<AboutHelp />} />
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
  )
}
