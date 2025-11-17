import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'

export default function SelfAssessment() {
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)
  const navigate = useNavigate()
  const { currentUser, getAssignmentsByOwner, addSelfAssessment } = useMockStore()
  const myAssignments = getAssignmentsByOwner(currentUser)

  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const assignment = data.get('assignment') || ''
    const rating = data.get('rating') || ''
    const comments = data.get('comments') || ''
    const errs = []
    if (!assignment) errs.push({ field: 'sa-assignment', message: 'Select an assignment' })
    const n = parseInt(String(rating), 10)
    if (!rating) errs.push({ field: 'sa-rating', message: 'Enter a rating from 1 to 5' })
    else if (isNaN(n) || n < 1 || n > 5) errs.push({ field: 'sa-rating', message: 'Rating must be a whole number from 1 to 5' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    addSelfAssessment({ assignmentId: assignment, rating: n, comments })
    navigate('/student-dashboard')
  }

  function handleSaveDraft() {
    setMessage('Draft saved (mock).')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <>
      <h1 id="sa-title">Self-Assessment</h1>

      <section className="tile" aria-labelledby="sa-rubric-heading">
        <h2 id="sa-rubric-heading" className="tile-title">Rubric & Attachments</h2>
        <div className="tile-content">
          <h3>Rubric (placeholder)</h3>
          <ul>
            <li><strong>Clarity &amp; Organization</strong>: 1–5 — Is your reflection easy to follow and well structured?</li>
            <li><strong>Specificity</strong>: 1–5 — Do you reference concrete examples?</li>
            <li><strong>Actionability</strong>: 1–5 — Do you include next steps?</li>
            <li><strong>Professionalism</strong>: 1–5 — Is the tone respectful and objective?</li>
          </ul>
          <h3>Attachments (placeholder)</h3>
          <ul>
            <li><a href="#" aria-label="Download assignment brief (mock)">Assignment brief (PDF)</a></li>
            <li><a href="#" aria-label="Download rubric (mock)">Rubric (PDF)</a></li>
          </ul>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="error-summary" role="alert" aria-labelledby="sa-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
          <h2 id="sa-error-summary-title">There is a problem</h2>
          <ul>
            {errors.map(e => (
              <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate aria-labelledby="sa-title">
        <label htmlFor="sa-assignment">Assignment</label>
        <select
          id="sa-assignment"
          name="assignment"
          required
          defaultValue=""
          aria-invalid={errors.some(e => e.field === 'sa-assignment') ? 'true' : 'false'}
          aria-describedby={errors.some(e => e.field === 'sa-assignment') ? 'sa-assignment-error' : undefined}
          className={errors.some(e => e.field === 'sa-assignment') ? 'input-error' : undefined}
        >
          <option value="" disabled>Select an assignment</option>
          {myAssignments.map(a => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
        {myAssignments.length === 0 && (
          <p className="muted">No assignments found. You can post one from My Feedback.</p>
        )}
        {errors.some(e => e.field === 'sa-assignment') && (
          <p id="sa-assignment-error" className="help-error">{errors.find(e => e.field === 'sa-assignment')?.message}</p>
        )}

        <label htmlFor="sa-rating">Rating (1-5)</label>
        <input
          id="sa-rating"
          name="rating"
          type="number" min="1" max="5" step="1"
          required
          aria-describedby={`saRatingHelp${errors.some(e => e.field === 'sa-rating') ? ' sa-rating-error' : ''}`}
          aria-invalid={errors.some(e => e.field === 'sa-rating') ? 'true' : 'false'}
          className={errors.some(e => e.field === 'sa-rating') ? 'input-error' : undefined}
        />
        <small id="saRatingHelp" className="sr-only">Enter a whole number from 1 to 5.</small>
        {errors.some(e => e.field === 'sa-rating') && (
          <p id="sa-rating-error" className="help-error">{errors.find(e => e.field === 'sa-rating')?.message}</p>
        )}

        <label htmlFor="sa-comments">Comments</label>
        <textarea id="sa-comments" name="comments" rows={6} placeholder="Write a concise reflection: what went well, what to improve, and next steps" aria-describedby="saCommentsHelp" />
        <small id="saCommentsHelp" className="sr-only">Provide specific examples and concrete next steps.</small>

        <div className="actions">
          <button className="btn primary" type="submit" aria-label="Submit self-assessment (mock)">Submit</button>
          <button type="button" className="btn" onClick={handleSaveDraft} aria-label="Save draft (mock)">Save draft</button>
          <Link to="/feedback-guidelines" className="btn" aria-label="View feedback guidelines">Guidelines</Link>
          <Link to="/student-dashboard" className="btn" aria-label="Cancel and return to dashboard">Cancel</Link>
        </div>
      </form>
      <div id="sa-messages" className="sr-only" aria-live="polite">{message}</div>
    </>
  )
}
