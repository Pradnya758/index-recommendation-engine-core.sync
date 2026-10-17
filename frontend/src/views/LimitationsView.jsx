
const LIMITATIONS = [
  {
    id: "query-plan-evidence",
    icon: "🔬",
    title: "Query-Plan Evidence, Not Benchmarks",
    severity: "warn",
    body: "The engine compares SQLite query plans before and after testing candidate indexes in an isolated database. A favorable plan change does not guarantee faster execution. Execution-time improvements are not claimed unless they are actually measured.",
  },
  {
    id: "workload",
    icon: "📊",
    title: "No Workload Frequency Analysis",
    severity: "warn",
    body: "The engine analyzes individual queries rather than a complete workload. It does not determine how frequently queries run or optimize competing read and write operations across thousands of queries.",
  },
  {
    id: "isolated-experiments",
    icon: "🧪",
    title: "Isolated Experiment Limitations",
    severity: "warn",
    body: "Candidate indexes are tested in an isolated SQLite environment. Results depend on how faithfully the experiment reproduces the relevant schema, existing indexes, data, and database settings.",
  },
  {
    id: "data-distribution",
    icon: "📉",
    title: "Limited Data-Distribution Evidence",
    severity: "warn",
    body: "The engine does not establish that experimental data represents every real workload. Selectivity, value distributions, and available planner statistics can affect SQLite's query-plan choices.",
  },
  {
    id: "not-always-used",
    icon: "🔀",
    title: "An Index Is Not Always Used",
    severity: "info",
    body: "SQLite may choose a table scan or another access path even when an index exists. Its decision depends on the query, available indexes, and planner information. A recommendation does not guarantee index usage.",
  },
  {
    id: "write-cost",
    icon: "✍️",
    title: "Write Overhead Is Not Benchmarked",
    severity: "warn",
    body: "Indexes consume storage and require maintenance during INSERT, UPDATE, and DELETE operations. The engine explains these trade-offs but does not claim to measure the actual write-performance cost of each candidate.",
  },
  {
    id: "bplus-conceptual",
    icon: "🌲",
    title: "B+ Tree Visualization Is Conceptual",
    severity: "info",
    body: "The visualization illustrates the general structure of a balanced tree. It does not reproduce SQLite's exact internal page layout, balancing operations, or storage behavior.",
  },
  {
    id: "sql-coverage",
    icon: "🧩",
    title: "Schema and SQL Coverage Is Limited",
    severity: "info",
    body: "Analysis depends on the schema and SQL constructs the engine can inspect and safely evaluate. Unsupported SQL, unavailable schema information, or inconclusive experiments may produce an UNCERTAIN result.",
  },
];


function LimitCard({ item }) {
  const colorMap = { warn: "lim-warn", info: "lim-info" };
  return (
    <div className={`lim-card ${colorMap[item.severity]}`}>
      <div className="lim-card-top">
        <span className="lim-icon">{item.icon}</span>
        <span className="lim-title">{item.title}</span>
        <span className={`lim-sev-badge lim-sev-${item.severity}`}>
          {item.severity === "warn" ? "Important" : "Note"}
        </span>
      </div>
      <p className="lim-body">{item.body}</p>
    </div>
  );
}

export default function LimitationsView() {
  return (
    <div className="lim-view">
      <div className="lim-inner">

        {/* Header */}
        <div className="lim-page-hdr">
          <div className="eyebrow eyebrow-accent">Academic Reference</div>
          <h1 className="lim-page-title">Known Limitations</h1>
          <p className="lim-page-sub">
            Honest documentation of what this educational engine does and does not measure.
          </p>
        </div>

        {/* ── Limitations ── */}
        <div className="algo-section">
          <div className="algo-section-hdr">
            <span className="algo-section-icon">⚠️</span>
            <span className="algo-section-title">Known Limitations</span>
          </div>
          <div className="algo-section-body">
            <p className="algo-body-text">
              These limitations are inherent to the current design. They are documented
              here for academic transparency, not as defects to be fixed.
            </p>
            <div className="lim-grid">
              {LIMITATIONS.map((item) => <LimitCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
