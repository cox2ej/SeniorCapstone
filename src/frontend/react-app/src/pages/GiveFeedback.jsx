import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function GiveFeedback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const peer = data.get('peer') || ''
    const rating = data.get('rating') || ''
    const comments = data.get('comments') || ''
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

      <form onSubmit={onSubmit} noValidate aria-labelledby="give-feedback-title">
        <label htmlFor="peer">Peer</label>
        <select id="peer" name="peer" required defaultValue="">
          <option value="" disabled>Select a peer</option>
          <option>Peer A</option>
          <option>Peer B</option>
          <option>Peer C</option>
        </select>

        <label htmlFor="rating">Rating (1-5)</label>
        <input id="rating" name="rating" type="number" min="1" max="5" step="1" required aria-describedby="ratingHelp" />
        <small id="ratingHelp" className="sr-only">Enter a whole number from 1 to 5.</small>

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
