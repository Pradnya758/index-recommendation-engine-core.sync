export default function PlanComparison({ result, plan }) {
  const recommendation = result.recommendations[0];
  return (
    <article className="visual-card plan-comparison-card">
      <div className="visual-heading"><div><p className="eyebrow">Plan-based comparison</p><h3>Before vs after index</h3></div><span>Not benchmarked</span></div>
      <p className="visual-copy">The current side uses actual SQLite <code>EXPLAIN QUERY PLAN</code> output. The proposed side describes the intended access path only; no performance number is claimed.</p>
      <div className="comparison-grid">
        <section><p className="comparison-label">Current query plan</p>{plan?.plan?.length ? <ul>{plan.plan.map((item) => <li key={item.id}><code>{item.detail}</code></li>)}</ul> : <p>No current plan.</p>}<strong>Access: current SQLite plan</strong></section>
        <section><p className="comparison-label">With recommended index</p>{recommendation ? <><code>{recommendation.create_index_sql}</code><p>Conceptual plan: <b>SEARCH {recommendation.table} USING INDEX {recommendation.columns.join(", ")}</b></p><strong>Access: index traversal, same matching rows</strong></> : <p>No new index is recommended because current access is already covered.</p>}</section>
      </div>
    </article>
  );
}
