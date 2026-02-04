import { useMemo, useState } from 'react'
import { useMockStore } from '../store/mockStore.jsx'
import { useReviewerMatches, useMatchActions } from '../hooks/useReviewerMatches.js'

export default function PeerMatching() {
  const { assignments, users, matches, generateMatches, setMatch, currentUser } = useMockStore()
  const { matches: remoteMatches, backendEnabled, loading, error, refresh } = useReviewerMatches()
  const { claimAssignment, backendEnabled: actionsBackendEnabled, loading: claiming, error: claimError } = useMatchActions({ onSuccess: refresh })
  const [msg, setMsg] = useState('')

  const usingBackend = backendEnabled && actionsBackendEnabled

  const rows = useMemo(() => {
    if (usingBackend) {
      return remoteMatches.map(entry => {
        const assignment = entry.assignment
        const ownerName = assignment?.created_by?.display_name || assignment?.created_by?.username || 'Owner'
        const reviewerName = entry.user?.display_name || entry.user?.username || entry.alias
        return {
          id: assignment?.id || entry.id,
          title: assignment?.title || `Assignment ${assignment?.id ?? entry.id}`,
          ownerName,
          reviewerName,
          assignment,
        }
      })
    }

    return assignments.map(a => {
      const ownerId = a.owner
      const reviewerId = matches[a.id]
      return {
        id: a.id,
        title: a.title,
        ownerName: users[ownerId]?.name || ownerId,
        reviewerName: reviewerId ? (users[reviewerId]?.name || reviewerId) : null,
        assignment: a,
      }
    })
  }, [usingBackend, remoteMatches, assignments, matches, users])

  async function handleGenerate() {
    if (usingBackend) {
      try {
        await claimAssignment()
        setMsg('Claimed the next available assignment to review.')
      } catch (err) {
        setMsg(err.message || 'Unable to claim assignment.')
      }
    } else {
      generateMatches()
      setMsg('Matches generated (mock).')
    }
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleAssignToMe(id) {
    if (usingBackend) {
      try {
        await claimAssignment({ assignmentId: id })
        setMsg('Assignment claimed.')
      } catch (err) {
        setMsg(err.message || 'Unable to claim assignment.')
      }
      setTimeout(() => setMsg(''), 3000)
      return
    }

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
            <p>
              {usingBackend
                ? 'No assignments are available to claim right now. Check back after classmates submit work.'
                : 'No assignments available for matching. Post an assignment as a student to see suggested pairs.'}
            </p>
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
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleAssignToMe(m.assignment?.id || m.id)}
                      aria-label={usingBackend ? 'Claim this assignment' : 'Assign to me (mock)'}
                      disabled={usingBackend && claiming}
                    >
                      {usingBackend ? (claiming ? 'Claiming…' : 'Claim this assignment') : 'Assign to me'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn primary"
              onClick={handleGenerate}
              aria-label={usingBackend ? 'Claim next assignment' : 'Generate matches (mock)'}
              disabled={usingBackend && (loading || claiming)}
            >
              {usingBackend
                ? (loading || claiming ? 'Searching…' : 'Claim next assignment')
                : 'Generate matches (mock)'}
            </button>
          </div>
          {msg && <p role="status" aria-live="polite" style={{ marginTop: 8 }}>{msg}</p>}
          {error && usingBackend && (
            <p role="alert" className="error-text">Unable to load matches: {error.message}</p>
          )}
          {claimError && usingBackend && (
            <p role="alert" className="error-text">{claimError.message}</p>
          )}
        </div>
      </section>
    </>
  )
}
