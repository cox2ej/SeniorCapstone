import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useReviewActions } from '../hooks/useReviewsData.js'
import { useReviewerMatches, useMatchActions, useAvailableAssignmentsForReview } from '../hooks/useReviewerMatches.js'
import { apiGet } from '../api/client.js'
import RubricMatrix from '../components/RubricMatrix.jsx'

export default function GiveFeedback() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const paramsIn = new URLSearchParams(search)
  const assignmentId = paramsIn.get('assignmentId') || ''
  const { getAssignmentById, addReview, users, currentUser, assignments, matches: mockMatches, generateMatches, addAssignmentFor } = useMockStore()
  const { assignments: backendAssignments, backendEnabled, loading: assignmentsLoading, error: assignmentsError } = useAssignmentsData()
  const { submitReview, backendEnabled: reviewsBackendEnabled, loading: submitting, error: submitError } = useReviewActions()
  const {
    matches: reviewerMatches,
    backendEnabled: matchesBackendEnabled,
    loading: matchesLoading,
    error: matchesError,
    refresh: refreshMatches,
  } = useReviewerMatches()
  const {
    assignments: availableAssignments,
    backendEnabled: availableBackendEnabled,
    loading: availableLoading,
    error: availableError,
    refresh: refreshAvailable,
  } = useAvailableAssignmentsForReview()
  const backendReviewEnabled = backendEnabled && reviewsBackendEnabled
  const backendMatchesEnabled = backendEnabled && matchesBackendEnabled
  const backendAvailableEnabled = backendEnabled && availableBackendEnabled
  const usingBackend = backendReviewEnabled
  const refreshQueues = useCallback(() => {
    refreshMatches()
    refreshAvailable()
  }, [refreshMatches, refreshAvailable])
  const {
    claimAssignment,
    loading: claimingMatch,
    error: claimError,
  } = useMatchActions({ onSuccess: refreshQueues })
  const reviewerMatchesMap = useMemo(() => {
    const map = {}
    reviewerMatches.forEach(match => {
      const id = match.assignment?.id
      if (id != null) {
        map[String(id)] = match
      }
    })
    return map
  }, [reviewerMatches])
  const availableAssignmentsMap = useMemo(() => {
    const map = {}
    availableAssignments.forEach(a => {
      if (a?.id != null) {
        map[String(a.id)] = a
      }
    })
    return map
  }, [availableAssignments])
  const assignment = useMemo(() => {
    if (!assignmentId) return null
    if (usingBackend) {
      return backendAssignments.find(a => String(a.id) === assignmentId)
        || reviewerMatchesMap[assignmentId]?.assignment
        || availableAssignmentsMap[assignmentId]
        || null
    }
    return getAssignmentById(assignmentId)
  }, [assignmentId, usingBackend, backendAssignments, reviewerMatchesMap, availableAssignmentsMap, getAssignmentById])
  const baseReviewQueue = useMemo(() => {
    if (assignment) return []
    if (usingBackend && backendMatchesEnabled) {
      return reviewerMatches
        .map(match => match.assignment)
        .filter(Boolean)
    }
    // Only show assignments that are explicitly matched to the current user (mock mode).
    return assignments.filter(a => mockMatches[a.id] === currentUser)
  }, [assignment, assignments, mockMatches, currentUser, usingBackend, backendMatchesEnabled, reviewerMatches])
  const availableList = useMemo(() => {
    if (!usingBackend) return []
    if (!backendAvailableEnabled) return []
    const assignedIds = new Set(
      reviewerMatches
        .map(m => m.assignment?.id)
        .filter(id => id != null)
        .map(id => String(id))
    )
    return availableAssignments.filter(a => !assignedIds.has(String(a.id)))
  }, [usingBackend, backendAvailableEnabled, reviewerMatches, availableAssignments])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)
  const [rubricDetail, setRubricDetail] = useState(null)
  const [rubricScores, setRubricScores] = useState({})
  const [rubricErrors, setRubricErrors] = useState({})
  const [rubricLoading, setRubricLoading] = useState(false)
  const [rubricError, setRubricError] = useState(null)
  const [matchMsg, setMatchMsg] = useState('')
  const [queue, setQueue] = useState(baseReviewQueue)
  const rubricCriteria = useMemo(() => (
    Array.isArray(rubricDetail?.criteria) ? rubricDetail.criteria : []
  ), [rubricDetail])

  useEffect(() => {
    setQueue(baseReviewQueue)
  }, [baseReviewQueue])

  useEffect(() => {
    setRubricErrors({})
    setRubricScores({})
    if (!assignment) {
      setRubricDetail(null)
      setRubricLoading(false)
      setRubricError(null)
      return undefined
    }
    if (!usingBackend) {
      setRubricDetail(assignment.rubric || assignment.rubric_template_detail?.definition || null)
      setRubricLoading(false)
      setRubricError(null)
      return undefined
    }

    let cancelled = false
    setRubricLoading(true)
    setRubricError(null)
    async function fetchRubric() {
      try {
        const data = await apiGet(`/assignments/${assignment.id}/rubric/`)
        if (!cancelled) {
          const fallback = assignment.rubric || assignment.rubric_template_detail?.definition || null
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
  }, [assignment, usingBackend])

  useEffect(() => {
    if (!matchMsg) return undefined
    const timeout = window.setTimeout(() => setMatchMsg(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [matchMsg])

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
    const rubricIssues = {}
    rubricCriteria.forEach((criterion) => {
      const raw = rubricScores[criterion.id]
      const hasValue = raw !== undefined && raw !== null && raw !== ''
      const min = typeof criterion.min_score === 'number' ? criterion.min_score : 0
      const max = typeof criterion.max_score === 'number' ? criterion.max_score : 5
      if (!hasValue) {
        if (criterion.required) {
          rubricIssues[criterion.id] = 'Score required.'
        }
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
    if (Object.keys(rubricIssues).length) {
      const rubricErrorList = Object.entries(rubricIssues).map(([criterionId, message]) => {
        const label = rubricCriteria.find(c => c.id === criterionId)?.label || 'Criterion'
        return { field: `rubric-${criterionId}`, message: `${label}: ${message}` }
      })
      setErrors(rubricErrorList)
      setRubricErrors(rubricIssues)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    setErrors([])
    setRubricErrors({})
    if (assignmentId && assignment) {
      try {
        const rubricScorePayload = rubricCriteria.reduce((acc, criterion) => {
          const raw = rubricScores[criterion.id]
          if (raw === undefined || raw === null || raw === '') return acc
          acc[criterion.id] = Number(raw)
          return acc
        }, {})
        if (usingBackend) {
          await submitReview({ assignmentId: assignment.id, rating: n, comments, rubricScores: rubricScorePayload })
        } else {
          addReview({ assignmentId, rating: n, comments, rubricScores: rubricScorePayload })
        }
        const out = new URLSearchParams({ assignmentId: assignmentId, rating: String(n), comments })
        navigate(`/feedback-confirmation?${out.toString()}`)
      } catch (err) {
        setErrors([{ field: 'rating', message: err.message || 'Unable to submit feedback.' }])
        setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      }
      return
    }
    if (usingBackend) {
      setErrors([{ field: 'rating', message: 'Select an assignment from your dashboard before giving feedback.' }])
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
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

  async function handleGenerateMatches() {
    if (usingBackend) {
      try {
        const result = await claimAssignment()
        const claimedTitle = result?.assignment?.title
        if (claimedTitle) {
          setMatchMsg(`Assigned to review "${claimedTitle}".`)
        } else {
          setMatchMsg(result?.detail || 'Attempted to claim the next assignment.')
        }
      } catch (err) {
        setMatchMsg(err.message || 'Unable to claim an assignment right now.')
      }
      return
    }

    const other = Object.keys(users).find(id => id !== currentUser) || currentUser
    const available = assignments.some(a => a.owner === other)
    if (!available) {
      const n = new Date()
      addAssignmentFor(other, {
        title: `Demo Assignment ${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`,
        description: 'Auto-generated for matching demo.'
      })
    }
    generateMatches()
    setMatchMsg('Matches generated (mock).')
  }

  async function handleRefreshAvailable() {
    if (!usingBackend) return
    try {
      await refreshAvailable()
      setMatchMsg('Available assignments refreshed.')
    } catch (err) {
      setMatchMsg(err.message || 'Unable to refresh available assignments right now.')
    }
  }

  async function handleAssignFromAvailable(id) {
    if (!usingBackend) return
    try {
      const result = await claimAssignment({ assignmentId: id })
      const title = result?.assignment?.title
      setMatchMsg(title ? `Claimed "${title}" and added it to your queue.` : 'Assignment claimed and added to your queue.')
    } catch (err) {
      setMatchMsg(err.message || 'Unable to claim this assignment right now.')
    }
  }

  return (
    <>
      <h1 id="give-feedback-title">Give Feedback</h1>

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
        <section className="tile" aria-labelledby="gf-match-title">
          <h2 id="gf-match-title" className="tile-title">{usingBackend ? 'Assignments ready for review' : 'Peer Matching'}</h2>
          <div className="tile-content">
            {usingBackend ? (
              <>
                <div>
                  <h3 style={{ marginTop: 0 }}>Assigned to you</h3>
                  {backendMatchesEnabled ? (
                    queue.length > 0 ? (
                      <ul>
                        {queue.map(a => (
                          <li key={a.id}>
                            <strong>{a.title}</strong>
                            {a.description ? <div className="muted">{a.description}</div> : null}
                            {reviewerMatchesMap[String(a.id)]?.assigned_at && (
                              <div className="muted">
                                Assigned {new Date(reviewerMatchesMap[String(a.id)].assigned_at).toLocaleString()}
                              </div>
                            )}
                            <div className="actions" style={{ marginTop: 8 }}>
                              <Link className="btn primary" to={`/give-feedback?assignmentId=${a.id}`}>Review</Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No assignments have been matched to you yet. Claim one below.</p>
                    )
                  ) : (
                    <p className="muted">Matching data is temporarily unavailable.</p>
                  )}
                  <div className="actions" style={{ marginTop: 12, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleGenerateMatches}
                      aria-label="Claim next assignment"
                      disabled={claimingMatch}
                    >
                      {claimingMatch ? 'Claiming…' : 'Claim next assignment'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={refreshMatches}
                      disabled={matchesLoading}
                      aria-label="Refresh assigned reviews"
                    >
                      {matchesLoading ? 'Refreshing…' : 'Refresh list'}
                    </button>
                  </div>
                </div>
                <hr style={{ margin: '24px 0' }} />
                <div>
                  <h3 style={{ marginTop: 0 }}>Available to review</h3>
                  {availableLoading ? (
                    <p className="muted">Loading classmates' assignments…</p>
                  ) : availableList.length > 0 ? (
                    <ul>
                      {availableList.map(a => (
                        <li key={a.id}>
                          <strong>{a.title}</strong>
                          {a.description ? <div className="muted">{a.description}</div> : null}
                          {a.due_date && (
                            <div className="muted">Due {new Date(a.due_date).toLocaleString()}</div>
                          )}
                          <div className="actions" style={{ marginTop: 8, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
                            <Link className="btn primary" to={`/give-feedback?assignmentId=${a.id}`}>Review</Link>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => handleAssignFromAvailable(a.id)}
                              aria-label="Claim this assignment"
                              disabled={claimingMatch}
                            >
                              {claimingMatch ? 'Claiming…' : 'Claim & add to queue'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No other assignments are available right now.</p>
                  )}
                  <div className="actions" style={{ marginTop: 12, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleRefreshAvailable}
                      disabled={availableLoading}
                      aria-label="Refresh available assignments"
                    >
                      {availableLoading ? 'Refreshing…' : 'Refresh available list'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={refreshAvailable}
                      aria-label="Force refresh"
                      style={{ display: 'none' }}
                    >
                      Hidden fallback
                    </button>
                  </div>
                  {availableError && (
                    <p className="error-text" role="alert">{availableError.message}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                {queue.length === 0 ? (
                  <p>No assignments to review.</p>
                ) : (
                  <ul>
                    {queue.map(a => (
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
                <div className="actions" style={{ marginTop: 12 }}>
                  <button type="button" className="btn" onClick={handleGenerateMatches} aria-label="Generate matches (mock)">Generate matches (mock)</button>
                </div>
              </>
            )}
            {matchMsg && (
              <p role="status" aria-live="polite" style={{ marginTop: 8 }}>{matchMsg}</p>
            )}
            {usingBackend && (matchesError || claimError) && (
              <p className="error-text" role="alert" style={{ marginTop: 8 }}>
                {matchesError?.message || claimError?.message || 'Unable to load matches.'}
              </p>
            )}
            <p className="muted" style={{ marginTop: 8 }}>Select an assignment above to start your review.</p>
          </div>
        </section>
      )}

      {assignment && (
        <form onSubmit={onSubmit} noValidate aria-labelledby="give-feedback-title">
          <p id="assignment-context">
            <strong>Reviewing:</strong> {assignment.title}
          </p>
          {assignment.description ? (
            <p>{assignment.description}</p>
          ) : (
            <p className="muted">No description provided.</p>
          )}

          {Array.isArray(assignment.attachments) && assignment.attachments.length > 0 && (
            <section className="attachment-list" aria-label="Assignment attachments">
              <h3>Attachments</h3>
              <ul>
                {assignment.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.file}
                      target="_blank"
                      rel="noreferrer"
                      download={file.original_name || undefined}
                    >
                      {file.original_name || file.file?.split('/').pop() || 'Attachment'}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rubricLoading ? (
            <p className="muted">Loading rubric…</p>
          ) : rubricError ? (
            <p className="error-text" role="alert">Unable to load rubric: {rubricError.message || 'Unknown error.'}</p>
          ) : (
            <section className="rubric-inputs" aria-label="Assignment rubric">
              <h3>Rubric</h3>
              <p className="muted">Click the description that best matches the work for each row.</p>
              <RubricMatrix
                criteria={rubricCriteria}
                selectedScores={rubricScores}
                onScoreChange={handleRubricScoreChange}
                errors={rubricErrors}
                emptyLabel="This assignment does not define a rubric."
              />
            </section>
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
            <button className="primary" type="submit" aria-label="Submit feedback">
              {submitting && usingBackend ? 'Submitting…' : 'Submit'}
            </button>
            <button type="button" className="btn" onClick={handleSaveDraft} aria-label="Save draft (mock)">Save draft</button>
            <Link to="/feedback-guidelines" className="btn" aria-label="View feedback guidelines">Guidelines</Link>
            <Link to="/student-dashboard" className="btn" aria-label="Cancel and return to dashboard">Cancel</Link>
          </div>
        </form>
      )}
      {usingBackend && (
        <>
          {assignmentsLoading && <p className="muted">Loading assignment…</p>}
          {assignmentsError && (
            <p className="error-text" role="alert">Unable to load assignment: {assignmentsError.message}</p>
          )}
          {matchesLoading && queue.length === 0 && !assignment && (
            <p className="muted">Loading assigned reviews…</p>
          )}
          {availableLoading && queue.length === 0 && availableList.length === 0 && !assignment && (
            <p className="muted">Loading classmates' assignments…</p>
          )}
          {submitError && (
            <p className="error-text" role="alert">{submitError.message}</p>
          )}
        </>
      )}
      <div id="gf-messages" className="sr-only" aria-live="polite">{message}</div>
    </>
  )
}
