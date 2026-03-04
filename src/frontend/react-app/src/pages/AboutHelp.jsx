import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import { apiGet, isBackendEnabled } from '../api/client.js'

const FAQ_ITEMS = [
  { id: 'submitting', q: 'How do I submit feedback?', a: 'Go to Give Feedback, select the assignment, and complete the rubric and comments. Submit before the deadline.' },
  { id: 'claiming', q: 'How do I claim assignments?', a: 'Assignments assigned to you appear on your dashboard and under Give Feedback. Open an assignment to start your review.' },
  { id: 'notifications', q: 'How do notifications work?', a: 'You get notified when you have new assignments to review or when feedback is due. Check the Notifications page and your email if enabled.' },
  { id: 'deadlines', q: 'What if I miss a deadline?', a: 'Late submissions may not be accepted. Contact your instructor if you have an exception.' },
  { id: 'privacy', q: 'Who can see my feedback?', a: 'Instructors can see all feedback for grading. Peers see only the feedback on work assigned to them, and anonymity depends on your privacy settings.' },
]

const INSTRUCTOR_FAQ = [
  { id: 'creating', q: 'How do I create assignments?', a: 'Go to Create Evaluation, set the title, criteria, and due dates, then publish. Students will see it on their dashboard.' },
  { id: 'cohorts', q: 'How do I manage cohorts and groups?', a: 'Use Manage Courses / Groups to view rosters, create groups, and assign peer reviewers. You can auto-generate groups or drag-and-drop.' },
  { id: 'analytics', q: 'How do I interpret analytics?', a: 'The Analytics page shows review completion, ratings over time, and workload. Use filters by course and date range.' },
]

export default function AboutHelp() {
  const [faqSearch, setFaqSearch] = useState('')
  const [openFaqId, setOpenFaqId] = useState(null)
  const { summary } = useDashboardSummary()
  const backendEnabled = isBackendEnabled()
  const [authUser, setAuthUser] = useState(null)
  useEffect(() => {
    if (!backendEnabled) return undefined
    let cancelled = false
    async function fetchMe() {
      try {
        const data = await apiGet('/users/me/')
        if (!cancelled) setAuthUser(data)
      } catch {
        if (!cancelled) setAuthUser(null)
      }
    }
    fetchMe()
    return () => { cancelled = true }
  }, [backendEnabled])
  const isInstructor = (summary?.role === 'instructor' || summary?.role === 'admin') || (authUser && (authUser.role === 'instructor' || authUser.role === 'admin'))

  const filteredFaq = useMemo(() => {
    const s = faqSearch.trim().toLowerCase()
    if (!s) return FAQ_ITEMS
    return FAQ_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(s) || item.a.toLowerCase().includes(s)
    )
  }, [faqSearch])

  return (
    <>
      <h1>About / Help</h1>

      {/* Optional Status Banner */}
      <section className="tile status-banner" aria-label="System announcements" style={{ marginBottom: 16 }}>
        <div className="tile-content">
          <p className="muted">Space for system announcements (e.g. maintenance, new features). No active announcements.</p>
        </div>
      </section>

      {/* Searchable FAQ */}
      <section className="tile" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="tile-title">Frequently asked questions</h2>
        <div className="tile-content">
          <label className="sr-only" htmlFor="faq-search">Search FAQ</label>
          <input
            id="faq-search"
            type="search"
            placeholder="Search FAQ…"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            className="faq-search-input"
            aria-controls="faq-list"
          />
          <ul id="faq-list" className="faq-list">
            {filteredFaq.length === 0 ? (
              <li><p className="muted">No matching questions.</p></li>
            ) : (
              filteredFaq.map((item) => (
                <li key={item.id} className="faq-item">
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaqId((id) => (id === item.id ? null : item.id))}
                    aria-expanded={openFaqId === item.id}
                    aria-controls={`faq-answer-${item.id}`}
                    id={`faq-q-${item.id}`}
                  >
                    {item.q}
                  </button>
                  <div
                    id={`faq-answer-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-q-${item.id}`}
                    className="faq-answer"
                    hidden={openFaqId !== item.id}
                  >
                    <p>{item.a}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      {/* Contact Support */}
      <section className="tile" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="tile-title">Contact support</h2>
        <div className="tile-content">
          <p>For technical or course-related help, contact your instructor first. For platform issues, use the form below or email support (placeholder).</p>
          <p className="muted">Typical response time: within 2 business days (SLA placeholder).</p>
          <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="support-subject">Subject</label>
            <input id="support-subject" type="text" placeholder="Brief subject" />
            <label htmlFor="support-message">Message</label>
            <textarea id="support-message" rows={4} placeholder="Describe your issue or question." />
            <div className="actions">
              <button type="submit" className="btn primary">Send (placeholder)</button>
              <a href="mailto:support@example.edu" className="btn">Email support</a>
            </div>
          </form>
        </div>
      </section>

      {/* Getting Started Links */}
      <section className="tile" aria-labelledby="getting-started-heading">
        <h2 id="getting-started-heading" className="tile-title">Getting started</h2>
        <div className="tile-content">
          <ul className="getting-started-links">
            <li><Link to="/student-dashboard">Student Dashboard</Link></li>
            <li><Link to="/give-feedback">Give Feedback</Link></li>
            <li><Link to="/peer-matching">Peer Matching</Link></li>
          </ul>
        </div>
      </section>

      {/* Instructor-only: Admin FAQ, Escalation, Training */}
      {isInstructor && (
        <>
          <section className="tile" aria-labelledby="instructor-faq-heading">
            <h2 id="instructor-faq-heading" className="tile-title">Instructor FAQ</h2>
            <div className="tile-content">
              <ul className="faq-list">
                {INSTRUCTOR_FAQ.map((item) => (
                  <li key={item.id} className="faq-item">
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => setOpenFaqId((id) => (id === 'inst-' + item.id ? null : 'inst-' + item.id))}
                      aria-expanded={openFaqId === 'inst-' + item.id}
                    >
                      {item.q}
                    </button>
                    <div className="faq-answer" hidden={openFaqId !== 'inst-' + item.id}>
                      <p>{item.a}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="tile" aria-labelledby="escalation-heading">
            <h2 id="escalation-heading" className="tile-title">Escalation paths</h2>
            <div className="tile-content">
              <p>For platform bugs or outages, contact <strong>platform support</strong>. For course or institutional policy, contact <strong>institutional IT</strong>.</p>
              <div className="actions" style={{ marginTop: 12 }}>
                <a href="mailto:platform-support@example.edu" className="btn">Platform support</a>
                <a href="mailto:it@example.edu" className="btn">Institutional IT</a>
              </div>
            </div>
          </section>
          <section className="tile" aria-labelledby="training-heading">
            <h2 id="training-heading" className="tile-title">Training resources</h2>
            <div className="tile-content">
              <ul className="getting-started-links">
                <li><a href="#">Onboarding deck (placeholder)</a></li>
                <li><a href="#">Video walkthrough (placeholder)</a></li>
              </ul>
            </div>
          </section>
        </>
      )}
    </>
  )
}
