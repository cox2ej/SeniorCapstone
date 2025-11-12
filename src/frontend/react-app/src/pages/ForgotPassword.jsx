import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const successEmail = params.get('email')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState([])
  const errorSummaryRef = useRef(null)
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    const errs = []
    const trimmed = email.trim()
    const valid = /.+@.+\..+/.test(trimmed)
    if (!trimmed) errs.push({ field: 'email', message: 'Enter your email address' })
    else if (!valid) errs.push({ field: 'email', message: 'Enter an email address in the correct format, like name@example.com' })
    if (errs.length) {
      setErrors(errs)
      setTimeout(() => errorSummaryRef.current && errorSummaryRef.current.focus(), 0)
      return
    }
    const sp = new URLSearchParams({ email })
    navigate(`/forgot-password?${sp.toString()}`)
  }

  return (
    <main id="main-content" className="auth-shell" tabIndex="-1">
      <section className="auth-card" aria-labelledby="fp-title">
        <h1 id="fp-title">Reset your password</h1>
        <p>Enter the email associated with your account and we'll send you a reset link.</p>

        {errors.length > 0 && (
          <div className="error-summary" role="alert" aria-labelledby="fp-error-summary-title" tabIndex="-1" ref={errorSummaryRef}>
            <h2 id="fp-error-summary-title">There is a problem</h2>
            <ul>
              {errors.map(e => (
                <li key={e.field}><a href={`#${e.field}`}>{e.message}</a></li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit} noValidate aria-labelledby="fp-title">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-describedby={`emailHelp${errors.length ? ' email-error' : ''}`}
            aria-invalid={errors.some(e => e.field === 'email') ? 'true' : 'false'}
            className={errors.some(e => e.field === 'email') ? 'input-error' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <small id="emailHelp" className="sr-only">Enter your email address. If an account exists, a reset link will be sent.</small>
          {errors.some(e => e.field === 'email') && (
            <p id="email-error" className="help-error">{errors.find(e => e.field === 'email')?.message}</p>
          )}

          <div className="actions">
            <button className="primary" type="submit" aria-label="Send password reset link (mock)">Send reset link</button>
            <Link to="/login" className="btn" aria-label="Back to login">Back to login</Link>
            <Link to="/reset-password" className="btn" aria-label="Go to reset password (nav test)">Go to reset (test)</Link>
          </div>
        </form>

        <div id="fp-success" role="status" aria-live="polite" hidden={!successEmail}>
          <p>
            If an account exists for <strong><span className="email">{successEmail}</span></strong>, we've sent a password reset link.
            Please check your inbox and spam folder. (Prototype)
          </p>
        </div>

        <div id="form-messages" className="sr-only" aria-live="polite"></div>
      </section>
    </main>
  )
}
