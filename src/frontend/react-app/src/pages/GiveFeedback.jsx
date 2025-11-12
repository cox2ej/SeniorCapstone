import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function GiveFeedback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)

  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const peer = data.get('peer') || ''
    const rating = data.get('rating') || ''
    const comments = data.get('comments') || ''
    const errs = []
    if (!peer) errs.push({ field: 'peer', message: 'Select a peer' })
    const n = parseInt(String(rating), 10)
    if (!rating) errs.push({ field: 'rating', message: 'Enter a rating from 1 to 5' })
    else if (isNaN(n) || n < 1 || n > 5) errs.push({ field: 'rating', message: 'Rating must be a whole number from 1 to 5' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    const params = new URLSearchParams({ peer, rating, comments })
    navigate(`/feedback-confirmation?${params.toString()}`)
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

      <form onSubmit={onSubmit} noValidate aria-labelledby="give-feedback-title">
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
