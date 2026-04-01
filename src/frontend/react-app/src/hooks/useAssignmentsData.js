import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost, isBackendEnabled } from '../api/client'
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

export function useAssignmentsData(options = {}) {
  const mockStore = useMockStore()
  const backendEnabled = isBackendEnabled()
  const [remoteAssignments, setRemoteAssignments] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)
  const query = options.query || ''

  const fetchAssignments = useCallback(async () => {
    if (!backendEnabled) return []
    const path = query ? `/assignments/?${query}` : '/assignments/'
    return apiGet(path)
  }, [backendEnabled, query])

  useEffect(() => {
    let cancelled = false
    if (!backendEnabled) {
      setRemoteAssignments([])
      setLoading(false)
      setError(null)
      return undefined
    }

    setLoading(true)
    setError(null)
    fetchAssignments()
      .then((data) => {
        if (!cancelled) setRemoteAssignments(normalizeList(data))
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [backendEnabled, fetchAssignments])

  const refresh = useCallback(async () => {
    if (!backendEnabled) return []
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAssignments()
      setRemoteAssignments(normalizeList(data))
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, fetchAssignments])

  const uploadAssignmentAttachments = useCallback(async (assignmentId, files = []) => {
    if (!files.length) return []

    if (!backendEnabled) {
      const generated = files.map((file, index) => ({
        id: `local-attach-${Date.now()}-${index}`,
        original_name: file.name,
        file: URL.createObjectURL(file),
      }))
      const existing = mockStore.getAssignmentById(assignmentId)
      const next = [...(existing?.attachments || []), ...generated]
      mockStore.updateAssignment(assignmentId, { attachments: next })
      return generated
    }

    const uploaded = []
    for (const file of files) {
      if (!file) continue
      const formData = new FormData()
      formData.append('assignment', assignmentId)
      formData.append('file', file)
      const attachment = await apiPost('/attachments/', formData)
      uploaded.push(attachment)
    }

    if (uploaded.length) {
      setRemoteAssignments((prev) => prev.map((assignment) => (
        assignment.id === assignmentId
          ? { ...assignment, attachments: [...(assignment.attachments || []), ...uploaded] }
          : assignment
      )))
    }

    return uploaded
  }, [backendEnabled, mockStore])

  const deleteAssignmentAttachment = useCallback(async ({ assignmentId, attachmentId }) => {
    if (!attachmentId) return

    if (!backendEnabled) {
      const existing = mockStore.getAssignmentById(assignmentId)
      const next = (existing?.attachments || []).filter((attachment) => String(attachment.id) !== String(attachmentId))
      mockStore.updateAssignment(assignmentId, { attachments: next })
      return
    }

    await apiDelete(`/attachments/${attachmentId}/`)
    setRemoteAssignments((prev) => prev.map((assignment) => (
      assignment.id === assignmentId
        ? { ...assignment, attachments: (assignment.attachments || []).filter((attachment) => attachment.id !== attachmentId) }
        : assignment
    )))
  }, [backendEnabled, mockStore])

  const createAssignment = useCallback(async (payload) => {
    if (!payload?.title) throw new Error('Title is required')

    if (!backendEnabled) {
      mockStore.addAssignment({ title: payload.title, description: payload.description || '', rubric: payload.rubric })
      return null
    }

    const { attachments: attachmentFiles = [], rubric, ...restPayload } = payload
    const courseId = payload.course ?? DEFAULT_COURSE_ID
    if (!courseId) {
      throw new Error('Set VITE_DEFAULT_COURSE_ID to a valid backend course id to post assignments.')
    }

    const created = await apiPost('/assignments/', {
      title: restPayload.title,
      description: restPayload.description || '',
      allow_self_assessment: true,
      anonymize_reviewers: true,
      rubric: rubric || {},
      ...restPayload,
      course: courseId,
    })

    let result = created
    if (attachmentFiles.length) {
      const uploaded = await uploadAssignmentAttachments(created.id, Array.from(attachmentFiles))
      result = { ...created, attachments: uploaded }
    }

    setRemoteAssignments(prev => [result, ...prev])
    return result
  }, [backendEnabled, mockStore, uploadAssignmentAttachments])

  const updateAssignment = useCallback(async (assignmentId, updates) => {
    if (!assignmentId) throw new Error('Assignment ID is required')
    if (!updates) return null

    if (!backendEnabled) {
      mockStore.updateAssignment(assignmentId, updates)
      return null
    }

    const response = await apiPatch(`/assignments/${assignmentId}/`, updates)
    setRemoteAssignments((prev) => prev.map((assignment) => (
      assignment.id === response.id ? response : assignment
    )))
    return response
  }, [backendEnabled, mockStore])

  const deleteAssignment = useCallback(async (assignmentId) => {
    if (!assignmentId) return

    if (!backendEnabled) {
      mockStore.deleteAssignment(assignmentId)
      return
    }

    await apiDelete(`/assignments/${assignmentId}/`)
    setRemoteAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId))
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
    updateAssignment,
    deleteAssignment,
    uploadAssignmentAttachments,
    deleteAssignmentAttachment,
    refresh,
  }
}
