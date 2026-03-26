import { useState } from 'react'

import { useCurrentUser } from '../hooks/useCurrentUser.js'

const SETTINGS_KEY = 'adminPlatformSettings'

const loadPlatformSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { autoPublishFeedback: false, anonymizeByDefault: true, reminderFrequencyDays: 7 }
    return JSON.parse(raw)
  } catch {
    return { autoPublishFeedback: false, anonymizeByDefault: true, reminderFrequencyDays: 7 }
  }
}

export default function AdminSettings() {
  const { user, loading, error, update } = useCurrentUser()
  const [platformSettings, setPlatformSettings] = useState(loadPlatformSettings)
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPlatform, setSavingPlatform] = useState(false)
  const [message, setMessage] = useState('')

  async function handleAccountSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setSavingAccount(true)
    try {
      await update({
        display_name: form.display_name.value,
        timezone: form.timezone.value,
      })
      setMessage('Account-level admin settings saved.')
    } finally {
      setSavingAccount(false)
    }
  }

  function handlePlatformSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const next = {
      autoPublishFeedback: form.auto_publish.checked,
      anonymizeByDefault: form.anonymize_default.checked,
      reminderFrequencyDays: Number(form.reminder_days.value || 7),
    }
    setSavingPlatform(true)
    setPlatformSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    setMessage('Platform defaults saved for this environment.')
    setSavingPlatform(false)
  }

  return (
    <>
      <h1>Admin Settings</h1>
      {error && <p className="error-text" role="alert">Unable to load settings: {error.message}</p>}
      {message && <p role="status">{message}</p>}

      <section className="tile" aria-labelledby="admin-settings-account">
        <h2 id="admin-settings-account" className="tile-title">Account defaults</h2>
        <div className="tile-content">
          {loading ? <p>Loading account settings…</p> : (
            <form onSubmit={handleAccountSubmit}>
              <label htmlFor="as-display-name">Display name</label>
              <input id="as-display-name" name="display_name" defaultValue={user?.display_name || ''} />

              <label htmlFor="as-timezone">Timezone</label>
              <input id="as-timezone" name="timezone" defaultValue={user?.timezone || 'UTC'} />

              <div className="actions">
                <button className="btn primary" type="submit" disabled={savingAccount}>{savingAccount ? 'Saving…' : 'Save account settings'}</button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="admin-settings-platform">
        <h2 id="admin-settings-platform" className="tile-title">Platform defaults</h2>
        <div className="tile-content">
          <form onSubmit={handlePlatformSubmit}>
            <label>
              <input type="checkbox" name="auto_publish" defaultChecked={platformSettings.autoPublishFeedback} />
              Auto-publish completed feedback
            </label>

            <label>
              <input type="checkbox" name="anonymize_default" defaultChecked={platformSettings.anonymizeByDefault} />
              Anonymize reviewers by default
            </label>

            <label htmlFor="as-reminder-days">Reminder frequency (days)</label>
            <input id="as-reminder-days" name="reminder_days" type="number" min="1" max="30" defaultValue={platformSettings.reminderFrequencyDays} />

            <div className="actions">
              <button className="btn primary" type="submit" disabled={savingPlatform}>{savingPlatform ? 'Saving…' : 'Save platform settings'}</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
