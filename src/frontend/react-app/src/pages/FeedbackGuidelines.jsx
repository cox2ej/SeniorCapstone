import { Link } from 'react-router-dom'

export default function FeedbackGuidelines() {
  return (
    <>
      <h1 id="guidelines-title">Feedback Guidelines</h1>

      <section id="principles" className="tile" aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="tile-title">Principles</h2>
        <div className="tile-content">
          <ul>
            <li><strong>Be specific and objective</strong>: Refer to observable behaviors and outcomes.</li>
            <li><strong>Be constructive</strong>: Offer actionable suggestions for improvement.</li>
            <li><strong>Be respectful</strong>: Keep a professional, supportive tone.</li>
            <li><strong>Be balanced</strong>: Note strengths alongside growth areas.</li>
          </ul>
        </div>
      </section>

      <section id="structure" className="tile" aria-labelledby="structure-heading">
        <h2 id="structure-heading" className="tile-title">How to structure feedback (SBI)</h2>
        <div className="tile-content">
          <ol>
            <li><strong>Situation</strong>: Briefly describe when/where it happened.</li>
            <li><strong>Behavior</strong>: State the observable behavior, not intent.</li>
            <li><strong>Impact</strong>: Explain the effect on the team, timeline, or quality.</li>
          </ol>
        </div>
      </section>

      <section id="examples" className="tile" aria-labelledby="examples-heading">
        <h2 id="examples-heading" className="tile-title">Examples</h2>
        <div className="tile-content">
          <ul>
            <li><em>Constructive</em>: "In yesterday's stand-up (Situation), interruptions occurred during updates (Behavior), which caused confusion about next steps (Impact). Consider waiting until the end to ask questions."</li>
            <li><em>Positive</em>: "During the demo (Situation), your walkthrough of error states (Behavior) clarified our approach (Impact). Keep this level of detail in future demos."</li>
          </ul>
        </div>
      </section>

      <section id="dos-donts" className="tile" aria-labelledby="dos-heading">
        <h2 id="dos-heading" className="tile-title">Do's and Don'ts</h2>
        <div className="tile-content">
          <ul>
            <li><strong>Do</strong>: Use neutral language; focus on outcomes and behaviors.</li>
            <li><strong>Do</strong>: Provide suggestions or next steps.</li>
            <li><strong>Don't</strong>: Make assumptions about intent or character.</li>
            <li><strong>Don't</strong>: Share private information from outside the assignment context.</li>
          </ul>
        </div>
      </section>

      <div className="actions">
        <Link className="btn primary" to="/give-feedback" aria-label="Start giving feedback">Start feedback</Link>
      </div>
    </>
  )
}
