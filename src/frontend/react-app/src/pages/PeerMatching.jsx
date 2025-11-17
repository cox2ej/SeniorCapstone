import { useState } from 'react'
import { useMockStore } from '../store/mockStore.jsx'

export default function PeerMatching() {
  const { assignments, users } = useMockStore()
  const [msg, setMsg] = useState('')

  const matches = assignments.map(a => {
    const ownerId = a.owner
    const reviewerId = Object.keys(users).find(id => id !== ownerId) || ownerId
    return {
      id: a.id,
      title: a.title,
      ownerName: users[ownerId]?.name || ownerId,
      reviewerName: users[reviewerId]?.name || reviewerId,
    }
  })

  function handleGenerate() {
    setMsg('Matches generated (mock).')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <>
      <h1>Peer Matching</h1>
      <section className="tile" aria-labelledby="pm-overview">
        <h2 id="pm-overview" className="tile-title">Current matches (demo)</h2>
        <div className="tile-content">
          {matches.length === 0 ? (
            <p>No assignments available for matching. Post an assignment as a student to see suggested pairs.</p>
          ) : (
            <ul>
              {matches.map(m => (
                <li key={m.id}>
                  <strong>{m.title}</strong>
                  <div className="muted">Owner: {m.ownerName}</div>
                  <div>Suggested reviewer: {m.reviewerName}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={handleGenerate} aria-label="Generate matches (mock)">Generate matches (mock)</button>
          </div>
        </div>
      </section>
      <div id="pm-messages" className="sr-only" aria-live="polite">{msg}</div>
    </>
  )
}
