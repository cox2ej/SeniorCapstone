import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'

export default function MyFeedback() {
  const { currentUser, getReviewsReceivedBy, getAssignmentById, users } = useMockStore()
  const { backendEnabled, assignments, loading, error, createAssignment } = useAssignmentsData()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef(null)
  const reviews = getReviewsReceivedBy(currentUser)

  const assignmentLookup = useMemo(() => {
    if (!backendEnabled) return null
    return assignments.reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [backendEnabled, assignments])

  async function onPost(e) {
    e.preventDefault()
    setSubmitError('')
    setStatusMessage('')
    const trimmed = title.trim()
    if (!trimmed) return
    try {
      await createAssignment({
        title: trimmed,
        description: desc.trim(),
        attachments: backendEnabled ? attachmentFiles : [],
      })
      setTitle('')
      setDesc('')
      setAttachmentFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setStatusMessage(backendEnabled ? 'Assignment submitted to backend.' : 'Assignment saved locally.')
    } catch (err) {
      setSubmitError(err.message || 'Unable to save assignment.')
    }
  }

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || [])
    setAttachmentFiles(files)
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
            <label htmlFor="mf-assn-files">Attachments (optional)</label>
            <input
              id="mf-assn-files"
              type="file"
              multiple
              onChange={handleAttachmentChange}
              ref={fileInputRef}
              disabled={!backendEnabled}
              aria-describedby="mf-assn-files-help"
            />
            <small id="mf-assn-files-help" className="muted">
              {backendEnabled ? 'Upload reference files to share with assigned reviewers (PDF, DOCX, ZIP, etc.).' : 'Enable backend mode to attach files.'}
            </small>
            {attachmentFiles.length > 0 && (
              <ul className="attachment-preview" style={{ marginTop: 8 }}>
                {attachmentFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
            <div className="actions">
              <button className="primary" type="submit">Post</button>
            </div>
            <div role="status" aria-live="polite">
              {loading && backendEnabled && <p className="muted">Loading assignments…</p>}
              {statusMessage && <p className="success-text">{statusMessage}</p>}
              {submitError && <p className="error-text" role="alert">{submitError}</p>}
            </div>
            {error && backendEnabled && (
              <p className="error-text" role="alert">Failed to load assignments: {error.message}</p>
            )}
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
                const assignment = backendEnabled
                  ? assignmentLookup?.[r.assignmentId] || getAssignmentById(r.assignmentId)
                  : getAssignmentById(r.assignmentId)
                return (
                  <li key={r.id}>
                    <strong>{assignment?.title || 'Assignment'}</strong>
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
