import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'

export default function GiveFeedback() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const paramsIn = new URLSearchParams(search)
  const assignmentId = paramsIn.get('assignmentId') || ''
  const { getAssignmentById, addReview, users, currentUser, getAssignmentsForReview } = useMockStore()
  const assignment = assignmentId ? getAssignmentById(assignmentId) : null
  const reviewQueue = assignment ? [] : getAssignmentsForReview(currentUser)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)

  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const rating = data.get('rating') || ''
    const comments = data.get('comments') || ''
    const errs = []
    const n = parseInt(String(rating), 10)
    if (!rating) errs.push({ field: 'rating', message: 'Enter a rating from 1 to 5' })
    else if (isNaN(n) || n < 1 || n > 5) errs.push({ field: 'rating', message: 'Rating must be a whole number from 1 to 5' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    if (assignmentId && assignment) {
      addReview({ assignmentId, rating: n, comments })
      const out = new URLSearchParams({ assignmentId, rating: String(n), comments })
      navigate(`/feedback-confirmation?${out.toString()}`)
      return
    }
    const peer = data.get('peer') || ''
    if (!peer) {
      setErrors([{ field: 'peer', message: 'Select a peer' }])
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    const out = new URLSearchParams({ peer, rating, comments })
    navigate(`/feedback-confirmation?${out.toString()}`)
  }

  function handleSaveDraft() {
    setMessage('Draft saved (mock).')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <>
      <h1 id="give-feedback-title">Give Feedback</h1>
      <section className="tile" aria-labelledby="rubric-heading">
        <h2 id="rubric-heading" className="tile-title">Rubric & Attachments</h2>
        <div className="tile-content">
          <h3>Rubric (placeholder)</h3>
          <ul>
            <li><strong>Clarity &amp; Organization</strong>: 1–5 — Is the feedback easy to follow and well structured?</li>
            <li><strong>Constructiveness</strong>: 1–5 — Does it include actionable suggestions?</li>
            <li><strong>Specificity</strong>: 1–5 — Does it reference concrete examples?</li>
            <li><strong>Professionalism</strong>: 1–5 — Is the tone respectful and objective?</li>
          </ul>
          <h3>Attachments (placeholder)</h3>
          <ul>
            <li><a href="#" aria-label="Download assignment brief (mock)">Assignment brief (PDF)</a></li>
            <li><a href="#" aria-label="Download rubric (mock)">Rubric (PDF)</a></li>
            <li><a href="#" aria-label="Download starter files (mock)">Starter files (ZIP)</a></li>
          </ul>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="error-summary" role="alert" aria-labelledby="gf-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
          <h2 id="gf-error-summary-title">There is a problem</h2>
          <ul>
            {errors.map(e => (
              <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
            ))}
          </ul>
        </div>
      )}

      {!assignment && (
        <section className="tile" aria-labelledby="gf-queue-title">
          <h2 id="gf-queue-title" className="tile-title">Assignments to review</h2>
          <div className="tile-content">
            {reviewQueue.length === 0 ? (
              <p>No assignments to review.</p>
            ) : (
              <ul>
                {reviewQueue.map(a => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>
                    {a.description ? <div className="muted">{a.description}</div> : null}
                    <div className="actions" style={{ marginTop: 8 }}>
                      <Link className="btn primary" to={`/give-feedback?assignmentId=${a.id}`}>Review</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <form onSubmit={onSubmit} noValidate aria-labelledby="give-feedback-title">
        {assignment ? (
          <>
            <p id="assignment-context"><strong>Reviewing:</strong> {assignment.title} <span className="muted">(Owner: {users[assignment.owner]?.name || assignment.owner})</span></p>
            {assignment.description ? (
              <p>{assignment.description}</p>
            ) : (
              <p className="muted">No description provided.</p>
            )}
          </>
        ) : (
          <>
            <label htmlFor="peer">Peer</label>
            <select
              id="peer"
              name="peer"
              required
              defaultValue=""
              aria-invalid={errors.some(e => e.field === 'peer') ? 'true' : 'false'}
              aria-describedby={errors.some(e => e.field === 'peer') ? 'peer-error' : undefined}
              className={errors.some(e => e.field === 'peer') ? 'input-error' : undefined}
            >
              <option value="" disabled>Select a peer</option>
              <option>Peer A</option>
              <option>Peer B</option>
              <option>Peer C</option>
            </select>
            {errors.some(e => e.field === 'peer') && (
              <p id="peer-error" className="help-error">{errors.find(e => e.field === 'peer')?.message}</p>
            )}
          </>
        )}

        <label htmlFor="rating">Rating (1-5)</label>
        <input
          id="rating"
          name="rating"
          type="number" min="1" max="5" step="1"
          required
          aria-describedby={`ratingHelp${errors.some(e => e.field === 'rating') ? ' rating-error' : ''}`}
          aria-invalid={errors.some(e => e.field === 'rating') ? 'true' : 'false'}
          className={errors.some(e => e.field === 'rating') ? 'input-error' : undefined}
        />
        <small id="ratingHelp" className="sr-only">Enter a whole number from 1 to 5.</small>
        {errors.some(e => e.field === 'rating') && (
          <p id="rating-error" className="help-error">{errors.find(e => e.field === 'rating')?.message}</p>
        )}

        <label htmlFor="comments">Comments</label>
        <textarea id="comments" name="comments" rows={6} placeholder="Write constructive, specific, and actionable feedback" aria-describedby="commentsHelp" />
        <small id="commentsHelp" className="sr-only">Provide constructive, specific, and actionable feedback.</small>

        <div className="actions">
          <button className="primary" type="submit" aria-label="Submit feedback (mock)">Submit</button>
          <button type="button" className="btn" onClick={handleSaveDraft} aria-label="Save draft (mock)">Save draft</button>
          <Link to="/feedback-guidelines" className="btn" aria-label="View feedback guidelines">Guidelines</Link>
          <Link to="/student-dashboard" className="btn" aria-label="Cancel and return to dashboard">Cancel</Link>
        </div>
      </form>
      <div id="gf-messages" className="sr-only" aria-live="polite">{message}</div>
    </>
  )
}
