import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  return (
    <>
      <h1>Student Dashboard</h1>
      <p>Quick actions and recent items.</p>
      <div className="tiles featured">
        <Link className="tile primary tile-lg" to="/give-feedback" aria-labelledby="tile-give-feedback">
          <h2 id="tile-give-feedback" className="tile-title">Give Feedback</h2>
          <div className="tile-subtitle">Start a new feedback submission</div>
          <div className="tile-content">
            <ul>
              <li>Next due: Peer Review 2</li>
              <li>Drafts: 1</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/my-feedback" aria-labelledby="tile-my-feedback">
          <h2 id="tile-my-feedback" className="tile-title">My Feedback</h2>
          <div className="tile-subtitle">See feedback you've received</div>
          <div className="tile-content">
            <ul>
              <li>New: 3 items</li>
              <li>Unread: 1</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/self-assessment" aria-labelledby="tile-self-assessment">
          <h2 id="tile-self-assessment" className="tile-title">Self-Assessment</h2>
          <div className="tile-subtitle">Reflect on your performance</div>
          <div className="tile-content">
            <ul>
              <li>Current period: Week 8</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/feedback-history" aria-labelledby="tile-feedback-history">
          <h2 id="tile-feedback-history" className="tile-title">Feedback History</h2>
          <div className="tile-subtitle">Review past submissions</div>
          <div className="tile-content">
            <ul>
              <li>Submissions: 12</li>
            </ul>
          </div>
        </Link>
      </div>
      <section className="due-soon" aria-labelledby="due-heading">
        <h2 id="due-heading">Due soon</h2>
        <ul className="due-list">
          <li><Link to="/give-feedback">Peer Review 2</Link> — due in 2 days</li>
          <li><Link to="/self-assessment">Self-Assessment</Link> — due next week</li>
        </ul>
      </section>
    </>
  )
}
