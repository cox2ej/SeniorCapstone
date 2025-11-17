import { useLocation } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'

export default function FeedbackHistory() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const assignmentId = params.get('assignmentId') || ''
  const { currentUser, reviews, selfAssessments, getAssignmentById, users } = useMockStore()

  const received = reviews.filter(r => {
    const a = getAssignmentById(r.assignmentId)
    return a && a.owner === currentUser
  })
  const given = reviews.filter(r => r.reviewer === currentUser)
  const mySelf = selfAssessments.filter(sa => sa.owner === currentUser)

  const filteredReceived = assignmentId ? received.filter(r => r.assignmentId === assignmentId) : received
  const filteredGiven = assignmentId ? given.filter(r => r.assignmentId === assignmentId) : given
  const filteredSelf = assignmentId ? mySelf.filter(sa => sa.assignmentId === assignmentId) : mySelf
  const none = assignmentId && (filteredReceived.length + filteredGiven.length + filteredSelf.length === 0)

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
          {filteredReceived.length === 0 ? (
            <p>No received reviews.</p>
          ) : (
            <ul>
              {filteredReceived.map(r => {
                const a = getAssignmentById(r.assignmentId)
                const dt = r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
                return (
                  <li key={r.id}>
                    <strong>{a?.title || 'Assignment'}</strong> {dt ? <span className="muted">({dt})</span> : null}
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>{r.comments}</div>}
                    <div className="muted">Reviewer: {users[r.reviewer]?.name || r.reviewer}</div>
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
          {filteredGiven.length === 0 ? (
            <p>No given reviews.</p>
          ) : (
            <ul>
              {filteredGiven.map(r => {
                const a = getAssignmentById(r.assignmentId)
                const dt = r.createdAt ? new Date(r.createdAt).toLocaleString() : ''
                return (
                  <li key={r.id}>
                    <strong>{a?.title || 'Assignment'}</strong> {dt ? <span className="muted">({dt})</span> : null}
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>{r.comments}</div>}
                    <div className="muted">Owner: {a ? (users[a.owner]?.name || a.owner) : ''}</div>
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
          {filteredSelf.length === 0 ? (
            <p>No self-assessments.</p>
          ) : (
            <ul>
              {filteredSelf.map(sa => {
                const a = getAssignmentById(sa.assignmentId)
                const dt = sa.createdAt ? new Date(sa.createdAt).toLocaleString() : ''
                return (
                  <li key={sa.id}>
                    <strong>{a?.title || 'Assignment'}</strong> {dt ? <span className="muted">({dt})</span> : null}
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
