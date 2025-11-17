import { useState } from 'react'
import { useMockStore } from '../store/mockStore.jsx'

export default function PeerMatching() {
  const { assignments, users, matches, generateMatches, setMatch, currentUser } = useMockStore()
  const [msg, setMsg] = useState('')

  const rows = assignments.map(a => {
    const ownerId = a.owner
    const reviewerId = matches[a.id]
    return {
      id: a.id,
      title: a.title,
      ownerName: users[ownerId]?.name || ownerId,
      reviewerName: reviewerId ? (users[reviewerId]?.name || reviewerId) : null,
    }
  })

  function handleGenerate() {
    generateMatches()
    setMsg('Matches generated (mock).')
    setTimeout(() => setMsg(''), 3000)
  }

  function handleAssignToMe(id) {
    setMatch(id, currentUser)
    setMsg('Assigned to you (mock).')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <>
      <h1>Peer Matching</h1>
      <section className="tile" aria-labelledby="pm-overview">
        <h2 id="pm-overview" className="tile-title">Current matches (demo)</h2>
        <div className="tile-content">
          {rows.length === 0 ? (
            <p>No assignments available for matching. Post an assignment as a student to see suggested pairs.</p>
          ) : (
            <ul>
              {rows.map(m => (
                <li key={m.id}>
                  <strong>{m.title}</strong>
                  <div className="muted">Owner: {m.ownerName}</div>
                  <div>
                    {m.reviewerName ? (
                      <>Reviewer: {m.reviewerName}</>
                    ) : (
                      <>Reviewer: <span className="muted">Not matched</span></>
                    )}
                  </div>
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button type="button" className="btn" onClick={() => handleAssignToMe(m.id)} aria-label="Assign to me (mock)">Assign to me</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={handleGenerate} aria-label="Generate matches (mock)">Generate matches (mock)</button>
          </div>
          {msg && <p role="status" aria-live="polite" style={{ marginTop: 8 }}>{msg}</p>}
        </div>
      </section>
    </>
  )
}
