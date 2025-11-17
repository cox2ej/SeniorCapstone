import { useMockStore } from '../store/mockStore.jsx'

export default function AggregatedReports() {
  const { assignments, reviews, users } = useMockStore()
  const totalAssignments = assignments.length
  const totalReviews = reviews.length
  const average = totalReviews ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalReviews).toFixed(2) : 'N/A'

  const byAssignment = assignments.map(a => {
    const rs = reviews.filter(r => r.assignmentId === a.id)
    const avg = rs.length ? (rs.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rs.length).toFixed(2) : '—'
    return { id: a.id, title: a.title, owner: users[a.owner]?.name || a.owner, count: rs.length, avg }
  })

  const byReviewer = Object.values(reviews.reduce((acc, r) => {
    const key = r.reviewer
    if (!acc[key]) acc[key] = { reviewer: key, count: 0, sum: 0 }
    acc[key].count += 1
    acc[key].sum += Number(r.rating) || 0
    return acc
  }, {})).map(x => ({ name: users[x.reviewer]?.name || x.reviewer, count: x.count, avg: (x.sum / x.count).toFixed(2) }))

  return (
    <>
      <h1>Aggregated Reports</h1>
      <section className="tile" aria-labelledby="reports-overview">
        <h2 id="reports-overview" className="tile-title">Class-level Insights</h2>
        <div className="tile-content">
          <ul>
            <li>Total assignments: {totalAssignments}</li>
            <li>Total reviews: {totalReviews}</li>
            <li>Average rating: {average}</li>
          </ul>
        </div>
      </section>

      <section className="tile" aria-labelledby="by-assignment">
        <h2 id="by-assignment" className="tile-title">By assignment</h2>
        <div className="tile-content">
          {byAssignment.length === 0 ? (
            <p>No assignments yet.</p>
          ) : (
            <ul>
              {byAssignment.map(a => (
                <li key={a.id}><strong>{a.title}</strong> <span className="muted">(Owner: {a.owner})</span> — Reviews: {a.count} • Avg: {a.avg}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="tile" aria-labelledby="by-reviewer">
        <h2 id="by-reviewer" className="tile-title">By reviewer</h2>
        <div className="tile-content">
          {byReviewer.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            <ul>
              {byReviewer.map(p => (
                <li key={p.name}><strong>{p.name}</strong> — Reviews given: {p.count} • Avg rating: {p.avg}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
