import { useState } from 'react'

const MOCK_COURSES = [
  { id: 'c1', code: 'CS 101', title: 'Intro to Programming', enrollment: 42, cycleStart: '2025-01-15', cycleEnd: '2025-05-10', status: 'Active' },
  { id: 'c2', code: 'CS 201', title: 'Data Structures', enrollment: 28, cycleStart: '2025-01-15', cycleEnd: '2025-05-10', status: 'Active' },
]

export default function ManageCoursesGroups() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [drawerTab, setDrawerTab] = useState('overview')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  return (
    <>
      <h1>Manage Courses / Groups</h1>

      {/* Course Overview Table */}
      <section className="tile" aria-labelledby="course-overview">
        <h2 id="course-overview" className="tile-title">Courses</h2>
        <div className="tile-content">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course code</th>
                  <th>Title</th>
                  <th>Enrollment</th>
                  <th>Cycle dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COURSES.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.title}</td>
                    <td>{c.enrollment}</td>
                    <td>{c.cycleStart} – {c.cycleEnd}</td>
                    <td>{c.status}</td>
                    <td>
                      <button type="button" className="btn" onClick={() => setSelectedCourse(c)}>View roster</button>
                      {' '}
                      <button type="button" className="btn">Edit</button>
                      {' '}
                      <button type="button" className="btn">Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={() => { setWizardOpen(true); setWizardStep(1); }}>
              New course
            </button>
          </div>
        </div>
      </section>

      {/* Course Detail Drawer */}
      {selectedCourse && (
        <div className="drawer-backdrop" onClick={() => setSelectedCourse(null)} aria-hidden="true">
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="drawer-title">
            <h2 id="drawer-title">{selectedCourse.code} – {selectedCourse.title}</h2>
            <div className="drawer-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'overview'}
                onClick={() => setDrawerTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'assignments'}
                onClick={() => setDrawerTab('assignments')}
              >
                Assignments
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={drawerTab === 'groups'}
                onClick={() => setDrawerTab('groups')}
              >
                Groups
              </button>
            </div>
            <div className="drawer-body">
              {drawerTab === 'overview' && (
                <div>
                  <p>Instructor team, announcements, notification rules (placeholder).</p>
                </div>
              )}
              {drawerTab === 'assignments' && (
                <div>
                  <p>List of assignments with deadlines and review state. CTA to create new assignment (placeholder).</p>
                  <button type="button" className="btn primary" style={{ marginTop: 8 }}>Create assignment</button>
                </div>
              )}
              {drawerTab === 'groups' && (
                <div>
                  <p>Visual grouping grid or list; drag-and-drop to rearrange (placeholder).</p>
                  <div className="actions" style={{ marginTop: 12 }}>
                    <button type="button" className="btn">Auto-generate groups</button>
                    <button type="button" className="btn">Export assignments</button>
                  </div>
                </div>
              )}
            </div>
            <div className="actions">
              <button type="button" className="btn" onClick={() => setSelectedCourse(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Course Wizard */}
      {wizardOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
          <div className="modal-content modal-wizard" onClick={(e) => e.stopPropagation()}>
            <h2 id="wizard-title">New course</h2>
            <p className="muted">Step {wizardStep} of 3</p>
            {wizardStep === 1 && (
              <p>Enter course code and title (placeholder).</p>
            )}
            {wizardStep === 2 && (
              <p>Add sections (placeholder).</p>
            )}
            {wizardStep === 3 && (
              <p>Import roster – CSV upload placeholder.</p>
            )}
            <div className="actions" style={{ marginTop: 16 }}>
              {wizardStep > 1 && (
                <button type="button" className="btn" onClick={() => setWizardStep((s) => s - 1)}>Back</button>
              )}
              {wizardStep < 3 ? (
                <button type="button" className="btn primary" onClick={() => setWizardStep((s) => s + 1)}>Next</button>
              ) : (
                <button type="button" className="btn primary" onClick={() => setWizardOpen(false)}>Finish</button>
              )}
              <button type="button" className="btn" onClick={() => setWizardOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
