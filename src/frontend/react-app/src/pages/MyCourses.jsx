import { useMemo, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'

import { useCoursesData } from '../hooks/useCoursesData.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useAssignmentDiscussions } from '../hooks/useAssignmentDiscussions.js'

function DiscussionPost({ post, onReply, depth = 0 }) {
  const [replyBody, setReplyBody] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [files, setFiles] = useState([])

  const handleReply = async () => {
    if (!replyBody.trim()) return
    await onReply(post.assignment, post.id, replyBody, files)
    setReplyBody('')
    setFiles([])
    setShowReplyForm(false)
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  return (
    <div style={{ marginLeft: depth * 20, marginTop: 12, padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
      <div>{post.body}</div>
      <small className="muted">
        {post.created_at ? new Date(post.created_at).toLocaleString() : 'Just now'}
      </small>
      
      {post.attachments && post.attachments.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <strong>Attachments:</strong>
          <ul>
            {post.attachments.map((attachment) => (
              <li key={attachment.id}>
                <a href={attachment.file} target="_blank" rel="noopener noreferrer">
                  {attachment.original_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <button 
          type="button" 
          className="btn link" 
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          Reply
        </button>
      </div>

      {showReplyForm && (
        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
          <textarea
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write your reply..."
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ marginBottom: 8 }}
          />
          <div className="actions">
            <button type="button" className="btn" onClick={handleReply}>
              Post Reply
            </button>
            <button type="button" className="btn link" onClick={() => setShowReplyForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {post.replies && post.replies.map((reply) => (
        <DiscussionPost 
          key={reply.id} 
          post={reply} 
          onReply={onReply} 
          depth={depth + 1} 
        />
      ))}
    </div>
  )
}

export default function MyCourses() {
  const [searchParams] = useSearchParams()
  const selectedCourseId = searchParams.get('courseId')
  const { courses, loading, error } = useCoursesData()
  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useAssignmentsData()
  const {
    postsByAssignment,
    loading: postsLoading,
    error: postsError,
    createPost,
  } = useAssignmentDiscussions({ courseId: selectedCourseId })
  const [draftsByAssignment, setDraftsByAssignment] = useState({})
  const [postError, setPostError] = useState('')

  const courseAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (!assignment?.course) return false
      if (!selectedCourseId) return true
      return String(assignment.course) === String(selectedCourseId)
    })
  }, [assignments, selectedCourseId])

  const courseLookup = useMemo(() => {
    return courses.reduce((acc, course) => {
      acc[String(course.id)] = course
      return acc
    }, {})
  }, [courses])

  const handleDraftChange = (assignmentId, value) => {
    setDraftsByAssignment(prev => ({ ...prev, [assignmentId]: value }))
  }

  const handlePost = async (assignmentId, parent = null, body, files = []) => {
    setPostError('')
    try {
      await createPost({ assignmentId, body, parent, files })
      setDraftsByAssignment(prev => ({ ...prev, [assignmentId]: '' }))
    } catch (err) {
      setPostError(err.message || 'Unable to post assignment response.')
    }
  }

  return (
    <>
      <h1>My Courses</h1>
      <section className="tile" aria-labelledby="my-courses-list">
        <h2 id="my-courses-list" className="tile-title">Enrolled courses</h2>
        <div className="tile-content">
          {error ? (
            <p className="error-text" role="alert">Unable to load courses: {error.message}</p>
          ) : loading ? (
            <p>Loading courses…</p>
          ) : courses.length === 0 ? (
            <p>You are not enrolled in any courses yet.</p>
          ) : (
            <ul>
              {courses.map((course) => {
                const isSelected = selectedCourseId && String(course.id) === String(selectedCourseId)
                return (
                  <li key={course.id} className={isSelected ? 'card' : undefined} style={isSelected ? { padding: 10, border: '1px solid #1f6f78' } : undefined}>
                    <strong>{course.code || 'Course'}</strong> — {course.title}
                    {course.term ? <span className="muted"> ({course.term})</span> : null}
                    <div className="actions" style={{ marginTop: 8 }}>
                      <RouterLink className="btn link" to={`/my-courses?courseId=${course.id}`}>View assignments</RouterLink>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="course-assignment-list">
        <h2 id="course-assignment-list" className="tile-title">Course assignment forum</h2>
        <div className="tile-content">
          <p className="muted">Instructor prompts appear as discussion threads. Post your assignment response inside each thread.</p>
          {assignmentsError ? (
            <p className="error-text" role="alert">Unable to load course assignments: {assignmentsError.message}</p>
          ) : assignmentsLoading ? (
            <p>Loading assignments…</p>
          ) : courseAssignments.length === 0 ? (
            <p>No course assignments are available yet.</p>
          ) : (
            <ul>
              {courseAssignments.map((assignment) => {
                const assignmentCourse = courseLookup[String(assignment.course)]
                const threadPosts = postsByAssignment[String(assignment.id)] || []
                return (
                  <li key={assignment.id} className="card" style={{ padding: 12, marginBottom: 12 }}>
                    <strong>{assignment.title}</strong>
                    <div className="muted">
                      {assignmentCourse
                        ? `${assignmentCourse.code || 'Course'} — ${assignmentCourse.title}`
                        : 'Course assignment'}
                    </div>
                    {assignment.description ? <p style={{ marginTop: 8 }}>{assignment.description}</p> : null}
                    {assignment.due_date ? (
                      <div className="muted">Due: {new Date(assignment.due_date).toLocaleString()}</div>
                    ) : null}

                    <div style={{ marginTop: 12 }}>
                      <h3 style={{ marginBottom: 8 }}>Discussion thread</h3>
                      {postsLoading ? (
                        <p className="muted">Loading thread…</p>
                      ) : postsError ? (
                        <p className="error-text" role="alert">Unable to load thread: {postsError.message}</p>
                      ) : threadPosts.length === 0 ? (
                        <p className="muted">No responses yet. Be the first to post your assignment.</p>
                      ) : (
                        <div>
                          {threadPosts.map((post) => (
                            <DiscussionPost 
                              key={post.id} 
                              post={post} 
                              onReply={handlePost} 
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <label htmlFor={`discussion-${assignment.id}`}>Post your assignment response</label>
                      <textarea
                        id={`discussion-${assignment.id}`}
                        rows={3}
                        value={draftsByAssignment[assignment.id] || ''}
                        onChange={(event) => handleDraftChange(assignment.id, event.target.value)}
                        placeholder="Share your draft, reflection, or question for this assignment prompt."
                      />
                      <input
                        type="file"
                        multiple
                        id={`files-${assignment.id}`}
                        style={{ marginTop: 8 }}
                      />
                      <div className="actions" style={{ marginTop: 8 }}>
                        <button 
                          type="button" 
                          className="btn" 
                          onClick={() => {
                            const body = draftsByAssignment[assignment.id] || ''
                            const fileInput = document.getElementById(`files-${assignment.id}`)
                            const files = fileInput ? Array.from(fileInput.files) : []
                            handlePost(assignment.id, null, body, files)
                          }}
                        >
                          Post to discussion
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {postError && <p className="error-text" role="alert">{postError}</p>}
        </div>
      </section>

      <div className="actions" style={{ marginTop: 12 }}>
        <RouterLink className="btn link" to="/student-dashboard">Back to dashboard</RouterLink>
      </div>
    </>
  )
}
