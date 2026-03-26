import { useCallback, useEffect, useState } from 'react'

import { apiGet, apiPatch, isBackendEnabled } from '../api/client.js'
import { useMockStore } from '../store/mockStore.jsx'

export function useCurrentUser() {
  const backendEnabled = isBackendEnabled()
  const mockStore = useMockStore()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!backendEnabled) {
      const mockUser = mockStore.users[mockStore.currentUser] || { id: mockStore.currentUser, name: mockStore.currentUser }
      const mockPayload = {
        id: mockUser.id,
        username: mockUser.id,
        display_name: mockUser.name,
        email: '',
        role: 'student',
        timezone: 'UTC',
        agreed_to_privacy: false,
      }
      setUser(mockPayload)
      setLoading(false)
      setError(null)
      return mockPayload
    }

    setLoading(true)
    setError(null)
    try {
      const data = await apiGet('/users/me/')
      setUser(data)
      return data
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, mockStore])

  const update = useCallback(async (updates) => {
    if (!backendEnabled) {
      setUser(prev => ({ ...(prev || {}), ...updates }))
      return { ...(user || {}), ...updates }
    }
    const updated = await apiPatch('/users/me/', updates)
    setUser(updated)
    return updated
  }, [backendEnabled, user])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  return {
    backendEnabled,
    user,
    loading,
    error,
    refresh,
    update,
  }
}
