import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const successEmail = params.get('email')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  function onSubmit(e) {
    e.preventDefault()
    if (!email) return
    const sp = new URLSearchParams({ email })
    navigate(`/forgot-password?${sp.toString()}`)
  }

  return (
    <div className="auth-shell">
      <section className="auth-card" aria-labelledby="fp-title">
        <h1 id="fp-title">Reset your password</h1>
        <p>Enter the email associated with your account and we'll send you a reset link.</p>

        <form onSubmit={onSubmit} noValidate aria-labelledby="fp-title">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            aria-describedby="emailHelp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <small id="emailHelp" className="sr-only">Enter your email address. If an account exists, a reset link will be sent.</small>

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
    </div>
  )
}
