import { useMockStore } from '../store/mockStore.jsx'

export default function ReportsExport() {
  const { assignments, reviews, users } = useMockStore()

  function handleExportCSV() {
    const header = ['assignment_id','assignment_title','assignment_owner','review_id','reviewer','rating','comments','created_at']
    const rows = []
    for (const r of reviews) {
      const a = assignments.find(x => x.id === r.assignmentId)
      rows.push([
        a?.id || '',
        escapeCsv(a?.title || ''),
        escapeCsv(users[a?.owner]?.name || a?.owner || ''),
        r.id,
        escapeCsv(users[r.reviewer]?.name || r.reviewer),
        String(r.rating ?? ''),
        escapeCsv(r.comments || ''),
        r.createdAt || ''
      ])
    }
    const csv = [header.join(','), ...rows.map(cols => cols.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'peer-feedback-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function escapeCsv(s) {
    if (s == null) return ''
    const str = String(s)
    if (/[",\n]/.test(str)) return '"' + str.replaceAll('"', '""') + '"'
    return str
  }

  return (
    <>
      <h1>Reports Export</h1>
      <section className="tile" aria-labelledby="re-overview">
        <h2 id="re-overview" className="tile-title">Export Options</h2>
        <div className="tile-content">
          <p>Download a CSV of all reviews with assignment context.</p>
          <div className="actions">
            <button className="btn primary" onClick={handleExportCSV} aria-label="Export CSV (mock)">Export CSV (mock)</button>
            <button className="btn" disabled>Export PDF (mock)</button>
          </div>
        </div>
      </section>
    </>
  )
}
