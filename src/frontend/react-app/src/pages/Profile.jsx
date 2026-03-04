import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import { useMockStore } from '../store/mockStore.jsx'
import { apiGet, isBackendEnabled } from '../api/client.js'

export default function Profile() {
  const { summary, loading } = useDashboardSummary()
  const { currentUser, users } = useMockStore()
  const backendEnabled = isBackendEnabled()
  const [authUser, setAuthUser] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function fetchMe() {
      try {
        const data = await apiGet('/users/me/')
        if (!cancelled) setAuthUser(data)
      } catch {
        if (!cancelled) setAuthUser(null)
      }
    }
    fetchMe()
    return () => { cancelled = true }
  }, [backendEnabled])

  const displayName = useMemo(() => {
    if (backendEnabled && authUser) {
      return authUser.display_name || authUser.full_name || authUser.username || authUser.email || 'Signed-in user'
    }
    return users[currentUser]?.name || currentUser || 'Demo user'
  }, [backendEnabled, authUser, users, currentUser])

  const rawRole = useMemo(() => {
    if (backendEnabled && authUser?.role) return authUser.role
    return summary?.role || 'student'
  }, [backendEnabled, authUser?.role, summary?.role])

  const roleLabel = useMemo(() => {
    const r = (rawRole || 'student').toLowerCase()
    if (r === 'instructor' || r === 'admin') return 'Instructor'
    return 'Student'
  }, [rawRole])

  const isInstructor = roleLabel === 'Instructor'

  return (
    <>
      <h1>Profile</h1>

      {/* Header + Summary */}
      <section className="tile profile-header" aria-labelledby="profile-summary">
        <h2 id="profile-summary" className="tile-title">Summary</h2>
        <div className="tile-content">
          <div className="profile-header-inner">
            <div className="profile-avatar" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="profile-meta">
              <p className="profile-name">{displayName}</p>
              <p className="muted">Role: {roleLabel}</p>
              <p className="muted">Course / Section: <span className="profile-course-placeholder">—</span></p>
              <div className="actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setEditOpen((v) => !v)}
                  aria-expanded={editOpen}
                  aria-controls="edit-profile-form"
                >
                  Edit profile
                </button>
              </div>
            </div>
          </div>
          {editOpen && (
            <div id="edit-profile-form" className="profile-edit-form" role="region" aria-label="Edit profile form">
              <p className="muted">Edit profile form (placeholder). Display name and course/section can be wired to backend later.</p>
              <div className="actions">
                <button type="button" className="btn primary" onClick={() => setEditOpen(false)}>Done</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Activity Snapshot */}
      <section className="tile" aria-labelledby="activity-snapshot">
        <h2 id="activity-snapshot" className="tile-title">Activity Snapshot</h2>
        <div className="tile-content">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : (
            <div className="grid stats-cards">
              <div className="card">
                <strong>Assignments posted</strong>
                <p className="stat-value">{summary?.assignments_posted ?? 0}</p>
              </div>
              <div className="card">
                <strong>Reviews given</strong>
                <p className="stat-value">{summary?.reviews_given ?? 0}</p>
              </div>
              <div className="card">
                <strong>Avg rating</strong>
                <p className="stat-value">{summary?.average_rating_received != null ? Number(summary.average_rating_received).toFixed(1) : '—'}</p>
              </div>
              {isInstructor && summary?.course_assignments != null && (
                <>
                  <div className="card">
                    <strong>Course assignments</strong>
                    <p className="stat-value">{summary.course_assignments}</p>
                  </div>
                  <div className="card">
                    <strong>Course reviews</strong>
                    <p className="stat-value">{summary.course_reviews ?? '—'}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Instructor-only: Professional Bio + Office Hours, Courses Taught, Notification Routing */}
      {isInstructor && (
        <>
          <section className="tile" aria-labelledby="instructor-bio">
            <h2 id="instructor-bio" className="tile-title">Professional Bio &amp; Office Hours</h2>
            <div className="tile-content">
              <p className="muted">Office location, calendar link, and bio (placeholder for future backend).</p>
            </div>
          </section>
          <section className="tile" aria-labelledby="courses-taught">
            <h2 id="courses-taught" className="tile-title">Courses Taught</h2>
            <div className="tile-content">
              <p className="muted">Cards linking to each active course (placeholder).</p>
            </div>
          </section>
          <section className="tile" aria-labelledby="notification-routing">
            <h2 id="notification-routing" className="tile-title">Notification Routing</h2>
            <div className="tile-content">
              <p className="muted">Choose channels for assignment events and review escalations (placeholder).</p>
            </div>
          </section>
        </>
      )}

      {/* Security Callout */}
      <section className="tile security-callout" aria-labelledby="security-callout">
        <h2 id="security-callout" className="tile-title">Security</h2>
        <div className="tile-content">
          <p><Link to="/reset-password">Reset password</Link> (or use your school&apos;s password reset if you sign in with SSO).</p>
          <p className="muted">If your school uses single sign-on (SSO), follow your institution&apos;s login and password reset process.</p>
        </div>
      </section>
    </>
  )
}
