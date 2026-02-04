import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, isBackendEnabled } from '../api/client'
import { useMockStore } from '../store/mockStore.js'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

const DEFAULT_COURSE_ID = import.meta.env.VITE_DEFAULT_COURSE_ID
  ? Number(import.meta.env.VITE_DEFAULT_COURSE_ID)
  : null

export function useAssignmentsData() {
  const mockStore = useMockStore()
  const backendEnabled = isBackendEnabled()
  const [remoteAssignments, setRemoteAssignments] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false

    async function fetchAssignments() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet('/assignments/')
        if (!cancelled) {
          setRemoteAssignments(normalizeList(data))
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAssignments()
    return () => { cancelled = true }
  }, [backendEnabled])

  const createAssignment = useCallback(async (payload) => {
    if (!payload?.title) throw new Error('Title is required')

    if (!backendEnabled) {
      mockStore.addAssignment({ title: payload.title, description: payload.description || '' })
      return null
    }

    const courseId = payload.course ?? DEFAULT_COURSE_ID
    if (!courseId) {
      throw new Error('Set VITE_DEFAULT_COURSE_ID to a valid backend course id to post assignments.')
    }

    const created = await apiPost('/assignments/', {
      title: payload.title,
      description: payload.description || '',
      allow_self_assessment: true,
      anonymize_reviewers: true,
      rubric: {},
      ...payload,
      course: courseId,
    })
    setRemoteAssignments(prev => [created, ...prev])
    return created
  }, [backendEnabled, mockStore])

  const assignments = useMemo(() => (
    backendEnabled ? remoteAssignments : mockStore.assignments
  ), [backendEnabled, remoteAssignments, mockStore.assignments])

  return {
    backendEnabled,
    assignments,
    loading,
    error,
    createAssignment,
  }
}
