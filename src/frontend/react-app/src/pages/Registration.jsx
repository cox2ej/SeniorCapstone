import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Registration() {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [msg, setMsg] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)
  const navigate = useNavigate()

  const bothFilled = pw.length > 0 && pw2.length > 0
  const match = pw === pw2
  const canSubmit = bothFilled && match

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
    <main id="main-content" className="auth-shell" tabIndex="-1">
      <section className="auth-card" aria-labelledby="reg-title">
        <h1 id="reg-title">Create your account</h1>
        {errors.length > 0 && (
          <div className="error-summary" role="alert" aria-labelledby="reg-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
            <h2 id="reg-error-summary-title">There is a problem</h2>
            <ul>
              {errors.map(e => (
                <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const fullName = form.fullName.value.trim()
          const email = form.email.value.trim()
          const errs = []
          if (!fullName) errs.push({ field: 'fullName', message: 'Enter your full name' })
          const validEmail = /.+@.+\..+/.test(email)
          if (!email) errs.push({ field: 'email', message: 'Enter your email address' })
          else if (!validEmail) errs.push({ field: 'email', message: 'Enter an email address in the correct format, like name@example.com' })
          if (!pw) errs.push({ field: 'password', message: 'Enter a password' })
          else if (pw.length < 8) errs.push({ field: 'password', message: 'Enter a password of at least 8 characters' })
          if (pw !== pw2) errs.push({ field: 'confirmPassword', message: 'Passwords do not match' })
          if (errs.length) {
            setErrors(errs)
            setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
            return
          }
          navigate('/login')
        }} noValidate>
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.some(e => e.field === 'fullName') ? 'true' : 'false'}
            aria-describedby={errors.some(e => e.field === 'fullName') ? 'fullName-error' : undefined}
            className={errors.some(e => e.field === 'fullName') ? 'input-error' : undefined}
          />
          {errors.some(e => e.field === 'fullName') && (
            <p id="fullName-error" className="help-error">{errors.find(e => e.field === 'fullName')?.message}</p>
          )}

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors.some(e => e.field === 'email') ? 'true' : 'false'}
            aria-describedby={`emailHelp${errors.some(e => e.field === 'email') ? ' email-error' : ''}`}
            className={errors.some(e => e.field === 'email') ? 'input-error' : undefined}
          />
          <small id="emailHelp" className="sr-only">Enter your email address.</small>
          {errors.some(e => e.field === 'email') && (
            <p id="email-error" className="help-error">{errors.find(e => e.field === 'email')?.message}</p>
          )}

          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-describedby={`passwordHelp${errors.some(e => e.field === 'password') ? ' password-error' : ''}`}
              aria-invalid={errors.some(e => e.field === 'password') ? 'true' : 'false'}
              className={errors.some(e => e.field === 'password') ? 'input-error' : undefined}
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
          {errors.some(e => e.field === 'password') && (
            <p id="password-error" className="help-error">{errors.find(e => e.field === 'password')?.message}</p>
          )}

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
    </main>
  )
}
