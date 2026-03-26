import { useState } from 'react'

import { useCurrentUser } from '../hooks/useCurrentUser.js'

export default function Profile() {
  const { user, loading, error, update } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    try {
      await update({
        display_name: form.display_name.value,
        timezone: form.timezone.value,
      })
      setMessage('Profile saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>Profile</h1>
      {error && <p className="error-text" role="alert">Unable to load profile: {error.message}</p>}
      {message && <p role="status">{message}</p>}

      <section className="tile" aria-labelledby="profile-overview">
        <h2 id="profile-overview" className="tile-title">Overview</h2>
        <div className="tile-content">
          {loading ? <p>Loading profile…</p> : (
            <form onSubmit={onSubmit}>
              <label htmlFor="profile-username">Username</label>
              <input id="profile-username" value={user?.username || ''} disabled readOnly />

              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" value={user?.email || ''} disabled readOnly />

              <label htmlFor="profile-display-name">Display name</label>
              <input id="profile-display-name" name="display_name" defaultValue={user?.display_name || ''} />

              <label htmlFor="profile-timezone">Timezone</label>
              <input id="profile-timezone" name="timezone" defaultValue={user?.timezone || 'UTC'} />

              <div className="actions">
                <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
