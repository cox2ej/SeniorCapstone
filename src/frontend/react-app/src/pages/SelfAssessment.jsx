import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SelfAssessment() {
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
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

      <form onSubmit={onSubmit} noValidate aria-labelledby="sa-title">
        <label htmlFor="sa-assignment">Assignment</label>
        <select id="sa-assignment" name="assignment" required defaultValue="">
          <option value="" disabled>Select an assignment</option>
          <option>Assignment A</option>
          <option>Assignment B</option>
          <option>Assignment C</option>
        </select>

        <label htmlFor="sa-rating">Rating (1-5)</label>
        <input id="sa-rating" name="rating" type="number" min="1" max="5" step="1" required aria-describedby="saRatingHelp" />
        <small id="saRatingHelp" className="sr-only">Enter a whole number from 1 to 5.</small>

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
