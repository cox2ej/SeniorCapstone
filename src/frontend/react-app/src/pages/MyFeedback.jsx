import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.js'

export default function MyFeedback() {
  const { currentUser, getReviewsReceivedBy, getAssignmentById, users, addAssignment } = useMockStore()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const reviews = getReviewsReceivedBy(currentUser)

  function onPost(e) {
    e.preventDefault()
    if (!title.trim()) return
    addAssignment({ title: title.trim(), description: desc.trim() })
    setTitle('')
    setDesc('')
  }

  return (
    <>
      <h1>My Feedback</h1>
      <section className="tile" aria-labelledby="post-assignment-title">
        <h2 id="post-assignment-title" className="tile-title">Post an assignment for review</h2>
        <div className="tile-content">
          <form onSubmit={onPost} noValidate>
            <label htmlFor="mf-assn-title">Title</label>
            <input id="mf-assn-title" name="assnTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label htmlFor="mf-assn-desc">Description (optional)</label>
            <textarea id="mf-assn-desc" name="assnDesc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="actions">
              <button className="primary" type="submit">Post</button>
            </div>
          </form>
        </div>
      </section>
      <section className="tile" aria-labelledby="mf-list-title">
        <h2 id="mf-list-title" className="tile-title">Reviews you've received</h2>
        <div className="tile-content">
          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <ul>
              {reviews.map(r => {
                const a = getAssignmentById(r.assignmentId)
                return (
                  <li key={r.id}>
                    <strong>{a?.title || 'Assignment'}</strong>
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>Comment: {r.comments}</div>}
                    <div className="muted">Reviewer: {users[r.reviewer]?.name || r.reviewer}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
      <div className="actions">
        <Link to="/student-dashboard" className="btn" aria-label="Back to dashboard">Back to Dashboard</Link>
        <Link to="/give-feedback" className="btn" aria-label="Give feedback to a peer">Give Feedback</Link>
      </div>
    </>
  )
}
