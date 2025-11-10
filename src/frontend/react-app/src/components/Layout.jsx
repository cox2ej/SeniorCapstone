import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export default function Layout() {
  const active = ({ isActive }) => (isActive ? 'active' : undefined)
  const navigate = useNavigate()
  const [role, setRole] = useState(() => localStorage.getItem('role') || 'student')

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
  return (
    <div className="layout">
      <aside className="sidebar" aria-label="Sidebar">
        <NavLink to={homePath} className="brand-large">Peer Feedback App</NavLink>
        <label htmlFor="role-select">View as</label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
        </select>
        <nav className="side-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={active}>{link.label}</NavLink>
          ))}
          <NavLink to="/logout" className={active}>Logout</NavLink>
        </nav>
      </aside>
      <main className="main" id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
