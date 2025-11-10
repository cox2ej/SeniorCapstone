export default function PrivacySettings() {
  return (
    <>
      <h1>Privacy Settings</h1>
      <section className="tile" aria-labelledby="ps-overview">
        <h2 id="ps-overview" className="tile-title">Data & Consent</h2>
        <div className="tile-content">
          <p>Manage consent and data retention (prototype placeholder).</p>
          <div className="actions">
            <button className="btn" type="button" disabled>Delete My Account (mock)</button>
          </div>
        </div>
      </section>
    </>
  )
}
