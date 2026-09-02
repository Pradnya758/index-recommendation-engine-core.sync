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
    q: "Which SQL clause is the PRIMARY driver of index recommendations in this engine?",
    options: ["SELECT", "FROM", "WHERE", "LIMIT"],
    answer: 2,
    explanation: "WHERE clause columns are the primary candidates for indexing because they filter rows. The engine scores equality filters at +45 points and range filters at +25 points.",
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
    q: "What does EXPLAIN QUERY PLAN output 'SCAN orders' indicate?",
    options: [
      "SQLite is using an index on the orders table",
      "SQLite is performing a full table scan — reading every row",
      "SQLite is scanning only the primary key column",
      "SQLite has found no rows matching the query",
    ],
    answer: 1,
    explanation: "'SCAN tablename' in EXPLAIN QUERY PLAN means SQLite is doing a full table scan with no index. 'SEARCH tablename USING INDEX' would indicate index usage.",
  },
  {
    id: 6,
    q: "Why does column ORDER matter in a composite index?",
    options: [
      "It doesn't — SQLite reorders columns automatically",
      "Alphabetical order is always best",
      "SQLite can only use the index if the query matches columns from the left (left-prefix rule)",
      "The last column is always the most important",
    ],
    answer: 2,
    explanation: "SQLite uses the left-prefix rule: a composite index on (a, b, c) can be used for queries filtering on a, or a+b, or a+b+c — but NOT on b alone or c alone. Equality columns should come first.",
  },
  {
    id: 7,
    q: "What is a B+ tree?",
    options: [
      "A binary search tree where each node has exactly 2 children",
      "A balanced tree where all data is in leaf nodes, linked for range scans",
      "A hash table optimized for equality lookups",
      "A tree structure used only for primary keys",
    ],
    answer: 1,
    explanation: "A B+ tree stores all actual data in leaf nodes, which are linked together. This makes both point lookups (O(log n)) and range scans efficient. SQLite uses B+ trees for indexes.",
  },
  {
    id: 8,
    q: "Which of these is a trade-off of adding an index?",
    options: [
      "SELECT queries become slower",
      "The table can no longer be updated",
      "INSERT, UPDATE, and DELETE operations become slightly slower because the index must also be updated",
      "The primary key is automatically removed",
    ],
    answer: 2,
    explanation: "Every write operation (INSERT, UPDATE, DELETE) must update all indexes on the table. This adds overhead. Indexes improve read performance at the cost of write performance and storage.",
  },
  {
    id: 9,
    q: "Why does this engine reject a candidate that matches the primary key?",
    options: [
      "Primary keys cannot be indexed in SQLite",
      "Primary keys are automatically indexed — adding another index would be redundant",
      "The engine only recommends composite indexes",
      "Primary key columns are never used in WHERE clauses",
    ],
    answer: 1,
    explanation: "SQLite automatically creates an index for the primary key. Recommending another index on the same column(s) would waste storage and write overhead without any benefit.",
  },
  {
    id: 10,
    q: "A query has ORDER BY order_date. How many points does this contribute to the index score?",
    options: ["45 points", "35 points", "25 points", "15 points"],
    answer: 3,
    explanation: "ORDER BY columns are scored at +15 points. Equality filters score +45, join columns +35, range filters +25. ORDER BY benefits from an index (avoids a sort step) but is less critical than filters.",
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
    explanation: "A covering index includes all columns the query needs (in SELECT, WHERE, ORDER BY). SQLite can answer the query entirely from the index without touching the main table rows — the fastest possible access.",
  },
  {
    id: 12,
    q: "Which score threshold gives 'high' confidence in this engine?",
    options: ["Score ≥ 25", "Score ≥ 35", "Score ≥ 50", "Score ≥ 65"],
    answer: 3,
    explanation: "The engine assigns confidence as: high (score ≥ 65), medium (score ≥ 35), low (below 35). A composite predicate candidate starts at +65, which is why composite recommendations often have high confidence.",
  },
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
            <h1 className="kt-page-title">Knowledge Test</h1>
            <p className="kt-page-sub">Test your understanding of database indexing concepts.</p>
          </div>
          <div className="kt-progress-info">
            <span className="kt-q-counter">Question {current + 1} of {total}</span>
            <div className="kt-progress-bar-wrap">
              <div className="kt-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

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
