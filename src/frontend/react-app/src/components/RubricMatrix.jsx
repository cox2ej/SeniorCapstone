import { useMemo } from 'react'

export default function RubricMatrix({
  criteria = [],
  selectedScores = {},
  onScoreChange,
  errors = {},
  readonly = false,
  emptyLabel = 'This assignment does not define a rubric.',
}) {
  const columnScores = useMemo(() => {
    const set = new Set()
    criteria.forEach((criterion) => {
      const min = typeof criterion.min_score === 'number' ? criterion.min_score : 1
      const max = typeof criterion.max_score === 'number' ? criterion.max_score : 5
      for (let score = min; score <= max; score += 1) {
        set.add(score)
      }
    })
    const list = Array.from(set)
    list.sort((a, b) => a - b)
    return list
  }, [criteria])

  if (!criteria.length) {
    return <p className="muted">{emptyLabel}</p>
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="rubric-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border-color, #ccc)' }}>Criterion</th>
            {columnScores.map((score) => (
              <th key={`rubric-head-${score}`} style={{ padding: '8px 12px', borderBottom: '2px solid var(--border-color, #ccc)', textAlign: 'center' }}>
                <div style={{ fontSize: 14 }}><strong>{score}</strong></div>
                <div style={{ fontSize: 12, color: 'var(--muted-color, #666)' }}>points</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((criterion) => {
            const min = typeof criterion.min_score === 'number' ? criterion.min_score : 1
            const max = typeof criterion.max_score === 'number' ? criterion.max_score : 5
            const hasError = Boolean(errors[criterion.id])
            const selectedScore = selectedScores[criterion.id]
            const scaleDescriptions = criterion.scale_descriptions || {}
            return (
              <tr key={criterion.id} style={{ borderBottom: '1px solid var(--border-color, #eee)' }}>
                <th scope="row" style={{ verticalAlign: 'top', padding: '12px', minWidth: 180 }}>
                  <div style={{ fontWeight: 600 }}>{criterion.label}{criterion.required && <span className="muted"> *</span>}</div>
                  {criterion.description && <p style={{ marginTop: 6, marginBottom: 6 }}>{criterion.description}</p>}
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {selectedScore ? `Selected: ${selectedScore} point${selectedScore !== 1 ? 's' : ''}` : 'No score selected yet.'}
                  </p>
                  {hasError && (
                    <p className="help-error" style={{ marginTop: 6 }}>{errors[criterion.id]}</p>
                  )}
                </th>
                {columnScores.map((score) => {
                  const inRange = score >= min && score <= max
                  const description = scaleDescriptions?.[score]
                  if (!inRange) {
                    return (
                      <td key={`${criterion.id}-${score}`} style={{ padding: '12px', textAlign: 'center', color: 'var(--muted-color, #bbb)' }}>—</td>
                    )
                  }
                  const isSelected = Number(selectedScore) === Number(score)
                  const content = (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Score {score}</div>
                      <p style={{ marginTop: 4, marginBottom: 0, fontSize: 14 }}>
                        {description || <span className="muted">No description provided.</span>}
                      </p>
                    </>
                  )
                  if (readonly || !onScoreChange) {
                    return (
                      <td key={`${criterion.id}-${score}`} style={{ padding: '12px', background: isSelected ? 'var(--accent-muted, #e6f2ff)' : 'transparent' }}>
                        {content}
                      </td>
                    )
                  }
                  return (
                    <td key={`${criterion.id}-${score}`} style={{ padding: 0 }}>
                      <button
                        type="button"
                        onClick={() => onScoreChange(criterion.id, score)}
                        aria-pressed={isSelected}
                        className="rubric-cell-button"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          padding: '12px',
                          background: isSelected ? 'var(--accent-muted, #e6f2ff)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        {content}
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
