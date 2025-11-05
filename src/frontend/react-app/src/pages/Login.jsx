import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    navigate('/student-dashboard')
  }

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Login</h1>
        <p>Prototype login. This will take you into the app.</p>

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="username">Email or Username</label>
          <input id="username" name="username" type="text" autoComplete="username" required autoFocus />

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-describedby="passwordHelp"
            />
            <button
              type="button"
              className="btn"
              id="togglePassword"
              aria-pressed={showPw ? 'true' : 'false'}
              aria-controls="password"
              onClick={() => setShowPw(v => !v)}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
          <small id="passwordHelp" className="sr-only">Password field. Use the button to show or hide the password.</small>

          <div className="actions">
            <button className="primary" type="submit" aria-label="Sign in (mock)">Sign in</button>
            <Link to="/" className="btn" aria-label="Return to home">Home</Link>
            <button type="button" className="btn" aria-label="Sign in with SSO (mock)" onClick={() => navigate('/student-dashboard')}>Use SSO (mock)</button>
          </div>
          <div className="actions">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/registration">Create an account</Link>
          </div>
        </form>

        <p><small className="muted">By continuing, you agree to our <a href="#">Terms &amp; Privacy</a>.</small></p>
        <p><small className="muted">No authentication is performed in this prototype.</small></p>
        <div id="form-messages" className="sr-only" aria-live="polite"></div>
      </section>
    </div>
  )
}
