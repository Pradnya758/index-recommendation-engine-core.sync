const LIMITATIONS = [
  {
    id: "heuristic",
    icon: "⚖️",
    title: "Heuristic Scoring, Not Cost-Based",
    severity: "info",
    body: "Scores are fixed, project-defined educational values assigned by query feature (equality 45, join 35, range 25, sort/group 15, composite exactly 65). Database evidence does not add scoring bonuses. They are not produced by a dataset, machine learning, benchmarks, measured performance, or a query cost model.",
  },
  {
    id: "workload",
    icon: "📊",
    title: "No Workload Frequency Data",
    severity: "warn",
    body: "The engine analyzes one query at a time. It does not know how often a query runs, whether it is a hot path, or whether other queries on the same table would benefit from a different index. A production advisor would analyze a workload log of thousands of queries.",
  },
  {
    id: "write-cost",
    icon: "✍️",
    title: "Write Overhead Not Measured",
    severity: "warn",
    body: "Every INSERT, UPDATE, and DELETE must update all indexes on the affected table. Adding an index always increases write latency. This engine recommends indexes based on read evidence only — it does not estimate write cost or warn about write-heavy tables.",
  },
  {
    id: "not-always-used",
    icon: "🔀",
    title: "An Index Is Not Always Used",
    severity: "info",
    body: "The SQLite query planner may choose a full table scan even when an index exists — for example, when the table is very small, when statistics suggest low selectivity, or when the query returns most rows. A recommendation is a suggestion, not a guarantee of index usage.",
  },
  {
    id: "bplus-conceptual",
    icon: "🌲",
    title: "B+ Tree Visualization Is Conceptual",
    severity: "info",
    body: "The B+ Tree visualization is an educational model showing the general structure of a balanced tree with linked leaf nodes. It does not reflect SQLite's exact internal page layout, fill factor, or node splitting behavior. SQLite uses a variant of B-trees for both table storage and indexes.",
  },
  {
    id: "no-stats",
    icon: "📉",
    title: "No Column Statistics",
    severity: "warn",
    body: "The engine does not read column cardinality, null counts, or value distributions from the database. It cannot distinguish a high-selectivity column (e.g. customer_id with 10,000 distinct values) from a low-selectivity column (e.g. is_active with 2 values) — both receive the same score for the same query feature.",
  },
  {
    id: "storage",
    icon: "💾",
    title: "Storage Cost Not Estimated",
    severity: "info",
    body: "Each index consumes additional disk space proportional to the number of rows and indexed columns. For large tables with many indexes, storage overhead can be significant. This engine does not estimate index size.",
  },
  {
    id: "demo-db",
    icon: "🗄️",
    title: "Demo Database Only",
    severity: "info",
    body: "The engine operates on a fixed demo database (students, customers, products, orders). It cannot connect to arbitrary databases. Schema inspection is limited to the tables and indexes present in the demo SQLite file.",
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
