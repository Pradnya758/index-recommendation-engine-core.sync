import { useState } from "react";

const LIMITATIONS = [
  {
    id: "heuristic",
    icon: "⚖️",
    title: "Heuristic Scoring, Not Cost-Based",
    severity: "info",
    body: "Scores are additive weights assigned by rule (equality +45, join +35, range +25, sort/group +15, composite +65). They reflect common DBA intuition, not a query cost model. A real optimizer measures I/O cost, row estimates, and buffer pool state — this engine does none of that.",
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

const LEARNING_OUTCOMES = [
  { icon: "🗂️", outcome: "Identify useful index candidates from a SQL query's WHERE, JOIN, ORDER BY, and GROUP BY clauses." },
  { icon: "📊", outcome: "Read and interpret SQLite EXPLAIN QUERY PLAN output — distinguish SCAN (full table read) from SEARCH (index lookup)." },
  { icon: "📋", outcome: "Explain the difference between a full table scan and an index scan, and when each is used." },
  { icon: "🔗", outcome: "Understand composite indexes — why column order matters and how the left-prefix rule applies." },
  { icon: "💡", outcome: "Interpret an index recommendation: what the score means, what confidence levels indicate, and what the CREATE INDEX SQL does." },
  { icon: "⚖️", outcome: "Articulate the trade-offs of adding an index: faster reads, slower writes, additional storage." },
  { icon: "🌲", outcome: "Describe the conceptual structure of a B+ tree and why it supports both point lookups and range scans efficiently." },
  { icon: "🎯", outcome: "Explain selectivity and why high-selectivity columns benefit more from indexing than low-selectivity columns." },
];

const THEORY = [
  {
    id: "what-is-index",
    icon: "🗂️",
    title: "What Is a Database Index?",
    definition: "A separate data structure (typically a B+ tree) that maps column values to the physical locations of matching rows.",
    usecase: "Without an index, finding all orders with status = 'paid' requires reading every row. With an index on status, the database jumps directly to matching rows.",
    tradeoff: "Indexes consume storage and must be updated on every write. They are most valuable on columns used frequently in WHERE, JOIN, or ORDER BY clauses.",
  },
  {
    id: "full-scan",
    icon: "📋",
    title: "Full Table Scan",
    definition: "The database reads every row in the table sequentially to find rows matching the query condition.",
    usecase: "Unavoidable when no suitable index exists, or when the query returns most rows (e.g. SELECT * FROM small_table).",
    tradeoff: "Cost grows linearly with table size — O(n). Acceptable for small tables; expensive for millions of rows.",
  },
  {
    id: "index-scan",
    icon: "⚡",
    title: "Index Scan",
    definition: "The database traverses the index structure to find matching entries, then fetches only the relevant rows.",
    usecase: "SELECT * FROM orders WHERE customer_id = 42 — with an index on customer_id, only matching rows are fetched.",
    tradeoff: "Efficient for selective queries. For queries returning most rows, the overhead of index traversal + row fetch can exceed a full scan.",
  },
  {
    id: "btree",
    icon: "🌳",
    title: "B-Tree / B+ Tree",
    definition: "A self-balancing tree where each node holds multiple keys. In a B+ tree, all data is in leaf nodes; internal nodes hold only routing keys. Leaf nodes are linked for range traversal.",
    usecase: "O(log n) point lookups and efficient range scans (BETWEEN, >, <) because leaf nodes are linked in sorted order.",
    tradeoff: "Tree rebalancing on insert/delete adds write overhead. Node splits can cause page I/O.",
  },
  {
    id: "composite",
    icon: "🔗",
    title: "Composite Index",
    definition: "An index on two or more columns. The index is sorted first by the leading column, then by subsequent columns.",
    usecase: "An index on (customer_id, status) satisfies WHERE customer_id = 10 AND status = 'paid' in one lookup. It also satisfies WHERE customer_id = 10 alone (left-prefix rule).",
    tradeoff: "Does NOT help queries that filter only on a non-leading column (e.g. WHERE status = 'paid' alone). Column order is critical.",
  },
  {
    id: "query-plan",
    icon: "📊",
    title: "Query Plan",
    definition: "The step-by-step execution strategy chosen by the database engine for a given query.",
    usecase: "EXPLAIN QUERY PLAN reveals whether SQLite will SCAN (full table) or SEARCH USING INDEX — essential for diagnosing slow queries.",
    tradeoff: "The plan is chosen by the query planner based on statistics and heuristics. It can change as data grows or statistics are updated.",
  },
  {
    id: "selectivity",
    icon: "🎯",
    title: "Selectivity",
    definition: "The fraction of rows a filter condition eliminates. High selectivity = few rows match = index is very useful.",
    usecase: "customer_id = 42 is highly selective (one customer out of thousands). is_active = 1 is low selectivity (half the table).",
    tradeoff: "Indexing a low-selectivity column rarely helps — the planner may still prefer a full scan.",
  },
  {
    id: "tradeoffs",
    icon: "⚖️",
    title: "Index Trade-offs",
    definition: "Indexes improve read performance at the cost of write performance and storage.",
    usecase: "A read-heavy reporting table benefits greatly from indexes. A write-heavy event log table may be hurt by too many indexes.",
    tradeoff: "Every INSERT, UPDATE, DELETE must update all indexes on the table. Too many indexes on a write-heavy table can significantly reduce throughput.",
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

function TheoryCard({ item, open, onToggle }) {
  return (
    <div className={`theory-card${open ? " open" : ""}`}>
      <div className="theory-hdr" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}>
        <span className="theory-icon">{item.icon}</span>
        <span className="theory-title">{item.title}</span>
        <span className="theory-chevron">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="theory-body">
          <div className="theory-row">
            <span className="theory-label">Definition</span>
            <span className="theory-val">{item.definition}</span>
          </div>
          <div className="theory-row">
            <span className="theory-label">Practical use</span>
            <span className="theory-val">{item.usecase}</span>
          </div>
          <div className="theory-row theory-row-tradeoff">
            <span className="theory-label">Trade-off</span>
            <span className="theory-val">{item.tradeoff}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LimitationsView() {
  const [openTheory, setOpenTheory] = useState(null);
  const [openSection, setOpenSection] = useState("limitations");

  function toggleSection(id) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <div className="lim-view">
      <div className="lim-inner">

        {/* Header */}
        <div className="lim-page-hdr">
          <div className="eyebrow eyebrow-accent">Academic Reference</div>
          <h1 className="lim-page-title">Limitations, Theory & Outcomes</h1>
          <p className="lim-page-sub">
            Honest documentation of what this engine does and does not do,
            background theory for every concept used, and the learning outcomes
            this project is designed to achieve.
          </p>
        </div>

        {/* ── Limitations ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("limitations")}
            type="button" aria-expanded={openSection === "limitations"}>
            <span className="algo-section-icon">⚠️</span>
            <span className="algo-section-title">Known Limitations</span>
            <span className="algo-section-chevron">{openSection === "limitations" ? "▲" : "▼"}</span>
          </button>
          {openSection === "limitations" && (
            <div className="algo-section-body">
              <p className="algo-body-text">
                These limitations are inherent to the current design. They are documented
                here for academic transparency, not as defects to be fixed.
              </p>
              <div className="lim-grid">
                {LIMITATIONS.map((item) => <LimitCard key={item.id} item={item} />)}
              </div>
            </div>
          )}
        </div>

        {/* ── Background Theory ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("theory")}
            type="button" aria-expanded={openSection === "theory"}>
            <span className="algo-section-icon">📚</span>
            <span className="algo-section-title">Background Theory</span>
            <span className="algo-section-chevron">{openSection === "theory" ? "▲" : "▼"}</span>
          </button>
          {openSection === "theory" && (
            <div className="algo-section-body">
              <p className="algo-body-text">
                Beginner-friendly definitions for every concept used in this project.
                Each entry includes a practical use case and a trade-off or limitation.
              </p>
              <div className="theory-list">
                {THEORY.map((item) => (
                  <TheoryCard
                    key={item.id}
                    item={item}
                    open={openTheory === item.id}
                    onToggle={() => setOpenTheory((prev) => (prev === item.id ? null : item.id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Learning Outcomes ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("outcomes")}
            type="button" aria-expanded={openSection === "outcomes"}>
            <span className="algo-section-icon">🎓</span>
            <span className="algo-section-title">Learning Outcomes</span>
            <span className="algo-section-chevron">{openSection === "outcomes" ? "▲" : "▼"}</span>
          </button>
          {openSection === "outcomes" && (
            <div className="algo-section-body">
              <p className="algo-body-text">
                After working through this application, a student should be able to:
              </p>
              <div className="outcomes-list">
                {LEARNING_OUTCOMES.map((lo, i) => (
                  <div className="outcome-item" key={i}>
                    <span className="outcome-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="outcome-icon">{lo.icon}</span>
                    <span className="outcome-text">{lo.outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
