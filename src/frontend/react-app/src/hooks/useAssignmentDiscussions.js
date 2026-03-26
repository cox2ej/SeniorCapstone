import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'

const normalizeList = (payload) => {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  return []
}

export function useAssignmentDiscussions({ courseId } = {}) {
  const backendEnabled = isBackendEnabled()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(backendEnabled)
  const [error, setError] = useState(null)

  const fetchPosts = useCallback(async () => {
    if (!backendEnabled) return []
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (courseId) params.set('course', String(courseId))
      const path = params.toString()
        ? `/assignment-discussion-posts/?${params.toString()}`
        : '/assignment-discussion-posts/'
      const data = await apiGet(path)
      const normalized = normalizeList(data)
      setItems(normalized)
      return normalized
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [backendEnabled, courseId])

  useEffect(() => {
    if (!backendEnabled) {
      setItems([])
      setLoading(false)
      setError(null)
      return undefined
    }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (courseId) params.set('course', String(courseId))
        const path = params.toString()
          ? `/assignment-discussion-posts/?${params.toString()}`
          : '/assignment-discussion-posts/'
        const data = await apiGet(path)
        if (!cancelled) {
          setItems(normalizeList(data))
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [backendEnabled, courseId])

  const postsByAssignment = useMemo(() => {
    const itemsMap = items.reduce((acc, post) => {
      acc[post.id] = { ...post, replies: [] }
      return acc
    }, {})
    
    // Build the tree structure
    items.forEach(post => {
      if (post.parent && itemsMap[post.parent]) {
        itemsMap[post.parent].replies.push(itemsMap[post.id])
      }
    })
    
    // Group by assignment, only including root posts
    const rootPosts = Object.values(itemsMap).filter(post => !post.parent)
    
    const threaded = rootPosts.reduce((acc, post) => {
      const key = String(post.assignment)
      if (!acc[key]) acc[key] = []
      acc[key].push(post)
      return acc
    }, {})
    
    return threaded
  }, [items])

  const createPost = useCallback(async ({ assignmentId, body, parent = null, files = [] }) => {
    const trimmedBody = (body || '').trim()
    if (!assignmentId) throw new Error('Assignment is required')
    if (!trimmedBody) throw new Error('Post content is required')

    if (!backendEnabled) {
      const localPost = {
        id: `local-${Date.now()}`,
        assignment: assignmentId,
        parent,
        body: trimmedBody,
        created_at: new Date().toISOString(),
        attachments: files.map((file, index) => ({
          id: `local-attach-${index}`,
          original_name: file.name,
          file: URL.createObjectURL(file)
        }))
      }
      setItems(prev => [...prev, localPost])
      return localPost
    }

    const formData = new FormData()
    formData.append('assignment', assignmentId)
    formData.append('body', trimmedBody)
    if (parent) formData.append('parent', parent)
    files.forEach(file => formData.append('attachments', file))

    const created = await apiPost('/assignment-discussion-posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    setItems(prev => [...prev, created])
    return created
  }, [backendEnabled])

  return {
    backendEnabled,
    posts: items,
    postsByAssignment,
    loading,
    error,
    refresh: fetchPosts,
    createPost,
  }
}
