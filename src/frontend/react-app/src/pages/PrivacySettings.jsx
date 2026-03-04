import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import { apiGet, isBackendEnabled } from '../api/client.js'

export default function PrivacySettings() {
  const [showRealName, setShowRealName] = useState(true)
  const [allowClassmatesView, setAllowClassmatesView] = useState(true)
  const [profileExposure, setProfileExposure] = useState('instructors')
  const [retentionAck, setRetentionAck] = useState(false)
  const [emailOptIn, setEmailOptIn] = useState(true)
  const [pushOptIn, setPushOptIn] = useState(false)
  const [exportDeleteModal, setExportDeleteModal] = useState(null) // null | 'export' | 'delete'

  const { summary } = useDashboardSummary()
  const backendEnabled = isBackendEnabled()
  const [authUser, setAuthUser] = useState(null)
  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function fetchMe() {
      try {
        const data = await apiGet('/users/me/')
        if (!cancelled) setAuthUser(data)
      } catch {
        if (!cancelled) setAuthUser(null)
      }
    }
    fetchMe()
    return () => { cancelled = true }
  }, [backendEnabled])
  const isInstructor = useMemo(() => {
    return (summary?.role === 'instructor' || summary?.role === 'admin') ||
      (authUser && (authUser.role === 'instructor' || authUser.role === 'admin'))
  }, [summary?.role, authUser])

  return (
    <>
      <h1>Privacy Settings</h1>

      {/* Intro Copy */}
      <section className="tile" aria-labelledby="privacy-intro">
        <h2 id="privacy-intro" className="tile-title">Your data &amp; privacy</h2>
        <div className="tile-content">
          <p>
            This page explains what data is shared with peers vs instructors. Your feedback submissions
            and self-assessments may be visible to instructors for grading; peer reviewers may see
            your work only when assigned. We do not share your contact details with other students
            unless you allow it below.
          </p>
        </div>
      </section>

      {/* Visibility Controls */}
      <section className="tile" aria-labelledby="visibility-controls">
        <h2 id="visibility-controls" className="tile-title">Visibility controls</h2>
        <div className="tile-content">
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showRealName}
                onChange={(e) => setShowRealName(e.target.checked)}
                aria-describedby="show-real-name-desc"
              />
              <span>Show real name on submissions</span>
            </label>
            <p id="show-real-name-desc" className="muted" style={{ marginTop: 4, marginLeft: 28 }}>
              When off, submissions are shown to reviewers as anonymous.
            </p>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={allowClassmatesView}
                onChange={(e) => setAllowClassmatesView(e.target.checked)}
                aria-describedby="allow-classmates-desc"
              />
              <span>Allow classmates to view my profile</span>
            </label>
            <p id="allow-classmates-desc" className="muted" style={{ marginTop: 4, marginLeft: 28 }}>
              When off, only instructors can see your profile.
            </p>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <span id="profile-exposure-desc" className="block" style={{ marginBottom: 8, fontWeight: 600 }}>
              Profile exposure
            </span>
            <div className="radio-group" role="radiogroup" aria-labelledby="profile-exposure-desc">
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileExposure"
                  value="instructors"
                  checked={profileExposure === 'instructors'}
                  onChange={(e) => setProfileExposure(e.target.value)}
                />
                <span>Only instructors</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileExposure"
                  value="peers"
                  checked={profileExposure === 'peers'}
                  onChange={(e) => setProfileExposure(e.target.value)}
                />
                <span>Peers in same course</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="profileExposure"
                  value="everyone"
                  checked={profileExposure === 'everyone'}
                  onChange={(e) => setProfileExposure(e.target.value)}
                />
                <span>Everyone</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Data Retention Panel */}
      <section className="tile" aria-labelledby="data-retention">
        <h2 id="data-retention" className="tile-title">Data retention</h2>
        <div className="tile-content">
          <p>
            Your feedback and course data are retained according to our institutional policy.
            {' '}<a href="#">Read the full policy</a> (placeholder)..
          </p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={retentionAck}
                onChange={(e) => setRetentionAck(e.target.checked)}
                aria-describedby="retention-ack-desc"
              />
              <span>I acknowledge the data retention policy</span>
            </label>
            <p id="retention-ack-desc" className="muted" style={{ marginTop: 4, marginLeft: 28 }}>
              Optional acknowledgment for records.
            </p>
          </div>
        </div>
      </section>

      {/* Notification Consent */}
      <section className="tile" aria-labelledby="notification-consent">
        <h2 id="notification-consent" className="tile-title">Notification consent</h2>
        <div className="tile-content">
          <p className="muted">Email and push opt-ins (tied to notification center; future backend API).</p>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="toggle-label">
              <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
              <span>Email notifications</span>
            </label>
          </div>
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="toggle-label">
              <input type="checkbox" checked={pushOptIn} onChange={(e) => setPushOptIn(e.target.checked)} />
              <span>Push notifications (when available)</span>
            </label>
          </div>
        </div>
      </section>

      {/* Instructor-only: Role-Specific Visibility, Data Permissions */}
      {isInstructor && (
        <>
          <section className="tile" aria-labelledby="instructor-visibility">
            <h2 id="instructor-visibility" className="tile-title">Instructor visibility</h2>
            <div className="tile-content">
              <p className="muted">Control whether students see your email/phone; disable certain profile elements.</p>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="toggle-label">
                  <input type="checkbox" defaultChecked />
                  <span>Show email to students</span>
                </label>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="toggle-label">
                  <input type="checkbox" />
                  <span>Show office hours to students</span>
                </label>
              </div>
            </div>
          </section>
          <section className="tile" aria-labelledby="data-permissions">
            <h2 id="data-permissions" className="tile-title">Data permissions</h2>
            <div className="tile-content">
              <p className="muted">Toggles for which analytics are shared with TAs / co-instructors.</p>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="toggle-label">
                  <input type="checkbox" defaultChecked />
                  <span>Share analytics with TAs</span>
                </label>
              </div>
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="toggle-label">
                  <input type="checkbox" defaultChecked />
                  <span>Share roster with co-instructors</span>
                </label>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Export & Delete Requests */}
      <section className="tile" aria-labelledby="export-delete">
        <h2 id="export-delete" className="tile-title">Export &amp; delete</h2>
        <div className="tile-content">
          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={() => setExportDeleteModal('export')}
              aria-haspopup="dialog"
            >
              Export my data
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setExportDeleteModal('delete')}
              aria-haspopup="dialog"
            >
              Request account deletion
            </button>
          </div>
        </div>
      </section>

      {/* Export / Delete modal */}
      {exportDeleteModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setExportDeleteModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title">
              {exportDeleteModal === 'export' ? 'Export my data' : 'Request account deletion'}
            </h2>
            {exportDeleteModal === 'export' ? (
              <p>
                To export your data, contact your instructor or institutional support. They will
                provide a secure export link. This is a manual process for now.
              </p>
            ) : (
              <p>
                Account deletion is handled by your institution. Please contact your instructor or
                IT support to submit a deletion request. All data will be removed per the retention
                policy.
              </p>
            )}
            <div className="actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn primary" onClick={() => setExportDeleteModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
