export default function Notifications() {
  return (
    <>
      <h1>Notifications Center</h1>
      <section className="tile" aria-labelledby="nt-recent">
        <h2 id="nt-recent" className="tile-title">Recent</h2>
        <div className="tile-content">
          <ul>
            <li>Reminder: Submit feedback for Assignment 1 by Friday.</li>
            <li>New feedback received for Group Project.</li>
          </ul>
        </div>
      </section>
    </>
  )
}
