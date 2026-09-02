import { useState } from "react";

const STEPS = [
  {
    n: 1,
    icon: "🏠",
    title: "Open Home",
    click: "Click the IRE logo or the Home button (🏠) in the sidebar.",
    expect: "The Home page loads with an animated database network, a headline, and two call-to-action buttons.",
    meaning: "The Home page gives you an overview of what the engine does and links to the main features.",
    tip: null,
  },
  {
    n: 2,
    icon: "📖",
    title: "Understand the Purpose",
    click: "Read the headline and the six feature cards on the Home page. Click 'Explore Concepts' to open the Learn page.",
    expect: "You see a description of the rule-based index recommendation engine and its educational goals.",
    meaning: "This tool analyses a SQL SELECT query and tells you which database indexes would speed it up, and why. It is deterministic — no AI is used in the recommendation logic.",
    tip: "The engine only works with the built-in demo database (students, customers, products, orders). It does not connect to your own database.",
  },
  {
    n: 3,
    icon: "🧪",
    title: "Choose an Example or Enter SQL",
    click: "Go to Analyze (⚡) in the sidebar. Use the 'Load example' dropdown to pick a pre-built query, or type your own SELECT query in the editor.",
    expect: "The textarea fills with the selected query. Line numbers update automatically.",
    meaning: "Five examples cover the main scenarios: WHERE filter, JOIN lookup, ORDER BY, composite filter, and a query where no new index is needed.",
    tip: "Only SELECT queries are accepted. The Run Analysis button is disabled and a yellow warning appears if the input is empty or starts with INSERT, UPDATE, DELETE, DROP, ALTER, or CREATE.",
  },
  {
    n: 4,
    icon: "▶",
    title: "Run Analysis",
    click: "Click the '▶ Run Analysis' button.",
    expect: "A spinner appears while the backend processes the query. Results appear in the centre panel within a second or two.",
    meaning: "The backend validates the SQL, extracts query features (WHERE filters, JOINs, ORDER BY, GROUP BY), generates index candidates, filters out duplicates and primary-key columns, scores the remaining candidates, and returns the ranked recommendations.",
    tip: "If the backend is not running you will see: 'Cannot reach the backend. Start FastAPI on port 8000 and try again.'",
  },
  {
    n: 5,
    icon: "🔎",
    title: "Read Detected Query Features",
    click: "Click the 'Query Analysis' tab in the centre panel.",
    expect: "A table shows which columns were detected in each clause: WHERE equality, WHERE range, JOIN, ORDER BY, GROUP BY.",
    meaning: "These are the raw inputs to the recommendation engine. If a column you expected is missing, the engine did not recognise it — usually because it is not in the demo schema.",
    tip: null,
  },
  {
    n: 6,
    icon: "💡",
    title: "Read the Index Recommendation",
    click: "Click the 'Recommendations' tab (the default tab after analysis).",
    expect: "One or more recommendation cards appear, each showing: the table, the columns to index, the CREATE INDEX SQL, a score (0–100), a confidence level (high/medium/low), the reasons, and the query evidence.",
    meaning: "A high-confidence recommendation (score ≥ 65) means the engine found strong evidence — typically a composite equality+range filter. A rejected candidate means an existing index or primary key already covers that column.",
    tip: "If you see 'No new index recommended', the query is already well-covered. Check the Rejected Candidates section to see why.",
  },
  {
    n: 7,
    icon: "🪜",
    title: "Open Analysis Steps",
    click: "Click the 'Analysis Steps' tab in the centre panel.",
    expect: "An 8-step walkthrough appears: SQL Input → Parsing → Feature Extraction → Schema Inspection → Candidate Generation → Filtering → Scoring → Output.",
    meaning: "Each step explains what the engine did at that stage, what it found, and why. This is the educational core of the application — it makes the recommendation transparent and explainable.",
    tip: "Click 'Go to Visualizations' at the bottom of the steps to jump directly to the visual diagrams.",
  },
  {
    n: 8,
    icon: "📊",
    title: "Explore Visualizations",
    click: "Click the 'Visualizations' tab, or go to Visualize (📊) in the sidebar. Choose from: Execution Flow, Table Scan, B+ Tree, Plan Comparison.",
    expect: "Interactive animated diagrams appear. Use the playback controls (▶ / ⏸ / ⏮ / ⏭) to step through each animation.",
    meaning: "Execution Flow shows the query pipeline. Table Scan compares full-scan vs index-lookup row counts. B+ Tree shows how the index stores values for O(log n) lookup. Plan Comparison shows the actual EXPLAIN QUERY PLAN output alongside a conceptual indexed path.",
    tip: "All visualizations are educational models. The B+ Tree and the proposed indexed plan are labelled 'conceptual' — they illustrate the concept, not exact SQLite internals.",
  },
  {
    n: 9,
    icon: "🤖",
    title: "Use AI Tutor",
    click: "Go to AI Tutor (🤖) in the sidebar. Click 'Explain this analysis' to get a plain-English explanation of the current recommendation.",
    expect: "A structured explanation appears with sections: Query Summary, Features Detected, Why This Index, Simple Explanation, Technical Explanation, Trade-offs, and Query Plan Meaning.",
    meaning: "The AI Tutor uses a local rule-based explanation generator by default (no external API key needed). If an OpenAI API key is configured, it uses GPT instead. You can also type follow-up questions.",
    tip: "Run an analysis first — the AI Tutor needs a result to explain. If no analysis has been run, it will prompt you to go to Analyze.",
  },
  {
    n: 10,
    icon: "🕑",
    title: "View History",
    click: "Go to History (🕑) in the sidebar.",
    expect: "A list of all previously run analyses appears, newest first, each showing the query, timestamp, and number of recommendations.",
    meaning: "Every successful analysis is automatically saved to the history store. You can browse past queries without re-running them.",
    tip: null,
  },
  {
    n: 11,
    icon: "↩",
    title: "Reopen a Previous Analysis",
    click: "In the History page, click the 'Open' button on any entry.",
    expect: "The application navigates to the Analyze page with the query, recommendations, and query plan from that history entry restored.",
    meaning: "You can pick up exactly where you left off — all tabs (Recommendations, Steps, Analysis, Visualizations) will show the restored data.",
    tip: null,
  },
  {
    n: 12,
    icon: "⬇",
    title: "Export JSON or Report",
    click: "After running an analysis, scroll down in the SQL Editor panel. Click '🖨 Print / Save as PDF' to open a formatted report in a new tab, '⬇ Download Report' to save it as an HTML file, or '{ } Export JSON' to download the raw data.",
    expect: "A new browser tab opens with a print-ready report, or a file download begins.",
    meaning: "The HTML report includes all analysis sections: detected features, existing indexes, recommendations, rejected candidates, query plan, and the 8-step walkthrough. The JSON export contains the raw API response for programmatic use.",
    tip: "In the print report tab, use your browser's Print function (Ctrl+P / Cmd+P) and choose 'Save as PDF' to create a PDF file.",
  },
  {
    n: 13,
    icon: "📖",
    title: "Use Learn / Terminology",
    click: "Go to Concepts (📖) in the Learn section of the sidebar. Use the search box or category filter (Core, Structures, SQL Clauses, Advanced) to find a concept.",
    expect: "Concept cards appear. Click any card to expand it and see: definition, why it matters, a SQL example, and how it relates to this project.",
    meaning: "16 concepts are covered: index, table scan, index scan, B-tree, B+ tree, primary key, composite index, query plan, EXPLAIN, selectivity, WHERE, JOIN, ORDER BY, GROUP BY, covering index, and trade-offs.",
    tip: null,
  },
  {
    n: 14,
    icon: "✅",
    title: "Use Knowledge Test",
    click: "Go to Knowledge Test (✅) in the Practice section of the sidebar.",
    expect: "A set of multiple-choice questions about database indexing concepts appears.",
    meaning: "The knowledge test lets you check your understanding of the concepts covered in this project. Each question has immediate feedback.",
    tip: null,
  },
  {
    n: 15,
    icon: "💬",
    title: "Use Doubt Solver",
    click: "Go to Doubt Solver (💬) in the Practice section of the sidebar.",
    expect: "A question-and-answer interface appears. Type a question about database indexing.",
    meaning: "The Doubt Solver answers common questions about indexes, query plans, and the recommendation engine. It uses the same local explanation engine as the AI Tutor.",
    tip: "For deeper explanations tied to a specific query result, use the AI Tutor instead.",
  },
];

const QUICK_LINKS = [
  { label: "⚡ Analyze",        page: "analyze" },
  { label: "📊 Visualize",      page: "visualize" },
  { label: "📖 Concepts",       page: "learn" },
  { label: "⚙️ Algorithm",      page: "algorithm" },
  { label: "⚠️ Limitations",    page: "limitations" },
  { label: "🧾 Testing",        page: "testing" },
  { label: "🤖 AI Usage Log",   page: "aiusage" },
  { label: "🕑 History",        page: "history" },
  { label: "✅ Knowledge Test", page: "test" },
  { label: "💬 Doubt Solver",   page: "doubts" },
];

export default function UserManualView({ onNavigate }) {
  const [openStep, setOpenStep] = useState(null);

  return (
    <div className="um-view">

      {/* hero */}
      <div className="um-hero">
        <div className="um-hero-icon">📘</div>
        <div>
          <div className="um-hero-title">User Manual</div>
          <div className="um-hero-sub">
            Step-by-step guide to every feature · Beginner-friendly · 15 stages
          </div>
        </div>
      </div>

      {/* quick nav */}
      <div className="um-section">
        <div className="um-section-title">Quick Navigation</div>
        <div className="um-quick-grid">
          {QUICK_LINKS.map((l) => (
            <button
              key={l.page}
              type="button"
              className="um-quick-btn"
              onClick={() => onNavigate?.(l.page)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* overview */}
      <div className="um-section">
        <div className="um-section-title">Application Overview</div>
        <div className="um-overview-grid">
          {[
            { icon: "⚡", title: "Lab",      desc: "Analyze SQL queries, explore visualizations, browse history." },
            { icon: "📖", title: "Learn",    desc: "Concepts, algorithm pipeline, limitations, examples, testing, AI usage, this manual." },
            { icon: "🎯", title: "Practice", desc: "Knowledge test and doubt solver to reinforce understanding." },
            { icon: "🤖", title: "AI",       desc: "AI Tutor for plain-English explanations of any analysis result." },
          ].map((g) => (
            <div key={g.title} className="um-overview-card">
              <div className="um-overview-icon">{g.icon}</div>
              <div className="um-overview-title">{g.title}</div>
              <div className="um-overview-desc">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* steps */}
      <div className="um-section">
        <div className="um-section-title">Step-by-Step Guide</div>
        <div className="um-steps">
          {STEPS.map((step) => {
            const isOpen = openStep === step.n;
            return (
              <div key={step.n} className={`um-step${isOpen ? " um-step-open" : ""}`}>
                <div
                  className="um-step-hdr"
                  onClick={() => setOpenStep(isOpen ? null : step.n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setOpenStep(isOpen ? null : step.n)}
                >
                  <div className="um-step-num">{step.n}</div>
                  <div className="um-step-icon">{step.icon}</div>
                  <div className="um-step-title">{step.title}</div>
                  <div className="um-step-chevron">{isOpen ? "▲" : "▼"}</div>
                </div>
                {isOpen && (
                  <div className="um-step-body">
                    <div className="um-step-row">
                      <div className="um-step-row-label">What to click</div>
                      <div className="um-step-row-val">{step.click}</div>
                    </div>
                    <div className="um-step-row">
                      <div className="um-step-row-label">What to expect</div>
                      <div className="um-step-row-val">{step.expect}</div>
                    </div>
                    <div className="um-step-row">
                      <div className="um-step-row-label">What it means</div>
                      <div className="um-step-row-val">{step.meaning}</div>
                    </div>
                    {step.tip && (
                      <div className="um-tip">
                        <span className="um-tip-icon">💡</span>
                        {step.tip}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* demo database */}
      <div className="um-section">
        <div className="um-section-title">Demo Database Tables</div>
        <div className="um-db-grid">
          {[
            { table: "students",  cols: "student_id (PK), name, email, major, enrollment_year", indexes: "idx_students_major" },
            { table: "customers", cols: "customer_id (PK), name, email, city, country",         indexes: "none" },
            { table: "products",  cols: "product_id (PK), product_name, category, price",       indexes: "idx_products_category" },
            { table: "orders",    cols: "order_id (PK), customer_id, product_id, status, order_date, amount", indexes: "idx_orders_customer_id" },
          ].map((t) => (
            <div key={t.table} className="um-db-card">
              <div className="um-db-table">{t.table}</div>
              <div className="um-db-cols">{t.cols}</div>
              <div className="um-db-idx">Existing index: <span>{t.indexes}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* scoring reference */}
      <div className="um-section">
        <div className="um-section-title">Scoring Quick Reference</div>
        <div className="um-score-table-wrap">
          <table className="um-score-table">
            <thead>
              <tr><th>Evidence type</th><th>Points</th><th>Confidence threshold</th></tr>
            </thead>
            <tbody>
              <tr><td>Equality filter (WHERE col = val)</td><td>+45</td><td rowSpan={2} className="um-conf-cell">≥ 65 → High</td></tr>
              <tr><td>Composite predicate (equality + range)</td><td>+65</td></tr>
              <tr><td>JOIN column</td><td>+35</td><td className="um-conf-cell">≥ 35 → Medium</td></tr>
              <tr><td>Range filter (WHERE col &gt; val)</td><td>+25</td><td rowSpan={2} className="um-conf-cell">&lt; 35 → Low</td></tr>
              <tr><td>ORDER BY / GROUP BY column</td><td>+15</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* troubleshooting */}
      <div className="um-section">
        <div className="um-section-title">Common Issues</div>
        <div className="um-trouble-list">
          {[
            { q: "Run Analysis button is greyed out", a: "The textarea is empty or contains a non-SELECT statement. Enter a valid SELECT query." },
            { q: "\"Cannot reach the backend\" error", a: "The FastAPI server is not running. Open a terminal, navigate to the backend folder, activate the venv, and run: uvicorn main:app --reload" },
            { q: "\"Table 'X' does not exist\" error", a: "The query references a table not in the demo database. Use: students, customers, products, or orders." },
            { q: "No recommendations returned", a: "The query only references columns already covered by a primary key or existing index. Check the Rejected Candidates section for details." },
            { q: "Visualizations show 'No query analyzed yet'", a: "Run an analysis on the Analyze page first, then return to Visualize." },
            { q: "AI Tutor shows no explanation", a: "Run an analysis first. The AI Tutor requires a recommendation result to explain." },
          ].map((item) => (
            <div key={item.q} className="um-trouble-item">
              <div className="um-trouble-q">❓ {item.q}</div>
              <div className="um-trouble-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
