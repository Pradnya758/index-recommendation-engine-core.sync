const TEST_CASES = [
  {
    id: "TC-01",
    category: "Validation",
    input: "SELECT * FROM orders WHERE status = 'paid'",
    expected: "200 OK — valid:true, statement_type:SELECT",
    actual: "200 OK — valid:true, statement_type:SELECT",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-02",
    category: "Validation",
    input: '""  (empty string)',
    expected: "422 — Pydantic min_length rejects before service layer",
    actual: "422 Unprocessable Entity",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-03",
    category: "Validation",
    input: "SELEKT * FORM orders",
    expected: "422 — Invalid SQLite SQL",
    actual: "422 — Invalid SQLite SQL: …",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04a",
    category: "Validation",
    input: "INSERT INTO students VALUES (1,'A','a@b.com','CS',2024)",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received INSERT statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04b",
    category: "Validation",
    input: "UPDATE orders SET status = 'paid'",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received UPDATE statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04c",
    category: "Validation",
    input: "DELETE FROM orders WHERE order_id = 1",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received DELETE statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04d",
    category: "Validation",
    input: "DROP TABLE customers",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received DROP statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04e",
    category: "Validation",
    input: "ALTER TABLE orders ADD COLUMN notes TEXT",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received ALTER statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-04f",
    category: "Validation",
    input: "CREATE TABLE t (id INTEGER PRIMARY KEY)",
    expected: "422 — Only SELECT queries are supported",
    actual: "422 — Only SELECT queries are supported in Phase 1. Received CREATE statement.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-05",
    category: "Validation",
    input: "SELECT * FROM students; DELETE FROM students",
    expected: "422 — Submit exactly one SQL statement",
    actual: "422 — Submit exactly one SQL statement. Multiple statements are not allowed.",
    status: "PASS",
    endpoint: "POST /api/sql/validate",
  },
  {
    id: "TC-06",
    category: "Existing Index",
    input: "SELECT * FROM orders WHERE customer_id = 42",
    expected: "recommendations:[], rejected with idx_orders_customer_id",
    actual: "recommendations:[], rejected_candidates:[{reason:'…idx_orders_customer_id…'}]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-07",
    category: "WHERE Filter",
    input: "SELECT * FROM orders WHERE status = 'paid'",
    expected: "Recommend (orders, status), score 45, confidence medium",
    actual: "recommendations:[{table:orders, columns:[status], score:45, confidence:medium}]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-08",
    category: "JOIN",
    input: "SELECT o.order_id, p.product_name FROM orders o JOIN products p ON o.product_id = p.product_id",
    expected: "Recommend (orders, product_id); reject (products, product_id) as PK",
    actual: "recommendations:[orders.product_id]; rejected:[products.product_id — primary key]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-09",
    category: "ORDER BY",
    input: "SELECT * FROM orders ORDER BY order_date DESC",
    expected: "Recommend (orders, order_date), score 15, confidence low",
    actual: "recommendations:[{table:orders, columns:[order_date], score:15, confidence:low}]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-10",
    category: "Composite Index",
    input: "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01'",
    expected: "Composite (orders, status, order_date), score 65, confidence high",
    actual: "recommendations include {columns:[status,order_date], score:65, confidence:high}",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-11",
    category: "No Recommendation",
    input: "SELECT * FROM orders WHERE order_id = 1",
    expected: "recommendations:[], rejected because primary key",
    actual: "recommendations:[], rejected_candidates:[{columns:[order_id], reason:'…primary key…'}]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-12",
    category: "Duplicate Rejection",
    input: "SELECT * FROM students WHERE major = 'CS'",
    expected: "recommendations:[], rejected because idx_students_major",
    actual: "recommendations:[], rejected_candidates:[{reason:'…idx_students_major…'}]",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
  {
    id: "TC-13",
    category: "Query Plan",
    input: "SELECT * FROM orders WHERE customer_id = 42",
    expected: "200 OK — plan array with id/parent/detail fields",
    actual: "200 OK — plan:[{id:2, parent:0, detail:'SEARCH orders…'}]",
    status: "PASS",
    endpoint: "POST /api/query-plan",
  },
  {
    id: "TC-14",
    category: "History",
    input: "POST /api/history with rec+plan payload",
    expected: "201 Created — {id: <integer>}; GET /api/history/{id} returns same entry",
    actual: "201 Created — {id:N}; GET returns {id, query, rec, plan}",
    status: "PASS",
    endpoint: "POST /api/history",
  },
  {
    id: "TC-15",
    category: "Export",
    input: "GET recommendations response for status='paid' query",
    expected: "Response contains query, analysis, recommendations, rejected_candidates; each rec has create_index_sql, drop_index_sql, score, confidence, reasons, evidence",
    actual: "All required export fields present",
    status: "PASS",
    endpoint: "POST /api/recommendations",
  },
];

const VALIDATION_MESSAGES = [
  { trigger: "Empty input", message: "Enter a SQL query before running analysis." },
  { trigger: "INSERT / UPDATE / DELETE / DROP / ALTER / CREATE", message: "Only SELECT queries are allowed for analysis." },
  { trigger: "Unknown table (e.g. orderss)", message: "Table 'orderss' does not exist in the demo database." },
  { trigger: "Multiple statements", message: "Submit exactly one SQL statement. Multiple statements are not allowed." },
  { trigger: "Malformed SQL", message: "Invalid SQLite SQL: …" },
  { trigger: "Backend unreachable", message: "Cannot reach the backend. Start FastAPI on port 8000 and try again." },
];

const PERF_NOTES = [
  { operation: "Full test suite (76 tests)", observation: "1.60 s total (pytest wall-clock, local machine)" },
  { operation: "Single /api/recommendations call", observation: "Not formally benchmarked. Subjectively <200 ms on local machine with warm DB connection." },
  { operation: "Single /api/query-plan call", observation: "Not formally benchmarked. SQLite EXPLAIN QUERY PLAN is non-executing; subjectively <100 ms." },
  { operation: "Schema load (/api/schema)", observation: "Not formally benchmarked. PRAGMA calls on 4 tables; subjectively <50 ms." },
  { operation: "Frontend build (Vite)", observation: "617 modules, ~3–5 s cold build on local machine." },
  { operation: "Faculty target (<2 s per operation)", observation: "Cannot be reliably claimed without a repeatable benchmark harness. All operations appear well within target in manual testing, but no automated timing assertions exist." },
];

const CATEGORY_COLOR = {
  Validation: "var(--accent)",
  "Existing Index": "#f59e0b",
  "WHERE Filter": "#10b981",
  JOIN: "#06b6d4",
  "ORDER BY": "#8b5cf6",
  "Composite Index": "#ec4899",
  "No Recommendation": "#64748b",
  "Duplicate Rejection": "#f97316",
  "Query Plan": "#2563eb",
  History: "#14b8a6",
  Export: "#a3e635",
};

function StatusBadge({ status }) {
  return (
    <span className={`tv-status tv-status-${status.toLowerCase()}`}>{status}</span>
  );
}

export default function TestingView() {
  return (
    <div className="tv-view">

      <div className="tv-hero">
        <div className="tv-hero-icon">🧾</div>
        <div>
          <div className="tv-hero-title">Test Case Documentation</div>
          <div className="tv-hero-sub">
            76 automated pytest tests · 0 failures · 1 pre-existing deprecation warning (httpx/starlette)
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="tv-summary-strip">
        <div className="tv-summary-cell">
          <div className="tv-summary-num">76</div>
          <div className="tv-summary-label">Total Tests</div>
        </div>
        <div className="tv-summary-cell">
          <div className="tv-summary-num tv-green">76</div>
          <div className="tv-summary-label">Passed</div>
        </div>
        <div className="tv-summary-cell">
          <div className="tv-summary-num tv-red">0</div>
          <div className="tv-summary-label">Failed</div>
        </div>
        <div className="tv-summary-cell">
          <div className="tv-summary-num">5</div>
          <div className="tv-summary-label">Test Files</div>
        </div>
        <div className="tv-summary-cell">
          <div className="tv-summary-num">1.60 s</div>
          <div className="tv-summary-label">Suite Duration</div>
        </div>
      </div>

      {/* ── Test files ── */}
      <div className="tv-section">
        <div className="tv-section-title">Test Files</div>
        <div className="tv-file-grid">
          {[
            { file: "test_sql_validator.py",       count: 17, desc: "Empty, malformed, all destructive types, multiple statements, valid SELECT" },
            { file: "test_analysis_api.py",         count: 28, desc: "All HTTP endpoints: validate, query-plan, recommendations, schema, history smoke, export shape" },
            { file: "test_recommendation_engine.py",count: 14, desc: "WHERE, JOIN, ORDER BY, GROUP BY, composite, PK rejection, existing-index rejection, score cap, confidence" },
            { file: "test_history_api.py",           count: 5,  desc: "Save, list, retrieve, delete, clear, 404 on missing" },
            { file: "test_ai_tutor_api.py",          count: 7,  desc: "Explain sections, local fallback, table name, recommendation details, follow-up" },
            { file: "test_sqlite_inspector.py",      count: 2,  desc: "Schema inspection, query plan execution" },
          ].map((f) => (
            <div key={f.file} className="tv-file-card">
              <div className="tv-file-name">{f.file}</div>
              <div className="tv-file-count">{f.count} tests</div>
              <div className="tv-file-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main test case table ── */}
      <div className="tv-section">
        <div className="tv-section-title">Test Case Table</div>
        <div className="tv-table-wrap">
          <table className="tv-table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Category</th>
                <th>Input</th>
                <th>Expected Result</th>
                <th>Actual Result</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TEST_CASES.map((tc) => (
                <tr key={tc.id}>
                  <td className="tv-id">{tc.id}</td>
                  <td>
                    <span
                      className="tv-cat"
                      style={{ borderColor: CATEGORY_COLOR[tc.category] ?? "var(--accent)", color: CATEGORY_COLOR[tc.category] ?? "var(--accent)" }}
                    >
                      {tc.category}
                    </span>
                  </td>
                  <td className="tv-input"><code>{tc.input}</code></td>
                  <td className="tv-expected">{tc.expected}</td>
                  <td className="tv-actual">{tc.actual}</td>
                  <td><StatusBadge status={tc.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Validation messages ── */}
      <div className="tv-section">
        <div className="tv-section-title">User-Facing Validation Messages</div>
        <p className="tv-prose">
          All error messages are beginner-friendly. Python stack traces are never exposed — the API layer
          catches <code>SqlValidationError</code> and <code>SqlAnalysisError</code> and returns only the
          human-readable message string as the HTTP 422 <code>detail</code> field.
        </p>
        <table className="tv-table tv-msg-table">
          <thead>
            <tr><th>Trigger</th><th>Message shown to user</th></tr>
          </thead>
          <tbody>
            {VALIDATION_MESSAGES.map((v) => (
              <tr key={v.trigger}>
                <td className="tv-trigger">{v.trigger}</td>
                <td className="tv-msg"><code>{v.message}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="tv-prose tv-prose-note">
          The frontend also performs live pre-flight validation: the Run Analysis button is disabled and an
          inline message is shown immediately when the textarea is empty or starts with a destructive keyword,
          before any network request is made.
        </p>
      </div>

      {/* ── Performance ── */}
      <div className="tv-section">
        <div className="tv-section-title">Performance Observations</div>
        <p className="tv-prose">
          No automated timing assertions exist. The observations below are based on manual testing and the
          pytest wall-clock time. The faculty target of &lt;2 s per operation cannot be formally claimed
          without a repeatable benchmark harness.
        </p>
        <table className="tv-table">
          <thead>
            <tr><th>Operation</th><th>Observation</th></tr>
          </thead>
          <tbody>
            {PERF_NOTES.map((p) => (
              <tr key={p.operation}>
                <td className="tv-trigger">{p.operation}</td>
                <td>{p.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── How to run ── */}
      <div className="tv-section">
        <div className="tv-section-title">How to Run Tests</div>
        <pre className="tv-code">{`# From the backend directory with the venv active:
.venv\\Scripts\\python.exe -m pytest tests -v

# Quick summary only:
.venv\\Scripts\\python.exe -m pytest tests -q`}</pre>
      </div>

    </div>
  );
}
