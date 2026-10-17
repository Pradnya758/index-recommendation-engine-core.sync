import { useState } from "react";
import { EXAMPLES } from "../examples";
/* ── Per-example metadata (faculty requirement content) ─────────────────── */

const META = [
  {
    type: "WHERE",
    difficulty: "Beginner",
    diffLevel: 1,
    typeColor: "ex-type-where",
    demonstrates: "Equality filtering on customer country.",
    detects: ["Equality filter: Customer.Country"],
    expected: "Check whether an index on Country improves the query plan.",
    expectedNote: "The result depends on the existing indexes and SQLite's measured query-plan evidence.",
    why: "An index may help SQLite find customers matching a country without scanning every row.",
    concepts: ["WHERE", "Equality Filter", "Query Plan"],
  },
  {
    type: "EXISTING INDEX",
    difficulty: "Beginner",
    diffLevel: 1,
    typeColor: "ex-type-where",
    demonstrates: "Detection of an existing customer lookup index.",
    detects: ["Equality filter: Invoice.CustomerId"],
    expected: "Check whether an existing index already covers CustomerId.",
    expectedNote: "Avoid recommending a redundant index when existing coverage is sufficient.",
    why: "Existing indexes should be considered before adding another index for the same lookup.",
    concepts: ["Existing Index", "WHERE", "Redundancy"],
  },
  {
    type: "RANGE",
    difficulty: "Intermediate",
    diffLevel: 2,
    typeColor: "ex-type-orderby",
    demonstrates: "Filtering invoices within a date range.",
    detects: ["Range filter: Invoice.InvoiceDate"],
    expected: "Evaluate an index on InvoiceDate using query-plan evidence.",
    expectedNote: "The actual recommendation depends on the query plan and existing indexes.",
    why: "A suitable index may help SQLite locate rows within the requested date range.",
    concepts: ["Range Filter", "WHERE", "Index Scan"],
  },
  {
    type: "COMPOSITE",
    difficulty: "Intermediate",
    diffLevel: 2,
    typeColor: "ex-type-composite",
    demonstrates: "Customer filtering combined with descending date sorting.",
    detects: ["Equality filter: Invoice.CustomerId", "ORDER BY: Invoice.InvoiceDate"],
    expected: "Evaluate index coverage for CustomerId and InvoiceDate.",
    expectedNote: "Column order and the existing query plan determine whether a composite index helps.",
    why: "A suitable composite index may support filtering and ordering together.",
    concepts: ["Composite Index", "WHERE", "ORDER BY"],
  },
  {
    type: "JOIN",
    difficulty: "Intermediate",
    diffLevel: 2,
    typeColor: "ex-type-join",
    demonstrates: "Joining customers and invoices with a country filter.",
    detects: ["JOIN: Customer.CustomerId = Invoice.CustomerId", "Equality filter: Customer.Country"],
    expected: "Evaluate join and filter index coverage.",
    expectedNote: "Existing indexes and the actual SQLite plan determine which candidates are useful.",
    why: "Indexes may support filtering and lookups during join processing.",
    concepts: ["JOIN", "Equality Filter", "Query Plan"],
  },
  {
    type: "JOIN",
    difficulty: "Advanced",
    diffLevel: 3,
    typeColor: "ex-type-join",
    demonstrates: "Multi-table joins with an artist-name filter.",
    detects: ["JOIN: Track and Album", "JOIN: Album and Artist", "Filter: Artist.Name"],
    expected: "Evaluate existing join-key indexes and the Artist.Name filter.",
    expectedNote: "Do not add indexes where existing primary-key or foreign-key coverage is sufficient.",
    why: "Multiple joins require considering lookup columns and filtering conditions together.",
    concepts: ["JOIN", "Foreign Key", "Multi-table Query"],
  },
  {
    type: "GROUP BY",
    difficulty: "Advanced",
    diffLevel: 3,
    typeColor: "ex-type-composite",
    demonstrates: "Aggregating invoice totals for each customer.",
    detects: ["GROUP BY: CustomerId, FirstName, LastName", "Aggregate: SUM(Invoice.Total)"],
    expected: "Inspect grouping and sorting operations in the query plan.",
    expectedNote: "An index recommendation should be based on actual plan evidence, not grouping alone.",
    why: "Grouping and ordering can affect query execution, but an index is not automatically beneficial.",
    concepts: ["GROUP BY", "Aggregation", "ORDER BY"],
  },
  {
    type: "ORDER BY",
    difficulty: "Intermediate",
    diffLevel: 2,
    typeColor: "ex-type-orderby",
    demonstrates: "Filtering tracks by album and sorting by track name.",
    detects: ["Equality filter: Track.AlbumId", "ORDER BY: Track.Name"],
    expected: "Evaluate whether an index can support filtering and sorting.",
    expectedNote: "A composite index may help, depending on the existing indexes and query plan.",
    why: "The ordering of columns in a composite index affects which query operations it can support.",
    concepts: ["Composite Index", "WHERE", "ORDER BY"],
  },
  {
    type: "EXISTING INDEX",
    difficulty: "Beginner",
    diffLevel: 1,
    typeColor: "ex-type-where",
    demonstrates: "Filtering tracks by genre.",
    detects: ["Equality filter: Track.GenreId"],
    expected: "Check for existing index coverage on GenreId.",
    expectedNote: "Avoid duplicate indexes if existing coverage is sufficient.",
    why: "A foreign-key column may already have an index that supports this lookup.",
    concepts: ["Foreign Key", "Existing Index", "Redundancy"],
  },
  {
    type: "NO FILTER",
    difficulty: "Beginner",
    diffLevel: 1,
    typeColor: "ex-type-noindex",
    demonstrates: "Selecting all tracks without filtering or sorting.",
    detects: ["No WHERE, JOIN, ORDER BY, or GROUP BY"],
    expected: "No additional index is automatically required.",
    expectedNote: "A full table scan can be appropriate when all rows are requested.",
    why: "An index is not necessarily useful when the query must retrieve every row.",
    concepts: ["Table Scan", "Index Trade-offs"],
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
  const [expandedExamples, setExpandedExamples] = useState({});
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

                
{/* Compact summary */}
<div className="ex-card-section">
  <div className="ex-section-title">Key takeaway</div>
  <div className="ex-expected-value">{m.expected}</div>
</div>

{/* Expandable explanation */}
<div className="ex-card-section">
  <button
    type="button"
    className="ex-open-btn"
    onClick={() =>
      setExpandedExamples((previous) => ({
        ...previous,
        [i]: !previous[i],
      }))
    }
    aria-expanded={!!expandedExamples[i]}
  >
    {expandedExamples[i] ? "Hide explanation ↑" : "View explanation ↓"}
  </button>

  {expandedExamples[i] && (
    <div className="ex-expanded-details">
      <div className="ex-section-title">What the engine detects</div>
      <DetectList items={m.detects} />

      <div className="ex-section-title">Expected recommendation details</div>
      <p>{m.expectedNote}</p>

      <div className="ex-section-title">Why</div>
      <p>{m.why}</p>

      <div className="ex-section-title">Related concepts</div>
      <div className="ex-concepts-row">
        {m.concepts.map((c) => (
          <ConceptPill key={c} label={c} />
        ))}
      </div>
    </div>
  )}
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
  The previous project-defined scoring system has been replaced
  by rule-based analysis and evidence from isolated SQLite
  query-plan experiments. Recommendations are not assigned
  arbitrary points for equality, joins, ranges, sorting, or
  composite indexes.
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
