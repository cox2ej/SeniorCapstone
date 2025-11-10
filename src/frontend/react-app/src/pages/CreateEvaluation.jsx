import { useNavigate } from 'react-router-dom'

export default function CreateEvaluation() {
  const navigate = useNavigate()
  function onSubmit(e) {
    e.preventDefault()
    navigate('/instructor-dashboard')
  }
  return (
    <>
      <h1>Create Evaluation / Assignment</h1>
      <section className="tile" aria-labelledby="create-eval">
        <h2 id="create-eval" className="tile-title">New Evaluation</h2>
        <div className="tile-content">
          <form onSubmit={onSubmit} noValidate>
            <label htmlFor="ce-title">Title</label>
            <input id="ce-title" name="title" required />

            <label htmlFor="ce-due">Due Date</label>
            <input id="ce-due" name="due" type="date" required />

            <label htmlFor="ce-criteria">Criteria</label>
            <textarea id="ce-criteria" name="criteria" rows={4} placeholder="e.g., Collaboration, Communication, Quality" />

            <div className="actions">
              <button className="primary" type="submit">Save</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
