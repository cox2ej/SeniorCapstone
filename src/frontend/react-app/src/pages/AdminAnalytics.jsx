import { useMemo } from 'react'

import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'

const formatAverage = (value) => (value == null || Number.isNaN(value) ? '—' : Number(value).toFixed(2))

export default function AdminAnalytics() {
  const { summary, loading: summaryLoading, error: summaryError, refresh: refreshSummary } = useDashboardSummary()
  const {
    courses,
    enrollments,
    users,
    loading: dataLoading,
    error: dataError,
    refresh: refreshData,
  } = useCoursesGroupsData()
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignmentsData()

  const roleCounts = useMemo(() => {
    const counts = { student: 0, instructor: 0, admin: 0 }
    users.forEach((user) => {
      if (counts[user.role] !== undefined) counts[user.role] += 1
    })
    return counts
  }, [users])

  const loading = summaryLoading || dataLoading || assignmentsLoading
  const error = summaryError || dataError || assignmentsError

  return (
    <>
      <h1>Admin Analytics</h1>
      {error && (
        <p className="error-text" role="alert">
          Unable to load analytics: {error.message}
        </p>
      )}

      <section className="tile" aria-labelledby="analytics-overview">
        <h2 id="analytics-overview" className="tile-title">System Metrics</h2>
        <div className="tile-content">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="card" style={{ padding: 12 }}><div className="muted">Users</div><strong>{users.length}</strong></div>
            <div className="card" style={{ padding: 12 }}><div className="muted">Courses</div><strong>{courses.length}</strong></div>
            <div className="card" style={{ padding: 12 }}><div className="muted">Assignments</div><strong>{assignments.length}</strong></div>
            <div className="card" style={{ padding: 12 }}><div className="muted">Enrollments</div><strong>{enrollments.length}</strong></div>
          </div>
          {loading && <p style={{ marginTop: 12 }}>Loading metrics…</p>}
        </div>
      </section>

      <section className="tile" aria-labelledby="analytics-distribution">
        <h2 id="analytics-distribution" className="tile-title">User distribution</h2>
        <div className="tile-content">
          <ul>
            <li>Students: {roleCounts.student}</li>
            <li>Instructors: {roleCounts.instructor}</li>
            <li>Admins: {roleCounts.admin}</li>
          </ul>
        </div>
      </section>

      <section className="tile" aria-labelledby="analytics-feedback-health">
        <h2 id="analytics-feedback-health" className="tile-title">Feedback health</h2>
        <div className="tile-content">
          <ul>
            <li>Pending reviews for your courses: {summary.pending_reviews_for_course ?? 0}</li>
            <li>Average rating for your courses: {formatAverage(summary.average_rating_for_course)}</li>
            <li>Reviews given by you: {summary.reviews_given ?? 0}</li>
          </ul>
          <div className="actions">
            <button className="btn" type="button" onClick={() => { refreshSummary().catch(() => {}); refreshData().catch(() => {}) }}>Refresh metrics</button>
          </div>
        </div>
      </section>
    </>
  )
}
