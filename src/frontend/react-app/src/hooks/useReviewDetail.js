import { useCallback, useEffect, useState } from 'react'

import { apiGet, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.jsx'

export function useReviewDetail(reviewId) {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(Boolean(reviewId))
  const [error, setError] = useState(null)

  const fetchReview = useCallback(async () => {
    if (!reviewId) {
      setReview(null)
      setLoading(false)
      return null
    }
    setLoading(true)
    setError(null)
    if (!backendEnabled) {
      const found = mockStore.reviews.find(r => String(r.id) === String(reviewId)) || null
      if (found) {
        const assignment = mockStore.getAssignmentById(found.assignmentId)
        const augmented = {
          ...found,
          assignment_detail: assignment ? {
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            rubric: assignment.rubric,
            attachments: assignment.attachments || [],
            created_by: assignment.owner ? { display_name: mockStore.users[assignment.owner]?.name || assignment.owner } : null,
          } : null,
        }
        setReview(augmented)
      } else {
        setReview(null)
        setError(new Error('Review not found.'))
      }
      setLoading(false)
      return found
    }
    try {
      const data = await apiGet(`/feedback/${reviewId}/`)
      setReview(data)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [reviewId, backendEnabled, mockStore])

  useEffect(() => {
    fetchReview().catch(() => {})
  }, [fetchReview])

  return {
    backendEnabled,
    review,
    loading,
    error,
    refresh: fetchReview,
  }
}
