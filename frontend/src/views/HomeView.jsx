const METRICS = [
  { val: "5+", label: "Query Examples" },
  { val: "8", label: "Analysis Steps" },
  { val: "16", label: "Learning Concepts" },
  { val: "4", label: "Visualization Modes" },
];

function DbNetwork() {
  const stages = ["DATABASE", "SQL QUERY", "ANALYSIS", "INDEX", "QUERY PLAN"];
  return (
    <div className="hero-visual intelligence-stack" aria-label="Database intelligence pipeline">
      {stages.map((stage, index) => (
        <div className={`intelligence-node node-${index + 1}`} key={stage}>
          <span className="node-index">0{index + 1}</span>
          <span>{stage}</span>
          {index < stages.length - 1 && <i className="node-path" />}
        </div>
      ))}
    </div>
  );
}

export default function HomeView({ onNavigate }) {
  return (
    <div className="home-view view active">
      <div className="home-inner">

        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Database Intelligence Lab
            </div>
            <h1 className="hero-title">
              Index Recommendation<br />
              <span className="hero-title-line2">Engine</span>
            </h1>
            <p className="hero-statement">
              See how databases think about indexes.
            </p>
            <p className="hero-sub">
              Analyze a SQL query, discover useful index candidates, and understand why the
              engine recommends them.
            </p>
            <div className="hero-actions">
              <button className="hero-cta-primary" onClick={() => onNavigate("analyze")}>
                Analyze a Query <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          </div>
          <DbNetwork />
        </section>

        <div className="metrics-strip">
          {METRICS.map((m) => (
            <div className="metric-cell" key={m.label}>
              <div className={`metric-val ${m.valClass}`}>{m.val}</div>
              <div className="metric-label">{m.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
