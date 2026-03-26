import { useCallback, useEffect, useMemo, useState } from 'react'

import { apiDelete, apiGet, apiPatch, apiPost, isBackendEnabled } from '../api/client.js'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useCoursesGroupsData(options = {}) {
  const backendEnabled = isBackendEnabled()
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)
  const courseId = options.courseId || ''

  const load = useCallback(async () => {
    if (!backendEnabled) {
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [courseData, enrollmentData, usersData] = await Promise.all([
        apiGet('/courses/'),
        apiGet(courseId ? `/enrollments/?course=${courseId}` : '/enrollments/'),
        apiGet('/users/'),
      ])
      setCourses(normalizeList(courseData))
      setEnrollments(normalizeList(enrollmentData))
      setUsers(normalizeList(usersData))
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, courseId])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  const createCourse = useCallback(async (payload) => {
    const created = await apiPost('/courses/', payload)
    setCourses(prev => [...prev, created])
    return created
  }, [])

  const updateCourse = useCallback(async (course, payload) => {
    const updated = await apiPatch(`/courses/${course.id}/`, payload)
    setCourses(prev => prev.map(item => (item.id === updated.id ? updated : item)))
    return updated
  }, [])

  const deleteCourse = useCallback(async (courseIdToDelete) => {
    await apiDelete(`/courses/${courseIdToDelete}/`)
    setCourses(prev => prev.filter(item => item.id !== courseIdToDelete))
    setEnrollments(prev => prev.filter(item => item.course !== courseIdToDelete))
  }, [])

  const createEnrollment = useCallback(async (payload) => {
    const created = await apiPost('/enrollments/', payload)
    setEnrollments(prev => [...prev, created])
    return created
  }, [])

  const inviteEnrollment = useCallback(async ({ course, email, role = 'student' }) => {
    const response = await apiPost('/enrollments/invite/', { course, email, role })
    if (response?.enrollment) {
      setEnrollments(prev => {
        const exists = prev.some(item => item.id === response.enrollment.id)
        if (exists) return prev.map(item => (item.id === response.enrollment.id ? response.enrollment : item))
        return [...prev, response.enrollment]
      })
    }
    return response
  }, [])

  const updateEnrollment = useCallback(async (enrollment, payload) => {
    const updated = await apiPatch(`/enrollments/${enrollment.id}/`, payload)
    setEnrollments(prev => prev.map(item => (item.id === updated.id ? updated : item)))
    return updated
  }, [])

  const deleteEnrollment = useCallback(async (enrollmentId) => {
    await apiDelete(`/enrollments/${enrollmentId}/`)
    setEnrollments(prev => prev.filter(item => item.id !== enrollmentId))
  }, [])

  const availableStudents = useMemo(() => (
    users.filter((user) => user.role === 'student' || user.role === 'instructor')
  ), [users])

  return {
    backendEnabled,
    courses,
    enrollments,
    users,
    availableStudents,
    loading,
    error,
    refresh: load,
    createCourse,
    updateCourse,
    deleteCourse,
    createEnrollment,
    inviteEnrollment,
    updateEnrollment,
    deleteEnrollment,
  }
}
