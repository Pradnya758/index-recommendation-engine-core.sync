import { useState } from "react";

/* ── Pipeline steps — documented from actual source code ── */
const PIPELINE = [
  {
    id: "validate",
    num: "01",
    icon: "🛡️",
    title: "SQL Validation",
    badge: "sql_validator.py",
    badgeColor: "badge-blue",
    purpose: "Reject unsafe, empty, or non-SELECT statements before any parsing.",
    input: "Raw query string from the user",
    output: "Normalised SELECT string, or a 422 error",
    algo: "SQLGlot parse() — checks statement count and top-level node type",
    complexity: "O(n)",
    complexityNote: "n = query length. Single-pass tokenisation.",
    detail: "The validator calls SQLGlot's parse() with the sqlite dialect. It rejects empty strings, multi-statement input, and any statement whose root node is not exp.Query (SELECT). INSERT, UPDATE, DELETE, DROP, ALTER, and CREATE all fail here. The normalised SQL string is returned for the next stage.",
    rule: false,
  },
  {
    id: "parse",
    num: "02",
    icon: "⚙️",
    title: "SQL Parsing",
    badge: "sql_analyzer.py",
    badgeColor: "badge-cyan",
    purpose: "Build a structured AST from the validated SQL and resolve table aliases.",
    input: "Normalised SELECT string + schema column map",
    output: "SQLGlot AST + alias→table mapping + list of referenced tables",
    algo: "SQLGlot parse_one() with sqlite dialect; alias resolution via exp.Table traversal",
    complexity: "O(n)",
    complexityNote: "n = query length. Linear AST construction.",
    detail: "parse_one() produces a full expression tree. _table_aliases() walks every exp.Table node to build an alias→real-name map and validates that each table exists in the demo schema. Unknown tables raise SqlAnalysisError immediately.",
    rule: false,
  },
  {
    id: "extract",
    num: "03",
    icon: "🔎",
    title: "Feature Extraction",
    badge: "sql_analyzer.py",
    badgeColor: "badge-cyan",
    purpose: "Walk the AST to collect every index-relevant column reference.",
    input: "SQLGlot AST + alias map + schema column map",
    output: "QueryFeatures: equality_filters, range_filters, join_columns, order_by_columns, group_by_columns",
    algo: "Recursive AST traversal using SQLGlot find_all() and _split_and() for AND decomposition",
    complexity: "O(n)",
    complexityNote: "n = number of AST nodes. Each node visited at most once.",
    
detail: "The analyzer walks the SQL AST to identify equality filters, range filters, join predicates, ORDER BY columns, and GROUP BY columns. These features are passed to the recommendation engine for rule-based candidate generation. No arbitrary feature-point weights are assigned.",
rule: false,
  },
  {
    id: "inspect",
    num: "04",
    icon: "🗄️",
    title: "Schema Inspection",
    badge: "recommendation_engine.py",
    badgeColor: "badge-indigo",
    purpose: "Load existing indexes and primary keys from the live SQLite schema.",
    input: "SchemaInspectionResponse (already fetched from SQLite)",
    output: "existing_indexes dict (table → [(name, columns)]), primary_keys dict (table → columns)",
    algo: "Dictionary construction from schema response — O(t + i) where t = tables, i = total indexes",
    complexity: "O(t + i)",
    complexityNote: "t = number of tables, i = total existing indexes across all tables.",
    detail: "The schema response is already available from the /api/schema endpoint. build_recommendations() extracts two lookup structures: a dict of existing index column tuples per table, and a dict of primary key column tuples per table. These are used in the filtering step.",
    rule: false,
  },
  {
    id: "generate",
    num: "05",
    icon: "🗂️",
    title: "Candidate Generation",
    badge: "recommendation_engine.py",
    badgeColor: "badge-indigo",
    purpose: "Create single-column and composite index candidates from extracted features.",
    input: "QueryFeatures from step 3",
    output: "Dict of _Candidate objects keyed by (table, columns_tuple)",
    algo: "Rule-based: one candidate per (table, column) pair; composite candidates for multi-equality and equality+range patterns",
    complexity: "O(f)",
    complexityNote: "f = total number of extracted feature references. Each feature creates or updates one candidate entry.",
    
detail: "Single-column and composite index candidates are generated from extracted query features. Composite candidates are considered for multiple equality conditions and applicable equality-plus-range patterns. Candidate column order is selected using the query predicates and applicable design rules. Candidates are subsequently checked against primary keys and existing indexes, then evaluated using isolated SQLite query-plan experiments.",
rule: false,
  },
  {
    id: "filter",
    num: "06",
    icon: "🚫",
    title: "Redundancy Filtering",
    badge: "recommendation_engine.py",
    badgeColor: "badge-indigo",
    purpose: "Reject candidates already covered by a primary key or existing index.",
    input: "Each _Candidate + existing_indexes + primary_keys",
    output: "Candidate classified as recommendation or RejectedCandidate",
    algo: "Prefix-match check: candidate.columns[:len(pk)] == pk; index_columns[:len(candidate)] == candidate.columns",
    complexity: "O(c × i)",
    complexityNote: "c = number of candidates, i = existing indexes per table. Typically very small.",
    detail: "_rejection_reason() checks two conditions in order: (1) if the candidate's leading columns match the primary key tuple, reject as PK duplicate; (2) for each existing index on the same table, if the existing index's leading columns match the candidate's columns, reject as already covered. The first matching rejection reason is returned. Rejected candidates are still returned in the response for transparency.",
    rule: false,
  },
  
{
  id: "evidence",
  num: "07",
  icon: "🔬",
  title: "Evidence Validation",
  badge: "index_evidence.py",
  badgeColor: "badge-indigo",
  purpose: "Evaluate candidate indexes using isolated SQLite query-plan experiments.",
  input: "Candidate index + isolated schema and query",
  output: "Before-plan, after-plan, evidence status and explanation",
  algo: "Compare EXPLAIN QUERY PLAN before and after candidate index creation",
  complexity: "Depends on experiment",
  complexityNote: "Includes database setup, index creation and query-plan inspection.",
  detail: "The candidate is evaluated in an isolated SQLite database rather than the application's real database. The baseline query plan is compared with the plan after creating the candidate index. Relevant plan changes support the evidence classification, but a plan change alone does not prove faster execution.",
  rule: false,
},

  
{
  id: "output",
  num: "08",
  icon: "💡",
  title: "Evidence-Based Recommendation",
  badge: "recommendation_engine.py",
  badgeColor: "badge-indigo",
  purpose: "Return recommendations with supporting rules, evidence and trade-offs.",
  input: "Candidate results + rule matches + query-plan evidence",
  output: "Recommendation response with status, reasons and query-plan details",
  algo: "Evidence-based classification and transparent candidate prioritisation",
  complexity: "Depends on candidates and experiments",
  complexityNote: "Includes candidate processing and isolated query-plan evaluation.",
  detail: "Each candidate reports applicable rule IDs and the observed query-plan evidence. SUPPORTED indicates relevant favorable plan evidence; UNCHANGED indicates no meaningful relevant plan change; UNCERTAIN indicates insufficient or unreliable evidence. The system does not claim measured speed improvements unless execution times were actually measured.",
  rule: false,
},

];


const RULE_GROUPS = [
  {
    id: "R1",
    title: "Search conditions",
    description: "Evaluate equality, IN, IS and applicable range predicates for potential index use.",
    source: "Official SQLite documentation",
  },
  {
    id: "R2",
    title: "Composite index prefix",
    description: "Evaluate leftmost-prefix constraints, range conditions and documented exceptions such as skip-scan.",
    source: "Official SQLite documentation",
  },
  {
    id: "R3",
    title: "Covering indexes",
    description: "Check whether an index contains the required query columns and whether the plan reports a covering index.",
    source: "Official SQLite documentation",
  },
  {
    id: "R4",
    title: "Sorting and grouping",
    description: "Inspect ORDER BY and GROUP BY operations and whether a suitable index may avoid a temporary B-tree.",
    source: "Official SQLite documentation",
  },
  {
    id: "R5",
    title: "Joins",
    description: "Inspect join predicates and lookup paths without assuming every join requires a new index.",
    source: "Official SQLite documentation",
  },
  {
    id: "R6",
    title: "Expressions, functions and LIKE",
    description: "Evaluate expression-index and LIKE restrictions, including relevant collation and pattern requirements.",
    source: "Official SQLite documentation",
  },
  {
    id: "R7",
    title: "Statistics and uncertainty",
    description: "Record available planner-statistics evidence and explain when the evidence is insufficient.",
    source: "SQLite documentation and evidence limitations",
  },
  {
    id: "R8",
    title: "Redundancy",
    description: "Check existing index coverage, column order, uniqueness and partial-index differences.",
    source: "SQLite documentation and schema inspection",
  },
  {
    id: "R9",
    title: "Rowid and primary-key access",
    description: "Recognise existing rowid and applicable INTEGER PRIMARY KEY access paths.",
    source: "Official SQLite documentation",
  },
  {
    id: "R10",
    title: "Index overhead",
    description: "Explain storage and write-maintenance costs as trade-offs, not optimizer rules.",
    source: "General database principle",
  },
  {
    id: "R11",
    title: "Composite ordering heuristic",
    description: "Evaluate equality, ordering/grouping and range columns when generating and validating composite candidates.",
    source: "Design heuristic — not a universal SQLite rule",
  },
];

function ComplexityBadge({ notation, note }) {
  return (
    <span className="algo-complexity-badge" title={note}>
      {notation}
    </span>
  );
}

function StepCard({ step, open, onToggle }) {
  return (
    <div className={`algo-step-card${open ? " open" : ""}`}>
      <div className="algo-step-hdr" onClick={onToggle} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}>
        <div className="algo-step-left">
          <span className="algo-step-num">{step.num}</span>
          <span className="algo-step-icon">{step.icon}</span>
          <div>
            <div className="algo-step-title">{step.title}</div>
            <div className="algo-step-badges">
              <span className={`algo-file-badge ${step.badgeColor}`}>{step.badge}</span>
              {step.rule && (
  <span className="algo-rule-badge">
    Rule-based analysis
  </span>
)}
              <ComplexityBadge notation={step.complexity} note={step.complexityNote} />
            </div>
          </div>
        </div>
        <span className="algo-step-chevron">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="algo-step-body">
          <div className="algo-io-grid">
            <div className="algo-io-cell">
              <div className="algo-io-label">Input</div>
              <div className="algo-io-val">{step.input}</div>
            </div>
            <div className="algo-io-cell">
              <div className="algo-io-label">Output</div>
              <div className="algo-io-val">{step.output}</div>
            </div>
          </div>
          <div className="algo-purpose-row">
            <span className="algo-purpose-label">Purpose</span>
            <span className="algo-purpose-val">{step.purpose}</span>
          </div>
          <div className="algo-purpose-row">
            <span className="algo-purpose-label">Algorithm</span>
            <span className="algo-purpose-val algo-mono">{step.algo}</span>
          </div>
          <div className="algo-detail">{step.detail}</div>
          <div className="algo-complexity-row">
            <span className="algo-purpose-label">Complexity</span>
            <ComplexityBadge notation={step.complexity} note={step.complexityNote} />
            <span className="algo-complexity-note">{step.complexityNote}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlgorithmView() {
  const [openStep, setOpenStep] = useState(null);
  const [openSection, setOpenSection] = useState("pipeline");

  function toggleStep(id) {
    setOpenStep((prev) => (prev === id ? null : id));
  }
  function toggleSection(id) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <div className="algo-view">
      <div className="algo-inner">

        {/* Header */}
        <div className="algo-page-hdr">
          <div className="eyebrow eyebrow-accent">Technical Reference</div>
          <h1 className="algo-page-title">Recommendation Algorithm</h1>
          <p className="algo-page-sub">
            A complete walkthrough of the eight-stage pipeline that turns a SQL query into
            an index recommendation. All logic is deterministic and rule-based — no machine
            learning or AI is involved in the recommendation itself.
          </p>
          <div className="algo-disclaimer">
            
⚠ Educational tool — not a production optimizer. Recommendations use SQL analysis, schema checks, and isolated SQLite query-plan evidence. A favorable query-plan change does not guarantee faster execution in every workload.

          </div>
        </div>

        {/* ── Section: Pipeline ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("pipeline")}
            type="button" aria-expanded={openSection === "pipeline"}>
            <span className="algo-section-icon">⚡</span>
            <span className="algo-section-title">8-Stage Pipeline</span>
            <span className="algo-section-chevron">{openSection === "pipeline" ? "▲" : "▼"}</span>
          </button>
          {openSection === "pipeline" && (
            <div className="algo-section-body">
              {/* Mini flow diagram */}
              <div className="algo-flow">
                {PIPELINE.map((s, i) => (
                  <div key={s.id} className="algo-flow-item">
                    <div className="algo-flow-node" onClick={() => toggleStep(s.id)}
                      style={{ cursor: "pointer" }} title={s.title}>
                      <span className="algo-flow-num">{s.num}</span>
                      <span className="algo-flow-icon">{s.icon}</span>
                    </div>
                    <div className="algo-flow-label">{s.title}</div>
                    {i < PIPELINE.length - 1 && <div className="algo-flow-arrow">→</div>}
                  </div>
                ))}
              </div>
              <div className="algo-steps-list">
                {PIPELINE.map((step) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    open={openStep === step.id}
                    onToggle={() => toggleStep(step.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Scoring ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("scoring")}
            type="button" aria-expanded={openSection === "scoring"}>
            <span className="algo-section-icon">🏆</span>
            <span className="algo-section-title">SQLite Rule Catalogue (R1–R11)</span>
            <span className="algo-section-chevron">{openSection === "scoring" ? "▲" : "▼"}</span>
          </button>
          
{openSection === "scoring" && (
  <div className="algo-section-body">
    <p className="algo-body-text">
      The engine evaluates index candidates using explicit rules and
      isolated SQLite query-plan evidence, rather than assigning arbitrary
      points to query features. Each rule describes a condition to inspect;
      the final status depends on the implementation and available evidence.
    </p>

    <div className="algo-score-table">
      <div className="algo-score-hdr">
        <span>Rule</span>
        <span>Category</span>
        <span>Purpose</span>
      </div>

      {RULE_GROUPS.map((rule) => (
        <div className="algo-score-row" key={rule.id}>
          <span className="algo-score-pts">{rule.id}</span>
          <span className="algo-score-feature">{rule.title}</span>
          <span className="algo-score-why">
            {rule.description}
            <br />
            <small>{rule.source}</small>
          </span>
        </div>
      ))}
    </div>

    <div className="algo-disclaimer">
      Evidence statuses:
      <strong> SUPPORTED</strong> — favorable query-plan evidence;
      <strong> UNCHANGED</strong> — no meaningful plan change;
      <strong> UNCERTAIN</strong> — insufficient or inconclusive evidence.
      A query-plan improvement does not by itself prove faster execution.
    </div>
  </div>
)}

        </div>

        {/* ── Section: Complexity ── */}
        <div className="algo-section">
          <button className="algo-section-hdr" onClick={() => toggleSection("complexity")}
            type="button" aria-expanded={openSection === "complexity"}>
            <span className="algo-section-icon">📐</span>
            <span className="algo-section-title">Complexity Analysis</span>
            <span className="algo-section-chevron">{openSection === "complexity" ? "▲" : "▼"}</span>
          </button>
          {openSection === "complexity" && (
            <div className="algo-section-body">
              <p className="algo-body-text">
                All complexity claims below are justified from the actual implementation.
                No benchmark numbers are stated — complexity depends on query size, schema size,
                and number of candidates, all of which are small in typical use.
              </p>
              <div className="algo-complexity-table">
                {[
                  { stage: "Validation + Parsing", notation: "O(n)", var: "n = query length", note: "Single-pass tokenisation and AST construction by SQLGlot." },
                  { stage: "Feature Extraction", notation: "O(n)", var: "n = AST nodes", note: "Each AST node is visited at most once during WHERE/JOIN/ORDER/GROUP traversal." },
                  { stage: "Schema Lookup", notation: "O(t + i)", var: "t = tables, i = indexes", note: "One pass to build two lookup dicts from the schema response." },
                  { stage: "Candidate Generation", notation: "O(f)", var: "f = feature references", note: "Each feature reference creates or updates one dict entry. Composite rules add at most 2 extra entries per table." },
                  { stage: "Redundancy Filtering", notation: "O(c × i)", var: "c = candidates, i = indexes/table", note: "Each candidate is checked against existing indexes. Both c and i are small in practice." },
                  { stage: "Candidate Sorting", notation: "O(c log c)", var: "c = surviving candidates", note: "Python's Timsort on the candidate list. Dominates only when many candidates exist." },
                  { stage: "Full Pipeline", notation: "O(n + f + c log c)", var: "combined", note: "Dominated by parsing (O(n)) for short queries; by sorting (O(c log c)) for queries with many features." },
                ].map((row) => (
                  <div className="algo-cx-row" key={row.stage}>
                    <div className="algo-cx-stage">{row.stage}</div>
                    <ComplexityBadge notation={row.notation} note={row.note} />
                    <div className="algo-cx-var">{row.var}</div>
                    <div className="algo-cx-note">{row.note}</div>
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
