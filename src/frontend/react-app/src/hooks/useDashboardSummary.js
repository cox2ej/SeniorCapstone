import { useCallback, useEffect, useMemo, useState } from 'react'

import { apiGet, isBackendEnabled } from '../api/client'
import { useMockStore } from '../store/mockStore.jsx'

const DEFAULT_SUMMARY = {
  role: null,
  assignments_posted: 0,
  reviews_given: 0,
  reviews_received: 0,
  pending_reviews: 0,
  average_rating_given: null,
  average_rating_received: null,
  course_assignments: null,
  course_reviews: null,
  pending_reviews_for_course: null,
  average_rating_for_course: null,
}

const avg = (values) => {
  if (!values || values.length === 0) return null
  const sum = values.reduce((total, value) => total + Number(value || 0), 0)
  return sum / values.length
}

const clampZero = (value) => (value < 0 ? 0 : value)

export function useDashboardSummary() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()

  const mockSummary = useMemo(() => {
    if (backendEnabled) return DEFAULT_SUMMARY
    const assignments = mockStore.assignments || []
    const reviews = mockStore.reviews || []
    const currentUser = mockStore.currentUser

    const assignmentsPosted = assignments.filter(a => a.owner === currentUser)
    const reviewsGiven = reviews.filter(r => r.reviewer === currentUser)
    const reviewsReceived = reviews.filter(r => {
      const assignment = assignments.find(a => a.id === r.assignmentId)
      return assignment && assignment.owner === currentUser
    })
    const queue = assignments.filter(a => a.owner !== currentUser)
    const pendingReviews = clampZero(queue.length - reviewsGiven.length)

    return {
      ...DEFAULT_SUMMARY,
      role: 'student',
      assignments_posted: assignmentsPosted.length,
      reviews_given: reviewsGiven.length,
      reviews_received: reviewsReceived.length,
      pending_reviews: pendingReviews,
      average_rating_given: avg(reviewsGiven.map(r => r.rating)),
      average_rating_received: avg(reviewsReceived.map(r => r.rating)),
    }
  }, [backendEnabled, mockStore.assignments, mockStore.reviews, mockStore.currentUser])

  const [summary, setSummary] = useState(DEFAULT_SUMMARY)
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  const fetchSummary = useCallback(async () => {
    if (!backendEnabled) return mockSummary
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/dashboard/summary/')
      setSummary({ ...DEFAULT_SUMMARY, ...data })
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, mockSummary])

  useEffect(() => {
    if (!backendEnabled) {
      setSummary(mockSummary)
      setLoading(false)
      setError(null)
      return undefined
    }

    let cancelled = false
    async function load() {
      try {
        const data = await fetchSummary()
        if (!cancelled) {
          setSummary({ ...DEFAULT_SUMMARY, ...data })
        }
      } catch {
        /* errors handled in fetchSummary */
      }
    }
    load()
    return () => { cancelled = true }
  }, [backendEnabled, mockSummary, fetchSummary])

  return {
    backendEnabled,
    summary: backendEnabled ? summary : mockSummary,
    loading,
    error,
    refresh: fetchSummary,
  }
}
