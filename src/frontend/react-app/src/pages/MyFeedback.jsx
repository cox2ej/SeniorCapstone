import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { ATTACHMENT_SIZE_HELP_TEXT, validateAttachmentSizes } from '../constants/uploads.js'

const createEmptyCriterion = () => ({
  id: `crit-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  description: '',
  required: true,
  scaleDescriptions: Array.from({ length: 5 }).reduce((acc, _, index) => {
    const score = index + 1
    acc[score] = ''
    return acc
  }, {}),
})

const normalizeScaleDescriptions = (incoming = {}) => {
  const output = {}
  for (let score = 1; score <= 5; score += 1) {
    const key = String(score)
    output[score] = incoming[score] || incoming[key] || ''
  }
  return output
}

const rubricToCriteria = (rubric) => {
  const criteria = rubric?.criteria
  if (!Array.isArray(criteria)) return []
  return criteria.map((criterion, index) => ({
    id: criterion.id || criterion.key || `crit-${index + 1}`,
    label: criterion.label || '',
    description: criterion.description || '',
    required: Boolean(criterion.required),
    scaleDescriptions: normalizeScaleDescriptions(criterion.scale_descriptions || criterion.scaleDescriptions),
  }))
}

const criteriaToRubric = (criteria) => {
  if (!criteria?.length) return null
  return {
    criteria: criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      description: criterion.description,
      required: Boolean(criterion.required),
      min_score: 1,
      max_score: 5,
      scale_descriptions: criterion.scaleDescriptions || {},
    })),
  }
}

export default function MyFeedback() {
  const { currentUser, getReviewsReceivedBy, getAssignmentById } = useMockStore()
  const {
    backendEnabled,
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    uploadAssignmentAttachments,
    deleteAssignmentAttachment,
    refresh,
  } = useAssignmentsData({ query: 'role=mine' })
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [rubricCriteria, setRubricCriteria] = useState([])
  const fileInputRef = useRef(null)
  const errorSummaryRef = useRef(null)
  const attachmentErrorRef = useRef(null)
  const editFileInputRef = useRef(null)
  const reviews = getReviewsReceivedBy(currentUser)
  const [editingAssignmentId, setEditingAssignmentId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFiles, setEditFiles] = useState([])
  const [editRubricCriteria, setEditRubricCriteria] = useState([])
  const [editRubricRemoved, setEditRubricRemoved] = useState(false)
  const [editBaselineRubric, setEditBaselineRubric] = useState([])
  const [manageStatus, setManageStatus] = useState('')
  const [manageError, setManageError] = useState('')
  const [manageLoading, setManageLoading] = useState(false)

  useEffect(() => {
    if (attachmentError && attachmentErrorRef.current) {
      attachmentErrorRef.current.focus()
    }
  }, [attachmentError])

  const assignmentLookup = useMemo(() => {
    if (!backendEnabled) return null
    return assignments.reduce((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [backendEnabled, assignments])

  const sortedAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return []
    return [...assignments].sort((a, b) => {
      const bDate = new Date(b?.created_at || b?.createdAt || 0).getTime()
      const aDate = new Date(a?.created_at || a?.createdAt || 0).getTime()
      return bDate - aDate
    })
  }, [assignments])

  async function onPost(e) {
    e.preventDefault()
    setSubmitError('')
    setStatusMessage('')
    const trimmed = title.trim()
    if (!trimmed) return
    if (attachmentError) {
      setSubmitError(attachmentError)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    try {
      validateAttachmentSizes(attachmentFiles)
      const rubricPayload = criteriaToRubric(rubricCriteria) || undefined

      await createAssignment({
        title: trimmed,
        description: desc.trim(),
        attachments: backendEnabled ? attachmentFiles : [],
        rubric: rubricPayload,
      })
      setTitle('')
      setDesc('')
      setAttachmentFiles([])
      setAttachmentError('')
      setRubricCriteria([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setStatusMessage(backendEnabled ? 'Assignment submitted to backend.' : 'Assignment saved locally.')
    } catch (err) {
      setSubmitError(err.message || 'Unable to save assignment.')
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
    }
  }

  const handleAttachmentChange = (event) => {
    const incoming = Array.from(event.target.files || [])
    if (event.target) {
      event.target.value = ''
    }
    if (!incoming.length) return

    setAttachmentFiles((prev) => {
      const next = [...prev, ...incoming]
      try {
        validateAttachmentSizes(next)
        setAttachmentError('')
        return next
      } catch (err) {
        setAttachmentError(err.message)
        return prev
      }
    })
  }

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachmentFiles((prev) => {
      const next = prev.filter((_, index) => index !== indexToRemove)
      if (!next.length) {
        setAttachmentError('')
      }
      return next
    })
  }

  const handleAddCriterion = () => {
    setRubricCriteria((prev) => ([
      ...prev,
      createEmptyCriterion(),
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

  const startEditingAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id)
    setEditTitle(assignment.title || '')
    setEditDescription(assignment.description || '')
    setEditFiles([])
    const initialRubric = rubricToCriteria(assignment.rubric)
    setEditBaselineRubric(initialRubric)
    setEditRubricCriteria(initialRubric)
    setEditRubricRemoved(!initialRubric.length)
    setManageError('')
    setManageStatus('')
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const cancelEditingAssignment = () => {
    setEditingAssignmentId(null)
    setEditTitle('')
    setEditDescription('')
    setEditFiles([])
    setEditRubricCriteria([])
    setEditBaselineRubric([])
    setEditRubricRemoved(false)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const handleEditFileChange = (event) => {
    setManageError('')
    setManageStatus('')
    const incoming = Array.from(event.target.files || [])
    if (event.target) event.target.value = ''
    if (!incoming.length) return
    const next = [...editFiles, ...incoming]
    try {
      validateAttachmentSizes(next)
      setEditFiles(next)
    } catch (err) {
      setManageError(err.message || ATTACHMENT_SIZE_HELP_TEXT)
    }
  }

  const removePendingEditFile = (indexToRemove) => {
    setEditFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleEditAddCriterion = () => {
    setEditRubricRemoved(false)
    setEditRubricCriteria((prev) => ([...prev, createEmptyCriterion()]))
  }

  const handleEditCriterionChange = (index, field, value) => {
    setEditRubricCriteria((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleEditScaleDescriptionChange = (index, score, value) => {
    setEditRubricCriteria((prev) => {
      const next = [...prev]
      const criterion = next[index]
      const scale = { ...(criterion.scaleDescriptions || {}) }
      scale[score] = value
      next[index] = { ...criterion, scaleDescriptions: scale }
      return next
    })
  }

  const handleEditCriterionRemove = (index) => {
    setEditRubricCriteria((prev) => prev.filter((_, i) => i !== index))
  }

  const clearEditRubric = () => {
    setEditRubricCriteria([])
    setEditRubricRemoved(true)
  }

  const restoreEditRubric = () => {
    setEditRubricCriteria(editBaselineRubric)
    setEditRubricRemoved(false)
  }

  const handleExistingAttachmentDelete = async (assignmentId, attachmentId) => {
    if (!attachmentId) return
    setManageError('')
    setManageStatus('')
    try {
      await deleteAssignmentAttachment({ assignmentId, attachmentId })
      await refresh()
      setManageStatus('Attachment removed.')
    } catch (err) {
      setManageError(err.message || 'Unable to remove attachment.')
    }
  }

  const handleAssignmentUpdate = async (event) => {
    event.preventDefault()
    if (!editingAssignmentId) return
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setManageError('A title is required.')
      return
    }
    setManageError('')
    setManageStatus('')
    try {
      validateAttachmentSizes(editFiles)
    } catch (err) {
      setManageError(err.message)
      return
    }
    try {
      setManageLoading(true)
      const rubricPayload = editRubricRemoved ? null : criteriaToRubric(editRubricCriteria)
      await updateAssignment(editingAssignmentId, {
        title: trimmedTitle,
        description: editDescription.trim(),
        rubric: rubricPayload,
      })
      if (editFiles.length) {
        await uploadAssignmentAttachments(editingAssignmentId, editFiles)
      }
      await refresh()
      setManageStatus('Posting updated.')
      cancelEditingAssignment()
    } catch (err) {
      setManageError(err.message || 'Unable to update posting.')
    } finally {
      setManageLoading(false)
    }
  }

  const handleAssignmentDelete = async (assignmentId) => {
    if (!window.confirm('Delete this posting and any related reviews?')) return
    setManageError('')
    setManageStatus('')
    try {
      await deleteAssignment(assignmentId)
      if (editingAssignmentId === assignmentId) {
        cancelEditingAssignment()
      }
      await refresh()
      setManageStatus('Posting deleted.')
    } catch (err) {
      setManageError(err.message || 'Unable to delete posting.')
    }
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
              {backendEnabled
                ? `Upload reference files to share with assigned reviewers (PDF, DOCX, ZIP, etc.). ${ATTACHMENT_SIZE_HELP_TEXT}`
                : 'Enable backend mode to attach files.'}
            </small>
            {attachmentError && (
              <p
                className="error-text"
                role="alert"
                ref={attachmentErrorRef}
                tabIndex={-1}
                aria-live="assertive"
                style={{
                  backgroundColor: '#ffeceb',
                  border: '1px solid #f05b5b',
                  borderRadius: 6,
                  padding: '8px 12px',
                  marginTop: 8,
                }}
              >
                {attachmentError}
              </p>
            )}
            {attachmentFiles.length > 0 && (
              <ul className="attachment-preview" style={{ marginTop: 8 }}>
                {attachmentFiles.map((file, index) => (
                  <li key={`${file.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      className="btn link"
                      onClick={() => handleRemoveAttachment(index)}
                      aria-label={`Remove attachment ${file.name}`}
                    >
                      Remove
                    </button>
                  </li>
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
      <section className="tile" aria-labelledby="mf-posts-title">
        <h2 id="mf-posts-title" className="tile-title">Your posted drafts</h2>
        <div className="tile-content">
          {!backendEnabled && (
            <p className="muted">Demo mode stores postings locally. Enable backend mode to sync across devices.</p>
          )}
          {loading ? (
            <p className="muted">Loading your postings…</p>
          ) : error ? (
            <p className="error-text" role="alert">Unable to load your postings: {error.message}</p>
          ) : sortedAssignments.length === 0 ? (
            <p>You haven't posted any drafts yet. Use the form above to share your work.</p>
          ) : (
            <ul className="stack" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortedAssignments.map((assignment) => {
                const isEditing = editingAssignmentId === assignment.id
                const attachments = assignment.attachments || []
                return (
                  <li key={assignment.id} className="card" style={{ padding: 12 }}>
                    {isEditing ? (
                      <form onSubmit={handleAssignmentUpdate}>
                        <label htmlFor={`edit-title-${assignment.id}`}>Title</label>
                        <input
                          id={`edit-title-${assignment.id}`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                        <label htmlFor={`edit-desc-${assignment.id}`}>Description</label>
                        <textarea
                          id={`edit-desc-${assignment.id}`}
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                        <div style={{ marginTop: 12 }}>
                          <strong>Existing attachments</strong>
                          {attachments.length === 0 ? (
                            <p className="muted">No attachments yet.</p>
                          ) : (
                            <ul style={{ marginTop: 6 }}>
                              {attachments.map((attachment) => (
                                <li key={attachment.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                  <a href={attachment.file} target="_blank" rel="noopener noreferrer">{attachment.original_name}</a>
                                  <button
                                    type="button"
                                    className="btn link danger"
                                    onClick={() => handleExistingAttachmentDelete(assignment.id, attachment.id)}
                                    disabled={manageLoading}
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <label style={{ marginTop: 12 }} htmlFor={`edit-files-${assignment.id}`}>
                          Add more files (optional)
                        </label>
                        <input
                          id={`edit-files-${assignment.id}`}
                          type="file"
                          multiple
                          onChange={handleEditFileChange}
                          ref={editFileInputRef}
                        />
                        <small className="muted">{ATTACHMENT_SIZE_HELP_TEXT}</small>
                        {editFiles.length > 0 && (
                          <ul className="attachment-preview" style={{ marginTop: 8 }}>
                            {editFiles.map((file, index) => (
                              <li key={`${file.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                <span>{file.name}</span>
                                <button type="button" className="btn link" onClick={() => removePendingEditFile(index)}>
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <fieldset style={{ marginTop: 16 }}>
                          <legend>Edit custom rubric (optional)</legend>
                          {editRubricRemoved ? (
                            <p className="muted">Rubric removed for this post.</p>
                          ) : editRubricCriteria.length === 0 ? (
                            <p className="muted">No custom criteria defined.</p>
                          ) : (
                            <div className="rubric-editor" aria-label="Edit rubric criteria">
                              {editRubricCriteria.map((criterion, index) => (
                                <div key={criterion.id} className="rubric-row" style={{ border: '1px solid var(--border-color, #ddd)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <input
                                      type="text"
                                      placeholder="Criterion title"
                                      value={criterion.label}
                                      onChange={(e) => handleEditCriterionChange(index, 'label', e.target.value)}
                                      required
                                      style={{ flex: '1 1 220px' }}
                                    />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <input
                                        type="checkbox"
                                        checked={Boolean(criterion.required)}
                                        onChange={(e) => handleEditCriterionChange(index, 'required', e.target.checked)}
                                      />
                                      Required
                                    </label>
                                    <button type="button" className="btn" onClick={() => handleEditCriterionRemove(index)}>
                                      Remove
                                    </button>
                                  </div>
                                  <textarea
                                    placeholder="Describe expectations"
                                    value={criterion.description}
                                    onChange={(e) => handleEditCriterionChange(index, 'description', e.target.value)}
                                    style={{ width: '100%', marginTop: 8, minHeight: 60 }}
                                  />
                                  <div className="rubric-grid" role="table" style={{ marginTop: 12, overflowX: 'auto' }}>
                                    <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 8, fontWeight: 600 }}>
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <div key={`edit-head-${criterion.id}-${score}`} role="columnheader" style={{ textAlign: 'center' }}>{score} pt{score !== 1 ? 's' : ''}</div>
                                      ))}
                                    </div>
                                    <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))', gap: 8, marginTop: 8 }}>
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <textarea
                                          key={`edit-cell-${criterion.id}-${score}`}
                                          value={criterion.scaleDescriptions?.[score] || ''}
                                          onChange={(e) => handleEditScaleDescriptionChange(index, score, e.target.value)}
                                          placeholder={`Describe what earns ${score} point${score !== 1 ? 's' : ''}`}
                                          style={{ width: '100%', minHeight: 70 }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            <button type="button" className="btn" onClick={handleEditAddCriterion}>
                              {editRubricCriteria.length > 0 || !editRubricRemoved ? 'Add another criterion' : 'Create rubric'}
                            </button>
                            {(!editRubricRemoved && (editRubricCriteria.length > 0)) && (
                              <button type="button" className="btn link danger" onClick={clearEditRubric}>
                                Remove rubric
                              </button>
                            )}
                            {editRubricRemoved && editBaselineRubric.length > 0 && (
                              <button type="button" className="btn link" onClick={restoreEditRubric}>
                                Restore saved rubric
                              </button>
                            )}
                          </div>
                        </fieldset>
                        {manageError && (
                          <p className="error-text" role="alert" style={{ marginTop: 8 }}>{manageError}</p>
                        )}
                        <div className="actions" style={{ marginTop: 12 }}>
                          <button type="submit" className="btn" disabled={manageLoading}>
                            {manageLoading ? 'Saving…' : 'Save changes'}
                          </button>
                          <button type="button" className="btn link" onClick={cancelEditingAssignment} disabled={manageLoading}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <strong>{assignment.title}</strong>
                          {assignment.description && <p>{assignment.description}</p>}
                          <small className="muted">
                            Posted {new Date(assignment.created_at || assignment.createdAt || Date.now()).toLocaleString()}
                          </small>
                        </div>
                        {attachments.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <strong>Attachments</strong>
                            <ul>
                              {attachments.map((attachment) => (
                                <li key={attachment.id}>
                                  <a href={attachment.file} target="_blank" rel="noopener noreferrer">{attachment.original_name}</a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="actions" style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn link" onClick={() => startEditingAssignment(assignment)}>
                            Edit
                          </button>
                          <button type="button" className="btn link danger" onClick={() => handleAssignmentDelete(assignment.id)}>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {manageStatus && (
            <p className="success-text" role="status" style={{ marginTop: 12 }}>{manageStatus}</p>
          )}
          {manageError && !editingAssignmentId && (
            <p className="error-text" role="alert" style={{ marginTop: 12 }}>{manageError}</p>
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
