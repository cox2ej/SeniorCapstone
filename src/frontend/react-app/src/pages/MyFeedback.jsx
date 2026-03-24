import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'

export default function MyFeedback() {
  const { currentUser, getReviewsReceivedBy, getAssignmentById } = useMockStore()
  const { backendEnabled, assignments, loading, error, createAssignment } = useAssignmentsData()
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [rubricCriteria, setRubricCriteria] = useState([])
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
      const rubricPayload = rubricCriteria.length
        ? {
            criteria: rubricCriteria.map((c) => ({
              id: c.id,
              label: c.label,
              description: c.description,
              required: Boolean(c.required),
              min_score: 1,
              max_score: 5,
              scale_descriptions: c.scaleDescriptions,
            })),
          }
        : undefined

      await createAssignment({
        title: trimmed,
        description: desc.trim(),
        attachments: backendEnabled ? attachmentFiles : [],
        rubric: rubricPayload,
      })
      setTitle('')
      setDesc('')
      setAttachmentFiles([])
      setRubricCriteria([])
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

  const handleAddCriterion = () => {
    setRubricCriteria((prev) => ([
      ...prev,
      {
        id: `crit-${Math.random().toString(36).slice(2, 8)}`,
        label: '',
        description: '',
        required: true,
        scaleDescriptions: {
          1: '',
          2: '',
          3: '',
          4: '',
          5: '',
        },
      }
    ]))
  }

  const handleCriterionChange = (index, field, value) => {
    setRubricCriteria((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleScaleDescriptionChange = (index, score, value) => {
    setRubricCriteria((prev) => {
      const next = [...prev]
      const criterion = next[index]
      const scale = { ...(criterion.scaleDescriptions || {}) }
      scale[score] = value
      next[index] = { ...criterion, scaleDescriptions: scale }
      return next
    })
  }

  const handleRemoveCriterion = (index) => {
    setRubricCriteria((prev) => prev.filter((_, i) => i !== index))
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

            <fieldset style={{ marginTop: 16 }}>
              <legend>Create a custom rubric (optional)</legend>
              <p className="muted">Define scoring criteria your reviewers will complete. Leave blank to use the default rubric.</p>
              {rubricCriteria.length === 0 && (
                <p className="muted">No custom criteria yet.</p>
              )}
              {rubricCriteria.length > 0 && (
                <div className="rubric-editor" aria-label="Custom rubric criteria">
                  {rubricCriteria.map((criterion, index) => (
                    <div key={criterion.id} className="rubric-row" style={{ border: '1px solid var(--border-color, #ddd)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Criterion title"
                          value={criterion.label}
                          onChange={(e) => handleCriterionChange(index, 'label', e.target.value)}
                          aria-label={`Criterion ${index + 1} label`}
                          required
                          style={{ flex: '1 1 220px' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(criterion.required)}
                            onChange={(e) => handleCriterionChange(index, 'required', e.target.checked)}
                            aria-label={`Criterion ${index + 1} required`}
                          />
                          Required
                        </label>
                        <button type="button" className="btn" onClick={() => handleRemoveCriterion(index)} aria-label={`Remove criterion ${criterion.label || index + 1}`}>
                          Remove
                        </button>
                      </div>
                      <textarea
                        placeholder="Describe the overall expectations for this area"
                        value={criterion.description}
                        onChange={(e) => handleCriterionChange(index, 'description', e.target.value)}
                        aria-label={`Criterion ${index + 1} overview description`}
                        style={{ width: '100%', marginTop: 8, minHeight: 60 }}
                      />
                      <div className="rubric-grid" role="table" aria-label={`Score descriptions for ${criterion.label || `criterion ${index + 1}`}`} style={{ marginTop: 12, overflowX: 'auto' }}>
                        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 8, fontWeight: 600 }}>
                          {[1, 2, 3, 4, 5].map((score) => (
                            <div key={`head-${criterion.id}-${score}`} role="columnheader" style={{ textAlign: 'center' }}>{score} pt{score !== 1 ? 's' : ''}</div>
                          ))}
                        </div>
                        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 8, marginTop: 8 }}>
                          {[1, 2, 3, 4, 5].map((score) => (
                            <textarea
                              key={`cell-${criterion.id}-${score}`}
                              value={criterion.scaleDescriptions?.[score] || ''}
                              onChange={(e) => handleScaleDescriptionChange(index, score, e.target.value)}
                              placeholder={`Describe what earns ${score} point${score !== 1 ? 's' : ''}`}
                              style={{ width: '100%', minHeight: 70 }}
                              aria-label={`Description for score ${score}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="btn" onClick={handleAddCriterion} style={{ marginTop: 8 }}>Add criterion</button>
            </fieldset>
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
                const detailUrl = r.id ? `/reviews/${r.id}` : null
                return (
                  <li key={r.id}>
                    <strong>{assignment?.title || 'Assignment'}</strong>
                    <div>Rating: {r.rating}</div>
                    {r.comments && <div>Comment: {r.comments}</div>}
                    <div className="muted">Reviewer: Anonymous reviewer</div>
                    {detailUrl && (
                      <div className="actions" style={{ marginTop: 8 }}>
                        <Link className="btn" to={detailUrl} aria-label={`View review details for ${assignment?.title || 'assignment'}`}>
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
      <div className="actions">
        <Link to="/student-dashboard" className="btn" aria-label="Back to dashboard">Back to Dashboard</Link>
        <Link to="/give-feedback" className="btn" aria-label="Give feedback to a peer">Give Feedback</Link>
      </div>
    </>
  )
}
