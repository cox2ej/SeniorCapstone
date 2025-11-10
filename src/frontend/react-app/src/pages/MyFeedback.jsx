import { Link } from 'react-router-dom'

export default function MyFeedback() {
  return (
    <>
      <h1>My Feedback</h1>
      <div className="tiles">
        <Link className="tile" to="/feedback-history?assignment=A" aria-labelledby="mf-a-title">
          <h2 id="mf-a-title" className="tile-title">Assignment A</h2>
          <div className="tile-subtitle">Updated today • New: 2 • Unread: 1</div>
          <div className="tile-content">
            <ul>
              <li>Average rating: 4.2</li>
              <li>Latest: "Helpful code review on edge cases"</li>
            </ul>
          </div>
        </Link>
        <Link className="tile" to="/feedback-history?assignment=B" aria-labelledby="mf-b-title">
          <h2 id="mf-b-title" className="tile-title">Assignment B</h2>
          <div className="tile-subtitle">Updated 2 days ago • Unread: 0</div>
          <div className="tile-content">
            <ul>
              <li>Average rating: 3.8</li>
              <li>Latest: "Consider simplifying the intro section"</li>
            </ul>
          </div>
        </Link>
        <Link className="tile" to="/feedback-history?assignment=C" aria-labelledby="mf-c-title">
          <h2 id="mf-c-title" className="tile-title">Assignment C</h2>
          <div className="tile-subtitle">Updated yesterday • New: 1</div>
          <div className="tile-content">
            <ul>
              <li>Average rating: 4.7</li>
              <li>Latest: "Great clarity, add tests for error paths"</li>
            </ul>
          </div>
        </Link>
        <Link className="tile" to="/feedback-history?assignment=D" aria-labelledby="mf-d-title">
          <h2 id="mf-d-title" className="tile-title">Assignment D</h2>
          <div className="tile-subtitle">Updated last week</div>
          <div className="tile-content">
            <ul>
              <li>Average rating: 4.0</li>
              <li>Latest: "Nice refactor, watch variable naming"</li>
            </ul>
          </div>
        </Link>
      </div>
      <div className="actions">
        <Link to="/give-feedback" className="btn" aria-label="Give feedback to a peer">Give Feedback</Link>
        <Link to="/feedback-history" className="btn" aria-label="View full feedback history">View History</Link>
      </div>
    </>
  )
}
