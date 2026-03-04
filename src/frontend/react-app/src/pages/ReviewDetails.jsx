import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'

import { useReviewDetail } from '../hooks/useReviewDetail.js'
import RubricMatrix from '../components/RubricMatrix.jsx'

const formatDateTime = (value) => {
  if (!value) return ''
  try {
    const date = new Date(value)
    return date.toLocaleString()
  } catch {
    return ''
  }
}

export default function ReviewDetails() {
  const { reviewId } = useParams()
  const navigate = useNavigate()
  const { review, loading, error, refresh } = useReviewDetail(reviewId)

  const assignment = review?.assignment_detail
  const rubricCriteria = useMemo(() => (
    assignment?.rubric?.criteria || []
  ), [assignment?.rubric])

  const attachments = assignment?.attachments || []
  const reviewerLabel = review?.reviewer_alias
    || review?.reviewer_user?.display_name
    || review?.reviewer_user?.username
    || ''
  const submittedAt = review ? formatDateTime(review.submitted_at || review.updated_at) : ''
  const rubricScores = review?.rubric_scores || {}

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Review details</h1>
          <p className="muted">Full view of the feedback you received.</p>
        </div>
        <div className="actions" style={{ gap: 8 }}>
          <button type="button" className="btn" onClick={() => navigate(-1)}>Back</button>
          <button type="button" className="btn" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>

      {loading && <p aria-busy="true">Loading review…</p>}
      {error && (
        <p role="alert" className="error-text">
          {error.message || 'Unable to load review.'}
        </p>
      )}

      {review && (
        <>
          <section className="tile" aria-labelledby="rd-summary-title">
            <h2 id="rd-summary-title" className="tile-title">Summary</h2>
            <div className="tile-content">
              <p>
                <strong>Assignment:</strong> {assignment?.title || 'Unknown assignment'}
                {assignment?.description && (
                  <span className="muted"> — {assignment.description}</span>
                )}
              </p>
              {assignment?.id && (
                <p>
                  <Link to={`/feedback-history?assignmentId=${assignment.id}`} className="btn link">View assignment history</Link>
                </p>
              )}
              <p><strong>Rating:</strong> {review.rating}</p>
              <p><strong>Reviewer:</strong> {reviewerLabel || 'Anonymous reviewer'}</p>
              <p><strong>Submitted:</strong> {submittedAt || '—'}</p>
              {review.comments && (
                <div>
                  <strong>Comments:</strong>
                  <p style={{ marginTop: 4 }}>{review.comments}</p>
                </div>
              )}
            </div>
          </section>

          {attachments.length > 0 && (
            <section className="tile" aria-labelledby="rd-attachments-title">
              <h2 id="rd-attachments-title" className="tile-title">Assignment attachments</h2>
              <div className="tile-content">
                <ul>
                  {attachments.map((file) => (
                    <li key={file.id || file.file}>
                      {file.file ? (
                        <a href={file.file} target="_blank" rel="noreferrer" download={file.original_name || undefined}>
                          {file.original_name || file.file.split('/').pop()}
                        </a>
                      ) : (
                        <span>{file.original_name || 'Attachment'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="tile" aria-labelledby="rd-rubric-title">
            <h2 id="rd-rubric-title" className="tile-title">Rubric scores</h2>
            <div className="tile-content">
              <RubricMatrix
                criteria={rubricCriteria}
                selectedScores={rubricScores}
                readonly
                emptyLabel="This review did not use a rubric."
              />
            </div>
          </section>
        </>
      )}

      {!loading && !review && !error && (
        <p>No review data found. Double-check the link or return to <Link to="/feedback-history">Feedback History</Link>.</p>
      )}
    </>
  )
}
