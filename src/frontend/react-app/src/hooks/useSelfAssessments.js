import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.js'
import { useCallback, useEffect, useState } from 'react'

export function useSelfAssessments(options = {}) {
  const mockStore = useMockStore()
  const backendEnabled = isBackendEnabled()
  const [remoteItems, setRemoteItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const assignmentId = options.assignmentId

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function fetchItems() {
      setLoading(true)
      setError(null)
      try {
        const query = assignmentId ? `?assignment=${assignmentId}` : ''
        const data = await apiGet(`/self-assessments/${query}`)
        if (!cancelled) setRemoteItems(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchItems()
    return () => { cancelled = true }
  }, [backendEnabled, assignmentId])

  const submit = useCallback(async ({ assignmentId: aId, rating, comments }) => {
    if (!aId) throw new Error('Assignment is required')
    if (!rating) throw new Error('Rating is required')

    if (!backendEnabled) {
      mockStore.addSelfAssessment({ assignmentId: aId, rating: Number(rating), comments })
      return null
    }

    const payload = {
      assignment: aId,
      rating: Number(rating),
      comments: comments || '',
    }
    const created = await apiPost('/self-assessments/', payload)
    setRemoteItems(prev => [created, ...prev])
    return created
  }, [backendEnabled, mockStore])

  const items = backendEnabled ? remoteItems : mockStore.selfAssessments

  return {
    backendEnabled,
    loading,
    error,
    items,
    submit,
  }
}
