import { useEffect, useRef, useState } from "react";

/* ── scoring constants mirrored from backend (display only) ── */
const SCORE_FACTORS = [
  { feature: "equality_filter", points: 45, label: "Equality filter" },
  { feature: "join",            points: 35, label: "Join column" },
  { feature: "range_filter",    points: 25, label: "Range filter" },
  { feature: "order_by",        points: 15, label: "ORDER BY" },
  { feature: "group_by",        points: 15, label: "GROUP BY" },
  { feature: "composite",       points: 65, label: "Composite predicate" },
];

const STEP_META = [
  { icon: "📝", title: "SQL Input",           why: "The engine starts by reading your exact query — nothing is assumed." },
  { icon: "🔍", title: "Query Parsing",        why: "SQLGlot parses the SQL into a structured tree so the engine can inspect every clause." },
  { icon: "🧩", title: "Feature Extraction",   why: "Each clause (WHERE, JOIN, ORDER BY, GROUP BY) signals a different access pattern that indexes can accelerate." },
  { icon: "🗂️", title: "Existing Index Check", why: "Creating a duplicate index wastes space and write overhead. The engine rejects any candidate already covered." },
  { icon: "⚙️", title: "Candidate Generation", why: "Every filtered, joined, or sorted column becomes a candidate. Equality columns are promoted to composite candidates when multiple appear together." },
  { icon: "📊", title: "Candidate Ranking",    why: "Candidates are scored by evidence strength. Higher scores mean the index would help more query patterns." },
  { icon: "🏆", title: "Final Recommendation", why: "The highest-scoring, non-duplicate candidate becomes the recommendation. Rejected candidates are shown for transparency." },
  { icon: "📈", title: "Visualization",        why: "The interactive diagrams show how the recommended index changes the execution path — from full table scan to index lookup." },
];

const TOTAL = STEP_META.length;
const PLAY_INTERVAL = 3200;

function Tag({ children, color }) {
  return <span className={`as-tag as-tag-${color || "blue"}`}>{children}</span>;
}

function StepBody({ step, result, plan, query, schema }) {
  const { analysis, recommendations, rejected_candidates } = result;

  if (step === 0) {
    return (
      <div className="as-body">
        <pre className="as-sql-pre">{query}</pre>
        <p className="as-note">Only SELECT statements are accepted. Data-changing statements are rejected before analysis begins.</p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="as-body">
        <div className="as-kv-row">
          <span className="as-kv-label">Tables referenced</span>
          <div className="as-tag-row">
            {analysis.tables.length
              ? analysis.tables.map((t) => <Tag key={t} color="blue">{t}</Tag>)
              : <span className="as-none">None detected</span>}
          </div>
        </div>
        <p className="as-note">SQLGlot walks the AST to find every table reference, alias, and subquery.</p>
      </div>
    );
  }

  if (step === 2) {
    const sections = [
      { label: "WHERE equality",  color: "blue",  items: analysis.equality_filters },
      { label: "WHERE range",     color: "cyan",  items: analysis.range_filters },
      { label: "JOIN columns",    color: "green", items: analysis.join_columns },
      { label: "ORDER BY",        color: "amber", items: analysis.order_by_columns },
      { label: "GROUP BY",        color: "purple",items: analysis.group_by_columns },
    ];
    return (
      <div className="as-body">
        {sections.map(({ label, color, items }) => (
          <div className="as-kv-row" key={label}>
            <span className="as-kv-label">{label}</span>
            <div className="as-tag-row">
              {items.length
                ? items.map((c) => <Tag key={`${c.table}.${c.column}`} color={color}>{c.table}.{c.column}</Tag>)
                : <span className="as-none">None</span>}
            </div>
          </div>
        ))}
        <p className="as-note">Each detected column becomes a candidate in the next step.</p>
      </div>
    );
  }

  if (step === 3) {
    const queryTables = new Set(analysis.tables);
    const relevantTables = schema?.tables?.filter((t) => queryTables.has(t.name)) ?? [];
    const allRejected = rejected_candidates;
    return (
      <div className="as-body">
        {relevantTables.map((tbl) => (
          <div className="as-kv-row" key={tbl.name}>
            <span className="as-kv-label">{tbl.name}</span>
            <div className="as-tag-row">
              {tbl.indexes.length
                ? tbl.indexes.map((idx) => (
                    <Tag key={idx.name} color="cyan">{idx.name} ({idx.columns.join(", ")})</Tag>
                  ))
                : <span className="as-none">No existing indexes</span>}
              {tbl.primary_keys.length > 0 && (
                <Tag color="amber">PK: {tbl.primary_keys.join(", ")}</Tag>
              )}
            </div>
          </div>
        ))}
        {allRejected.length > 0 && (
          <div className="as-rejected-list">
            {allRejected.map((r) => (
              <div className="as-rejected-item" key={`${r.table}-${r.columns.join("-")}`}>
                <span className="as-rejected-icon">✗</span>
                <span><strong>{r.table}({r.columns.join(", ")})</strong> — {r.reason}</span>
              </div>
            ))}
          </div>
        )}
        {allRejected.length === 0 && (
          <p className="as-note">No candidates were rejected — all are new and non-duplicate.</p>
        )}
      </div>
    );
  }

  if (step === 4) {
    const allEvidence = recommendations.flatMap((r) => r.evidence);
    const seen = new Set();
    const unique = allEvidence.filter((e) => {
      const k = `${e.table}.${e.column}.${e.feature}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    return (
      <div className="as-body">
        {unique.length === 0 && rejected_candidates.length > 0 && (
          <p className="as-note">All candidates were rejected by the existing index check — no new candidates remain.</p>
        )}
        {unique.map((e) => (
          <div className="as-candidate-row" key={`${e.table}.${e.column}.${e.feature}`}>
            <Tag color="blue">{e.table}.{e.column}</Tag>
            <span className="as-candidate-reason">{e.detail}</span>
          </div>
        ))}
        <p className="as-note">Equality columns that appear together are also promoted to a composite candidate.</p>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="as-body">
        <div className="as-score-table">
          <div className="as-score-hdr">
            <span>Evidence type</span><span>Points</span>
          </div>
          {SCORE_FACTORS.map((f) => (
            <div className="as-score-row" key={f.feature}>
              <span>{f.label}</span>
              <span className="as-score-pts">+{f.points}</span>
            </div>
          ))}
        </div>
        {recommendations.length > 0 && (
          <div className="as-ranked-list">
            {recommendations.map((r) => (
              <div className="as-ranked-item" key={`${r.table}-${r.columns.join("-")}`}>
                <div className="as-ranked-name">{r.table}({r.columns.join(", ")})</div>
                <div className="as-ranked-bar-wrap">
                  <div className="as-ranked-bar" style={{ width: `${Math.min(r.score, 100)}%` }} />
                </div>
                <div className="as-ranked-score">{r.score}</div>
              </div>
            ))}
          </div>
        )}
        <p className="as-note">Score is capped at 100. Composite candidates start at 65 and can accumulate additional evidence.</p>
      </div>
    );
  }

  if (step === 6) {
    if (recommendations.length === 0) {
      return (
        <div className="as-body">
          <div className="as-no-rec">
            <span className="as-no-rec-icon">✅</span>
            <div>
              <strong>No new index needed.</strong>
              <p className="as-note" style={{ marginTop: 4 }}>All candidates are already covered by existing indexes or primary keys.</p>
            </div>
          </div>
          {rejected_candidates.map((r) => (
            <div className="as-rejected-item" key={`${r.table}-${r.columns.join("-")}`}>
              <span className="as-rejected-icon">✗</span>
              <span>{r.reason}</span>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="as-body">
        {recommendations.map((rec) => (
          <div className="as-final-card" key={`${rec.table}-${rec.columns.join("-")}`}>
            <div className="as-final-hdr">
              <span className="as-final-name">{rec.table}.{rec.columns.join(", ")}</span>
              <span className={`conf-badge conf-${rec.confidence}`}>{rec.confidence}</span>
              <span className="as-final-score">score {rec.score}</span>
            </div>
            <pre className="as-sql-pre as-sql-sm">CREATE {rec.create_index_sql}</pre>
            <ul className="as-reason-list">
              {rec.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (step === 7) {
    const rec = recommendations[0];
    return (
      <div className="as-body">
        <div className="as-viz-grid">
          {[
            { icon: "⚡", title: "Execution Flow", desc: "Shows the query processing pipeline — parse → plan → execute — and where the index intercepts the scan." },
            { icon: "📋", title: "Table Scan",     desc: rec ? `Without the index, SQLite reads every row in ${rec.table}. With it, only matching rows are fetched.` : "Shows the difference between a full scan and an index lookup." },
            { icon: "🌲", title: "B+ Tree",        desc: "Illustrates how the index stores column values in sorted order for O(log n) lookup." },
            { icon: "🔄", title: "Plan Comparison",desc: "Compares the actual EXPLAIN QUERY PLAN output before and after the recommended index." },
          ].map((v) => (
            <div className="as-viz-card" key={v.title}>
              <div className="as-viz-icon">{v.icon}</div>
              <div className="as-viz-title">{v.title}</div>
              <div className="as-viz-desc">{v.desc}</div>
            </div>
          ))}
        </div>
        <p className="as-note">Open the dedicated Visualize page to interact with these diagrams.</p>
      </div>
    );
  }

  return null;
}

export default function AnalysisSteps({ result, plan, query, schema }) {
  const [step, setStep]       = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const timerRef              = useRef(null);

  function goTo(n) {
    setStep(n);
    setAnimKey((k) => k + 1);
  }

  function prev() { if (step > 0) goTo(step - 1); }
  function next() { if (step < TOTAL - 1) goTo(step + 1); else setPlaying(false); }
  function reset() { setPlaying(false); goTo(0); }

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep((s) => {
          if (s >= TOTAL - 1) { setPlaying(false); return s; }
          setAnimKey((k) => k + 1);
          return s + 1;
        });
      }, PLAY_INTERVAL);
    }
    return () => clearInterval(timerRef.current);
  }, [playing]);

  /* reset to step 0 when a new result arrives */
  useEffect(() => { goTo(0); }, [result]);

  const meta = STEP_META[step];

  return (
    <div className="as-shell">
      {/* ── timeline ── */}
      <div className="as-timeline" role="list">
        {STEP_META.map((m, i) => (
          <button
            key={i}
            role="listitem"
            type="button"
            className={`as-tl-dot${i === step ? " active" : i < step ? " done" : ""}`}
            onClick={() => goTo(i)}
            title={m.title}
            aria-label={`Step ${i + 1}: ${m.title}`}
          >
            <span className="as-tl-icon">{i < step ? "✓" : m.icon}</span>
            <span className="as-tl-label">{m.title}</span>
          </button>
        ))}
        <div
          className="as-tl-progress"
          style={{ width: `${(step / (TOTAL - 1)) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      {/* ── step card ── */}
      <div className="as-card" key={animKey}>
        <div className="as-card-hdr">
          <div className="as-step-badge">Step {step + 1} of {TOTAL}</div>
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

      {/* ── controls ── */}
      <div className="as-controls">
        <button className="as-ctrl-btn" onClick={reset} title="Reset" type="button">⏮ Reset</button>
        <button className="as-ctrl-btn" onClick={prev}  disabled={step === 0} type="button">◀ Prev</button>
        <button
          className={`as-ctrl-btn as-ctrl-play${playing ? " active" : ""}`}
          onClick={() => setPlaying((p) => !p)}
          type="button"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <button className="as-ctrl-btn" onClick={next} disabled={step === TOTAL - 1} type="button">Next ▶</button>
        <div className="as-ctrl-progress">
          {STEP_META.map((_, i) => (
            <span key={i} className={`as-ctrl-pip${i === step ? " active" : i < step ? " done" : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
