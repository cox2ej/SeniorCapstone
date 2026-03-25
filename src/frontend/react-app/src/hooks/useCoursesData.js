import { useEffect, useMemo, useState } from 'react'

import { apiGet, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.jsx'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useCoursesData() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [remoteCourses, setRemoteCourses] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!backendEnabled) {
      setLoading(false)
      setError(null)
      return undefined
    }

    let cancelled = false
    async function fetchCourses() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet('/courses/')
        if (!cancelled) setRemoteCourses(normalizeList(data))
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCourses()
    return () => { cancelled = true }
  }, [backendEnabled])

  const courses = useMemo(() => {
    if (backendEnabled) return remoteCourses
    const ownerCourses = mockStore.assignments
      .filter((assignment) => assignment.owner === mockStore.currentUser)
      .map((assignment, index) => ({
        id: assignment.id || `mock-course-${index}`,
        code: 'DEMO',
        title: assignment.title,
        term: '',
      }))
    return ownerCourses
  }, [backendEnabled, remoteCourses, mockStore.assignments, mockStore.currentUser])

  return {
    backendEnabled,
    courses,
    loading,
    error,
  }
}
