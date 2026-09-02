import { useState } from "react";

const ENTRIES = [
  // ── Planning & Architecture ──────────────────────────────────────────────
  {
    id: "AU-01",
    category: "Planning & Architecture",
    agent: "ChatGPT",
    purpose: "Initial project scoping and architecture decisions",
    promptDesc: "Asked for a recommended architecture for an educational SQLite index recommendation engine with a FastAPI backend and React frontend, rule-based (no ML), suitable for a university project.",
    generated: "Suggested FastAPI + SQLGlot + SQLite for the backend; React + Vite for the frontend; separation of sql_validator, sql_analyzer, recommendation_engine, and sqlite_inspector service modules; Pydantic schemas for API contracts.",
    verification: "Reviewed the proposed module split against project requirements. Adopted the service-layer separation. Discarded suggestions for ML-based scoring — kept deterministic rules only.",
    result: "Core architecture: backend/app/services/ module layout, Pydantic schemas in models/schemas.py, FastAPI routers in app/api/.",
  },
  {
    id: "AU-02",
    category: "Planning & Architecture",
    agent: "Amazon Q",
    purpose: "Clarifying SQLite PRAGMA usage for schema inspection",
    promptDesc: "Asked how to use PRAGMA table_info and PRAGMA index_list to extract column types, primary keys, and existing indexes from a SQLite database without executing user SQL.",
    generated: "Explained PRAGMA table_info columns (cid, name, type, notnull, dflt_value, pk), PRAGMA index_list (seq, name, unique, origin), and PRAGMA index_info (seqno, cid, name). Provided example Python sqlite3 code.",
    verification: "Cross-checked against SQLite official documentation. Verified pk field ordering for composite primary keys.",
    result: "Implemented in sqlite_inspector.py — _inspect_table() and _inspect_indexes() use these exact PRAGMAs.",
  },

  // ── Backend Development ──────────────────────────────────────────────────
  {
    id: "AU-03",
    category: "Backend Development",
    agent: "ChatGPT",
    purpose: "FastAPI router structure and error handling pattern",
    promptDesc: "Asked for the idiomatic FastAPI pattern for catching custom ValueError subclasses and returning HTTP 422 with a plain-text detail message, without exposing stack traces.",
    generated: "Suggested catching SqlValidationError and SqlAnalysisError in the route handler with try/except and raising HTTPException(status_code=422, detail=str(error)). Showed how Pydantic min_length=1 provides a first layer before the service.",
    verification: "Tested that stack traces do not appear in the response body. Confirmed 422 is the correct status for unprocessable input (not 400).",
    result: "Pattern used in app/api/analysis.py for all three POST endpoints.",
  },
  {
    id: "AU-04",
    category: "Backend Development",
    agent: "Amazon Q",
    purpose: "Demo database seed script",
    promptDesc: "Asked for a SQLite seed script that creates students, customers, products, and orders tables with realistic data, a small set of deliberate existing indexes, and 5 000 orders rows.",
    generated: "Provided CREATE TABLE statements, INSERT statements using Python random/faker-style generation, and the three existing indexes (idx_students_major, idx_products_category, idx_orders_customer_id).",
    verification: "Reviewed column names and types for consistency with the recommendation engine's expected schema. Adjusted orders to include status, order_date, product_id, customer_id, and amount columns.",
    result: "Implemented in backend/app/services/demo_database.py and backend/app/data/demo_schema.sql.",
  },

  // ── SQL Analysis / Recommendation Engine ────────────────────────────────
  {
    id: "AU-05",
    category: "SQL Analysis / Recommendation Engine",
    agent: "ChatGPT",
    purpose: "SQLGlot AST traversal for WHERE clause decomposition",
    promptDesc: "Asked how to use SQLGlot's expression tree to extract equality filters (EQ), range filters (GT, GTE, LT, LTE, BETWEEN), join ON conditions, ORDER BY columns, and GROUP BY columns from a parsed SELECT statement.",
    generated: "Showed exp.EQ, exp.GT, exp.GTE, exp.LT, exp.LTE, exp.Between, exp.Join, exp.Column, expression.find_all(), and the args dict keys ('where', 'order', 'group'). Provided a recursive AND-splitter pattern.",
    verification: "Tested against all five example queries. Verified alias resolution (_resolve_column) handles both qualified (t.col) and unqualified (col) references. Confirmed BETWEEN is treated as range, not equality.",
    result: "Implemented in sql_analyzer.py — extract_query_features(), _split_and(), _where_condition(), _resolve_column().",
  },
  {
    id: "AU-06",
    category: "SQL Analysis / Recommendation Engine",
    agent: "ChatGPT",
    purpose: "Scoring weights and composite index heuristic",
    promptDesc: "Asked for a justification of scoring weights for index candidates based on query clause type, and the correct column ordering rule for composite indexes in SQLite.",
    generated: "Suggested equality=45, join=35, range=25, order_by/group_by=15 based on typical selectivity ordering. Explained the equality-first, range-last composite rule and why it matches SQLite's B-tree traversal.",
    verification: "Verified weights produce sensible confidence levels (≥65=high, ≥35=medium, else low). Confirmed composite score of 65 is correct for the equality+range case. Checked score cap at 100.",
    result: "Scoring implemented in recommendation_engine.py — _add_feature(), _add_composite(), _confidence(). Weights documented in Algorithm page and README.",
  },
  {
    id: "AU-07",
    category: "SQL Analysis / Recommendation Engine",
    agent: "Amazon Q",
    purpose: "Rejection logic for existing indexes and primary keys",
    promptDesc: "Asked for the correct prefix-match rule to determine whether an existing index already covers a candidate, and how to handle composite primary keys.",
    generated: "Explained that an existing index covers a candidate if index_columns[:len(candidate_columns)] == candidate_columns (prefix match). For primary keys, check candidate_columns[:len(pk)] == pk.",
    verification: "Tested with idx_orders_customer_id covering (customer_id,) and with composite PK scenarios. Confirmed the prefix direction is correct (existing index prefix must match candidate, not the other way).",
    result: "Implemented in _rejection_reason() in recommendation_engine.py.",
  },

  // ── Frontend Development ─────────────────────────────────────────────────
  {
    id: "AU-08",
    category: "Frontend Development",
    agent: "ChatGPT",
    purpose: "React application shell with collapsible sidebar",
    promptDesc: "Asked for a React + CSS layout pattern for a three-column shell (collapsible sidebar, main workspace, right panel) with a fixed header, using CSS custom properties for theming.",
    generated: "Provided the shell/sidebar/workspace/hdr CSS class structure, CSS variables for nav widths (--nav-w-collapsed, --nav-w-expanded), and the sidebar-expanded toggle pattern using a body class.",
    verification: "Adapted to the midnight navy theme. Replaced suggested purple palette with indigo/cyan. Verified mobile overlay behaviour.",
    result: "App.jsx shell structure and the core layout CSS in styles.css.",
  },
  {
    id: "AU-09",
    category: "Frontend Development",
    agent: "Amazon Q",
    purpose: "Vite proxy configuration for local development",
    promptDesc: "Asked how to configure Vite's server.proxy to forward /api requests to FastAPI on port 8000 so the React dev server and backend can run simultaneously without CORS issues.",
    generated: "Provided the vite.config.js server.proxy block with target, changeOrigin, and rewrite options.",
    verification: "Tested that /api/health, /api/schema, and /api/recommendations all resolve correctly through the proxy.",
    result: "vite.config.js proxy configuration.",
  },
  {
    id: "AU-10",
    category: "Frontend Development",
    agent: "Amazon Q",
    purpose: "Live inline validation for the SQL textarea",
    promptDesc: "Asked for a React useEffect pattern to perform live pre-flight validation on a textarea value, disabling a submit button and showing an inline message without making a network request.",
    generated: "Suggested a useEffect on the query state that checks for empty/whitespace and a regex for destructive keywords, setting an inlineError state used to disable the button and render a warning div.",
    verification: "Verified the regex /^\\s*(insert|update|delete|drop|alter|create)\\b/i covers all six destructive types. Confirmed button disabled={loading || !!inlineError} works correctly.",
    result: "inlineError state and useEffect in App.jsx; .inline-validation CSS class in styles.css.",
  },

  // ── Visualization ────────────────────────────────────────────────────────
  {
    id: "AU-11",
    category: "Visualization",
    agent: "ChatGPT",
    purpose: "SVG animated database network for the Home hero",
    promptDesc: "Asked for an inline SVG component with animated edges between database-concept nodes (DB core, SQL, IDX, B+T, PLAN, SCAN, REC) using animateMotion and orbit rings.",
    generated: "Provided the DbNetwork SVG structure with circle nodes, path edges, animateMotion elements, and orbit ring animations using CSS keyframes.",
    verification: "Adjusted node positions, colours (cyan/indigo), and animation durations to match the midnight navy theme. Removed suggested drop-shadow filters that caused performance issues.",
    result: "DbNetwork inline SVG component in HomeView.jsx.",
  },
  {
    id: "AU-12",
    category: "Visualization",
    agent: "ChatGPT",
    purpose: "B+ tree traversal visualization concept",
    promptDesc: "Asked for a React component that animates a conceptual B+ tree traversal — root node to internal node to leaf — with step-by-step highlighting for an educational audience.",
    generated: "Suggested a node/edge SVG layout with useState for the active step, step-through controls, and colour transitions for visited nodes.",
    verification: "Adapted to use the project's existing PlaybackControls component. Added the 'Educational model — not exact SQLite internals' disclaimer label.",
    result: "BPlusTreeVisualization.jsx component.",
  },

  // ── Learn / Terminology ──────────────────────────────────────────────────
  {
    id: "AU-13",
    category: "Learn / Terminology",
    agent: "ChatGPT",
    purpose: "DBMS concept definitions for the Learn page",
    promptDesc: "Asked for concise, beginner-friendly definitions of 16 database index concepts (index, table scan, index scan, B-tree, B+ tree, primary key, composite index, query plan, EXPLAIN, selectivity, WHERE, JOIN, ORDER BY, GROUP BY, covering index, trade-offs) with a 'why it matters' and a SQL example for each.",
    generated: "Provided definitions, why-it-matters paragraphs, and SQL examples for all 16 concepts.",
    verification: "Reviewed each definition for accuracy. Corrected the B+ tree definition (leaf-level linking, not just sorted order). Added 'In this project' context to each card linking the concept to the actual engine behaviour.",
    result: "CONCEPTS array in LearnView.jsx — 16 concept cards with search and category filter.",
  },

  // ── Examples ─────────────────────────────────────────────────────────────
  {
    id: "AU-14",
    category: "Examples",
    agent: "ChatGPT",
    purpose: "Representative SQL example queries for the demo database",
    promptDesc: "Asked for five SQL SELECT queries against the students/customers/products/orders schema that each demonstrate a different index recommendation scenario: WHERE equality, JOIN lookup, ORDER BY, composite filter, and no-useful-index.",
    generated: "Provided five queries with labels and descriptions covering the five scenarios.",
    verification: "Ran each query through the actual recommendation engine and verified the expected output (recommendation, rejection, or no recommendation) matches the example description.",
    result: "EXAMPLES array in examples.js — five entries used by the example selector and ExamplesView.",
  },

  // ── History / Export ─────────────────────────────────────────────────────
  {
    id: "AU-15",
    category: "History / Export",
    agent: "ChatGPT",
    purpose: "HTML report template for the export feature",
    promptDesc: "Asked for a self-contained HTML report template (print-ready, no external dependencies) that presents an index recommendation result with cover metadata, detected features table, recommendation cards, rejected candidates, query plan, and step-by-step analysis.",
    generated: "Provided the full HTML/CSS template with print media query, recommendation card styles, step-by-step layout, and a print toolbar.",
    verification: "Reviewed all template sections against the actual API response shape. Replaced hardcoded values with the esc() helper and dynamic data bindings. Tested print/PDF output in Chrome.",
    result: "buildHtmlReport() function in ExportButton.jsx.",
  },
  {
    id: "AU-16",
    category: "History / Export",
    agent: "Amazon Q",
    purpose: "SQLite history store implementation",
    promptDesc: "Asked for a Python SQLite-backed key-value store for saving and retrieving analysis history entries (rec + plan JSON blobs) with auto-increment IDs, newest-first listing, and delete/clear operations.",
    generated: "Provided the history_store.py module with save_analysis(), list_history(), get_entry(), delete_entry(), and clear_history() using sqlite3 with JSON serialisation.",
    verification: "Verified thread safety is acceptable for single-process development use. Confirmed JSON round-trip preserves all nested Pydantic model fields.",
    result: "backend/app/services/history_store.py and the /api/history endpoints in app/api/history.py.",
  },

  // ── AI Tutor ─────────────────────────────────────────────────────────────
  {
    id: "AU-17",
    category: "AI Tutor",
    agent: "ChatGPT",
    purpose: "Local fallback explanation generator",
    promptDesc: "Asked for a deterministic Python function that generates a structured explanation of an index recommendation (query summary, features detected, why this index, simple explanation, technical explanation, trade-offs, query plan meaning) from the recommendation response object, without calling any external API.",
    generated: "Provided a template-based explanation builder that extracts table names, column names, confidence, and plan details from the response dict and formats them into the required sections.",
    verification: "Verified all eight required keys are present in the output. Confirmed the function handles the no-recommendation case (rejected candidates only). Checked that table and column names from the actual response appear in the output.",
    result: "Local fallback path in backend/app/services/ai_tutor.py, tested by test_ai_tutor_api.py.",
  },

  // ── Validation / Testing ─────────────────────────────────────────────────
  {
    id: "AU-18",
    category: "Validation / Testing",
    agent: "Amazon Q",
    purpose: "pytest test suite expansion",
    promptDesc: "Asked for pytest test cases covering: empty SQL, whitespace-only SQL, each destructive statement type individually (INSERT/UPDATE/DELETE/DROP/ALTER/CREATE), multiple statements, existing-index rejection, composite index scoring, score cap at 100, and export JSON field shape.",
    generated: "Provided parametrized test cases for destructive types, individual tests for each validation scenario, and assertions for score/confidence/drop_index_sql correctness.",
    verification: "Ran pytest -v and confirmed 76/76 pass. Reviewed each assertion to ensure it tests real engine behaviour, not hardcoded values. Removed one suggested test that asserted a specific error message substring that differed from the actual SQLGlot output.",
    result: "Expanded test_sql_validator.py (17 tests), test_analysis_api.py (28 tests), test_recommendation_engine.py (14 tests).",
  },

  // ── UI Refinement / Debugging ────────────────────────────────────────────
  {
    id: "AU-19",
    category: "UI Refinement / Debugging",
    agent: "Amazon Q",
    purpose: "LearnView accordion bug fix",
    promptDesc: "Reported that clicking a concept card crashed with 'Cannot read properties of null (reading id)' — the open state was being used as an object but was initialised as string|null.",
    generated: "Identified that open[c.id] was the crash site. Suggested changing the check to open === c.id and the toggle to setOpen(prev => prev === id ? null : id).",
    verification: "Confirmed the fix resolves the crash. Verified only one card can be open at a time (string|null accordion pattern).",
    result: "Fixed in LearnView.jsx — open state is string|null, toggle uses prev === id comparison.",
  },
  {
    id: "AU-20",
    category: "UI Refinement / Debugging",
    agent: "ChatGPT",
    purpose: "Dark/light mode CSS token strategy",
    promptDesc: "Asked for a CSS custom property strategy for a dark-first theme (midnight navy base) with a light mode override using a body.light class, covering background, surface, border, foreground, muted foreground, and accent colours.",
    generated: "Suggested :root for dark defaults and body.light overrides for all tokens. Provided the specific token names (--bg, --surface, --border, --fg, --fg-muted, --accent, --cyan, --indigo).",
    verification: "Applied to styles.css. Verified all components render correctly in both modes. Adjusted light mode surface colours to avoid the washed-out appearance of the initial suggestion.",
    result: "CSS token system in styles.css used throughout all components and views.",
  },
];

const CATEGORIES = [
  "All",
  "Planning & Architecture",
  "Backend Development",
  "SQL Analysis / Recommendation Engine",
  "Frontend Development",
  "Visualization",
  "Learn / Terminology",
  "Examples",
  "History / Export",
  "AI Tutor",
  "Validation / Testing",
  "UI Refinement / Debugging",
];

const AGENT_COLOR = {
  "ChatGPT":       { bg: "rgba(16,163,127,.15)", border: "rgba(16,163,127,.35)", text: "#10a37f" },
  "Amazon Q":      { bg: "rgba(255,153,0,.15)",  border: "rgba(255,153,0,.35)",  text: "#ff9900" },
  "OpenCode":      { bg: "rgba(99,102,241,.15)",  border: "rgba(99,102,241,.35)", text: "#818cf8" },
  "Google Gemini": { bg: "rgba(66,133,244,.15)",  border: "rgba(66,133,244,.35)", text: "#4285f4" },
};

function AgentBadge({ agent }) {
  const s = AGENT_COLOR[agent] ?? { bg: "rgba(100,116,139,.15)", border: "rgba(100,116,139,.35)", text: "#94a3b8" };
  return (
    <span className="au-agent-badge" style={{ background: s.bg, borderColor: s.border, color: s.text }}>
      {agent}
    </span>
  );
}

function EntryCard({ entry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`au-card${open ? " au-card-open" : ""}`}>
      <div className="au-card-hdr" onClick={() => setOpen((v) => !v)} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}>
        <div className="au-card-left">
          <span className="au-id">{entry.id}</span>
          <AgentBadge agent={entry.agent} />
          <span className="au-purpose">{entry.purpose}</span>
        </div>
        <span className="au-chevron">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="au-card-body">
          <div className="au-row">
            <div className="au-label">Prompt description</div>
            <div className="au-value">{entry.promptDesc}</div>
          </div>
          <div className="au-row">
            <div className="au-label">What was generated / changed</div>
            <div className="au-value">{entry.generated}</div>
          </div>
          <div className="au-row">
            <div className="au-label">Human verification</div>
            <div className="au-value au-verify">{entry.verification}</div>
          </div>
          <div className="au-row au-row-result">
            <div className="au-label">Result</div>
            <div className="au-value au-result-text">{entry.result}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiUsageView() {
  const [activeCat, setActiveCat] = useState("All");

  const filtered = activeCat === "All"
    ? ENTRIES
    : ENTRIES.filter((e) => e.category === activeCat);

  const agentCounts = ENTRIES.reduce((acc, e) => {
    acc[e.agent] = (acc[e.agent] ?? 0) + 1;
    return acc;
  }, {});

  const catCounts = ENTRIES.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="au-view">

      {/* hero */}
      <div className="au-hero">
        <div className="au-hero-icon">🤖</div>
        <div>
          <div className="au-hero-title">AI Usage Log</div>
          <div className="au-hero-sub">
            Accurate record of AI-assisted development for faculty submission · {ENTRIES.length} entries across {CATEGORIES.length - 1} categories
          </div>
        </div>
      </div>

      {/* disclaimer */}
      <div className="au-disclaimer">
        <span className="au-disclaimer-icon">ℹ</span>
        All entries reflect actual AI interactions during development. No prompts or outputs have been invented.
        Every AI-generated artefact was reviewed, tested, and adapted by the developer before being committed.
        The recommendation engine logic, scoring weights, and API contracts were designed by the developer
        and verified against the project specification — AI was used for scaffolding, syntax guidance, and
        documentation drafting only.
      </div>

      {/* agent summary */}
      <div className="au-agent-strip">
        {Object.entries(agentCounts).map(([agent, count]) => {
          const s = AGENT_COLOR[agent] ?? { bg: "rgba(100,116,139,.15)", border: "rgba(100,116,139,.35)", text: "#94a3b8" };
          return (
            <div key={agent} className="au-agent-cell" style={{ borderColor: s.border }}>
              <div className="au-agent-name" style={{ color: s.text }}>{agent}</div>
              <div className="au-agent-count">{count} entries</div>
            </div>
          );
        })}
      </div>

      {/* category filter */}
      <div className="au-filter-row">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`au-filter-btn${activeCat === cat ? " active" : ""}`}
            onClick={() => setActiveCat(cat)}
          >
            {cat}{cat !== "All" && catCounts[cat] ? ` (${catCounts[cat]})` : ""}
          </button>
        ))}
      </div>

      {/* entries */}
      <div className="au-section-label">
        {activeCat === "All" ? "All entries" : activeCat} — {filtered.length} item{filtered.length !== 1 ? "s" : ""}
      </div>
      <div className="au-entries">
        {filtered.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

    </div>
  );
}
