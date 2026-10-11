import { EXAMPLES } from "../examples";

/* ── Per-example metadata (faculty requirement content) ─────────────────── */
const META = [
  {
    type:       "WHERE",
    difficulty: "Beginner",
    diffLevel:  1,
    typeColor:  "ex-type-where",
    demonstrates: "Single-column equality filter with existing-index detection.",
    detects:    ["Equality filter: students.major"],
    expected:   "students.major already has an index (idx_students_major) — rejected as covered.",
    expectedNote: "The engine detects the equality filter, then rejects the candidate because the existing index already covers major.",
    why:        "The query demonstrates both feature detection and duplicate-index prevention. SQLite can use the existing major index, so another one would add write and storage overhead without adding coverage.",
    concepts:   ["Table Scan", "Index Scan", "Selectivity"],
  },
  {
    type:       "JOIN",
    difficulty: "Intermediate",
    diffLevel:  2,
    typeColor:  "ex-type-join",
    demonstrates: "JOIN column indexing — the foreign key side of a join.",
    detects:    ["JOIN column: orders.customer_id", "JOIN column: customers.customer_id"],
    expected:   "orders.customer_id already has an index (idx_orders_customer_id) — rejected as covered. customers.customer_id is a primary key — rejected.",
    expectedNote: "Both join columns are already covered. The engine returns rejected candidates, not new recommendations.",
    why:        "The engine checks existing indexes before recommending. Since both sides are already indexed, no new index is needed.",
    concepts:   ["JOIN", "Primary Key", "Index Scan"],
  },
  {
    type:       "ORDER BY",
    difficulty: "Beginner",
    diffLevel:  1,
    typeColor:  "ex-type-orderby",
    demonstrates: "Sort-column indexing — eliminating the sort step.",
    detects:    ["ORDER BY column: products.unit_price"],
    expected:   "CREATE INDEX on products(unit_price)",
    expectedNote: "The engine detects unit_price in ORDER BY and recommends an index. Score ≈ 15 (sort evidence). Confidence: low.",
    why:        "An index on unit_price stores values in sorted order. SQLite can read them in sequence without a separate sort operation.",
    concepts:   ["ORDER BY", "Index Scan", "Query Plan"],
  },
  {
    type:       "COMPOSITE",
    difficulty: "Advanced",
    diffLevel:  3,
    typeColor:  "ex-type-composite",
    demonstrates: "Composite equality index plus a separate sort-column candidate.",
    detects:    [
      "Equality filter: orders.customer_id",
      "Equality filter: orders.status",
      "ORDER BY column: orders.order_date",
    ],
    expected:   "Composite index on orders(customer_id, status), plus orders(order_date)",
    expectedNote: "The equality columns form the 65-point composite candidate. ORDER BY produces a separate 15-point order_date candidate.",
    why:        "The implemented rules combine multiple equality filters in predicate order. ORDER BY is evaluated as its own candidate rather than being appended to the equality composite.",
    concepts:   ["Composite Index", "WHERE", "ORDER BY", "Selectivity"],
  },
  {
    type:       "NO INDEX",
    difficulty: "Beginner",
    diffLevel:  1,
    typeColor:  "ex-type-noindex",
    demonstrates: "When no index can help — no filter, join, sort, or group.",
    detects:    ["No WHERE, JOIN, ORDER BY, or GROUP BY detected"],
    expected:   "No recommendation",
    expectedNote: "The engine finds no index-relevant features. There are no candidates to score or reject.",
    why:        "An index only helps when the query has a condition to filter, a join to match, or a sort to eliminate. A bare SELECT * has none of these.",
    concepts:   ["Table Scan", "Index Trade-offs"],
  },
];

/* ── Difficulty dots ─────────────────────────────────────────────────────── */
function DiffDots({ level }) {
  return (
    <span className="ex-diff-dots" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={`ex-diff-dot${n <= level ? " filled" : ""}`} />
      ))}
    </span>
  );
}

/* ── Type badge ──────────────────────────────────────────────────────────── */
function TypeBadge({ type, colorClass }) {
  return <span className={`ex-type-badge ${colorClass}`}>{type}</span>;
}

/* ── Detected features list ──────────────────────────────────────────────── */
function DetectList({ items }) {
  return (
    <ul className="ex-detect-list">
      {items.map((item) => (
        <li key={item} className="ex-detect-item">
          <span className="ex-detect-dot" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ── Concept pill ────────────────────────────────────────────────────────── */
function ConceptPill({ label }) {
  return <span className="ex-concept-pill">{label}</span>;
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function ExamplesView({ onOpen }) {
  return (
    <div className="examples-view">
      <div className="examples-inner">

        {/* Page header */}
        <div className="examples-page-hdr">
          <div>
            <div className="eyebrow">Query Library</div>
            <h1 className="examples-title">Sample Inputs &amp; Outputs</h1>
            <p className="examples-sub">
              Five realistic queries against the demo database. Each example shows what the engine
              detects, what it recommends, and why. Click <strong>Try this example</strong> to run
              it live against the backend.
            </p>
          </div>
          <div className="examples-legend">
            <span className="ex-type-badge ex-type-where">WHERE</span>
            <span className="ex-type-badge ex-type-join">JOIN</span>
            <span className="ex-type-badge ex-type-orderby">ORDER BY</span>
            <span className="ex-type-badge ex-type-composite">COMPOSITE</span>
            <span className="ex-type-badge ex-type-noindex">NO INDEX</span>
          </div>
        </div>

        {/* Example cards */}
        <div className="examples-grid">
          {EXAMPLES.map((ex, i) => {
            const m = META[i];
            return (
              <div
                className="ex-card"
                key={ex.label}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Card header */}
                <div className="ex-card-hdr">
                  <div className="ex-card-hdr-top">
                    <TypeBadge type={m.type} colorClass={m.typeColor} />
                    <div className="ex-card-hdr-right">
                      <DiffDots level={m.diffLevel} />
                      <span className="ex-diff-label">{m.difficulty}</span>
                    </div>
                  </div>
                  <div className="ex-card-num">Lab Experiment {String(i + 1).padStart(2, "0")}</div>
                  <div className="ex-card-title">{ex.label}</div>
                  <div className="ex-card-demonstrates">{m.demonstrates}</div>
                </div>

                {/* SQL block */}
                <div className="ex-sql-wrap">
                  <div className="ex-sql-label">SQL</div>
                  <pre className="ex-sql-pre">{ex.query}</pre>
                </div>

                {/* Detects */}
                <div className="ex-card-section">
                  <div className="ex-section-title">What the engine detects</div>
                  <DetectList items={m.detects} />
                </div>

                {/* Expected */}
                <div className="ex-card-section ex-expected-section">
                  <div className="ex-section-title">Expected recommendation</div>
                  <div className="ex-expected-value">{m.expected}</div>
                  <div className="ex-expected-note">{m.expectedNote}</div>
                </div>

                {/* Why */}
                <div className="ex-card-section">
                  <div className="ex-section-title">Why</div>
                  <div className="ex-why-text">{m.why}</div>
                </div>

                {/* Concepts */}
                <div className="ex-card-section">
                  <div className="ex-section-title">Related concepts</div>
                  <div className="ex-concepts-row">
                    {m.concepts.map((c) => <ConceptPill key={c} label={c} />)}
                  </div>
                </div>

                {/* Footer */}
                <div className="ex-card-footer">
                  <span className="ex-card-hint">
                    Result is produced live by the backend — not hardcoded.
                  </span>
                  <button
                    className="ex-open-btn"
                    type="button"
                    onClick={() => onOpen(ex.query)}
                  >
                    Try Experiment →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* How to read the result */}
        <section className="how-to-read">
          <div className="htr-header">
            <div className="eyebrow">Guide</div>
            <h2 className="htr-title">How to read the result</h2>
            <p className="htr-sub">
              After clicking <strong>Try this example</strong>, the Analyze page shows the engine's
              output. Here is what each part means.
            </p>
          </div>
          <div className="htr-grid">
            <div className="htr-card">
              <div className="htr-card-icon">🎯</div>
              <div className="htr-card-title">Candidate</div>
              <div className="htr-card-desc">
                A table + column combination the engine considered for indexing, based on detected
                query features (WHERE, JOIN, ORDER BY, GROUP BY).
              </div>
            </div>
            <div className="htr-card">
              <div className="htr-card-icon">🔢</div>
              <div className="htr-card-title">Score</div>
              <div className="htr-card-desc">
                A project-defined educational heuristic based on the candidate's query feature.
                Equality filter = 45 pts, JOIN = 35 pts, range filter = 25 pts,
                ORDER BY / GROUP BY = 15 pts, and composite = exactly 65 pts.
              </div>
            </div>
            <div className="htr-card">
              <div className="htr-card-icon">📊</div>
              <div className="htr-card-title">Confidence</div>
              <div className="htr-card-desc">
                Derived from the score. <strong>High</strong> (≥ 65) means strong evidence.
                <strong> Medium</strong> (35–64) means moderate evidence.
                <strong> Low</strong> (&lt; 35) means weak evidence.
              </div>
            </div>
            <div className="htr-card">
              <div className="htr-card-icon">💡</div>
              <div className="htr-card-title">Reason</div>
              <div className="htr-card-desc">
                A plain-English explanation of why this index was recommended — which query feature
                triggered it and how the index would help execution.
              </div>
            </div>
            <div className="htr-card">
              <div className="htr-card-icon">🚫</div>
              <div className="htr-card-title">Rejected Candidate</div>
              <div className="htr-card-desc">
                A candidate that was considered but discarded because an existing index or the
                primary key already covers it. No new index is needed.
              </div>
            </div>
            <div className="htr-card">
              <div className="htr-card-icon">📋</div>
              <div className="htr-card-title">CREATE INDEX SQL</div>
              <div className="htr-card-desc">
                The exact SQL statement you would run to create the recommended index. The DROP
                INDEX statement below it lets you roll back the change.
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
