import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'

export default function Layout() {
  const active = ({ isActive }) => (isActive ? 'active' : undefined)
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'student')
  const [navOpen, setNavOpen] = useState(false)

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
        <button
          type="button"
          className="menu-toggle btn"
          aria-label="Toggle navigation"
          aria-controls="primary-nav"
          aria-expanded={navOpen ? 'true' : 'false'}
          onClick={() => setNavOpen((v) => !v)}
        >
          Menu
        </button>
        <nav className="side-nav" id="primary-nav" aria-label="Primary">
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
      <main className="main" id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
