function FeatureCard({ title, values }) {
  return (
    <div className="feat-card">
      <div className="feat-label">{title}</div>
      {values.length ? (
        <div className="feat-tags">
          {values.map((v) => (
            <span className="feat-tag" key={`${v.table}-${v.column}`}>{v.table}.{v.column}</span>
          ))}
        </div>
      ) : (
        <span className="feat-none">None detected</span>
      )}
    </div>
  );
}

export default function AnalysisPanel({ result, plan }) {
  if (!result) return null;
  const { analysis } = result;

  return (
    <div className="analysis-section">
      <div style={{ marginBottom: "4px" }}>
        <div className="eyebrow">Query anatomy</div>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>Detected access patterns</div>
      </div>

      <div className="feat-grid">
        <FeatureCard title="WHERE filters" values={[...analysis.equality_filters, ...analysis.range_filters]} />
        <FeatureCard title="JOIN columns"  values={analysis.join_columns} />
        <FeatureCard title="ORDER BY"      values={analysis.order_by_columns} />
        <FeatureCard title="GROUP BY"      values={analysis.group_by_columns} />
      </div>

      <div className="plan-card">
        <div className="plan-card-hdr">EXPLAIN QUERY PLAN</div>
        <div className="plan-steps">
          {plan?.plan?.length ? (
            plan.plan.map((step, i) => (
              <div className="plan-step" key={step.id}>
                <span className="plan-step-n">{i + 1}.</span>
                <span className="plan-step-d">{step.detail}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: "11px", color: "var(--text3)", padding: "4px 0" }}>No plan available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
