import { Link, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import RubricMatrix from '../components/RubricMatrix.jsx'
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
      || 'Anonymous reviewer'
  }

  const getTimestamp = (item) => item.submitted_at || item.updated_at || item.createdAt || item.created_at

  const received = receivedData.reviews
  const given = givenData.reviews
  const mySelf = selfData.items
  const showGivenSection = !assignmentId
  const visibleGivenCount = showGivenSection ? given.length : 0
  const none = assignmentId && (received.length + visibleGivenCount + mySelf.length === 0)

  const trendRows = useMemo(() => {
    const grouped = new Map()
    const pushItem = (item, key) => {
      const dt = getTimestamp(item)
      if (!dt || typeof item.rating !== 'number') return
      const bucket = new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      if (!grouped.has(bucket)) {
        grouped.set(bucket, { label: bucket, received: [], given: [], self: [] })
      }
      grouped.get(bucket)[key].push(item.rating)
    }
    received.forEach(item => pushItem(item, 'received'))
    given.forEach(item => pushItem(item, 'given'))
    mySelf.forEach(item => pushItem(item, 'self'))
    return Array.from(grouped.values()).map((row) => ({
      ...row,
      receivedAvg: row.received.length ? row.received.reduce((acc, value) => acc + value, 0) / row.received.length : null,
      givenAvg: row.given.length ? row.given.reduce((acc, value) => acc + value, 0) / row.given.length : null,
      selfAvg: row.self.length ? row.self.reduce((acc, value) => acc + value, 0) / row.self.length : null,
    }))
  }, [received, given, mySelf])

  const summary = useMemo(() => {
    const avg = (items) => {
      if (!items.length) return null
      const total = items.reduce((acc, item) => acc + Number(item.rating || 0), 0)
      return total / items.length
    }
    const receivedAvg = avg(received)
    const givenAvg = avg(given)
    const selfAvg = avg(mySelf)
    const selfVsPeer = (selfAvg !== null && receivedAvg !== null) ? (selfAvg - receivedAvg) : null
    return { receivedAvg, givenAvg, selfAvg, selfVsPeer }
  }, [received, given, mySelf])

  return (
    <>
      <h1 id="fh-title">Feedback History</h1>
      <p id="fh-filter-note" className="sr-only">
        {assignmentId ? `Showing results for assignment ${assignmentId}` : 'Showing results for: All assignments'}
      </p>

      <section className="tile" aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="tile-title">Trends</h2>
        <div className="tile-content">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Average received</div>
              <strong style={{ fontSize: 20 }}>{summary.receivedAvg !== null ? summary.receivedAvg.toFixed(2) : 'N/A'}</strong>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Average given</div>
              <strong style={{ fontSize: 20 }}>{summary.givenAvg !== null ? summary.givenAvg.toFixed(2) : 'N/A'}</strong>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Average self-assessment</div>
              <strong style={{ fontSize: 20 }}>{summary.selfAvg !== null ? summary.selfAvg.toFixed(2) : 'N/A'}</strong>
            </div>
            <div className="card" style={{ padding: 12 }}>
              <div className="muted">Self vs peer delta</div>
              <strong style={{ fontSize: 20 }}>{summary.selfVsPeer !== null ? summary.selfVsPeer.toFixed(2) : 'N/A'}</strong>
            </div>
          </div>
          {trendRows.length > 0 ? (
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 520 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Date</th>
                    <th style={{ textAlign: 'left' }}>Received</th>
                    <th style={{ textAlign: 'left' }}>Given</th>
                    <th style={{ textAlign: 'left' }}>Self</th>
                  </tr>
                </thead>
                <tbody>
                  {trendRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.receivedAvg !== null ? row.receivedAvg.toFixed(2) : '—'}</td>
                      <td>{row.givenAvg !== null ? row.givenAvg.toFixed(2) : '—'}</td>
                      <td>{row.selfAvg !== null ? row.selfAvg.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 12 }}>No trend data yet.</p>
          )}
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
                const detailUrl = r.id ? `/reviews/${r.id}` : null
                return (
                  <li key={r.id}>
                    <strong>{getAssignmentTitle(r)}</strong> {dt ? <span className="muted">({new Date(dt).toLocaleString()})</span> : null}
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>{r.comments}</div>}
                    <div className="muted">Reviewer: {getReviewerLabel(r)}</div>
                    {detailUrl && (
                      <div className="actions" style={{ marginTop: 8 }}>
                        <Link className="btn" to={detailUrl} aria-label={`View review details for ${getAssignmentTitle(r)}`}>
                          View full review
                        </Link>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {showGivenSection && (
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
      )}

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
                const detailUrl = sa.id ? `/self-assessments/${sa.id}` : null
                return (
                  <li key={sa.id}>
                    <strong>{title}</strong> {dt ? <span className="muted">({new Date(dt).toLocaleString()})</span> : null}
                    <div>Rating: {sa.rating}</div>
                    {sa.comments && <div>{sa.comments}</div>}
                    <div style={{ marginTop: 8 }}>
                      <RubricMatrix
                        criteria={assignmentLookup[sa.assignment]?.rubric?.criteria || assignmentLookup[sa.assignmentId]?.rubric?.criteria || []}
                        selectedScores={sa.rubric_scores || sa.rubricScores || {}}
                        readonly
                        emptyLabel="No rubric scores submitted."
                      />
                    </div>
                    {detailUrl && (
                      <div className="actions" style={{ marginTop: 8 }}>
                        <Link className="btn" to={detailUrl} aria-label={`View self-assessment details for ${title}`}>
                          View self-assessment details
                        </Link>
                      </div>
                    )}
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
