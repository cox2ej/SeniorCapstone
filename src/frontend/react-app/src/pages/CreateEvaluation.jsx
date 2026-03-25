import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

const parseRubricCriteria = (text) => {
  const lines = String(text || '')
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
  return lines.map((label, index) => ({
    id: slugify(label) || `criterion_${index + 1}`,
    label,
    required: true,
    min_score: 1,
    max_score: 5,
  }))
}

export default function CreateEvaluation() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const errorSummaryRef = useRef(null)

  const { createAssignment } = useAssignmentsData()
  const { courses, loading: coursesLoading, error: coursesError } = useCoursesGroupsData()

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const course = (form.course?.value || '').trim()
    const title = (form.title?.value || '').trim()
    const description = (form.description?.value || '').trim()
    const due = (form.due?.value || '').trim()
    const criteria = (form.criteria?.value || '').trim()
    const errs = []
    if (!course) errs.push({ field: 'ce-course', message: 'Select a course' })
    if (!title) errs.push({ field: 'ce-title', message: 'Enter a title' })
    if (!due) errs.push({ field: 'ce-due', message: 'Enter a due date' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const rubricCriteria = parseRubricCriteria(criteria)
      await createAssignment({
        course: Number(course),
        title,
        description,
        due_date: `${due}T23:59:00Z`,
        rubric: rubricCriteria.length ? { criteria: rubricCriteria } : {},
      })
      navigate('/instructor-dashboard')
    } catch (err) {
      setSubmitError(err)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>Create Evaluation / Assignment</h1>
      <section className="tile" aria-labelledby="create-eval">
        <h2 id="create-eval" className="tile-title">New Evaluation</h2>
        <div className="tile-content">
          {coursesError && <p className="error-text" role="alert">Unable to load courses: {coursesError.message}</p>}
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
          {submitError && (
            <p className="error-text" role="alert">Unable to create evaluation: {submitError.message}</p>
          )}

          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="ce-course">Course</label>
            <select
              id="ce-course"
              name="course"
              required
              aria-invalid={errors.some(e => e.field === 'ce-course') ? 'true' : 'false'}
              aria-describedby={errors.some(e => e.field === 'ce-course') ? 'ce-course-error' : undefined}
              className={errors.some(e => e.field === 'ce-course') ? 'input-error' : undefined}
            >
              <option value="">{coursesLoading ? 'Loading courses…' : 'Select a course'}</option>
              {courses.map((courseOption) => (
                <option key={courseOption.id} value={courseOption.id}>
                  {courseOption.code} — {courseOption.title}
                </option>
              ))}
            </select>
            {errors.some(e => e.field === 'ce-course') && (
              <p id="ce-course-error" className="help-error">{errors.find(e => e.field === 'ce-course')?.message}</p>
            )}

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

            <label htmlFor="ce-description">Description</label>
            <textarea id="ce-description" name="description" rows={4} placeholder="Evaluation instructions and context" />

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
            <textarea id="ce-criteria" name="criteria" rows={4} placeholder="Enter rubric criteria (comma or line separated)" />

            <div className="actions">
              <button className="primary" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
