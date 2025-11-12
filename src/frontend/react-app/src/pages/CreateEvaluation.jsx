import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CreateEvaluation() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)
  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.title?.value || '').trim()
    const due = (form.due?.value || '').trim()
    const errs = []
    if (!title) errs.push({ field: 'ce-title', message: 'Enter a title' })
    if (!due) errs.push({ field: 'ce-due', message: 'Enter a due date' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    navigate('/instructor-dashboard')
  }
  return (
    <>
      <h1>Create Evaluation / Assignment</h1>
      <section className="tile" aria-labelledby="create-eval">
        <h2 id="create-eval" className="tile-title">New Evaluation</h2>
        <div className="tile-content">
          {errors.length > 0 && (
            <div className="error-summary" role="alert" aria-labelledby="ce-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
              <h2 id="ce-error-summary-title">There is a problem</h2>
              <ul>
                {errors.map(e => (
                  <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="ce-title">Title</label>
            <input
              id="ce-title"
              name="title"
              required
              aria-invalid={errors.some(e => e.field === 'ce-title') ? 'true' : 'false'}
              aria-describedby={errors.some(e => e.field === 'ce-title') ? 'ce-title-error' : undefined}
              className={errors.some(e => e.field === 'ce-title') ? 'input-error' : undefined}
            />
            {errors.some(e => e.field === 'ce-title') && (
              <p id="ce-title-error" className="help-error">{errors.find(e => e.field === 'ce-title')?.message}</p>
            )}

            <label htmlFor="ce-due">Due Date</label>
            <input
              id="ce-due"
              name="due"
              type="date"
              required
              aria-invalid={errors.some(e => e.field === 'ce-due') ? 'true' : 'false'}
              aria-describedby={errors.some(e => e.field === 'ce-due') ? 'ce-due-error' : undefined}
              className={errors.some(e => e.field === 'ce-due') ? 'input-error' : undefined}
            />
            {errors.some(e => e.field === 'ce-due') && (
              <p id="ce-due-error" className="help-error">{errors.find(e => e.field === 'ce-due')?.message}</p>
            )}

            <label htmlFor="ce-criteria">Criteria</label>
            <textarea id="ce-criteria" name="criteria" rows={4} placeholder="e.g., Collaboration, Communication, Quality" />

            <div className="actions">
              <button className="primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
