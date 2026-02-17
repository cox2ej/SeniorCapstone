import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'
import { useNotifications } from '../hooks/useNotifications.js'
import { apiGet, isBackendEnabled } from '../api/client.js'

export default function Layout() {
  const active = ({ isActive }) => (isActive ? 'active' : undefined)
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const navRef = useRef(null)
  const menuBtnRef = useRef(null)
  const prevFocusRef = useRef(null)
  const { currentUser, users, resetDemo } = useMockStore()
  const { notifications } = useNotifications()
  const backendEnabled = isBackendEnabled()
  const [authUser, setAuthUser] = useState(null)
  const [authError, setAuthError] = useState(null)
  const userDisplayName = useMemo(() => {
    if (backendEnabled && authUser) {
      return authUser.display_name
        || authUser.full_name
        || authUser.username
        || authUser.email
        || 'Signed-in user'
    }
    return users[currentUser]?.name || currentUser || 'Demo user'
  }, [backendEnabled, authUser, users, currentUser])

  useEffect(() => {
    if (!backendEnabled) {
      setAuthUser(null)
      setAuthError(null)
      return undefined
    }

    let cancelled = false
    async function fetchMe() {
      setAuthError(null)
      try {
        const data = await apiGet('/users/me/')
        if (!cancelled) setAuthUser(data)
      } catch (err) {
        if (!cancelled) {
          if (err?.status === 401) {
            setAuthUser(null)
            setAuthError(null)
          } else {
            setAuthError(err)
          }
        }
      }
    }

    fetchMe()
    return () => { cancelled = true }
  }, [backendEnabled])

  const studentLinks = [
    { to: '/student-dashboard', label: 'Dashboard' },
    { to: '/give-feedback', label: 'Give Feedback' },
    { to: '/my-feedback', label: 'My Feedback' },
    { to: '/self-assessment', label: 'Self-Assessment' },  
    { to: '/feedback-history', label: 'Feedback History' },
  ]
  const instructorLinks = [
    { to: '/instructor-dashboard', label: 'Dashboard' },
    { to: '/create-evaluation', label: 'Create Evaluation' },
    { to: '/manage-courses-groups', label: 'Manage Courses / Groups' },
    { to: '/aggregated-reports', label: 'Aggregated Reports' },
    { to: '/reports-export', label: 'Reports Export' },
    { to: '/peer-matching', label: 'Peer Matching' },
    { to: '/admin-analytics', label: 'Analytics' },
    { to: '/admin-settings', label: 'Settings' },
  ]
  const commonLinks = [
    { to: '/notifications', label: 'Notifications' },
    { to: '/profile', label: 'Profile' },
    { to: '/privacy-settings', label: 'Privacy' },
    { to: '/about-help', label: 'Help' },
  ]

  const resolvedRole = useMemo(() => {
    if (backendEnabled && authUser?.role) return authUser.role
    return 'student'
  }, [backendEnabled, authUser])
  const viewingInstructor = resolvedRole === 'instructor' || resolvedRole === 'admin'
  const homePath = viewingInstructor ? '/instructor-dashboard' : '/student-dashboard'
  const navLinks = viewingInstructor ? [...instructorLinks, ...commonLinks] : [...studentLinks, ...commonLinks]

  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications])

  // Close mobile menu on route change and when viewport grows
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setNavOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Focus trap, ESC to close, and body scroll lock when drawer open
  useEffect(() => {
    if (navOpen) {
      // store previously focused element
      prevFocusRef.current = document.activeElement
      // lock body scroll
      const prevOverflow = document.body.style.overflow
      const menuBtnEl = menuBtnRef.current
      document.body.style.overflow = 'hidden'

      // move focus into drawer
      const container = navRef.current
      let focusables = []
      if (container) {
        focusables = Array.from(container.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ))
        if (focusables.length) {
          focusables[0].focus()
        } else {
          container.setAttribute('tabindex', '-1')
          container.focus()
        }
      }

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setNavOpen(false)
          return
        }
        if (e.key === 'Tab' && container) {
          const items = focusables.length
            ? focusables
            : Array.from(container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          if (!items.length) return
          const first = items[0]
          const last = items[items.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener('keydown', onKeyDown, true)

      return () => {
        document.body.style.overflow = prevOverflow
        document.removeEventListener('keydown', onKeyDown, true)
        // restore focus to menu button
        if (menuBtnEl) menuBtnEl.focus()
      }
    }
  }, [navOpen])
  return (
    <div className="layout">
      <aside className="sidebar" aria-label="Sidebar" data-open={navOpen ? 'true' : 'false'}>
        <NavLink to={homePath} className="brand-large" onClick={() => setNavOpen(false)}>Peer Feedback App</NavLink>
        <p className="muted" style={{ marginTop: 12 }}>
          Logged in as <strong>{userDisplayName}</strong>
          {authError && backendEnabled && (
            <>
              <br />
              <span className="error-text">Unable to confirm session.</span>
            </>
          )}
        </p>
        {!backendEnabled && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (window.confirm('Clear demo data and reset users?')) {
                resetDemo()
                setNavOpen(false)
                navigate(homePath)
              }
            }}
            aria-label="Reset demo data"
          >
            Reset demo data
          </button>
        )}
        <button
          type="button"
          className="menu-toggle btn"
          aria-label="Toggle navigation"
          aria-controls="primary-nav"
          aria-expanded={navOpen ? 'true' : 'false'}
          onClick={() => setNavOpen((v) => !v)}
          ref={menuBtnRef}
        >
          Menu
        </button>
        <nav className="side-nav" id="primary-nav" aria-label="Primary" ref={navRef}>
          <div className="role-mobile" style={{ marginTop: 12 }}>
            <p className="muted" style={{ marginBottom: 8 }}>Logged in as <strong>{userDisplayName}</strong></p>
            {!backendEnabled && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (window.confirm('Clear demo data and reset users?')) {
                    resetDemo()
                    setNavOpen(false)
                    navigate(homePath)
                  }
                }}
                aria-label="Reset demo data"
              >
                Reset demo data
              </button>
            )}
          </div>
          {navLinks.map((link) => {
            const showBadge = link.to === '/notifications' && unreadNotifications > 0
            const label = link.label
            return (
              <NavLink key={link.to} to={link.to} className={active} onClick={() => setNavOpen(false)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{label}</span>
                  {showBadge && (
                    <span
                      className="badge"
                      aria-label={`${unreadNotifications} unread notifications`}
                      style={{
                        background: '#d03b3b',
                        borderRadius: 12,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        lineHeight: 1.2,
                      }}
                    >
                      {unreadNotifications}
                    </span>
                  )}
                </span>
              </NavLink>
            )
          })}
          <NavLink to="/logout" className={active} onClick={() => setNavOpen(false)}>Logout</NavLink>
        </nav>
      </aside>
      {navOpen && (
        <div
          className="nav-backdrop"
          aria-hidden="true"
          onClick={() => setNavOpen(false)}
        />
      )}
      <main className="main" id="main-content" tabIndex="-1" aria-hidden={navOpen ? 'true' : undefined}>
        <Outlet />
      </main>
    </div>
  )
}
