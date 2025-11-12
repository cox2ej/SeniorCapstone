import { Link, useLocation } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.js'

export default function FeedbackConfirmation() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const peer = params.get('peer') || 'Selected peer'
  const rating = params.get('rating') || 'N/A'
  const comments = params.get('comments') || '(No comments provided)'
  const assignmentId = params.get('assignmentId') || ''
  const { getAssignmentById, users } = useMockStore()
  const assignment = assignmentId ? getAssignmentById(assignmentId) : null

  return (
    <>
      <h1>Feedback Submitted</h1>
      <section className="tile" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="tile-title">Submission summary</h2>
        <div className="tile-content">
          <ul>
            {assignment ? (
              <>
                <li><strong>Assignment:</strong> <span>{assignment.title}</span></li>
                <li><strong>Owner:</strong> <span>{users[assignment.owner]?.name || assignment.owner}</span></li>
                <li><strong>Rating:</strong> <span>{rating}</span></li>
                <li><strong>Comments:</strong> <span>{comments}</span></li>
              </>
            ) : (
              <>
                <li><strong>Peer:</strong> <span>{peer}</span></li>
                <li><strong>Rating:</strong> <span>{rating}</span></li>
                <li><strong>Comments:</strong> <span>{comments}</span></li>
              </>
            )}
          </ul>
        </div>
      </section>
      <p>Your feedback has been submitted (prototype confirmation).</p>
      <div className="actions">
        <Link to="/give-feedback" className="btn primary" aria-label="Give more feedback">Give more feedback</Link>
        <Link to="/student-dashboard" className="btn" aria-label="Return to dashboard">Back to Dashboard</Link>
      </div>
      <div id="cf-messages" className="sr-only" aria-live="polite"></div>
    </>
  )
}
