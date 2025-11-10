import { useLocation } from 'react-router-dom'

const entries = [
  { id: 'a1', assignment: 'A', title: 'Assignment A', date: 'Oct 10', rating: 4, text: '"Clear explanations; consider adding examples for edge cases."' },
  { id: 'b1', assignment: 'B', title: 'Assignment B', date: 'Oct 08', rating: 5, text: '"Great structure and detail; strong teamwork shown."' },
  { id: 'c1', assignment: 'C', title: 'Assignment C', date: 'Oct 05', rating: 3, text: '"Good baseline; tighten scope and expand test coverage."' },
  { id: 'a2', assignment: 'A', title: 'Assignment A', date: 'Oct 02', rating: 4, text: '"Helpful refactor suggestions; watch naming consistency."' },
]

export default function FeedbackHistory() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const filter = params.get('assignment')
  const filtered = filter ? entries.filter(e => e.assignment === filter) : entries
  const none = filter && filtered.length === 0

  return (
    <>
      <h1 id="fh-title">{filter ? `Feedback History — Assignment ${filter}` : 'Feedback History'}</h1>
      <p id="fh-filter-note" className="sr-only">
        {filter ? `Showing results for: Assignment ${filter}` : 'Showing results for: All assignments'}
      </p>

      <section className="tile" aria-labelledby="trend-heading">
        <h2 id="trend-heading" className="tile-title">Trends</h2>
        <div className="tile-content">
          <p>Trend graph placeholder.</p>
        </div>
      </section>

      <div className="tiles" aria-label="Feedback list">
        {filtered.map(e => (
          <div key={e.id} className="tile" aria-labelledby={`fh-${e.id}-title`}>
            <h2 id={`fh-${e.id}-title`} className="tile-title">{e.title}</h2>
            <div className="tile-subtitle">{e.date} • Rating {e.rating}</div>
            <div className="tile-content">
              <ul>
                <li>{e.text}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p id="fh-empty" className={none ? '' : 'sr-only'}>No feedback found for this assignment.</p>
    </>
  )
}
