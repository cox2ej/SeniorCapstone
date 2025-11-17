import { useMockStore } from '../store/mockStore.jsx'

export default function Notifications() {
  const { currentUser, assignments, reviews, users, getAssignmentById } = useMockStore()
  const events = []
  for (const a of assignments) {
    events.push({
      id: 'assn_' + a.id,
      date: a.createdAt ? new Date(a.createdAt).getTime() : 0,
      text: `Assignment posted by ${users[a.owner]?.name || a.owner}: ${a.title}`,
    })
  }
  for (const r of reviews) {
    const a = getAssignmentById(r.assignmentId)
    if (!a) continue
    const isReceived = a.owner === currentUser
    const who = users[r.reviewer]?.name || r.reviewer
    events.push({
      id: 'rev_' + r.id,
      date: r.createdAt ? new Date(r.createdAt).getTime() : 0,
      text: isReceived
        ? `New review received on ${a.title} by ${who} — Rating ${r.rating}`
        : `You reviewed ${users[a.owner]?.name || a.owner}'s ${a.title} — Rating ${r.rating}`,
    })
  }
  events.sort((a, b) => b.date - a.date)
  const recent = events.slice(0, 6)

  return (
    <>
      <h1>Notifications Center</h1>
      <section className="tile" aria-labelledby="nt-recent">
        <h2 id="nt-recent" className="tile-title">Recent</h2>
        <div className="tile-content">
          {recent.length === 0 ? (
            <p>No recent notifications.</p>
          ) : (
            <ul>
              {recent.map(ev => (
                <li key={ev.id}>{ev.text}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  )
}
