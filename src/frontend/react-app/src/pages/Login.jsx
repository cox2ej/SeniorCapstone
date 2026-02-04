import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, isBackendEnabled } from '../api/client.js'

const extractMessage = (error) => {
  if (error?.responseText) {
    try {
      const parsed = JSON.parse(error.responseText)
      if (parsed?.detail) return parsed.detail
    } catch { /* ignore */ }
    return error.responseText
  }
  return error?.message || 'Unable to complete request.'
}

export default function Login() {
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState([])
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const errorSummaryRef = useRef(null)
  const navigate = useNavigate()
  const backendEnabled = isBackendEnabled()

  const redirectAfterLogin = useCallback((user) => {
    const role = user?.role
    const path = role === 'instructor' || role === 'admin' ? '/instructor-dashboard' : '/student-dashboard'
    navigate(path, { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function checkSession() {
      try {
        const user = await apiGet('/users/me/')
        if (!cancelled) redirectAfterLogin(user)
      } catch (error) {
        if (!cancelled && error?.status !== 401) {
          const detail = extractMessage(error)
          setFormError(detail)
        }
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [backendEnabled, redirectAfterLogin])

  function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const username = form.username.value.trim()
    const password = form.password.value.trim()
    const errs = []
    if (!username) errs.push({ field: 'username', message: 'Enter your email or username' })
    if (!password) errs.push({ field: 'password', message: 'Enter your password' })
    if (errs.length) {
      setErrors(errs)
      setFormError('')
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }

    if (!backendEnabled) {
      navigate('/student-dashboard')
      return
    }

    async function login() {
      setLoading(true)
      setErrors([])
      setFormError('')
      try {
        await apiGet('/auth/csrf/')
        const user = await apiPost('/auth/login/', { username, password })
        redirectAfterLogin(user)
      } catch (error) {
        const detail = extractMessage(error)
        setFormError(detail)
        setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      } finally {
        setLoading(false)
      }
    }

    void login()
  }

  const hasError = (field) => errors.some(e => e.field === field)
  const getMsg = (field) => (errors.find(e => e.field === field)?.message || '')

  return (
    <main id="main-content" className="auth-shell" tabIndex="-1">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Login</h1>
        <p>Prototype login. This will take you into the app.</p>

        {(errors.length > 0 || formError) && (
          <div className="error-summary" role="alert" aria-labelledby="login-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
            <h2 id="login-error-summary-title">There is a problem</h2>
            <ul>
              {errors.map(e => (
                <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
              ))}
              {formError && (
                <li key="form-error">{formError}</li>
              )}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="username">Email or Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            aria-invalid={hasError('username') ? 'true' : 'false'}
            aria-describedby={hasError('username') ? 'username-error' : undefined}
            className={hasError('username') ? 'input-error' : undefined}
          />
          {hasError('username') && (
            <p id="username-error" className="help-error">{getMsg('username')}</p>
          )}

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-describedby={`passwordHelp${hasError('password') ? ' password-error' : ''}`}
              aria-invalid={hasError('password') ? 'true' : 'false'}
              className={hasError('password') ? 'input-error' : undefined}
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
          {hasError('password') && (
            <p id="password-error" className="help-error">{getMsg('password')}</p>
          )}

          <div className="actions">
            <button className="primary" type="submit" aria-label="Sign in" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <Link to="/" className="btn" aria-label="Return to home">Home</Link>
            {!backendEnabled && (
              <button type="button" className="btn" aria-label="Sign in with SSO (mock)" onClick={() => navigate('/student-dashboard')}>Use SSO (mock)</button>
            )}
          </div>
          <div className="actions">
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/registration">Create an account</Link>
          </div>
        </form>

        <p><small className="muted">By continuing, you agree to our <a href="#">Terms &amp; Privacy</a>.</small></p>
        {backendEnabled ? (
          <p><small className="muted">Session cookies are used for authentication.</small></p>
        ) : (
          <p><small className="muted">Backend is disabled; authentication is mocked.</small></p>
        )}
        <div id="form-messages" className="sr-only" aria-live="polite"></div>
      </section>
    </main>
  )
}
