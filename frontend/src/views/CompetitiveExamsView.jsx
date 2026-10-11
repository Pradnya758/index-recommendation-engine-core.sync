import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

const EXAMS = [
  {
    id: "gate",
    title: "GATE CSE",
    subtitle: "Graduate Aptitude Test in Engineering",
    description: "DBMS, SQL, indexing and query optimization practice.",
    icon: GraduationCap,
    color: "blue",
    source: "https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html",
    subjects: ["DBMS & SQL", "Indexing & Query Plans", "Engine Testing"],
  },
  {
    id: "isro",
    title: "ISRO Computer Science",
    subtitle: "Scientist/Engineer recruitment",
    description: "Technical database and query optimization practice.",
    icon: Target,
    color: "purple",
    source: "https://www.isro.gov.in/ICRB_Recruitment13.html",
    subjects: ["DBMS & SQL", "Indexing & Query Plans", "Engine Testing"],
  },
  {
    id: "ugc-net",
    title: "UGC NET Computer Science",
    subtitle: "Computer Science and Applications",
    description: "DBMS, relational theory and query processing practice.",
    icon: BookOpen,
    color: "green",
    source: "https://ugcnet.nta.ac.in/",
    subjects: ["DBMS & SQL", "Indexing & Query Plans", "Engine Testing"],
  },
  {
    id: "nielit",
    title: "NIELIT / NIC Technical",
    subtitle: "Technical recruitment examinations",
    description: "Database fundamentals and backend testing practice.",
    icon: Award,
    color: "orange",
    source:
      "https://recruit-delhi.nielit.gov.in/PDF/STQC/Syllabus/Syllabus_for_ScientificAssiatant_CS.pdf",
    subjects: ["DBMS & SQL", "Indexing & Query Plans", "Engine Testing"],
  },
  {
    id: "psu-gate",
    title: "PSU Recruitment through GATE",
    subtitle: "GATE-based technical recruitment",
    description: "GATE-aligned database and query optimization practice.",
    icon: Trophy,
    color: "pink",
    source: "https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html",
    subjects: ["DBMS & SQL", "Indexing & Query Plans", "Engine Testing"],
  },
];

const q = (question, options, answer, explanation) => ({
  question,
  options,
  answer,
  explanation,
});

const BANKS = {
  gate: {
    "DBMS & SQL": [
      q(
        "Which clause filters groups after aggregation?",
        ["WHERE", "HAVING", "ORDER BY", "DISTINCT"],
        1,
        "HAVING filters grouped results after aggregation. WHERE filters rows before grouping."
      ),
      q(
        "A composite primary key contains (store_id, product_id). What uniquely identifies a row?",
        [
          "store_id alone in every case",
          "product_id alone in every case",
          "The combination of both columns",
          "A column's display name",
        ],
        2,
        "A composite key guarantees uniqueness for the combination of its columns."
      ),
      q(
        "Which normal form removes partial functional dependencies?",
        ["1NF", "2NF", "3NF", "4NF"],
        1,
        "Second Normal Form eliminates partial dependencies of non-prime attributes on candidate keys."
      ),
    ],
    "Indexing & Query Plans": [
      q(
        "A query filters by store_id and product_id. Which index is a reasonable candidate to test?",
        [
          "An index on an unrelated timestamp",
          "A composite index on (store_id, product_id)",
          "An index on an unused column",
          "No index can support equality predicates",
        ],
        1,
        "A composite index matching the predicates is a candidate, but its usefulness must be checked."
      ),
      q(
        "SQLite reports a table scan for a selective lookup. What should the engine do next?",
        [
          "Assume an index always helps",
          "Test a candidate and inspect query-plan evidence",
          "Delete the table",
          "Remove the WHERE clause",
        ],
        1,
        "The engine should test candidates and use database evidence instead of assuming an index helps."
      ),
      q(
        "An index contains (customer_id, order_date). Which query most directly matches its leftmost prefix?",
        [
          "WHERE customer_id = ?",
          "WHERE order_date = ? only",
          "WHERE product_name = ?",
          "A query with no relevant predicate",
        ],
        0,
        "A composite index can generally be used through its leading columns."
      ),
    ],
    "Engine Testing": [
      q(
        "What kind of test checks that an existing index prevents a redundant recommendation?",
        [
          "A behavior or regression test",
          "A CSS color test only",
          "A network speed test",
          "A screen resolution test",
        ],
        0,
        "The test verifies a defined behavior of the recommendation engine."
      ),
      q(
        "Which evidence best explains why an index recommendation changed after a code update?",
        [
          "Button color",
          "Candidate columns, existing indexes and query-plan output",
          "Browser zoom",
          "Desktop wallpaper",
        ],
        1,
        "These details explain the candidate evaluation and the resulting recommendation."
      ),
      q(
        "Why use a small controlled SQLite database in automated tests?",
        [
          "To make tests reproducible",
          "To guarantee every index improves every query",
          "To remove assertions",
          "To test another DBMS automatically",
        ],
        0,
        "Controlled test data makes results repeatable and easier to diagnose."
      ),
    ],
  },

  isro: {
    "DBMS & SQL": [
      q(
        "Which SQL clause filters product rows where stock_qty equals zero?",
        [
          "WHERE stock_qty = 0",
          "ORDER BY stock_qty",
          "GROUP BY stock_qty",
          "DISTINCT stock_qty",
        ],
        0,
        "WHERE filters individual rows using a condition."
      ),
      q(
        "Which column is suitable as a primary key for query history?",
        [
          "execution time that may repeat",
          "A unique, non-null query_id",
          "An optional explanation",
          "A non-unique status",
        ],
        1,
        "A primary key uniquely and non-nullably identifies each row."
      ),
      q(
        "A candidate index can have multiple explanation reasons. Which database design is preferable?",
        [
          "Store reasons in a related child table",
          "Combine every reason into a primary key",
          "Remove the candidate identifier",
          "Store the entire database as one string",
        ],
        0,
        "A child table models one-to-many relationships and keeps reasons queryable."
      ),
    ],
    "Indexing & Query Plans": [
      q(
        "What should be considered before indexing product_id for repeated lookups?",
        [
          "Query selectivity and existing indexes",
          "Adding indexes to every column",
          "Deleting the WHERE clause",
          "Renaming the column",
        ],
        0,
        "Index usefulness depends on query shape, selectivity, existing indexes and planner decisions."
      ),
      q(
        "An existing index already covers a proposed candidate. What should the engine do?",
        [
          "Recommend both without explanation",
          "Reject or flag the redundant candidate with a reason",
          "Drop the table",
          "Report a syntax error",
        ],
        1,
        "Redundancy checks prevent recommending indexes already covered by suitable existing indexes."
      ),
      q(
        "Which SQLite command displays a high-level description of a query plan?",
        [
          "EXPLAIN QUERY PLAN",
          "SHOW MEMORY",
          "DESCRIBE NETWORK",
          "COMPILE HTML",
        ],
        0,
        "EXPLAIN QUERY PLAN describes how SQLite plans to execute a query."
      ),
    ],
    "Engine Testing": [
      q(
        "A candidate-index experiment raises an exception. What is the robust response?",
        [
          "Always crash the entire API",
          "Record failed evidence and return a clear status",
          "Pretend the index improved performance",
          "Silently rewrite the SQL",
        ],
        1,
        "A failure should be clearly represented and not mistaken for successful evidence."
      ),
      q(
        "Which test checks that a primary-key-covered candidate is rejected?",
        [
          "A unit test for candidate rejection",
          "A DNS lookup",
          "A CSS snapshot only",
          "A test with no assertions",
        ],
        0,
        "A unit test should assert the rejection outcome and expected reason."
      ),
      q(
        "Why test both an API status code and its JSON response?",
        [
          "To verify the status and response contract",
          "Because JSON has no structure",
          "To avoid testing application logic",
          "To disable database constraints",
        ],
        0,
        "The status code and response payload are separate parts of the API contract."
      ),
    ],
  },

  "ugc-net": {
    "DBMS & SQL": [
      q(
        "Which relational operation selects rows satisfying a predicate?",
        ["Selection", "Projection", "Rename", "Cartesian product"],
        0,
        "Selection filters tuples using a predicate and corresponds to row filtering."
      ),
      q(
        "What does the functional dependency product_id → product_name mean?",
        [
          "product_id determines product_name",
          "Every product has many mandatory names",
          "product_name determines every table",
          "product_id must be a decimal number",
        ],
        0,
        "The value of product_id determines the associated product_name in the relation."
      ),
      q(
        "Which SQL operation combines rows from tables using a matching condition?",
        ["JOIN", "DROP", "ALTER", "COMMIT"],
        0,
        "JOIN combines rows from related tables using a join condition."
      ),
    ],
    "Indexing & Query Plans": [
      q(
        "Why can an index on a selective predicate improve query processing?",
        [
          "It may reduce the number of rows visited",
          "It guarantees zero disk I/O",
          "It changes the query's logical result",
          "It automatically normalizes tables",
        ],
        0,
        "An index may reduce the work needed to locate matching rows."
      ),
      q(
        "For an index on (A, B), which predicate most directly matches the leftmost prefix?",
        ["A = 10", "B = 10 only", "C = 10", "No relevant predicate"],
        0,
        "The index begins with A, so predicates using A can use its leading prefix."
      ),
      q(
        "Why can indexes make write operations more expensive?",
        [
          "Indexes must be maintained when rows change",
          "Indexes prevent all inserts",
          "Indexes remove constraints",
          "Indexes disable SQL parsing",
        ],
        0,
        "Inserts, updates and deletes may require index maintenance."
      ),
    ],
    "Engine Testing": [
      q(
        "A test compares engine results before and after a refactor. What is its purpose?",
        [
          "Detect regressions",
          "Increase network latency",
          "Change the syllabus",
          "Remove database constraints",
        ],
        0,
        "Regression tests check that previously correct behavior remains correct."
      ),
      q(
        "Which result best explains why an index was not recommended?",
        [
          "A specific rejection reason linked to evidence",
          "A generic failure message only",
          "A decorative icon",
          "The current time",
        ],
        0,
        "Explicit reasons make recommendation results understandable and auditable."
      ),
      q(
        "How can intermittent tests caused by unpredictable database state be improved?",
        [
          "Use isolated fixtures and deterministic setup",
          "Remove all assertions",
          "Depend on production data",
          "Randomize expected results",
        ],
        0,
        "Deterministic fixtures make tests more reliable and reproducible."
      ),
    ],
  },

  nielit: {
    "DBMS & SQL": [
      q(
        "Which constraint enforces uniqueness of values in a column?",
        ["UNIQUE", "ORDER BY", "LIKE", "LIMIT"],
        0,
        "UNIQUE enforces uniqueness; a primary key also requires non-nullability."
      ),
      q(
        "Which SQL statement changes existing row values?",
        ["UPDATE", "CREATE", "DROP", "ALTER"],
        0,
        "UPDATE modifies values in existing rows."
      ),
      q(
        "Which constraint can enforce a reference to a key in another table?",
        ["Foreign key", "HAVING", "DISTINCT", "ORDER BY"],
        0,
        "A foreign key enforces referential integrity when enabled and correctly configured."
      ),
    ],
    "Indexing & Query Plans": [
      q(
        "An API frequently searches query logs by created_at. What index is reasonable to evaluate?",
        [
          "An index on created_at",
          "An index on an unrelated description",
          "An index on a constant",
          "No index can help ordering",
        ],
        0,
        "An index matching filtering or ordering may help; inspect the actual query plan."
      ),
      q(
        "Why should an engine avoid automatically indexing every column?",
        [
          "Indexes consume storage and add write-maintenance cost",
          "Databases never use indexes",
          "Indexes invalidate SELECT",
          "Indexes change column data types",
        ],
        0,
        "Indexes have costs and should be justified by the workload."
      ),
      q(
        "A query filters by A and sorts by B. How should a composite index be selected?",
        [
          "Inspect predicates, ordering and query-plan evidence",
          "Always sort column names alphabetically",
          "Ignore the query",
          "Create random index combinations",
        ],
        0,
        "Index order should be evaluated against the actual query and verified using the planner."
      ),
    ],
    "Engine Testing": [
      q(
        "What should an API contract test verify for a JSON recommendation response?",
        [
          "Expected fields, types and status code",
          "Only the page background",
          "Monitor resolution",
          "That every query receives an index",
        ],
        0,
        "Contract tests verify that the API returns the expected structure and status."
      ),
      q(
        "Why test malformed SQL input?",
        [
          "To verify safe and clear invalid-input handling",
          "To guarantee malformed SQL is optimized",
          "To bypass validation",
          "To prove all queries are equivalent",
        ],
        0,
        "Invalid-input tests verify that the application handles bad requests robustly."
      ),
      q(
        "What fixture is useful for testing redundant-index detection?",
        [
          "A schema with a known index covering the candidate",
          "An empty database with no schema",
          "A homepage screenshot",
          "An unrelated network trace",
        ],
        0,
        "The test schema must contain an existing index that should cause candidate rejection."
      ),
    ],
  },

  "psu-gate": {
    "DBMS & SQL": [
      q(
        "Which clause filters groups after calculating COUNT(*)?",
        ["HAVING", "WHERE only", "VALUES", "ALTER"],
        0,
        "HAVING filters grouped results after aggregate functions are evaluated."
      ),
      q(
        "What does a foreign-key constraint enforce when enabled?",
        [
          "Referential integrity",
          "That every query is faster",
          "That all columns are unique",
          "That rows are sorted",
        ],
        0,
        "Foreign keys restrict references to valid keys, subject to NULL rules."
      ),
      q(
        "A transaction writes a recommendation and its evidence rows. Which ACID property makes the changes all-or-nothing?",
        ["Atomicity", "Availability", "Index selectivity", "Query ordering"],
        0,
        "Atomicity means all operations in the transaction succeed or are rolled back."
      ),
    ],
    "Indexing & Query Plans": [
      q(
        "A workload repeatedly filters by tenant_id and status. Which candidate should be tested?",
        [
          "A composite index on (tenant_id, status)",
          "An index on description",
          "An index on last_error",
          "An index on an unrelated table",
        ],
        0,
        "The composite index matches the two equality predicates, but actual planner evidence is still needed."
      ),
      q(
        "The query plan does not use a tested candidate index. What should the engine report?",
        [
          "The observed evidence without claiming a proven benefit",
          "A guaranteed speedup",
          "No query-plan information",
          "An automatically rewritten answer",
        ],
        0,
        "Recommendations should reflect observed database evidence rather than promise universal gains."
      ),
      q(
        "Why can a redundant index be undesirable?",
        [
          "It may add storage and write cost without useful additional access",
          "It improves every query automatically",
          "It removes the schema",
          "It changes SQL into NoSQL",
        ],
        0,
        "Redundant indexes can consume space and require maintenance without adding useful capability."
      ),
    ],
    "Engine Testing": [
      q(
        "A recommendation was tested on a database with only a few rows. What limitation should be noted?",
        [
          "Results may not predict performance on large workloads",
          "It proves universal speedup",
          "SQLite has no query planner",
          "The schema cannot have indexes",
        ],
        0,
        "Small test databases help functional testing but do not prove production-scale performance."
      ),
      q(
        "What is the strongest assertion for a duplicate-candidate rejection test?",
        [
          "The candidate is not recommended and a rejection reason is returned",
          "The program prints anything",
          "The page loads",
          "The timer starts",
        ],
        0,
        "The test should verify both the rejection and the reason for it."
      ),
      q(
        "Why compare index experiments using the same query and comparable database state?",
        [
          "To make the comparison controlled",
          "To make results incomparable",
          "To remove the need for query plans",
          "To ensure every index wins",
        ],
        0,
        "Comparable conditions help isolate the effect of the index change."
      ),
    ],
  },
};

const EXAM_DURATION_MINUTES = 10;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

export default function CompetitiveExamsView() {
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(
    EXAM_DURATION_MINUTES * 60
  );
  const [testStarted, setTestStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [showReview, setShowReview] = useState(true);

  useEffect(() => {
    if (!testStarted || submitted) return undefined;

    const timer = window.setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          setTestStarted(false);
          setSubmitted(true);
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [testStarted, submitted]);

  const score = useMemo(
    () =>
      testQuestions.reduce(
        (total, question, index) =>
          total + (checkedAnswers[index] === question.answer ? 1 : 0),
        0
      ),
    [testQuestions, checkedAnswers]
  );

  const correctCount = testQuestions.filter(
    (question, index) => checkedAnswers[index] === question.answer
  ).length;

  const incorrectCount = testQuestions.filter(
    (question, index) =>
      checkedAnswers[index] !== undefined &&
      checkedAnswers[index] !== question.answer
  ).length;

  const unansweredCount =
    testQuestions.length - correctCount - incorrectCount;

  function startTest(exam, subject) {
    setSelectedExam(exam);
    setSelectedSubject(subject);
    setTestQuestions(BANKS[exam.id][subject]);
    setAnswers({});
    setCheckedAnswers({});
    setCurrentQuestion(0);
    setRemainingSeconds(EXAM_DURATION_MINUTES * 60);
    setSubmitted(false);
    setShowReview(true);
    setTestStarted(true);
  }

  function checkAnswer(index = currentQuestion) {
    if (answers[index] === undefined) return;

    setCheckedAnswers((previous) => ({
      ...previous,
      [index]: answers[index],
    }));
  }

  function submitTest() {
    if (!testStarted || submitted) return;

    const finalAnswers = { ...checkedAnswers };

    // Automatically check the current question if it has a selected answer.
    if (answers[currentQuestion] !== undefined) {
      finalAnswers[currentQuestion] = answers[currentQuestion];
    }

    setCheckedAnswers(finalAnswers);
    setTestStarted(false);
    setSubmitted(true);

    const correct = testQuestions.filter(
      (question, index) => finalAnswers[index] === question.answer
    ).length;

    const incorrect = testQuestions.filter(
      (question, index) =>
        finalAnswers[index] !== undefined &&
        finalAnswers[index] !== question.answer
    ).length;

    setAttempts((previous) => [
      {
        id: `${Date.now()}-${selectedExam.id}-${selectedSubject}`,
        exam: selectedExam.title,
        subject: selectedSubject,
        score: correct,
        total: testQuestions.length,
        date: new Date().toLocaleString(),
      },
      ...previous,
    ].slice(0, 8));
  }

  function backToExams() {
    setSelectedExam(null);
    setSelectedSubject(null);
    setTestQuestions([]);
    setAnswers({});
    setCheckedAnswers({});
    setCurrentQuestion(0);
    setTestStarted(false);
    setSubmitted(false);
  }

  function restartTest() {
    if (selectedExam && selectedSubject) {
      startTest(selectedExam, selectedSubject);
    }
  }

  if (submitted) {
    return (
      <div className="ce-page">
        <div className="ce-topbar">
          <button
            className="ce-button ce-button-secondary"
            onClick={backToExams}
          >
            <ArrowLeft size={16} /> All exams
          </button>
          <span className="ce-chip">RESULTS</span>
        </div>

        <section className="ce-results-hero">
          <div className="ce-hero-icon">
            <Trophy size={30} />
          </div>
          <span className="ce-eyebrow">PRACTICE COMPLETE</span>
          <h1>{selectedExam?.title}</h1>
          <p>{selectedSubject}</p>
          <div className="ce-score-number">
            {score}
            <span> / {testQuestions.length}</span>
          </div>
          <p>
            {Math.round((score / Math.max(testQuestions.length, 1)) * 100)}%
            score
          </p>
        </section>

        <div className="ce-stats-grid">
          <div className="ce-stat-card">
            <CheckCircle2 size={20} />
            <strong>{correctCount}</strong>
            <span>Correct</span>
          </div>
          <div className="ce-stat-card">
            <XCircle size={20} />
            <strong>{incorrectCount}</strong>
            <span>Incorrect</span>
          </div>
          <div className="ce-stat-card">
            <Target size={20} />
            <strong>{unansweredCount}</strong>
            <span>Unanswered</span>
          </div>
        </div>

        <section className="ce-section">
          <div className="ce-section-heading">
            <div>
              <h2>Answer review</h2>
              <p>Compare your answers with the correct answers and explanations.</p>
            </div>
            <button
              className="ce-button ce-button-secondary"
              onClick={() => setShowReview((value) => !value)}
            >
              {showReview ? "Hide review" : "Show review"}
            </button>
          </div>

          {showReview && (
            <div className="ce-review-list">
              {testQuestions.map((question, index) => {
                const picked = checkedAnswers[index];
                const isCorrect =
                  picked !== undefined && picked === question.answer;

                return (
                  <article
                    className="ce-review-card"
                    key={`${index}-${question.question}`}
                  >
                    <div className="ce-review-status">
                      {isCorrect ? (
                        <CheckCircle2 size={18} />
                      ) : picked === undefined ? (
                        <Target size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Question {index + 1} ·{" "}
                      {isCorrect
                        ? "Correct"
                        : picked === undefined
                        ? "Unanswered"
                        : "Incorrect"}
                    </div>

                    <h3>{question.question}</h3>
                    <p>
                      <strong>Your answer:</strong>{" "}
                      {picked === undefined
                        ? "Not answered"
                        : question.options[picked]}
                    </p>
                    <p>
                      <strong>Correct answer:</strong>{" "}
                      {question.options[question.answer]}
                    </p>
                    <div className="ce-explanation">
                      {question.explanation}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="ce-section">
          <div className="ce-section-heading">
            <div>
              <h2>Recent attempts</h2>
              <p>Your latest results in this session.</p>
            </div>
          </div>

          {attempts.map((attempt) => (
            <div className="ce-attempt-row" key={attempt.id}>
              <div>
                <strong>{attempt.exam}</strong>
                <p>
                  {attempt.subject} · {attempt.date}
                </p>
              </div>
              <strong>
                {attempt.score}/{attempt.total}
              </strong>
            </div>
          ))}
        </section>

        <div className="ce-action-row">
          <button
            className="ce-button ce-button-primary"
            onClick={restartTest}
          >
            <RotateCcw size={16} /> Try again
          </button>
          <button
            className="ce-button ce-button-secondary"
            onClick={backToExams}
          >
            Choose another exam <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (testStarted && testQuestions.length > 0) {
    const question = testQuestions[currentQuestion];
    const chosen = answers[currentQuestion];
    const checked = checkedAnswers[currentQuestion];

    return (
      <div className="ce-page">
        <div className="ce-topbar">
          <button
            className="ce-button ce-button-secondary"
            onClick={submitTest}
          >
            Finish test
          </button>
          <span
            className={`ce-timer ${
              remainingSeconds <= 60 ? "ce-timer-warning" : ""
            }`}
          >
            <Clock3 size={16} /> {formatTime(remainingSeconds)}
          </span>
        </div>

        <section className="ce-test-hero">
          <span className="ce-eyebrow">
            {selectedExam.title} · {selectedSubject}
          </span>
          <h1>Practice test</h1>
          <p>
            Choose an answer and select Check answer to see feedback. Finish
            the test to view your score.
          </p>
          <div className="ce-progress-track">
            <div
              className="ce-progress-fill"
              style={{
                width: `${
                  ((currentQuestion + 1) / testQuestions.length) * 100
                }%`,
              }}
            />
          </div>
          <div className="ce-progress-label">
            <span>
              Question {currentQuestion + 1} of {testQuestions.length}
            </span>
            <span>{Object.keys(answers).length} selected</span>
          </div>
        </section>

        <section className="ce-question-card">
          <div className="ce-question-kicker">
            QUESTION {currentQuestion + 1}
          </div>
          <h2>{question.question}</h2>

          <div className="ce-options-list">
            {question.options.map((option, optionIndex) => {
              const isSelected = chosen === optionIndex;
              const isCorrectOption =
                checked !== undefined && optionIndex === question.answer;
              const isWrongSelected =
                checked !== undefined &&
                isSelected &&
                optionIndex !== question.answer;

              return (
                <button
                  key={option}
                  className={`ce-option ${isSelected ? "selected" : ""} ${
                    isCorrectOption ? "correct" : ""
                  } ${isWrongSelected ? "incorrect" : ""}`}
                  onClick={() => {
                    if (checked !== undefined) return;

                    setAnswers((previous) => ({
                      ...previous,
                      [currentQuestion]: optionIndex,
                    }));
                  }}
                >
                  <span className="ce-option-letter">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span>{option}</span>
                  {isCorrectOption && <CheckCircle2 size={18} />}
                  {isWrongSelected && <XCircle size={18} />}
                </button>
              );
            })}
          </div>

          {checked !== undefined && (
            <div
              className={`ce-feedback ${
                checked === question.answer
                  ? "ce-feedback-correct"
                  : "ce-feedback-incorrect"
              }`}
            >
              <strong>
                {checked === question.answer ? "Correct answer" : "Not quite"}
              </strong>
              <p>{question.explanation}</p>
            </div>
          )}

          <div className="ce-question-actions">
            <button
              className="ce-button ce-button-secondary"
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion((value) => Math.max(0, value - 1))
              }
            >
              <ArrowLeft size={16} /> Previous
            </button>

            <button
              className="ce-button ce-button-secondary"
              disabled={chosen === undefined || checked !== undefined}
              onClick={() => checkAnswer()}
            >
              <CheckCircle2 size={16} /> Check answer
            </button>

            {currentQuestion < testQuestions.length - 1 ? (
              <button
                className="ce-button ce-button-primary"
                onClick={() =>
                  setCurrentQuestion((value) =>
                    Math.min(testQuestions.length - 1, value + 1)
                  )
                }
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="ce-button ce-button-primary"
                onClick={submitTest}
              >
                Submit test <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>

        <section className="ce-section">
          <div className="ce-section-heading">
            <div>
              <h2>Question navigator</h2>
              <p>Move between questions before finishing.</p>
            </div>
          </div>

          <div className="ce-question-navigator">
            {testQuestions.map((_, index) => (
              <button
                key={index}
                className={`ce-question-number ${
                  currentQuestion === index ? "active" : ""
                } ${
                  checkedAnswers[index] !== undefined
                    ? "answered"
                    : answers[index] !== undefined
                    ? "selected"
                    : ""
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (selectedExam) {
    const Icon = selectedExam.icon;

    return (
      <div className="ce-page">
        <div className="ce-topbar">
          <button
            className="ce-button ce-button-secondary"
            onClick={backToExams}
          >
            <ArrowLeft size={16} /> All exams
          </button>
          <span className="ce-chip">EXAM PRACTICE</span>
        </div>

        <section className="ce-exam-hero">
          <div className="ce-exam-icon">
            <Icon size={30} />
          </div>
          <span className="ce-eyebrow">COMPETITIVE EXAMS</span>
          <h1>{selectedExam.title}</h1>
          <h2>{selectedExam.subtitle}</h2>
          <p>{selectedExam.description}</p>
          <p className="ce-source-note">
            Questions are adapted practice questions aligned with relevant
            topics, not verbatim official paper questions.
          </p>
          <a
            className="ce-source-link"
            href={selectedExam.source}
            target="_blank"
            rel="noreferrer"
          >
            Open official source <ArrowRight size={15} />
          </a>
        </section>

        <section className="ce-section">
          <div className="ce-section-heading">
            <div>
              <h2>Choose a subject</h2>
              <p>
                Each exam has its own question bank for these project-related
                topics.
              </p>
            </div>
          </div>

          <div className="ce-subject-grid">
            {selectedExam.subjects.map((subject) => (
              <button
                className="ce-subject-card"
                key={subject}
                onClick={() => startTest(selectedExam, subject)}
              >
                <BookOpen size={20} />
                <span>{subject}</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="ce-info-banner">
          <Clock3 size={20} />
          <div>
            <strong>Timed practice</strong>
            <p>
              Each practice test has a {EXAM_DURATION_MINUTES}-minute
              countdown. Check answers for explanations, navigate questions,
              and review results after submission.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="ce-page">
      <section className="ce-page-hero">
        <div className="ce-hero-icon">
          <GraduationCap size={30} />
        </div>
        <span className="ce-eyebrow">COMPETITIVE EXAM PREPARATION</span>
        <h1>Prepare. Practise. Progress.</h1>
        <p>
          Practice questions aligned with DBMS, SQL, indexing, query processing
          and software testing topics relevant to your Index Recommendation
          Engine project.
        </p>
      </section>

      <section className="ce-section">
        <div className="ce-section-heading">
          <div>
            <h2>Select an exam</h2>
            <p>
              Each exam uses its own question bank instead of repeating one
              common set of questions.
            </p>
          </div>
        </div>

        <div className="ce-exam-grid">
          {EXAMS.map((exam) => {
            const Icon = exam.icon;

            return (
              <button
                className={`ce-exam-card ce-exam-${exam.color}`}
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
              >
                <div className="ce-exam-card-icon">
                  <Icon size={23} />
                </div>
                <div className="ce-exam-card-copy">
                  <h3>{exam.title}</h3>
                  <p>{exam.subtitle}</p>
                  <span>{exam.subjects.length} project-related subjects</span>
                </div>
                <ArrowRight size={18} />
              </button>
            );
          })}
        </div>
      </section>

      {attempts.length > 0 && (
        <section className="ce-section">
          <div className="ce-section-heading">
            <div>
              <h2>Recent attempts</h2>
              <p>Results from this session.</p>
            </div>
          </div>

          {attempts.map((attempt) => (
            <div className="ce-attempt-row" key={attempt.id}>
              <div>
                <strong>{attempt.exam}</strong>
                <p>
                  {attempt.subject} · {attempt.date}
                </p>
              </div>
              <strong>
                {attempt.score}/{attempt.total}
              </strong>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}