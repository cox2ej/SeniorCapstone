import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const bothFilled = pw.length > 0 && pw2.length > 0
  const matches = pw === pw2
  const canSubmit = bothFilled && matches

  function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) {
      setMsg('Passwords do not match.')
      return
    }
    navigate('/login')
  }

  function onPwChange(v) {
    setPw(v)
    setMsg(v && pw2 && v !== pw2 ? 'Passwords do not match.' : '')
  }
  function onPw2Change(v) {
    setPw2(v)
    setMsg(v && pw && v !== pw ? 'Passwords do not match.' : '')
  }

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="rp-title">
        <h1 id="rp-title">Set a new password</h1>
        <p>Enter and confirm your new password.</p>

        <form onSubmit={onSubmit} noValidate aria-labelledby="rp-title">
          <label htmlFor="newPassword">New password</label>
          <div className="password-row">
            <input
              id="newPassword"
              name="newPassword"
              type={show1 ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby="passwordRules"
              value={pw}
              onChange={(e) => onPwChange(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              id="toggleNew"
              aria-pressed={show1 ? 'true' : 'false'}
              aria-controls="newPassword"
              onClick={() => setShow1(v => !v)}
            >
              {show1 ? 'Hide' : 'Show'}
            </button>
          </div>
          <small id="passwordRules" className="sr-only">Use at least 8 characters for this prototype.</small>

          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-row">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={show2 ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby="confirmHelp"
              aria-invalid={bothFilled && !matches ? 'true' : 'false'}
              value={pw2}
              onChange={(e) => onPw2Change(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              id="toggleConfirm"
              aria-pressed={show2 ? 'true' : 'false'}
              aria-controls="confirmPassword"
              onClick={() => setShow2(v => !v)}
            >
              {show2 ? 'Hide' : 'Show'}
            </button>
          </div>
          <small id="confirmHelp" className="sr-only">Must match the new password.</small>

          <div className="actions">
            <button className="primary" id="resetSubmit" type="submit" disabled={!canSubmit} aria-label="Reset password (mock)">Reset password</button>
            <Link to="/login" className="btn" aria-label="Back to login">Back to login</Link>
          </div>
        </form>

        <div id="rp-messages" className="sr-only" aria-live="polite">{msg}</div>
      </section>
    </div>
  )
}
