import { useCallback, useEffect, useMemo, useState } from 'react'

import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.jsx'

const normalizeNotifications = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useNotifications() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  const mockNotifications = useMemo(() => {
    if (backendEnabled) return []
    const events = []
    const { assignments, reviews, users, currentUser, getAssignmentById } = mockStore
    assignments.forEach(a => {
      events.push({
        id: `assignment-${a.id}`,
        message: `Assignment posted by ${users[a.owner]?.name || a.owner}: ${a.title}`,
        created_at: a.createdAt || new Date().toISOString(),
        is_read: false,
      })
    })
    reviews.forEach(r => {
      const assignment = getAssignmentById(r.assignmentId)
      if (!assignment) return
      const received = assignment.owner === currentUser
      const who = users[r.reviewer]?.name || r.reviewer
      events.push({
        id: `review-${r.id}`,
        message: received
          ? `New review received on ${assignment.title} by ${who} — Rating ${r.rating}`
          : `You reviewed ${users[assignment.owner]?.name || assignment.owner}'s ${assignment.title}`,
        created_at: r.createdAt || new Date().toISOString(),
        is_read: false,
      })
    })
    return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }, [backendEnabled, mockStore])

  const fetchNotifications = useCallback(async () => {
    if (!backendEnabled) return mockNotifications
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/notifications/')
      const normalized = normalizeNotifications(data)
      setItems(normalized)
      return normalized
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, mockNotifications])

  const markRead = useCallback(async (id) => {
    if (!backendEnabled) return
    await apiPost(`/notifications/${id}/mark-read/`, {})
    setItems(prev => prev.map(item => (item.id === id ? { ...item, is_read: true } : item)))
  }, [backendEnabled])

  const markAllRead = useCallback(async () => {
    if (!backendEnabled) return
    await apiPost('/notifications/mark-all-read/', {})
    setItems(prev => prev.map(item => ({ ...item, is_read: true })))
  }, [backendEnabled])

  useEffect(() => {
    if (!backendEnabled) {
      setItems(mockNotifications)
      setLoading(false)
      setError(null)
      return undefined
    }
    let cancelled = false
    async function load() {
      try {
        const data = await fetchNotifications()
        if (!cancelled) setItems(data)
      } catch {
        /* handled */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [backendEnabled, mockNotifications, fetchNotifications])

  return {
    backendEnabled,
    notifications: backendEnabled ? items : mockNotifications,
    loading,
    error,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
  }
}
