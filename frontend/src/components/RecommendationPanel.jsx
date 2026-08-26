function confidenceClass(confidence) {
  return `confidence confidence-${confidence}`;
}

export default function RecommendationPanel({ result, loading }) {
  if (loading) {
    return <section className="result-panel loading-panel"><span className="spinner" /> Analyzing query structure and index coverage...</section>;
  }
  if (!result) {
    return <section className="result-panel empty-state">Run an analysis to see practical index recommendations.</section>;
  }
  if (!result.recommendations.length) {
    return (
      <section className="result-panel empty-state">
        <strong>No new index is useful for this query.</strong>
        <p>The relevant access path is already covered by a primary key or existing index.</p>
        {result.rejected_candidates.map((candidate) => <small key={`${candidate.table}-${candidate.columns.join("-")}`}>{candidate.reason}</small>)}
      </section>
    );
  }

  return (
    <div className="recommendation-list">
      {result.recommendations.map((recommendation) => (
        <article className="recommendation-card" key={`${recommendation.table}-${recommendation.columns.join("-")}`}>
          <div className="recommendation-topline">
            <div>
              <p className="eyebrow">Recommended index</p>
              <h2>{recommendation.table}<span>.</span>{recommendation.columns.join(", ")}</h2>
            </div>
            <div className="score-wrap">
              <strong>{recommendation.score}</strong><span>score</span>
              <em className={confidenceClass(recommendation.confidence)}>{recommendation.confidence}</em>
            </div>
          </div>
          <div className="sql-block"><span>CREATE</span><code>{recommendation.create_index_sql}</code></div>
          <div className="sql-block secondary"><span>DROP</span><code>{recommendation.drop_index_sql}</code></div>
          <div className="explanation-grid">
            <div>
              <h3>Why this helps</h3>
              <ul>{recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            </div>
            <div>
              <h3>Query evidence</h3>
              <ul>{recommendation.evidence.map((item) => <li key={`${item.feature}-${item.column}`}>{item.detail}</li>)}</ul>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
