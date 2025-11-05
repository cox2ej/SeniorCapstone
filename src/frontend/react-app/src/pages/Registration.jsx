import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Registration() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const bothFilled = pw.length > 0 && pw2.length > 0
  const match = pw === pw2
  const canSubmit = bothFilled && match

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
    if (pw2 && v !== pw2) setMsg('Passwords do not match.')
    else setMsg('')
  }
  function onPw2Change(v) {
    setPw2(v)
    if (pw && v !== pw) setMsg('Passwords do not match.')
    else setMsg('')
  }

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="reg-title">
        <h1 id="reg-title">Create your account</h1>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="name" type="text" autoComplete="name" required />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby="passwordHelp"
              value={pw}
              onChange={(e) => onPwChange(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              id="toggleRegPassword"
              aria-pressed={showPw ? 'true' : 'false'}
              aria-controls="password"
              onClick={() => setShowPw(v => !v)}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <small id="passwordHelp" className="sr-only">Password field. Use the button to show or hide the password.</small>

          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-row">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPw2 ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby="confirmHelp matchError"
              aria-invalid={bothFilled && !match ? 'true' : 'false'}
              className={!match && pw2 ? 'input-error' : ''}
              value={pw2}
              onChange={(e) => onPw2Change(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              id="toggleRegConfirm"
              aria-pressed={showPw2 ? 'true' : 'false'}
              aria-controls="confirmPassword"
              onClick={() => setShowPw2(v => !v)}
            >
              {showPw2 ? 'Hide' : 'Show'}
            </button>
          </div>
          <small id="confirmHelp" className="sr-only">Confirm password field. Use the button to show or hide the password.</small>
          <p id="matchError" className="help-error" hidden={match || !pw2}>Passwords do not match.</p>

          <div className="actions">
            <button id="createAccountBtn" className="primary" type="submit" aria-label="Create account (mock)" disabled={!canSubmit}>Create account</button>
            <Link to="/login" className="btn" aria-label="Already have an account? Log in">Already have an account?</Link>
            <Link to="/" className="btn" aria-label="Return to Home">Home</Link>
          </div>
        </form>
        <p><small className="muted">By creating an account, you agree to our <a href="#">Terms &amp; Privacy</a>.</small></p>
        <p><small className="muted">Prototype only. No actual account is created.</small></p>
        <div id="reg-messages" className="sr-only" aria-live="polite">{msg}</div>
      </section>
    </div>
  )
}
