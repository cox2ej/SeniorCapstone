import { useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useMockStore } from '../store/mockStore.jsx'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useReviewsData } from '../hooks/useReviewsData.js'
import { useSelfAssessments } from '../hooks/useSelfAssessments.js'

export default function FeedbackHistory() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const assignmentId = params.get('assignmentId') || ''
  const { users } = useMockStore()
  const assignmentsData = useAssignmentsData()
  const receivedData = useReviewsData({ role: 'received', assignmentId })
  const givenData = useReviewsData({ role: 'given', assignmentId })
  const selfData = useSelfAssessments({ assignmentId })

  const assignmentLookup = useMemo(() => {
    const map = {}
    assignmentsData.assignments.forEach(a => { map[a.id] = a })
    return map
  }, [assignmentsData.assignments])

  const getAssignmentTitle = (item) => {
    return item.assignment_detail?.title
      || assignmentLookup[item.assignment]?.title
      || assignmentLookup[item.assignmentId]?.title
      || 'Assignment'
  }

  const getAssignmentOwner = (item) => {
    const createdBy = item.assignment_detail?.created_by
      || assignmentLookup[item.assignment]?.created_by
      || assignmentLookup[item.assignmentId]?.created_by
    if (createdBy) return createdBy.display_name || `${createdBy.first_name || ''} ${createdBy.last_name || ''}`.trim() || createdBy.username
    const assignment = assignmentLookup[item.assignment] || assignmentLookup[item.assignmentId]
    if (assignment?.owner) return users[assignment.owner]?.name || assignment.owner
    return ''
  }

  const getReviewerLabel = (review) => {
    return review.reviewer_alias
      || review.reviewer_user?.display_name
      || users[review.reviewer]?.name
      || review.reviewer
      || 'Reviewer'
  }

  const getTimestamp = (item) => item.submitted_at || item.updated_at || item.createdAt || item.created_at

  const received = receivedData.reviews
  const given = givenData.reviews
  const mySelf = selfData.items
  const none = assignmentId && (received.length + given.length + mySelf.length === 0)

  return (
    <>
      <h1 id="fh-title">Feedback History</h1>
      <p id="fh-filter-note" className="sr-only">
        {assignmentId ? `Showing results for assignment ${assignmentId}` : 'Showing results for: All assignments'}
      </p>

      <section className="tile" aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="tile-title">Trends</h2>
        <div className="tile-content">
          <p>Trend graph placeholder.</p>
        </div>
      </section>

      <section className="tile" aria-labelledby="fh-rec-title">
        <h2 id="fh-rec-title" className="tile-title">Reviews you've received</h2>
        <div className="tile-content">
          {receivedData.loading ? (
            <p>Loading received reviews…</p>
          ) : receivedData.error ? (
            <p className="error-text" role="alert">Unable to load received reviews: {receivedData.error.message}</p>
          ) : received.length === 0 ? (
            <p>No received reviews.</p>
          ) : (
            <ul>
              {received.map(r => {
                const dt = getTimestamp(r)
                return (
                  <li key={r.id}>
                    <strong>{getAssignmentTitle(r)}</strong> {dt ? <span className="muted">({new Date(dt).toLocaleString()})</span> : null}
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>{r.comments}</div>}
                    <div className="muted">Reviewer: {getReviewerLabel(r)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="fh-given-title">
        <h2 id="fh-given-title" className="tile-title">Reviews you've given</h2>
        <div className="tile-content">
          {givenData.loading ? (
            <p>Loading given reviews…</p>
          ) : givenData.error ? (
            <p className="error-text" role="alert">Unable to load given reviews: {givenData.error.message}</p>
          ) : given.length === 0 ? (
            <p>No given reviews.</p>
          ) : (
            <ul>
              {given.map(r => {
                const dt = getTimestamp(r)
                return (
                  <li key={r.id}>
                    <strong>{getAssignmentTitle(r)}</strong> {dt ? <span className="muted">({new Date(dt).toLocaleString()})</span> : null}
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>{r.comments}</div>}
                    <div className="muted">Owner: {getAssignmentOwner(r)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="fh-self-title">
        <h2 id="fh-self-title" className="tile-title">Your self-assessments</h2>
        <div className="tile-content">
          {selfData.loading ? (
            <p>Loading self-assessments…</p>
          ) : selfData.error ? (
            <p className="error-text" role="alert">Unable to load self-assessments: {selfData.error.message}</p>
          ) : mySelf.length === 0 ? (
            <p>No self-assessments.</p>
          ) : (
            <ul>
              {mySelf.map(sa => {
                const dt = getTimestamp(sa)
                const title = getAssignmentTitle({ assignment: sa.assignment, assignmentId: sa.assignmentId })
                return (
                  <li key={sa.id}>
                    <strong>{title}</strong> {dt ? <span className="muted">({new Date(dt).toLocaleString()})</span> : null}
                    <div>Rating: {sa.rating}</div>
                    {sa.comments && <div>{sa.comments}</div>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <p id="fh-empty" className={none ? '' : 'sr-only'}>No feedback found for this filter.</p>
    </>
  )
}
