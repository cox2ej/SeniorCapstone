import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGet } from '../api/client.js'
import RubricMatrix from '../components/RubricMatrix.jsx'
import { useMockStore } from '../store/mockStore.jsx'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useSelfAssessments } from '../hooks/useSelfAssessments.js'

export default function SelfAssessment() {
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [rubricDetail, setRubricDetail] = useState(null)
  const [rubricScores, setRubricScores] = useState({})
  const [rubricErrors, setRubricErrors] = useState({})
  const [rubricLoading, setRubricLoading] = useState(false)
  const [rubricError, setRubricError] = useState(null)
  const errorSummaryRef = useRef(null)
  const navigate = useNavigate()
  const { currentUser, getAssignmentsByOwner } = useMockStore()
  const { assignments, backendEnabled, loading: assignmentsLoading, error: assignmentsError } = useAssignmentsData({ query: 'role=mine' })
  const { submit: submitAssessment, backendEnabled: assessmentsBackendEnabled, loading: saLoading, error: saError } = useSelfAssessments()
  const usingBackend = backendEnabled && assessmentsBackendEnabled

  const myAssignments = useMemo(() => {
    if (usingBackend) return assignments
    return getAssignmentsByOwner(currentUser)
  }, [usingBackend, assignments, getAssignmentsByOwner, currentUser])

  const selectedAssignment = useMemo(
    () => myAssignments.find((assignment) => String(assignment.id) === String(selectedAssignmentId)) || null,
    [myAssignments, selectedAssignmentId],
  )

  const rubricCriteria = useMemo(() => {
    const fromDetail = rubricDetail?.criteria
    if (Array.isArray(fromDetail)) return fromDetail
    const fromAssignment = selectedAssignment?.rubric?.criteria
    if (Array.isArray(fromAssignment)) return fromAssignment
    return []
  }, [rubricDetail, selectedAssignment])

  useEffect(() => {
    if (!selectedAssignment) {
      setRubricDetail(null)
      setRubricLoading(false)
      setRubricError(null)
      return undefined
    }
    if (!usingBackend) {
      setRubricDetail(selectedAssignment.rubric || selectedAssignment.rubric_template_detail?.definition || null)
      setRubricLoading(false)
      setRubricError(null)
      return undefined
    }

    let cancelled = false
    setRubricLoading(true)
    setRubricError(null)
    async function fetchRubric() {
      try {
        const data = await apiGet(`/assignments/${selectedAssignment.id}/rubric/`)
        if (!cancelled) {
          const fallback = selectedAssignment.rubric || selectedAssignment.rubric_template_detail?.definition || null
          setRubricDetail(data?.rubric || fallback)
        }
      } catch (err) {
        if (!cancelled) setRubricError(err)
      } finally {
        if (!cancelled) setRubricLoading(false)
      }
    }

    fetchRubric()
    return () => {
      cancelled = true
    }
  }, [selectedAssignment, usingBackend])

  const handleRubricScoreChange = (criterionId, value) => {
    setRubricScores(prev => ({ ...prev, [criterionId]: value }))
    setRubricErrors(prev => {
      if (!prev[criterionId]) return prev
      const next = { ...prev }
      delete next[criterionId]
      return next
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const assignment = selectedAssignmentId || data.get('assignment') || ''
    const rating = data.get('rating') || ''
    const comments = data.get('comments') || ''
    const errs = []
    if (!assignment) errs.push({ field: 'sa-assignment', message: 'Select an assignment' })
    const n = parseInt(String(rating), 10)
    if (!rating) errs.push({ field: 'sa-rating', message: 'Enter a rating from 1 to 5' })
    else if (isNaN(n) || n < 1 || n > 5) errs.push({ field: 'sa-rating', message: 'Rating must be a whole number from 1 to 5' })

    const rubricIssues = {}
    rubricCriteria.forEach((criterion) => {
      const raw = rubricScores[criterion.id]
      const hasValue = raw !== undefined && raw !== null && raw !== ''
      const min = typeof criterion.min_score === 'number' ? criterion.min_score : 0
      const max = typeof criterion.max_score === 'number' ? criterion.max_score : 5
      if (!hasValue) {
        if (criterion.required) rubricIssues[criterion.id] = 'Score required.'
        return
      }
      const value = Number(raw)
      if (Number.isNaN(value)) {
        rubricIssues[criterion.id] = 'Enter a numeric score.'
        return
      }
      if (value < min || value > max) {
        rubricIssues[criterion.id] = `Score must be between ${min} and ${max}.`
      }
    })

    if (errs.length || Object.keys(rubricIssues).length) {
      const rubricErrorList = Object.entries(rubricIssues).map(([criterionId, rubricMessage]) => {
        const label = rubricCriteria.find(c => c.id === criterionId)?.label || 'Criterion'
        return { field: `rubric-${criterionId}`, message: `${label}: ${rubricMessage}` }
      })
      setRubricErrors(rubricIssues)
      setErrors([...errs, ...rubricErrorList])
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    setRubricErrors({})

    try {
      const rubricScorePayload = rubricCriteria.reduce((acc, criterion) => {
        const raw = rubricScores[criterion.id]
        if (raw === undefined || raw === null || raw === '') return acc
        acc[criterion.id] = Number(raw)
        return acc
      }, {})
      await submitAssessment({ assignmentId: assignment, rating: n, comments, rubricScores: rubricScorePayload })
      navigate('/student-dashboard')
    } catch (err) {
      setErrors([{ field: 'sa-rating', message: err.message || 'Unable to submit self-assessment.' }])
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
    }
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
          {!selectedAssignment ? (
            <p className="muted">Select an assignment to load its rubric.</p>
          ) : rubricLoading ? (
            <p className="muted">Loading rubric…</p>
          ) : rubricError ? (
            <p className="help-error" role="alert">Unable to load rubric: {rubricError.message || 'Unknown error.'}</p>
          ) : (
            <>
              <h3>Rubric</h3>
              <p className="muted">Choose a score row-by-row using the same rubric matrix used in peer review.</p>
              <RubricMatrix
                criteria={rubricCriteria}
                selectedScores={rubricScores}
                onScoreChange={handleRubricScoreChange}
                errors={rubricErrors}
                emptyLabel="This assignment does not define a rubric."
              />
              {Array.isArray(selectedAssignment.attachments) && selectedAssignment.attachments.length > 0 && (
                <>
                  <h3 style={{ marginTop: 16 }}>Attachments</h3>
                  <ul>
                    {selectedAssignment.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a href={attachment.file} target="_blank" rel="noreferrer">{attachment.original_name || 'Attachment'}</a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
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
          value={selectedAssignmentId}
          onChange={(event) => {
            setSelectedAssignmentId(event.target.value)
            setRubricScores({})
            setRubricErrors({})
          }}
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
        {assignmentsLoading && usingBackend && <p className="muted">Loading assignments…</p>}
        {assignmentsError && usingBackend && (
          <p className="help-error" role="alert">Unable to load assignments: {assignmentsError.message}</p>
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
          <button className="btn primary" type="submit" aria-label="Submit self-assessment">{saLoading && usingBackend ? 'Submitting…' : 'Submit'}</button>
          <button type="button" className="btn" onClick={handleSaveDraft} aria-label="Save draft (mock)">Save draft</button>
          <Link to="/feedback-guidelines" className="btn" aria-label="View feedback guidelines">Guidelines</Link>
          <Link to="/student-dashboard" className="btn" aria-label="Cancel and return to dashboard">Cancel</Link>
        </div>
      </form>
      {saError && usingBackend && (
        <p className="error-text" role="alert">{saError.message}</p>
      )}
      <div id="sa-messages" className="sr-only" aria-live="polite">{message}</div>
    </>
  )
}
