import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useMockStore } from '../store/mockStore.jsx'

export default function Layout() {
  const active = ({ isActive }) => (isActive ? 'active' : undefined)
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'student')
  const [navOpen, setNavOpen] = useState(false)
  const navRef = useRef(null)
  const menuBtnRef = useRef(null)
  const prevFocusRef = useRef(null)
  const { currentUser, setCurrentUser } = useMockStore()

  useEffect(() => {
    localStorage.setItem('role', role)
  }, [role])

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

  const homePath = role === 'student' ? '/student-dashboard' : '/instructor-dashboard'
  const navLinks = role === 'student' ? [...studentLinks, ...commonLinks] : [...instructorLinks, ...commonLinks]

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    navigate(newRole === 'student' ? '/student-dashboard' : '/instructor-dashboard')
  }

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
        <label htmlFor="role-select">View as</label>
        <select
          id="role-select"
          aria-label="View as"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        {role === 'student' && (
          <>
            <label htmlFor="user-select">User</label>
            <select
              id="user-select"
              aria-label="User"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              <option value="student1">Student 1</option>
              <option value="student2">Student 2</option>
            </select>
          </>
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
          <div className="role-mobile">
            <label htmlFor="role-select-mobile">View as</label>
            <select
              id="role-select-mobile"
              aria-label="View as"
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          {role === 'student' && (
            <div className="role-mobile">
              <label htmlFor="user-select-mobile">User</label>
              <select
                id="user-select-mobile"
                aria-label="User"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
              >
                <option value="student1">Student 1</option>
                <option value="student2">Student 2</option>
              </select>
            </div>
          )}
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={active} onClick={() => setNavOpen(false)}>{link.label}</NavLink>
          ))}
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
