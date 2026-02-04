import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.js'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useReviewerMatches() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [remoteMatches, setRemoteMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMatches = useCallback(async () => {
    if (!backendEnabled) return []
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/assignment-reviewers/')
      const normalized = normalizeList(data)
      setRemoteMatches(normalized)
      return normalized
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled])

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet('/assignment-reviewers/')
        if (!cancelled) setRemoteMatches(normalizeList(data))
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [backendEnabled])

  const {
    assignments: mockAssignments,
    matches: mockMatches,
    currentUser,
  } = mockStore

  const fallbackMatches = useMemo(() => (
    mockAssignments
      .filter(a => mockMatches[a.id] === currentUser)
      .map(a => ({
        id: a.id,
        assignment: a,
        alias: currentUser,
        assigned_at: null,
        user: { username: currentUser },
        _mock: true,
      }))
  ), [mockAssignments, mockMatches, currentUser])

  const refresh = useCallback(() => {
    if (!backendEnabled) {
      return Promise.resolve(fallbackMatches)
    }
    return fetchMatches()
  }, [backendEnabled, fetchMatches, fallbackMatches])

  return {
    backendEnabled,
    matches: backendEnabled ? remoteMatches : fallbackMatches,
    loading: backendEnabled ? loading : false,
    error: backendEnabled ? error : null,
    refresh,
  }
}

export function useMatchActions({ onSuccess } = {}) {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { setMatch, generateMatches, currentUser } = mockStore

  const claimAssignment = useCallback(async ({ assignmentId } = {}) => {
    if (!backendEnabled) {
      if (assignmentId) {
        setMatch(assignmentId, currentUser)
      } else {
        generateMatches()
      }
      if (onSuccess) onSuccess()
      return { _mock: true }
    }

    setLoading(true)
    setError(null)
    try {
      const payload = assignmentId ? { assignment: assignmentId } : {}
      const claimed = await apiPost('/assignment-reviewers/claim/', payload)
      if (onSuccess) onSuccess()
      return claimed
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, generateMatches, setMatch, currentUser, onSuccess])

  return {
    backendEnabled,
    loading,
    error,
    claimAssignment,
  }
}

export function useAvailableAssignmentsForReview() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [remoteAssignments, setRemoteAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAvailable = useCallback(async () => {
    if (!backendEnabled) return []
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/assignment-reviewers/available/')
      setRemoteAssignments(normalizeList(data) || [])
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled])

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet('/assignment-reviewers/available/')
        if (!cancelled) setRemoteAssignments(normalizeList(data) || [])
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [backendEnabled])

  const { assignments: mockAssignments, currentUser } = mockStore

  const fallbackAssignments = useMemo(() => (
    mockAssignments.filter(a => a.owner && a.owner !== currentUser)
  ), [mockAssignments, currentUser])

  const refresh = useCallback(() => {
    if (!backendEnabled) return Promise.resolve(fallbackAssignments)
    return fetchAvailable()
  }, [backendEnabled, fetchAvailable, fallbackAssignments])

  return {
    backendEnabled,
    assignments: backendEnabled ? remoteAssignments : fallbackAssignments,
    loading: backendEnabled ? loading : false,
    error: backendEnabled ? error : null,
    refresh,
  }
}
