import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { useDashboardSummary } from '../hooks/useDashboardSummary.js'

const formatAverage = (value) => {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toFixed(1)
}

export default function InstructorDashboard() {
  const { summary, loading, error, refresh } = useDashboardSummary()

  const stats = useMemo(() => ({
    courseAssignments: summary?.course_assignments ?? 0,
    courseReviews: summary?.course_reviews ?? 0,
    pendingCourse: summary?.pending_reviews_for_course ?? 0,
    avgCourse: summary?.average_rating_for_course,
    myAssignments: summary?.assignments_posted ?? 0,
    myReviewsGiven: summary?.reviews_given ?? 0,
  }), [summary])

  return (
    <>
      <h1>Instructor Dashboard</h1>
      <p>Manage evaluations, review progress, and access reports.</p>
      <div className="tiles featured instructor">
        <Link className="tile primary tile-md" to="/create-evaluation" aria-labelledby="tile-create-eval">
          <h2 id="tile-create-eval" className="tile-title">Create Evaluation</h2>
          <div className="tile-subtitle">Start a new assignment</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading…' : `Assignments posted: ${stats.myAssignments}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/manage-courses-groups" aria-labelledby="tile-manage-courses">
          <h2 id="tile-manage-courses" className="tile-title">Manage Courses</h2>
          <div className="tile-subtitle">Courses and groups</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading courses…' : `Assignments under you: ${stats.courseAssignments}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/aggregated-reports" aria-labelledby="tile-agg-reports">
          <h2 id="tile-agg-reports" className="tile-title">Aggregated Reports</h2>
          <div className="tile-subtitle">Class performance</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading stats…' : `Course reviews logged: ${stats.courseReviews}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/reports-export" aria-labelledby="tile-export">
          <h2 id="tile-export" className="tile-title">Reports Export</h2>
          <div className="tile-subtitle">Download data</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading…' : `Pending reviews: ${stats.pendingCourse}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/peer-matching" aria-labelledby="tile-peer-match">
          <h2 id="tile-peer-match" className="tile-title">Peer Matching</h2>
          <div className="tile-subtitle">Configure pairing</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading…' : `Reviews you gave: ${stats.myReviewsGiven}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/admin-analytics" aria-labelledby="tile-analytics">
          <h2 id="tile-analytics" className="tile-title">Analytics</h2>
          <div className="tile-subtitle">Trends and insights</div>
          <div className="tile-content">
            <ul>
              <li>{loading ? 'Loading averages…' : `Avg rating: ${formatAverage(stats.avgCourse)}`}</li>
            </ul>
          </div>
        </Link>
      </div>
      {error && (
        <p role="alert" className="error-text">
          Unable to load instructor summary. <button type="button" className="link" onClick={refresh}>Retry</button>
        </p>
      )}
    </>
  )
}
