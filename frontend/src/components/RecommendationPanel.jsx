function confBadge(c) {
  return `conf-badge conf-${c}`;
}

export default function RecommendationPanel({ result, loading }) {
  if (loading) {
    return (
      <div className="az-loading">
        <span className="spinner" />
        Analyzing query structure and index coverage…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="az-empty">
        <div className="az-empty-icon">⚡</div>
        <div className="az-empty-title">No analysis yet</div>
        <div className="az-empty-desc">Enter a SELECT query and click Run Analysis to see index recommendations.</div>
      </div>
    );
  }

  if (!result.recommendations.length) {
    return (
      <div className="no-rec">
        <div className="no-rec-hdr">
          <span className="no-rec-icon">✅</span>
          <span className="no-rec-title">No new index needed</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "8px" }}>
          The relevant access path is already covered by a primary key or existing index.
        </p>
        <div className="rejected-list">
          {result.rejected_candidates.map((c) => (
            <div className="rejected-item" key={`${c.table}-${c.columns.join("-")}`}>
              {c.reason}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {result.recommendations.map((rec) => (
        <article className="rec-card" key={`${rec.table}-${rec.columns.join("-")}`}>
          <div className="rec-hdr">
            <div>
              <div className="rec-eyebrow">Recommended Index</div>
              <div className="rec-name">
                {rec.table}<span className="dot">.</span><span className="col">{rec.columns.join(", ")}</span>
              </div>
            </div>
            <div className="rec-score-wrap">
              <div className="rec-score">{rec.score}</div>
              <div className="rec-score-lbl">score</div>
              <span className={confBadge(rec.confidence)}>{rec.confidence}</span>
            </div>
          </div>

          <div className="rec-sql">
            <span className="sql-kw">CREATE</span>
            <span className="sql-code">{rec.create_index_sql}</span>
          </div>
          <div className="rec-sql">
            <span className="sql-kw drop">DROP</span>
            <span className="sql-code">{rec.drop_index_sql}</span>
          </div>

          <div className="rec-body">
            <div>
              <div className="rec-sec-title">Why this helps</div>
              <ul className="rec-list">
                {rec.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
            <div>
              <div className="rec-sec-title">Query evidence</div>
              <ul className="rec-list">
                {rec.evidence.map((item) => (
                  <li key={`${item.feature}-${item.column}`}>{item.detail}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
