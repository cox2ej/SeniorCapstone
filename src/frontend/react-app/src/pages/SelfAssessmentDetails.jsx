import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMemo } from 'react'

import RubricMatrix from '../components/RubricMatrix.jsx'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useSelfAssessmentDetail } from '../hooks/useSelfAssessmentDetail.js'

const formatDateTime = (value) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString()
  } catch {
    return ''
  }
}

export default function SelfAssessmentDetails() {
  const { selfAssessmentId } = useParams()
  const navigate = useNavigate()
  const { assessment, loading, error, refresh } = useSelfAssessmentDetail(selfAssessmentId)
  const { assignments } = useAssignmentsData({ query: 'role=mine' })

  const assignment = useMemo(() => {
    if (assessment?.assignment_detail) return assessment.assignment_detail
    const assignmentId = assessment?.assignment || assessment?.assignmentId
    return assignments.find((item) => String(item.id) === String(assignmentId)) || null
  }, [assessment, assignments])

  const rubricCriteria = assignment?.rubric?.criteria || []
  const rubricScores = assessment?.rubric_scores || assessment?.rubricScores || {}
  const attachments = assignment?.attachments || []
  const submittedAt = formatDateTime(assessment?.submitted_at || assessment?.createdAt || assessment?.created_at)

  return (
    <>
      <div className="header-row">
        <div>
          <h1>Self-assessment details</h1>
          <p className="muted">Review your submitted reflection and rubric scores.</p>
        </div>
        <div className="actions" style={{ gap: 8 }}>
          <button type="button" className="btn" onClick={() => navigate(-1)}>Back</button>
          <button type="button" className="btn" onClick={refresh} disabled={loading}>Refresh</button>
        </div>
      </div>

      {loading && <p aria-busy="true">Loading self-assessment…</p>}
      {error && (
        <p role="alert" className="error-text">
          {error.message || 'Unable to load self-assessment.'}
        </p>
      )}

      {assessment && (
        <>
          <section className="tile" aria-labelledby="sad-summary-title">
            <h2 id="sad-summary-title" className="tile-title">Summary</h2>
            <div className="tile-content">
              <p>
                <strong>Assignment:</strong> {assignment?.title || 'Unknown assignment'}
                {assignment?.description && (
                  <span className="muted"> — {assignment.description}</span>
                )}
              </p>
              {(assignment?.id || assessment?.assignment || assessment?.assignmentId) && (
                <p>
                  <Link
                    to={`/feedback-history?assignmentId=${assignment?.id || assessment?.assignment || assessment?.assignmentId}`}
                    className="btn link"
                  >
                    View assignment history
                  </Link>
                </p>
              )}
              <p><strong>Overall rating:</strong> {assessment.rating}</p>
              <p><strong>Submitted:</strong> {submittedAt || '—'}</p>
              {assessment.comments && (
                <div>
                  <strong>Reflection comments:</strong>
                  <p style={{ marginTop: 4 }}>{assessment.comments}</p>
                </div>
              )}
            </div>
          </section>

          {attachments.length > 0 && (
            <section className="tile" aria-labelledby="sad-attachments-title">
              <h2 id="sad-attachments-title" className="tile-title">Assignment attachments</h2>
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

          <section className="tile" aria-labelledby="sad-rubric-title">
            <h2 id="sad-rubric-title" className="tile-title">Rubric scores</h2>
            <div className="tile-content">
              <RubricMatrix
                criteria={rubricCriteria}
                selectedScores={rubricScores}
                readonly
                emptyLabel="This self-assessment did not include rubric scores."
              />
            </div>
          </section>
        </>
      )}

      {!loading && !assessment && !error && (
        <p>No self-assessment found. Return to <Link to="/feedback-history">Feedback History</Link>.</p>
      )}
    </>
  )
}
