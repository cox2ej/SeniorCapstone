import { useMemo, useState } from 'react'

import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'

export default function ManageCoursesGroups() {
  const {
    courses,
    enrollments,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    inviteEnrollment,
    updateEnrollment,
    deleteEnrollment,
  } = useCoursesGroupsData()

  const [courseForm, setCourseForm] = useState({ code: '', title: '', term: '', description: '' })
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [editingCourseId, setEditingCourseId] = useState(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseError, setCourseError] = useState(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [enrollRole, setEnrollRole] = useState('student')
  const [savingEnrollment, setSavingEnrollment] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState(null)
  const [inviteMessage, setInviteMessage] = useState('')

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(selectedCourseId)) || null,
    [courses, selectedCourseId],
  )

  const courseEnrollments = useMemo(
    () => enrollments.filter((item) => String(item.course) === String(selectedCourseId)),
    [enrollments, selectedCourseId],
  )

  async function handleCourseSubmit(event) {
    event.preventDefault()
    setSavingCourse(true)
    setCourseError(null)
    try {
      if (editingCourseId) {
        await updateCourse({ id: editingCourseId }, courseForm)
      } else {
        const created = await createCourse(courseForm)
        setSelectedCourseId(String(created.id))
      }
      setCourseForm({ code: '', title: '', term: '', description: '' })
      setEditingCourseId(null)
    } catch (err) {
      setCourseError(err)
    } finally {
      setSavingCourse(false)
    }
  }

  async function handleDeleteCourse(courseId) {
    setCourseError(null)
    try {
      await deleteCourse(courseId)
      if (String(selectedCourseId) === String(courseId)) {
        setSelectedCourseId('')
      }
    } catch (err) {
      setCourseError(err)
    }
  }

  async function handleAddEnrollment(event) {
    event.preventDefault()
    if (!selectedCourseId || !inviteEmail.trim()) return
    setSavingEnrollment(true)
    setEnrollmentError(null)
    setInviteMessage('')
    try {
      const response = await inviteEnrollment({
        course: Number(selectedCourseId),
        email: inviteEmail.trim(),
        role: enrollRole,
      })
      setInviteEmail('')
      setEnrollRole('student')
      setInviteMessage(response?.created ? 'Invitation sent and enrollment created.' : 'Invitation sent and enrollment updated.')
    } catch (err) {
      setEnrollmentError(err)
    } finally {
      setSavingEnrollment(false)
    }
  }

  async function handleToggleRole(enrollment) {
    const nextRole = enrollment.role === 'student' ? 'ta' : 'student'
    setEnrollmentError(null)
    try {
      await updateEnrollment(enrollment, { role: nextRole })
    } catch (err) {
      setEnrollmentError(err)
    }
  }

  async function handleRemoveEnrollment(enrollmentId) {
    setEnrollmentError(null)
    try {
      await deleteEnrollment(enrollmentId)
    } catch (err) {
      setEnrollmentError(err)
    }
  }

  return (
    <>
      <h1>Manage Courses / Groups</h1>
      {error && <p className="error-text" role="alert">Unable to load course data: {error.message}</p>}

      <section className="tile" aria-labelledby="mcg-course-title">
        <h2 id="mcg-course-title" className="tile-title">Courses</h2>
        <div className="tile-content">
          {courseError && <p className="error-text" role="alert">Course action failed: {courseError.message}</p>}
          <form onSubmit={handleCourseSubmit}>
            <label htmlFor="mcg-code">Course code</label>
            <input id="mcg-code" value={courseForm.code} onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))} required />

            <label htmlFor="mcg-title">Course title</label>
            <input id="mcg-title" value={courseForm.title} onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))} required />

            <label htmlFor="mcg-term">Term</label>
            <input id="mcg-term" value={courseForm.term} onChange={(e) => setCourseForm(prev => ({ ...prev, term: e.target.value }))} />

            <label htmlFor="mcg-description">Description</label>
            <textarea id="mcg-description" rows={3} value={courseForm.description} onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))} />

            <div className="actions">
              <button className="btn primary" type="submit" disabled={savingCourse}>{savingCourse ? 'Saving…' : (editingCourseId ? 'Update course' : 'Create course')}</button>
              {editingCourseId && (
                <button className="btn" type="button" onClick={() => {
                  setEditingCourseId(null)
                  setCourseForm({ code: '', title: '', term: '', description: '' })
                }}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <hr />

          {loading ? <p>Loading courses…</p> : courses.length === 0 ? <p>No courses yet.</p> : (
            <ul>
              {courses.map((course) => (
                <li key={course.id}>
                  <strong>{course.code}</strong> — {course.title} {course.term ? <span className="muted">({course.term})</span> : null}
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button className="btn" type="button" onClick={() => setSelectedCourseId(String(course.id))}>Manage roster</button>
                    <button className="btn" type="button" onClick={() => {
                      setEditingCourseId(course.id)
                      setCourseForm({
                        code: course.code || '',
                        title: course.title || '',
                        term: course.term || '',
                        description: course.description || '',
                      })
                    }}>Edit</button>
                    <button className="btn" type="button" onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="mcg-roster-title">
        <h2 id="mcg-roster-title" className="tile-title">Roster & groups</h2>
        <div className="tile-content">
          {!selectedCourse ? (
            <p>Select a course to manage enrollments.</p>
          ) : (
            <>
              <p><strong>{selectedCourse.code} — {selectedCourse.title}</strong></p>
              {enrollmentError && <p className="error-text" role="alert">Enrollment action failed: {enrollmentError.message}</p>}
              {inviteMessage && <p role="status">{inviteMessage}</p>}

              <form onSubmit={handleAddEnrollment}>
                <label htmlFor="mcg-email">Student email</label>
                <input
                  id="mcg-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@example.edu"
                  required
                />

                <label htmlFor="mcg-role">Role</label>
                <select id="mcg-role" value={enrollRole} onChange={(e) => setEnrollRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="ta">Teaching Assistant</option>
                </select>

                <div className="actions">
                  <button className="btn primary" type="submit" disabled={savingEnrollment}>{savingEnrollment ? 'Adding…' : 'Add to roster'}</button>
                </div>
              </form>

              <hr />

              {courseEnrollments.length === 0 ? <p>No enrollments yet.</p> : (
                <ul>
                  {courseEnrollments.map((enrollment) => (
                    <li key={enrollment.id}>
                      <strong>{enrollment.user?.display_name || enrollment.user?.username || 'User'}</strong> — {enrollment.role}
                      <div className="actions" style={{ marginTop: 8 }}>
                        <button className="btn" type="button" onClick={() => handleToggleRole(enrollment)}>
                          Set as {enrollment.role === 'student' ? 'TA' : 'Student'}
                        </button>
                        <button className="btn" type="button" onClick={() => handleRemoveEnrollment(enrollment.id)}>
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
