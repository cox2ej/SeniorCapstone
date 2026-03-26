import { useState } from 'react'

import { useCurrentUser } from '../hooks/useCurrentUser.js'

export default function PrivacySettings() {
  const { user, loading, error, update } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    try {
      await update({
        agreed_to_privacy: form.agreed_to_privacy.checked,
      })
      setMessage('Privacy preferences updated.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>Privacy Settings</h1>
      {error && <p className="error-text" role="alert">Unable to load privacy settings: {error.message}</p>}
      {message && <p role="status">{message}</p>}

      <section className="tile" aria-labelledby="ps-overview">
        <h2 id="ps-overview" className="tile-title">Data & Consent</h2>
        <div className="tile-content">
          {loading ? <p>Loading privacy settings…</p> : (
            <form onSubmit={onSubmit}>
              <label>
                <input type="checkbox" name="agreed_to_privacy" defaultChecked={Boolean(user?.agreed_to_privacy)} />
                I agree to the privacy policy and data processing terms.
              </label>

              <p className="muted">
                You can update this preference any time. Changing this setting updates your user profile record.
              </p>

              <div className="actions">
                <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save privacy settings'}</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  )
}
