import { Link } from 'react-router-dom'

export default function InstructorDashboard() {
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
              <li>Templates available: 4</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/manage-courses-groups" aria-labelledby="tile-manage-courses">
          <h2 id="tile-manage-courses" className="tile-title">Manage Courses</h2>
          <div className="tile-subtitle">Courses and groups</div>
          <div className="tile-content">
            <ul>
              <li>Active courses: 3</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/aggregated-reports" aria-labelledby="tile-agg-reports">
          <h2 id="tile-agg-reports" className="tile-title">Aggregated Reports</h2>
          <div className="tile-subtitle">Class performance</div>
          <div className="tile-content">
            <ul>
              <li>New reports: 2</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/reports-export" aria-labelledby="tile-export">
          <h2 id="tile-export" className="tile-title">Reports Export</h2>
          <div className="tile-subtitle">Download data</div>
          <div className="tile-content">
            <ul>
              <li>Queued exports: 0</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/peer-matching" aria-labelledby="tile-peer-match">
          <h2 id="tile-peer-match" className="tile-title">Peer Matching</h2>
          <div className="tile-subtitle">Configure pairing</div>
          <div className="tile-content">
            <ul>
              <li>Pending: 1</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-md" to="/admin-analytics" aria-labelledby="tile-analytics">
          <h2 id="tile-analytics" className="tile-title">Analytics</h2>
          <div className="tile-subtitle">Trends and insights</div>
          <div className="tile-content">
            <ul>
              <li>New charts: 1</li>
            </ul>
          </div>
        </Link>
      </div>
    </>
  )
}
