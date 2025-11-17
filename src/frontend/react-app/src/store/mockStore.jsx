import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const MockStoreContext = createContext(null)

export function MockStoreProvider({ children }) {
  const [store, setStore] = useState(() => {
    try {
      const saved = localStorage.getItem('demoStore')
      if (saved) return JSON.parse(saved)
    } catch (e) { void e }
    return {
      currentUser: localStorage.getItem('demoUser') || 'student1',
      assignments: [],
      reviews: [],
    }
  })

  useEffect(() => {
    localStorage.setItem('demoStore', JSON.stringify(store))
    localStorage.setItem('demoUser', store.currentUser)
  }, [store])

  const users = useMemo(() => ({
    student1: { id: 'student1', name: 'Student 1' },
    student2: { id: 'student2', name: 'Student 2' },
  }), [])

  const setCurrentUser = (u) => setStore(s => ({ ...s, currentUser: u }))

  const addAssignment = ({ title, description }) => {
    const id = 'a_' + Math.random().toString(36).slice(2, 9)
    const createdAt = new Date().toISOString()
    setStore(s => ({
      ...s,
      assignments: [...s.assignments, { id, title, description, owner: s.currentUser, createdAt }]
    }))
  }

  const addReview = ({ assignmentId, rating, comments }) => {
    const id = 'r_' + Math.random().toString(36).slice(2, 9)
    const createdAt = new Date().toISOString()
    setStore(s => ({
      ...s,
      reviews: [...s.reviews, { id, assignmentId, rating: Number(rating), comments, reviewer: s.currentUser, createdAt }]
    }))
  }

  const resetDemo = () => {
    try {
      localStorage.removeItem('demoStore')
      localStorage.removeItem('demoUser')
    } catch (e) { void e }
    setStore({
      currentUser: 'student1',
      assignments: [],
      reviews: [],
    })
  }

  const value = {
    users,
    currentUser: store.currentUser,
    setCurrentUser,
    assignments: store.assignments,
    reviews: store.reviews,
    addAssignment,
    addReview,
    resetDemo,
    getAssignmentsByOwner: (userId) => store.assignments.filter(a => a.owner === userId),
    getAssignmentsForReview: (userId) => store.assignments.filter(a => a.owner !== userId),
    getAssignmentById: (id) => store.assignments.find(a => a.id === id) || null,
    getReviewsReceivedBy: (userId) => store.reviews.filter(r => {
      const a = store.assignments.find(x => x.id === r.assignmentId)
      return a && a.owner === userId
    }),
    getReviewsForAssignment: (assignmentId) => store.reviews.filter(r => r.assignmentId === assignmentId),
  }

  return (
    <MockStoreContext.Provider value={value}>
      {children}
    </MockStoreContext.Provider>
  )
}

export function useMockStore() {
  const ctx = useContext(MockStoreContext)
  if (!ctx) throw new Error('useMockStore must be used within MockStoreProvider')
  return ctx
}
