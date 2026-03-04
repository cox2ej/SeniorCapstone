import { useState } from 'react'

const MOCK_METRICS = {
  totalAssignments: 12,
  reviewsCompleted: 89,
  avgRating: 4.2,
  overdueReviews: 3,
}

export default function AdminAnalytics() {
  const [courseFilter, setCourseFilter] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [assignmentFilter, setAssignmentFilter] = useState('')
  const [dataLoaded] = useState(true) // placeholder: set false to show disabled export buttons

  return (
    <>
      <h1>Admin Analytics</h1>

      {/* Filters */}
      <section className="tile" aria-labelledby="analytics-filters">
        <h2 id="analytics-filters" className="tile-title">Filters</h2>
        <div className="tile-content">
          <div className="analytics-filters-inner">
            <label htmlFor="analytics-course">Course</label>
            <select
              id="analytics-course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All courses</option>
              <option value="c1">CS 101</option>
              <option value="c2">CS 201</option>
            </select>
            <label htmlFor="analytics-daterange">Date range</label>
            <select
              id="analytics-daterange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="term">Current term</option>
            </select>
            <label htmlFor="analytics-assignment">Assignment</label>
            <select
              id="analytics-assignment"
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
            >
              <option value="">All assignments</option>
            </select>
          </div>
        </div>
      </section>

      {/* Metric Cards */}
      <section className="tile" aria-labelledby="analytics-metrics">
        <h2 id="analytics-metrics" className="tile-title">Course-wide KPIs</h2>
        <div className="tile-content">
          <div className="grid stats-cards">
            <div className="card">
              <strong>Total assignments posted</strong>
              <p className="stat-value">{MOCK_METRICS.totalAssignments}</p>
            </div>
            <div className="card">
              <strong>Reviews completed</strong>
              <p className="stat-value">{MOCK_METRICS.reviewsCompleted}</p>
            </div>
            <div className="card">
              <strong>Average rating</strong>
              <p className="stat-value">{MOCK_METRICS.avgRating}</p>
            </div>
            <div className="card">
              <strong>Overdue reviews</strong>
              <p className="stat-value">{MOCK_METRICS.overdueReviews}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Charts (placeholders) */}
      <section className="tile" aria-labelledby="analytics-charts">
        <h2 id="analytics-charts" className="tile-title">Charts</h2>
        <div className="tile-content">
          <div className="chart-placeholder">
            <p><strong>Review submissions over time</strong> (line chart placeholder)</p>
            <div className="chart-box" aria-hidden="true" />
          </div>
          <div className="chart-placeholder" style={{ marginTop: 24 }}>
            <p><strong>Rating distribution per assignment</strong> (bar chart placeholder)</p>
            <div className="chart-box" aria-hidden="true" />
          </div>
          <div className="chart-placeholder" style={{ marginTop: 24 }}>
            <p><strong>Reviewer workload</strong> (heatmap placeholder)</p>
            <div className="chart-box chart-box-wide" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Download & Share */}
      <section className="tile" aria-labelledby="analytics-export">
        <h2 id="analytics-export" className="tile-title">Download &amp; share</h2>
        <div className="tile-content">
          <div className="actions">
            <button type="button" className="btn" disabled={!dataLoaded} title={!dataLoaded ? 'Load data first' : ''}>
              Export CSV
            </button>
            <button type="button" className="btn" disabled={!dataLoaded} title={!dataLoaded ? 'Load data first' : ''}>
              Export PDF
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
