import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useMockStore } from '../store/mockStore.js'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'

const formatAverage = (value) => {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toFixed(1)
}

export default function StudentDashboard() {
  const { currentUser, addAssignment, getAssignmentsByOwner, getAssignmentsForReview } = useMockStore()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const myAssignments = getAssignmentsByOwner(currentUser)
  const reviewQueue = getAssignmentsForReview(currentUser)
  const { summary, loading: summaryLoading, error: summaryError, refresh } = useDashboardSummary()

  const summaryStats = useMemo(() => ({
    pendingReviews: summary?.pending_reviews ?? 0,
    reviewsGiven: summary?.reviews_given ?? 0,
    reviewsReceived: summary?.reviews_received ?? 0,
    assignmentsPosted: summary?.assignments_posted ?? 0,
    avgGiven: summary?.average_rating_given,
    avgReceived: summary?.average_rating_received,
  }), [summary])

  function onPost(e) {
    e.preventDefault()
    if (!title.trim()) return
    addAssignment({ title: title.trim(), description: desc.trim() })
    setTitle('')
    setDesc('')
  }

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
              <li>{summaryLoading ? 'Loading pending reviews…' : `Pending reviews: ${summaryStats.pendingReviews}`}</li>
              <li>{summaryLoading ? 'Loading reviews…' : `Reviews given: ${summaryStats.reviewsGiven}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/my-feedback" aria-labelledby="tile-my-feedback">
          <h2 id="tile-my-feedback" className="tile-title">My Feedback</h2>
          <div className="tile-subtitle">See feedback you've received</div>
          <div className="tile-content">
            <ul>
              <li>{summaryLoading ? 'Loading…' : `Received: ${summaryStats.reviewsReceived}`}</li>
              <li>{summaryLoading ? '' : `Avg rating: ${formatAverage(summaryStats.avgReceived)}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/self-assessment" aria-labelledby="tile-self-assessment">
          <h2 id="tile-self-assessment" className="tile-title">Self-Assessment</h2>
          <div className="tile-subtitle">Reflect on your performance</div>
          <div className="tile-content">
            <ul>
              <li>{summaryLoading ? 'Loading…' : `Assignments posted: ${summaryStats.assignmentsPosted}`}</li>
            </ul>
          </div>
        </Link>
        <Link className="tile tile-lg" to="/feedback-history" aria-labelledby="tile-feedback-history">
          <h2 id="tile-feedback-history" className="tile-title">Feedback History</h2>
          <div className="tile-subtitle">Review past submissions</div>
          <div className="tile-content">
            <ul>
              <li>{summaryLoading ? 'Loading submissions…' : `Reviews given: ${summaryStats.reviewsGiven}`}</li>
            </ul>
          </div>
        </Link>
      </div>
      {summaryError && (
        <p role="alert" className="error-text">Unable to load dashboard summary. <button type="button" className="link" onClick={refresh}>Try again</button></p>
      )}

      <section className="due-soon" aria-labelledby="due-heading">
        <h2 id="due-heading">Due soon</h2>
        <ul className="due-list">
          <li><Link to="/give-feedback">Peer Review 2</Link> — due in 2 days</li>
          <li><Link to="/self-assessment">Self-Assessment</Link> — due next week</li>
        </ul>
      </section>

      <section className="tile" aria-labelledby="post-assignment-title">
        <h2 id="post-assignment-title" className="tile-title">Post an assignment for review (demo)</h2>
        <div className="tile-content">
          <form onSubmit={onPost} noValidate>
            <label htmlFor="assn-title">Title</label>
            <input id="assn-title" name="assnTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label htmlFor="assn-desc">Description (optional)</label>
            <textarea id="assn-desc" name="assnDesc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="actions">
              <button className="primary" type="submit">Post</button>
            </div>
          </form>
        </div>
      </section>

      <section className="tile" aria-labelledby="your-assn-title">
        <h2 id="your-assn-title" className="tile-title">Your posted assignments</h2>
        <div className="tile-content">
          {myAssignments.length === 0 ? (
            <p>No assignments posted yet.</p>
          ) : (
            <ul>
              {myAssignments.map(a => (
                <li key={a.id}><strong>{a.title}</strong></li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="queue-title">
        <h2 id="queue-title" className="tile-title">Assignments to review</h2>
        <div className="tile-content">
          {reviewQueue.length === 0 ? (
            <p>No assignments to review.</p>
          ) : (
            <ul>
              {reviewQueue.map(a => (
                <li key={a.id}>
                  <strong>{a.title}</strong>
                  <div className="actions" style={{ marginTop: 8 }}>
                    <Link className="btn primary" to={`/give-feedback?assignmentId=${a.id}`}>Review</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
