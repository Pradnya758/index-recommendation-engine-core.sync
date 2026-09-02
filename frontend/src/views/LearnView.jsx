import { useState } from "react";

const CONCEPTS = [
  {
    id: "index", icon: "🗂️", cat: "core",
    title: "Database Index",
    short: "A data structure that speeds up row lookups without scanning every row.",
    why: "Without an index, the database reads every row to find matches. An index lets it jump directly to the relevant rows.",
    example: "CREATE INDEX idx_orders_status ON orders (status);",
    project: "The engine recommends indexes like this based on your WHERE, JOIN, and ORDER BY clauses.",
  },
  {
    id: "table-scan", icon: "📋", cat: "core",
    title: "Table Scan (Full Scan)",
    short: "Reading every row in a table to find matching records.",
    why: "A full scan is slow on large tables. It's the default when no suitable index exists.",
    example: "SELECT * FROM orders WHERE status = 'paid'; -- no index → full scan",
    project: "The Table Scan visualization shows this row-by-row search in action.",
  },
  {
    id: "index-scan", icon: "⚡", cat: "core",
    title: "Index Scan",
    short: "Using an index to find rows directly instead of reading the whole table.",
    why: "An index scan reads only the relevant index entries and fetches matching rows — much faster than a full scan.",
    example: "-- After: CREATE INDEX idx_orders_status ON orders (status);\nSELECT * FROM orders WHERE status = 'paid'; -- uses index",
    project: "The Plan Comparison visualization contrasts the current plan with the proposed indexed path.",
  },
  {
    id: "btree", icon: "🌳", cat: "structure",
    title: "B-Tree",
    short: "A self-balancing tree structure that keeps data sorted for efficient search.",
    why: "B-trees allow O(log n) lookups, insertions, and deletions — far better than O(n) linear scans.",
    example: "-- Most database indexes are B-tree based by default",
    project: "SQLite uses B-trees internally for both table storage and indexes.",
  },
  {
    id: "bplus-tree", icon: "🌲", cat: "structure",
    title: "B+ Tree",
    short: "A B-tree variant where all data is stored in leaf nodes, linked for range scans.",
    why: "Leaf-level linking makes range queries (BETWEEN, >, <) very efficient.",
    example: "-- Range query benefits from B+ tree leaf linking:\nSELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';",
    project: "The B+ Tree visualization animates a conceptual traversal from root to matching leaf.",
  },
  {
    id: "primary-key", icon: "🔑", cat: "core",
    title: "Primary Key",
    short: "A column (or set of columns) that uniquely identifies each row.",
    why: "Primary keys are automatically indexed. Lookups by primary key are always fast.",
    example: "CREATE TABLE orders (\n  order_id INTEGER PRIMARY KEY,\n  ...\n);",
    project: "The engine rejects index candidates that duplicate the primary key.",
  },
  {
    id: "composite", icon: "🔗", cat: "advanced",
    title: "Composite Index",
    short: "An index on two or more columns together.",
    why: "A composite index can satisfy multiple filter conditions in one lookup. Column order matters — equality columns should come first.",
    example: "CREATE INDEX idx_orders_status_date\n  ON orders (status, order_date);",
    project: "The engine generates composite candidates when it detects both equality and range filters on the same table.",
  },
  {
    id: "query-plan", icon: "📊", cat: "core",
    title: "Query Plan",
    short: "The step-by-step strategy the database engine uses to execute a query.",
    why: "Understanding the query plan tells you whether the database is using an index or doing a full scan.",
    example: "EXPLAIN QUERY PLAN\nSELECT * FROM orders WHERE status = 'paid';",
    project: "The Query Analysis tab shows the actual SQLite EXPLAIN QUERY PLAN output for your query.",
  },
  {
    id: "explain", icon: "🔍", cat: "core",
    title: "EXPLAIN QUERY PLAN",
    short: "A SQLite command that shows how a query will be executed without running it.",
    why: "It reveals whether a SCAN (full table read) or SEARCH (index lookup) will be used.",
    example: "-- Output example:\n-- SCAN TABLE orders\n-- vs\n-- SEARCH TABLE orders USING INDEX idx_orders_status",
    project: "Every analysis in this engine runs EXPLAIN QUERY PLAN and shows you the result.",
  },
  {
    id: "selectivity", icon: "🎯", cat: "advanced",
    title: "Selectivity",
    short: "How many rows a filter condition eliminates. High selectivity = few rows match.",
    why: "Indexes are most useful on high-selectivity columns. Indexing a column with only 2 distinct values rarely helps.",
    example: "-- High selectivity: customer_id (thousands of values)\n-- Low selectivity: is_active (only true/false)",
    project: "The engine scores equality filters higher (45 pts) than range filters (25 pts) because equality is typically more selective.",
  },
  {
    id: "where", icon: "🔎", cat: "sql",
    title: "WHERE Clause",
    short: "Filters rows returned by a query based on a condition.",
    why: "WHERE conditions are the primary driver of index recommendations — the engine looks for columns used in filters.",
    example: "SELECT * FROM orders\nWHERE status = 'paid' AND order_date >= '2024-01-01';",
    project: "The engine extracts equality and range filters from WHERE clauses and scores index candidates accordingly.",
  },
  {
    id: "join", icon: "🔀", cat: "sql",
    title: "JOIN",
    short: "Combines rows from two or more tables based on a related column.",
    why: "Join columns benefit from indexes on both sides to avoid nested-loop full scans.",
    example: "SELECT o.order_id, p.product_name\nFROM orders o\nJOIN products p ON o.product_id = p.product_id;",
    project: "The engine detects join columns and adds them as index candidates with a score of 35.",
  },
  {
    id: "orderby", icon: "↕️", cat: "sql",
    title: "ORDER BY",
    short: "Sorts the result set by one or more columns.",
    why: "An index on the ORDER BY column can eliminate the sort step entirely.",
    example: "SELECT * FROM orders ORDER BY order_date DESC;",
    project: "ORDER BY columns are detected and scored at 15 points as index candidates.",
  },
  {
    id: "groupby", icon: "📦", cat: "sql",
    title: "GROUP BY",
    short: "Groups rows with the same value in a column for aggregation.",
    why: "An index on the GROUP BY column can speed up grouping by providing pre-sorted data.",
    example: "SELECT status, COUNT(*) FROM orders GROUP BY status;",
    project: "GROUP BY columns are detected and scored at 15 points as index candidates.",
  },
  {
    id: "covering", icon: "🛡️", cat: "advanced",
    title: "Covering Index",
    short: "An index that contains all columns needed by a query — no table row fetch required.",
    why: "A covering index is the fastest possible access path because the database never touches the main table.",
    example: "-- Query only needs order_id and status:\nCREATE INDEX idx_covering ON orders (status, order_id);",
    project: "The engine does not yet generate covering index candidates, but the concept is explained here.",
  },
  {
    id: "tradeoffs", icon: "⚖️", cat: "advanced",
    title: "Index Trade-offs",
    short: "Indexes speed up reads but slow down writes and use extra storage.",
    why: "Every INSERT, UPDATE, or DELETE must also update all indexes on that table. Too many indexes can hurt write performance.",
    example: "-- Consider carefully before indexing every column\n-- Especially on tables with frequent writes",
    project: "The engine only recommends indexes with clear query evidence. It never recommends indexing every column.",
  },
];

const CATS = [
  { id: "all",       label: "All" },
  { id: "core",      label: "Core" },
  { id: "structure", label: "Structures" },
  { id: "sql",       label: "SQL Clauses" },
  { id: "advanced",  label: "Advanced" },
];

export default function LearnView() {
  const [search, setSearch]   = useState("");
  const [cat, setCat]         = useState("all");
  const [open, setOpen]       = useState(null);

  const filtered = CONCEPTS.filter((c) => {
    const matchCat = cat === "all" || c.cat === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.short.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  function toggle(id) {
    setOpen((prev) => (prev === id ? null : id));
  }

  return (
    <div className="learn-view">
      <div className="learn-inner">
        <div style={{ marginBottom: "24px" }}>
          <div className="eyebrow">Reference</div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "-.03em", marginBottom: "6px" }}>
            DBMS Concepts
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text2)", lineHeight: 1.6 }}>
            Concise explanations of every concept used in this project. Click any card to expand.
          </p>
        </div>

        <div className="learn-search-row">
          <input
            className="learn-search"
            type="search"
            placeholder="Search concepts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="learn-filter-row">
          {CATS.map((c) => (
            <button
              key={c.id}
              className={`learn-filter-btn${cat === c.id ? " active" : ""}`}
              onClick={() => setCat(c.id)}
              type="button"
            >
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text3)" }}>
            No concepts match your search.
          </div>
        )}

        <div className="learn-grid">
          {filtered.map((c, i) => (
            <div
              className={`concept-card${open === c.id ? " open" : ""}`}
              key={c.id}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="concept-hdr" onClick={() => toggle(c.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && toggle(c.id)}>
                <span className="concept-icon">{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="concept-title">{c.title}</div>
                  <div className="concept-short">{c.short}</div>
                </div>
                <span className="concept-toggle">{open === c.id ? "▲" : "▼"}</span>
              </div>
              <div className="concept-body">
                <div className="concept-section">
                  <div className="concept-section-title">Why it matters</div>
                  <div className="concept-section-text">{c.why}</div>
                </div>
                {c.example && (
                  <div className="concept-section">
                    <div className="concept-section-title">Example</div>
                    <code className="concept-code">{c.example}</code>
                  </div>
                )}
                <div className="concept-project">
                  <strong>In this project: </strong>{c.project}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
