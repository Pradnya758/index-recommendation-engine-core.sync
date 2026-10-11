
import { useEffect, useRef, useState } from "react";

const STEP_META = [
  {
    icon: "📝",
    title: "SQL Input",
    why: "The engine starts by reading your exact query. Nothing is assumed.",
  },
  {
    icon: "🔍",
    title: "Query Parsing",
    why: "The SQL parser identifies the tables, conditions, joins, and sorting clauses in your query.",
  },
  {
    icon: "🧩",
    title: "Feature Extraction",
    why: "WHERE, JOIN, ORDER BY, and GROUP BY clauses reveal which columns may benefit from indexing.",
  },
  {
    icon: "🗂️",
    title: "Existing Index Check",
    why: "The engine checks existing indexes and primary keys to avoid recommending duplicate indexes.",
  },
  {
    icon: "⚙️",
    title: "Candidate Generation",
    why: "Possible indexes are generated from query features.",
  },
  {
    icon: "🔬",
    title: "Candidate Evaluation",
    why: "Each candidate is evaluated using SQLite query plans before and after a test index is added.",
  },
  {
    icon: "🏆",
    title: "Final Recommendation",
    why: "Recommendations are based on observed query-plan changes and existing-index coverage.",
  },
  {
    icon: "📈",
    title: "Visualization",
    why: "Explore how indexes can change query execution and compare query plans before and after an index.",
  },
];

const TOTAL = STEP_META.length;
const PLAY_INTERVAL = 3200;

function Tag({ children, color = "blue" }) {
  return <span className={`as-tag as-tag-${color}`}>{children}</span>;
}

function EmptyMessage({ children = "None detected." }) {
  return <span className="as-none">{children}</span>;
}

function FeatureRow({ label, items = [], color = "blue" }) {
  return (
    <div className="as-kv-row">
      <span className="as-kv-label">{label}</span>
      <div className="as-tag-row">
        {items.length > 0 ? (
          items.map((item, index) => (
            <Tag
              key={`${item.table}.${item.column}.${index}`}
              color={color}
            >
              {item.table}.{item.column}
            </Tag>
          ))
        ) : (
          <EmptyMessage />
        )}
      </div>
    </div>
  );
}

function CandidateStatus({ recommendation }) {
  return (
    <div className="as-tag-row">
      <Tag
        color={
          recommendation.recommendation === "recommended"
            ? "green"
            : "amber"
        }
      >
        {recommendation.recommendation ?? "Not evaluated"}
      </Tag>

      {recommendation.priority && (
        <Tag color="blue">
          Priority: {recommendation.priority}
        </Tag>
      )}
    </div>
  );
}

function StepBody({ step, result, plan, query, schema }) {
  const analysis = result?.analysis ?? {};
  const recommendations = result?.recommendations ?? [];
  const rejectedCandidates = result?.rejected_candidates ?? [];

  if (step === 0) {
    return (
      <div className="as-body">
        <pre className="as-sql-pre">{query}</pre>
        <p className="as-note">
          Only SELECT statements are accepted. Data-changing statements
          are rejected before analysis begins.
        </p>
      </div>
    );
  }

  if (step === 1) {
    const tables = analysis.tables ?? [];

    return (
      <div className="as-body">
        <div className="as-kv-row">
          <span className="as-kv-label">Tables referenced</span>
          <div className="as-tag-row">
            {tables.length > 0 ? (
              tables.map((table) => (
                <Tag key={table}>{table}</Tag>
              ))
            ) : (
              <EmptyMessage />
            )}
          </div>
        </div>

        <p className="as-note">
          The parser extracts the tables referenced by your SQL query.
        </p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="as-body">
        <FeatureRow
          label="WHERE equality"
          items={analysis.equality_filters ?? []}
          color="blue"
        />
        <FeatureRow
          label="WHERE range"
          items={analysis.range_filters ?? []}
          color="cyan"
        />
        <FeatureRow
          label="JOIN columns"
          items={analysis.join_columns ?? []}
          color="green"
        />
        <FeatureRow
          label="ORDER BY"
          items={analysis.order_by_columns ?? []}
          color="amber"
        />
        <FeatureRow
          label="GROUP BY"
          items={analysis.group_by_columns ?? []}
          color="purple"
        />

        <p className="as-note">
          These features are used to generate possible index candidates.
        </p>
      </div>
    );
  }

  if (step === 3) {
    const queryTables = new Set(analysis.tables ?? []);
    const relevantTables =
      schema?.tables?.filter((table) => queryTables.has(table.name)) ?? [];

    return (
      <div className="as-body">
        {relevantTables.length > 0 ? (
          relevantTables.map((table) => (
            <div className="as-kv-row" key={table.name}>
              <span className="as-kv-label">{table.name}</span>

              <div className="as-tag-row">
                {(table.indexes ?? []).map((index) => (
                  <Tag key={index.name} color="cyan">
                    {index.name} ({(index.columns ?? []).join(", ")})
                  </Tag>
                ))}

                {(table.primary_keys ?? []).length > 0 && (
                  <Tag color="amber">
                    PK: {table.primary_keys.join(", ")}
                  </Tag>
                )}

                {(table.indexes ?? []).length === 0 &&
                  (table.primary_keys ?? []).length === 0 && (
                    <EmptyMessage>
                      No existing indexes found.
                    </EmptyMessage>
                  )}
              </div>
            </div>
          ))
        ) : (
          <p className="as-note">
            No matching table information is available in the schema response.
          </p>
        )}

        {rejectedCandidates.length > 0 ? (
          <div className="as-rejected-list">
            <h4>Rejected candidates</h4>

            {rejectedCandidates.map((candidate, index) => (
              <div
                className="as-rejected-item"
                key={`${candidate.table}-${(candidate.columns ?? []).join("-")}-${index}`}
              >
                <span className="as-rejected-icon">✗</span>
                <span>
                  <strong>
                    {candidate.table}(
                    {(candidate.columns ?? []).join(", ")})
                  </strong>{" "}
                  — {candidate.reason}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="as-note">
            No candidates have been rejected for existing index coverage.
          </p>
        )}
      </div>
    );
  }

  if (step === 4) {
    const candidateFeatures = new Set([
      "equality_filter",
      "range_filter",
      "join",
      "join_column",
      "order_by",
      "group_by",
      "composite",
    ]);

    const seen = new Set();

    const candidates = recommendations.flatMap((recommendation) =>
      (recommendation.evidence ?? [])
        .filter((item) => candidateFeatures.has(item.feature))
        .filter((item) => {
          const key = `${item.table}.${item.column}.${item.feature}`;

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        })
    );

    return (
      <div className="as-body">
        {candidates.length > 0 ? (
          candidates.map((item, index) => (
            <div
              className="as-candidate-row"
              key={`${item.table}.${item.column}.${item.feature}.${index}`}
            >
              <Tag color="blue">
                {item.table}.{item.column}
              </Tag>
              <span className="as-candidate-reason">
                {item.detail}
              </span>
            </div>
          ))
        ) : (
          <p className="as-note">
            No surviving candidate features are available in the
            recommendation response. Candidates already covered by
            existing indexes may have been rejected.
          </p>
        )}

        {rejectedCandidates.length > 0 && (
          <p className="as-note">
            {rejectedCandidates.length} candidate(s) were rejected because
            an existing index already covers them.
          </p>
        )}
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="as-body">
        {recommendations.length > 0 ? (
          recommendations.map((recommendation, index) => (
            <div
              className="as-ranked-item"
              key={`${recommendation.table}-${(recommendation.columns ?? []).join("-")}-${index}`}
            >
              <div className="as-ranked-name">
                {recommendation.table}(
                {(recommendation.columns ?? []).join(", ")})
              </div>

              <CandidateStatus recommendation={recommendation} />

              <ul className="as-reason-list">
                {(recommendation.reasons ?? []).map((reason, reasonIndex) => (
                  <li key={`${reason}-${reasonIndex}`}>{reason}</li>
                ))}
              </ul>

              {(recommendation.evidence ?? []).length > 0 && (
                <>
                  <h4>Candidate evidence</h4>
                  <ul className="as-reason-list">
                    {recommendation.evidence.map((item, evidenceIndex) => (
                      <li
                        key={`${item.feature}-${item.table}-${item.column}-${evidenceIndex}`}
                      >
                        {item.detail}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="as-no-rec">
            <span className="as-no-rec-icon">ℹ️</span>
            <div>
              <strong>No new index candidates to evaluate.</strong>
              <p className="as-note">
                Check the rejected candidates for existing-index coverage.
              </p>
            </div>
          </div>
        )}

        <p className="as-note">
          The evidence comes from SQLite query plans before and after
          a candidate index is added in an isolated test database.
          A changed plan is evidence to examine, not a guarantee that
          every query will run faster.
        </p>
      </div>
    );
  }

  if (step === 6) {
    if (recommendations.length === 0) {
      return (
        <div className="as-body">
          <div className="as-no-rec">
            <span className="as-no-rec-icon">ℹ️</span>
            <div>
              <strong>No new index is recommended.</strong>
              <p className="as-note">
                This can happen when existing indexes cover the candidates
                or no candidate demonstrates a useful query-plan improvement.
              </p>
            </div>
          </div>

          {rejectedCandidates.map((candidate, index) => (
            <div
              className="as-rejected-item"
              key={`${candidate.table}-${(candidate.columns ?? []).join("-")}-${index}`}
            >
              <span className="as-rejected-icon">✗</span>
              <span>
                <strong>
                  {candidate.table}(
                  {(candidate.columns ?? []).join(", ")})
                </strong>{" "}
                — {candidate.reason}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="as-body">
        {recommendations.map((recommendation, index) => (
          <div
            className="as-final-card"
            key={`${recommendation.table}-${(recommendation.columns ?? []).join("-")}-${index}`}
          >
            <div className="as-final-hdr">
              <span className="as-final-name">
                {recommendation.table}(
                {(recommendation.columns ?? []).join(", ")})
              </span>

              <Tag
                color={
                  recommendation.recommendation === "recommended"
                    ? "green"
                    : "amber"
                }
              >
                {recommendation.recommendation ?? "Not evaluated"}
              </Tag>

              {recommendation.priority && (
                <span className="as-final-score">
                  {recommendation.priority}
                </span>
              )}
            </div>

            <div className="as-sql-label">CREATE INDEX</div>
            <pre className="as-sql-pre as-sql-sm">
              {recommendation.create_index_sql}
            </pre>

            <div className="as-sql-label">DROP INDEX</div>
            <pre className="as-sql-pre as-sql-sm">
              {recommendation.drop_index_sql}
            </pre>

            <h4>Why this helps</h4>
            {(recommendation.reasons ?? []).length > 0 ? (
              <ul className="as-reason-list">
                {recommendation.reasons.map((reason, reasonIndex) => (
                  <li key={`${reason}-${reasonIndex}`}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="as-note">
                No positive query-plan improvements were recorded in the
                recommendation reasons.
              </p>
            )}

            {(recommendation.evidence ?? []).length > 0 && (
              <>
                <h4>Query evidence</h4>
                <ul className="as-reason-list">
                  {recommendation.evidence.map((item, evidenceIndex) => (
                    <li
                      key={`${item.feature}-${item.table}-${item.column}-${evidenceIndex}`}
                    >
                      {item.detail}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}

        {rejectedCandidates.length > 0 && (
          <div className="as-rejected-list">
            <h4>Existing index coverage</h4>
            {rejectedCandidates.map((candidate, index) => (
              <div
                className="as-rejected-item"
                key={`${candidate.table}-${(candidate.columns ?? []).join("-")}-${index}`}
              >
                <span className="as-rejected-icon">✗</span>
                <span>
                  <strong>
                    {candidate.table}(
                    {(candidate.columns ?? []).join(", ")})
                  </strong>{" "}
                  — {candidate.reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 7) {
    const recommendation = recommendations[0];

    return (
      <div className="as-body">
        <div className="as-viz-grid">
          {[
            {
              icon: "⚡",
              title: "Execution Flow",
              desc: "Understand the stages of SQL processing: parsing, planning, and execution.",
            },
            {
              icon: "📋",
              title: "Table Scan",
              desc: recommendation
                ? `Inspect whether SQLite changed access to ${recommendation.table} from a table scan to an index search.`
                : "A table scan reads table rows to find matching records.",
            },
            {
              icon: "🌲",
              title: "B-Tree Index",
              desc: "SQLite indexes use B-tree structures to organize indexed values and support efficient lookups.",
            },
            {
              icon: "🔄",
              title: "Plan Comparison",
              desc: plan
                ? "Use the query-plan results to examine execution before and after a candidate index."
                : "Compare the actual query-plan evidence returned by the backend.",
            },
          ].map((item) => (
            <div className="as-viz-card" key={item.title}>
              <div className="as-viz-icon">{item.icon}</div>
              <div className="as-viz-title">{item.title}</div>
              <div className="as-viz-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        <p className="as-note">
          Open the dedicated Visualize page to interact with the diagrams and
          query-plan comparison.
        </p>
      </div>
    );
  }

  return null;
}

export default function AnalysisSteps({ result, plan, query, schema }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  function goTo(nextStep) {
    setStep(nextStep);
    setAnimKey((key) => key + 1);
  }

  function prev() {
    if (step > 0) {
      goTo(step - 1);
    }
  }

  function next() {
    if (step < TOTAL - 1) {
      goTo(step + 1);
    } else {
      setPlaying(false);
    }
  }

  function reset() {
    setPlaying(false);
    goTo(0);
  }

  useEffect(() => {
    if (!playing) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setStep((currentStep) => {
        if (currentStep >= TOTAL - 1) {
          setPlaying(false);
          return currentStep;
        }

        setAnimKey((key) => key + 1);
        return currentStep + 1;
      });
    }, PLAY_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [playing]);

  useEffect(() => {
    setPlaying(false);
    goTo(0);
  }, [result]);

  const meta = STEP_META[step];

  return (
    <div className="as-shell">
      <div className="as-timeline" role="list">
        {STEP_META.map((item, index) => (
          <button
            key={item.title}
            role="listitem"
            type="button"
            className={`as-tl-dot${
              index === step ? " active" : index < step ? " done" : ""
            }`}
            onClick={() => goTo(index)}
            title={item.title}
            aria-label={`Step ${index + 1}: ${item.title}`}
          >
            <span className="as-tl-icon">
              {index < step ? "✓" : item.icon}
            </span>
            <span className="as-tl-label">{item.title}</span>
          </button>
        ))}

        <div
          className="as-tl-progress"
          style={{ width: `${(step / (TOTAL - 1)) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="as-card" key={animKey}>
        <div className="as-card-hdr">
          <div className="as-step-badge">
            Step {step + 1} of {TOTAL}
          </div>

          <div className="as-card-title">
            <span className="as-card-icon">{meta.icon}</span>
            {meta.title}
          </div>

          <div className="as-why-box">
            <span className="as-why-label">Why this matters</span>
            <span className="as-why-text">{meta.why}</span>
          </div>
        </div>

        <StepBody
          step={step}
          result={result}
          plan={plan}
          query={query}
          schema={schema}
        />
      </div>

      <div className="as-controls">
        <button
          className="as-ctrl-btn"
          onClick={reset}
          title="Reset"
          type="button"
        >
          ⏮ Reset
        </button>

        <button
          className="as-ctrl-btn"
          onClick={prev}
          disabled={step === 0}
          type="button"
        >
          ◀ Prev
        </button>

        <button
          className={`as-ctrl-btn as-ctrl-play${playing ? " active" : ""}`}
          onClick={() => {
            if (step === TOTAL - 1 && !playing) {
              goTo(0);
            }
            setPlaying((current) => !current);
          }}
          type="button"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          className="as-ctrl-btn"
          onClick={next}
          disabled={step === TOTAL - 1}
          type="button"
        >
          Next ▶
        </button>

        <div className="as-ctrl-progress">
          {STEP_META.map((item, index) => (
            <span
              key={item.title}
              className={`as-ctrl-pip${
                index === step ? " active" : index < step ? " done" : ""
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
