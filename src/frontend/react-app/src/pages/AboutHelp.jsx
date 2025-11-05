export default function AboutHelp() {
  return (
    <>
      <h1>About / Help</h1>
      <div className="tiles">
        <section className="tile" aria-labelledby="about-overview">
          <h2 id="about-overview" className="tile-title">Overview & FAQ</h2>
          <div className="tile-content">
            <p>Overview, FAQ, and contact info placeholder.</p>
          </div>
        </section>
        <section className="tile" aria-labelledby="about-contact">
          <h2 id="about-contact" className="tile-title">Contact & Support</h2>
          <div className="tile-content">
            <p>For help, visit this page or contact your instructor. (Prototype)</p>
          </div>
        </section>
      </div>
    </>
  )
}
