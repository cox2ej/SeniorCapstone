import { useState } from 'react'

const MOCK_AUDIT = [
  { id: 1, action: 'Course CS 101 created', who: 'admin@example.edu', when: '2025-02-18 10:00' },
  { id: 2, action: 'Settings updated', who: 'instructor@example.edu', when: '2025-02-17 14:30' },
]

export default function AdminSettings() {
  const [reviewCountTarget, setReviewCountTarget] = useState(2)
  const [dueDateOffsetDays, setDueDateOffsetDays] = useState(7)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailsEnabled, setEmailsEnabled] = useState(true)

  return (
    <>
      <h1>Admin Settings</h1>

      {/* Organization Preferences */}
      <section className="tile" aria-labelledby="org-prefs">
        <h2 id="org-prefs" className="tile-title">Organization preferences</h2>
        <div className="tile-content">
          <p className="muted">Default course settings (review count targets, due date offsets).</p>
          <label htmlFor="review-count-target">Default reviews per assignment</label>
          <input
            id="review-count-target"
            type="number"
            min={1}
            max={10}
            value={reviewCountTarget}
            onChange={(e) => setReviewCountTarget(Number(e.target.value) || 1)}
          />
          <label htmlFor="due-date-offset" style={{ marginTop: 12 }}>Default due date offset (days)</label>
          <input
            id="due-date-offset"
            type="number"
            min={1}
            value={dueDateOffsetDays}
            onChange={(e) => setDueDateOffsetDays(Number(e.target.value) || 1)}
          />
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span>Enable in-app notifications</span>
            </label>
          </div>
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={emailsEnabled}
                onChange={(e) => setEmailsEnabled(e.target.checked)}
              />
              <span>Enable email notifications</span>
            </label>
          </div>
        </div>
      </section>

      {/* Integration Hooks */}
      <section className="tile" aria-labelledby="integrations">
        <h2 id="integrations" className="tile-title">Integration hooks</h2>
        <div className="tile-content">
          <p className="muted">API keys (placeholders), LTI/Canvas connection status.</p>
          <label htmlFor="api-key">API key (placeholder)</label>
          <input id="api-key" type="text" placeholder="Configure in production" readOnly />
          <p className="muted" style={{ marginTop: 8 }}>LTI / Canvas: Not connected (placeholder)</p>
        </div>
      </section>

      {/* Team Management */}
      <section className="tile" aria-labelledby="team-mgmt">
        <h2 id="team-mgmt" className="tile-title">Team management</h2>
        <div className="tile-content">
          <p className="muted">Co-instructors and admins with role dropdowns.</p>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>instructor@example.edu</td>
                  <td>
                    <select aria-label="Role">
                      <option>Instructor</option>
                      <option>Admin</option>
                      <option>TA</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn primary">Invite team member</button>
          </div>
        </div>
      </section>

      {/* Audit Log Preview */}
      <section className="tile" aria-labelledby="audit-log">
        <h2 id="audit-log" className="tile-title">Recent admin actions</h2>
        <div className="tile-content">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Who</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_AUDIT.map((row) => (
                  <tr key={row.id}>
                    <td>{row.action}</td>
                    <td>{row.who}</td>
                    <td>{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
