import { useState } from "react";

const QUESTIONS = [
  {
    id: 1,
    q: "What is a database index?",
    options: [
      "A copy of the entire table stored separately",
      "A data structure that speeds up row lookups without scanning every row",
      "A constraint that prevents duplicate values",
      "A log of all queries executed",
    ],
    answer: 1,
    explanation: "An index is a separate data structure (usually a B+ tree) that maps column values to row locations, allowing the database to find rows without reading every row in the table.",
  },
  {
    id: 2,
    q: "What does a full table scan mean?",
    options: [
      "The database checks only the first and last row",
      "The database reads every row in the table to find matches",
      "The database uses an index to jump to matching rows",
      "The database copies the table to memory",
    ],
    answer: 1,
    explanation: "A full table scan (SCAN in SQLite's EXPLAIN QUERY PLAN) means the database reads every row sequentially. This is slow on large tables and is what indexes are designed to avoid.",
  },
  
    
{
  id: 3,
  q: "How does this engine evaluate index candidates from WHERE clauses?",
  options: [
    "It assigns 45 points to equality filters",
    "It assigns points based only on column names",
    "It analyzes predicates and evaluates candidates using SQLite query-plan evidence",
    "It creates an index for every WHERE column",
  ],
  answer: 2,
  explanation: "The engine extracts supported predicates, generates candidate indexes, and evaluates them using isolated SQLite query-plan experiments. It does not rely on the old fixed feature weights.",
},

  {
    id: 4,
    q: "In a composite index on (customer_id, status), which query benefits MOST?",
    options: [
      "SELECT * FROM orders WHERE status = 'paid'",
      "SELECT * FROM orders WHERE customer_id = 10 AND status = 'paid'",
      "SELECT * FROM orders ORDER BY order_date",
      "SELECT COUNT(*) FROM orders",
    ],
    answer: 1,
    explanation: "A composite index is most useful when the query filters on the leading columns in order. customer_id = 10 AND status = 'paid' matches both columns from the left, making full use of the index.",
  },
  
{
  id: 5,
  q: "What does SCAN orders in SQLite EXPLAIN QUERY PLAN indicate?",
  options: [
    "SQLite always performs the slowest possible operation",
    "SQLite scans the table or index",
    "SQLite has automatically created a new index",
    "The query returned no rows",
  ],
  answer: 1,
  explanation: "SCAN indicates that SQLite scans a table or index. Whether this is appropriate depends on the query and available data. SEARCH indicates a more targeted lookup, but does not by itself prove faster execution.",
},

  
{
  id: 6,
  q: "Why does column order matter in a composite index?",
  options: [
    "SQLite always sorts index columns alphabetically",
    "Only the last column can be used",
    "The leftmost prefix usually determines which constraints can use the index, subject to exceptions",
    "SQLite automatically rearranges every index for each query",
  ],
  answer: 2,
  explanation: "SQLite generally uses the leftmost columns of a composite index. Equality predicates, range predicates, sorting, grouping, and exceptions such as skip-scan affect its usefulness. Column order is a design decision that should be evaluated against the query plan.",
},

  
{
  id: 7,
  q: "Which statement about SQLite's B-tree structures is correct?",
  options: [
    "SQLite uses only binary search trees",
    "SQLite uses B-tree structures for tables and indexes",
    "SQLite uses B-trees only for primary keys",
    "Every index lookup is guaranteed to be faster than a table scan",
  ],
  answer: 1,
  explanation: "SQLite uses B-tree structures for tables and indexes. They organize keys to support lookups and ordered access, but the best access path depends on the query, schema, and data.",
},

  
{
  id: 8,
  q: "What is an important trade-off of adding an index?",
  options: [
    "Indexes eliminate all full table scans",
    "Indexes prevent UPDATE and DELETE operations",
    "Indexes consume storage and add maintenance work when data changes",
    "Indexes guarantee faster execution for every SELECT",
  ],
  answer: 2,
  explanation: "Indexes consume storage and must be maintained during relevant INSERT, UPDATE, and DELETE operations. They may improve particular access paths, but their benefits depend on the workload.",
},

 
{
  id: 9,
  q: "Why should the engine inspect primary-key access before proposing another index?",
  options: [
    "SQLite cannot search using primary keys",
    "Existing primary-key or rowid access may already support the lookup",
    "Every primary key requires an additional index",
    "Primary keys cannot appear in WHERE clauses",
  ],
  answer: 1,
  explanation: "SQLite may already have an appropriate primary-key or rowid access path. The engine should inspect the table definition and existing indexes before proposing a potentially redundant index.",
},

  
{
  id: 10,
  q: "What does the SUPPORTED evidence status mean?",
  options: [
    "The query is guaranteed to run faster",
    "The candidate has relevant supporting query-plan evidence",
    "The candidate received at least 65 points",
    "The index is always the best choice",
  ],
  answer: 1,
  explanation: "SUPPORTED means the isolated experiment produced relevant evidence, such as candidate-index use or a favorable change in the relevant plan operation. It does not establish a measured execution-time improvement.",
},

  {
    id: 11,
    q: "What is a covering index?",
    options: [
      "An index that covers the entire table",
      "An index that contains all columns needed by a query, so no table row fetch is required",
      "An index that covers multiple tables in a JOIN",
      "An index created automatically by the database",
    ],
    answer: 1,
    explanation: "A covering index contains the columns needed by a query so SQLite may answer it without fetching the corresponding table rows. Check EXPLAIN QUERY PLAN for evidence such as USING COVERING INDEX. A covering index is not automatically the best choice for every workload.",
  },
  
{
  id: 12,
  q: "When should an index recommendation be classified as UNCERTAIN?",
  options: [
    "Whenever a query contains a WHERE clause",
    "Whenever the candidate has multiple columns",
    "When the experiment fails or the available evidence is insufficient",
    "Whenever SQLite uses a SEARCH operation",
  ],
  answer: 2,
  explanation: "UNCERTAIN is appropriate when an experiment fails or cannot establish a reliable result, such as when required schema or data is unavailable or the SQL cannot be tested adequately.",
},

];


const REFLECTIONS = [
  "Can I identify index candidates from WHERE, JOIN, ORDER BY, and GROUP BY clauses?",
  "Can I explain SCAN versus SEARCH without assuming one is always faster?",
  "Can I explain composite-index leftmost-prefix behavior and its exceptions?",
  "Can I distinguish SUPPORTED, UNCHANGED, and UNCERTAIN evidence?",
  "Can I explain index redundancy, storage costs, and write overhead?",
];


export default function KnowledgeTestView() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [scores, setScores] = useState([]);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const progress = ((current) / total) * 100;

  function handleSelect(idx) {
    if (confirmed) return;
    setSelected(idx);
  }

  function handleConfirm() {
    if (selected === null || confirmed) return;
    const correct = selected === q.answer;
    setScores((prev) => [...prev, correct]);
    setConfirmed(true);
  }

  function handleNext() {
    if (current + 1 >= total) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setSelected(null);
    setConfirmed(false);
    setScores([]);
    setDone(false);
  }

  const finalScore = scores.filter(Boolean).length;

  if (done) {
    const pct = Math.round((finalScore / total) * 100);
    const grade = pct >= 90 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Needs review" : "Keep studying";
    const gradeColor = pct >= 90 ? "green" : pct >= 70 ? "cyan" : pct >= 50 ? "amber" : "red";
    return (
      <div className="kt-view">
        <div className="kt-inner">
          <div className="kt-score-reveal">
            <div className="kt-score-icon">🏆</div>
            <div className="kt-score-num">{finalScore}<span>/{total}</span></div>
            <div className={`kt-grade kt-grade-${gradeColor}`}>{grade}</div>
            <div className="kt-score-pct">{pct}% correct</div>
            <div className="kt-score-breakdown">
              {QUESTIONS.map((q, i) => (
                <span
                  key={q.id}
                  className={`kt-pip ${scores[i] ? "correct" : "wrong"}`}
                  title={`Q${i + 1}: ${scores[i] ? "Correct" : "Wrong"}`}
                />
              ))}
            </div>
            <button className="kt-restart-btn" type="button" onClick={handleRestart}>
              ↺ Restart Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kt-view">
      <div className="kt-inner">

        {/* Header */}
        <div className="kt-page-hdr">
          <div>
            <div className="eyebrow">Practice</div>
            <h1 className="kt-page-title">Ask Yourself + Knowledge Test</h1>
            <p className="kt-page-sub">Reflect on the learning goals, then test your understanding with the existing interactive quiz.</p>
          </div>
          <div className="kt-progress-info">
            <span className="kt-q-counter">Question {current + 1} of {total}</span>
            <div className="kt-progress-bar-wrap">
              <div className="kt-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <section className="ask-yourself" aria-labelledby="ask-yourself-title">
          <div>
            <span className="ask-kicker">Before you begin</span>
            <h2 id="ask-yourself-title">Ask Yourself</h2>
          </div>
          <div className="ask-grid">
            {REFLECTIONS.map((reflection, index) => (
              <div className="ask-prompt" key={reflection}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{reflection}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Question card */}
        <div className="kt-card" key={q.id}>
          <div className="kt-q-num">Q{current + 1}</div>
          <div className="kt-q-text">{q.q}</div>

          <div className="kt-options">
            {q.options.map((opt, i) => {
              let cls = "kt-option";
              if (confirmed) {
                if (i === q.answer) cls += " correct";
                else if (i === selected && i !== q.answer) cls += " wrong";
                else cls += " dim";
              } else if (i === selected) {
                cls += " selected";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={confirmed}
                >
                  <span className="kt-opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span className="kt-opt-text">{opt}</span>
                  {confirmed && i === q.answer && <span className="kt-opt-icon">✓</span>}
                  {confirmed && i === selected && i !== q.answer && <span className="kt-opt-icon">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {confirmed && (
            <div className={`kt-explanation ${selected === q.answer ? "kt-exp-correct" : "kt-exp-wrong"}`}>
              <div className="kt-exp-label">
                {selected === q.answer ? "✓ Correct!" : "✗ Incorrect"}
              </div>
              <div className="kt-exp-text">{q.explanation}</div>
            </div>
          )}

          {/* Actions */}
          <div className="kt-actions">
            {!confirmed ? (
              <button
                className="kt-confirm-btn"
                type="button"
                onClick={handleConfirm}
                disabled={selected === null}
              >
                Confirm Answer
              </button>
            ) : (
              <button className="kt-next-btn" type="button" onClick={handleNext}>
                {current + 1 >= total ? "See Results" : "Next Question →"}
              </button>
            )}
            <span className="kt-score-live">
              Score: {scores.filter(Boolean).length}/{scores.length}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
