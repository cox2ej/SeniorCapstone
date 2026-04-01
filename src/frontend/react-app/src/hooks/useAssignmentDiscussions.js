import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost, isBackendEnabled } from '../api/client.js'

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
        })),
        permissions: { can_edit: true, can_delete: true },
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

  const updatePost = useCallback(async ({
    postId,
    body,
    attachmentsToRemove = [],
    newFiles = [],
  }) => {
    if (!postId) throw new Error('Post ID is required')
    const trimmedBody = body !== undefined ? body.trim() : undefined
    if (trimmedBody !== undefined && !trimmedBody) {
      throw new Error('Post content is required')
    }

    if (!backendEnabled) {
      setItems((prev) => prev.map((item) => {
        if (item.id !== postId) return item
        const safeAttachments = Array.isArray(item.attachments) ? item.attachments : []
        const shouldRemove = (attachmentId) => attachmentsToRemove.some((val) => String(val) === String(attachmentId))
        const remaining = attachmentsToRemove.length
          ? safeAttachments.filter((att) => !shouldRemove(att.id))
          : safeAttachments
        const appended = newFiles.map((file, index) => ({
          id: `local-edit-${Date.now()}-${index}`,
          original_name: file.name,
          file: URL.createObjectURL(file),
        }))
        return {
          ...item,
          body: trimmedBody ?? item.body,
          attachments: [...remaining, ...appended],
        }
      }))
      return null
    }

    const formData = new FormData()
    if (trimmedBody !== undefined) formData.append('body', trimmedBody)
    attachmentsToRemove.forEach((id) => formData.append('attachments_to_remove', id))
    newFiles.forEach((file) => formData.append('attachments', file))

    const updated = await apiPatch(`/assignment-discussion-posts/${postId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setItems((prev) => prev.map((item) => (item.id === postId ? updated : item)))
    return updated
  }, [backendEnabled])

  const deletePost = useCallback(async (postId) => {
    if (!postId) return
    const removeDescendants = (list, rootId) => {
      const ids = new Set([String(rootId), Number(rootId)])
      let added = true
      while (added) {
        added = false
        list.forEach((item) => {
          const itemId = [item.id, Number(item.id), String(item.id)]
          const parentId = [item.parent, Number(item.parent), String(item.parent)]
          if (!itemId.some((id) => ids.has(id)) && item.parent && parentId.some((id) => ids.has(id))) {
            itemId.forEach((id) => ids.add(id))
            added = true
          }
        })
      }
      return ids
    }

    if (!backendEnabled) {
      setItems((prev) => {
        const ids = removeDescendants(prev, postId)
        return prev.filter((item) => !ids.has(item.id))
      })
      return
    }

    await apiDelete(`/assignment-discussion-posts/${postId}/`)
    setItems((prev) => {
      const ids = removeDescendants(prev, postId)
      return prev.filter((item) => !(ids.has(item.id) || ids.has(String(item.id)) || ids.has(Number(item.id))))
    })
  }, [backendEnabled])

  return {
    backendEnabled,
    posts: items,
    postsByAssignment,
    loading,
    error,
    refresh: fetchPosts,
    createPost,
    updatePost,
    deletePost,
  }
}
