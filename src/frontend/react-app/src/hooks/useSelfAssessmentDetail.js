import { useCallback, useEffect, useState } from 'react'

import { apiGet, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.jsx'

export function useSelfAssessmentDetail(selfAssessmentId) {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(Boolean(selfAssessmentId))
  const [error, setError] = useState(null)

  const fetchAssessment = useCallback(async () => {
    if (!selfAssessmentId) {
      setAssessment(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    setError(null)

    if (!backendEnabled) {
      const found = mockStore.selfAssessments.find((item) => String(item.id) === String(selfAssessmentId)) || null
      if (found) {
        const assignment = mockStore.getAssignmentById(found.assignmentId)
        const augmented = {
          ...found,
          assignment: found.assignmentId,
          assignment_detail: assignment ? {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            rubric: assignment.rubric,
            attachments: assignment.attachments || [],
          } : null,
          rubric_scores: found.rubricScores || {},
        }
        setAssessment(augmented)
      } else {
        setAssessment(null)
        setError(new Error('Self-assessment not found.'))
      }
      setLoading(false)
      return found
    }

    try {
      const data = await apiGet(`/self-assessments/${selfAssessmentId}/`)
      setAssessment(data)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selfAssessmentId, backendEnabled, mockStore])

  useEffect(() => {
    fetchAssessment().catch(() => {})
  }, [fetchAssessment])

  return {
    backendEnabled,
    assessment,
    loading,
    error,
    refresh: fetchAssessment,
  }
}
