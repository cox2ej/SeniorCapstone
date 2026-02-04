import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.js'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useReviewsData({ role = 'received', assignmentId } = {}) {
  const mockStore = useMockStore()
  const backendEnabled = isBackendEnabled()
  const [remoteReviews, setRemoteReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false

    async function fetchReviews() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ role })
        if (assignmentId) params.set('assignment', assignmentId)
        const data = await apiGet(`/feedback/?${params.toString()}`)
        if (!cancelled) setRemoteReviews(normalizeList(data))
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReviews()
    return () => { cancelled = true }
  }, [backendEnabled, role, assignmentId])

  const reviews = useMemo(() => {
    if (backendEnabled) return remoteReviews

    const { currentUser, reviews: mockReviews, getAssignmentById } = mockStore
    const byOwner = role === 'received'
      ? mockReviews.filter(r => {
          const a = getAssignmentById(r.assignmentId)
          return a && a.owner === currentUser
        })
      : mockReviews.filter(r => r.reviewer === currentUser)
    const filtered = assignmentId ? byOwner.filter(r => r.assignmentId === assignmentId) : byOwner
    return filtered
  }, [backendEnabled, remoteReviews, role, assignmentId, mockStore])

  return {
    backendEnabled,
    reviews,
    loading,
    error,
  }
}

export function useReviewActions() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submitReview = useCallback(async ({ assignmentId, rating, comments }) => {
    if (!assignmentId) throw new Error('Assignment is required')
    if (!rating) throw new Error('Rating is required')

    if (!backendEnabled) {
      mockStore.addReview({ assignmentId, rating: Number(rating), comments })
      return null
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        assignment: assignmentId,
        rating: Number(rating),
        comments: comments || '',
        status: 'submitted',
        rubric_scores: {},
      }
      const created = await apiPost('/feedback/', payload)
      return created
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, mockStore])

  return {
    backendEnabled,
    loading,
    error,
    submitReview,
  }
}
