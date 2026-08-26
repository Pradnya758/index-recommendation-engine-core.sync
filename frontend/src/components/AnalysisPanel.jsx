function FeatureList({ title, values }) {
  return (
    <div className="feature-card">
      <p>{title}</p>
      {values.length ? <div>{values.map((value) => <code key={`${value.table}-${value.column}`}>{value.table}.{value.column}</code>)}</div> : <span>None detected</span>}
    </div>
  );
}

export default function AnalysisPanel({ result, plan }) {
  if (!result) {
    return null;
  }
  const { analysis } = result;
  return (
    <section className="analysis-panel">
      <div className="section-heading"><div><p className="eyebrow">Query anatomy</p><h2>Detected access patterns</h2></div></div>
      <div className="feature-grid">
        <FeatureList title="WHERE filters" values={[...analysis.equality_filters, ...analysis.range_filters]} />
        <FeatureList title="JOIN columns" values={analysis.join_columns} />
        <FeatureList title="ORDER BY" values={analysis.order_by_columns} />
        <FeatureList title="GROUP BY" values={analysis.group_by_columns} />
      </div>
      <div className="plan-box">
        <div><p className="eyebrow">SQLite output</p><h3>EXPLAIN QUERY PLAN</h3></div>
        {plan?.plan?.length ? <ol>{plan.plan.map((step) => <li key={step.id}><code>{step.detail}</code></li>)}</ol> : <p className="muted">No plan is available.</p>}
      </div>
    </section>
  );
}
