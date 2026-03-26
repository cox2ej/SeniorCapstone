import { useMemo, useState } from 'react'

const FAQ_ITEMS = [
  {
    q: 'How are reviewers anonymized?',
    a: 'If the assignment has reviewer anonymization enabled, student-facing views hide reviewer identity and show alias labels only.',
  },
  {
    q: 'Where can I see detailed rubric scores?',
    a: 'Open Feedback History, then choose “View full review” or “View self-assessment details” to see criterion-by-criterion rubric output.',
  },
  {
    q: 'How do I update my profile and privacy preferences?',
    a: 'Use the Profile and Privacy Settings pages from the sidebar. Changes are saved to your account settings.',
  },
]

export default function AboutHelp() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const filteredFaq = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return FAQ_ITEMS
    return FAQ_ITEMS.filter((item) => (
      item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle)
    ))
  }, [query])

  function handleSupportSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <h1>About / Help</h1>

      <section className="tile" aria-labelledby="about-overview">
        <h2 id="about-overview" className="tile-title">Overview & FAQ</h2>
        <div className="tile-content">
          <p>
            Peer Feedback App helps instructors run structured peer reviews and gives students rubric-based, privacy-aware feedback workflows.
          </p>

          <label htmlFor="help-search">Search FAQ</label>
          <input
            id="help-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for rubric, privacy, feedback..."
          />

          {filteredFaq.length === 0 ? (
            <p className="muted" style={{ marginTop: 12 }}>No FAQ entries match your search.</p>
          ) : (
            <ul style={{ marginTop: 12 }}>
              {filteredFaq.map((item) => (
                <li key={item.q}>
                  <strong>{item.q}</strong>
                  <p style={{ marginTop: 4 }}>{item.a}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="about-contact">
        <h2 id="about-contact" className="tile-title">Contact & Support</h2>
        <div className="tile-content">
          <p>If your issue is blocking coursework, contact your course instructor first, then platform support.</p>
          <form onSubmit={handleSupportSubmit}>
            <label htmlFor="help-subject">Subject</label>
            <input id="help-subject" name="subject" required placeholder="Short issue summary" />

            <label htmlFor="help-message">Message</label>
            <textarea id="help-message" name="message" rows={5} required placeholder="Describe what happened and what you expected." />

            <div className="actions">
              <button className="btn primary" type="submit">Send support request</button>
            </div>
          </form>
          {submitted && <p role="status">Support request captured. Please check your inbox for follow-up instructions.</p>}
        </div>
      </section>
    </>
  )
}
