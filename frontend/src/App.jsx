import { useEffect, useState } from "react";

import { analyzeQuery, getSchema, saveHistory } from "./api";
import AnalysisPanel from "./components/AnalysisPanel";
import AnalysisSteps from "./components/AnalysisSteps";
import ExportButton from "./components/ExportButton";
import RecommendationPanel from "./components/RecommendationPanel";
import SchemaPanel from "./components/SchemaPanel";
import VisualizationsPanel from "./components/VisualizationsPanel";
import { EXAMPLES } from "./examples";
import ExamplesView from "./views/ExamplesView";
import HistoryView from "./views/HistoryView";
import HomeView from "./views/HomeView";
import LearnView from "./views/LearnView";

const NAV = [
  { id: "home",      icon: "🏠", label: "Home" },
  { id: "analyze",   icon: "🔬", label: "Analyze" },
  { id: "visualize", icon: "📊", label: "Visualize" },
  { id: "learn",     icon: "📖", label: "Learn" },
  { id: "examples",  icon: "💡", label: "Examples" },
  { id: "history",   icon: "🕑", label: "History" },
];

export default function App() {
  const [page, setPage]           = useState("home");
  const [light, setLight]         = useState(false);
  const [query, setQuery]         = useState(EXAMPLES[3].query);
  const [schema, setSchema]       = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [result, setResult]       = useState(null);
  const [plan, setPlan]           = useState(null);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [vizTab, setVizTab]       = useState("flow");
  const [lineCount, setLineCount] = useState(1);
  const [centerTab, setCenterTab] = useState("results");

  useEffect(() => {
    getSchema().then(setSchema).catch((e) => setSchemaError(e.message));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light", light);
  }, [light]);

  useEffect(() => {
    setLineCount(query.split("\n").length || 1);
  }, [query]);

  async function runAnalysis() {
    if (!query.trim()) {
      setError("Enter a SELECT query before running analysis.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setPlan(null);
    try {
      const [rec, planResult] = await analyzeQuery(query);
      setResult(rec);
      setPlan(planResult);
      // persist to backend — fire-and-forget, don't block UI
      saveHistory(rec, planResult).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function navigate(target, preloadQuery) {
    if (preloadQuery) setQuery(preloadQuery);
    setPage(target);
  }

  // Restore a full analysis from a history entry
  function openHistoryEntry(entry) {
    setQuery(entry.query);
    setResult(entry.rec);
    setPlan(entry.plan);
    setError("");
    setCenterTab("results");
    setPage("analyze");
  }

  return (
    <div className="shell">
      {/* ── HEADER ── */}
      <header className="hdr">
        <a className="hdr-brand" href="#" onClick={(e) => { e.preventDefault(); setPage("home"); }}>
          <div className="hdr-logo">IRE</div>
          <div className="hdr-brand-text">
            <span className="hdr-brand-name">Index Rec. Engine</span>
            <span className="hdr-brand-sub">SQLite · Educational</span>
          </div>
        </a>
        <div className="hdr-center">
          <div className="hdr-status">
            <span className="hdr-dot" />
            Engine online
          </div>
        </div>
        <div className="hdr-right">
          <button
            className="hdr-theme-btn"
            type="button"
            onClick={() => setLight((v) => !v)}
            aria-label="Toggle theme"
          >
            {light ? "🌙 Dark" : "☀ Light"}
          </button>
        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="nav-group-label">Navigation</div>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-btn${page === item.id ? " active" : ""}`}
            onClick={() => setPage(item.id)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="sidebar-foot">
          <strong>Rule-based</strong> · No AI · Deterministic
        </div>
      </nav>

      {/* ── WORKSPACE ── */}
      <main className="workspace">

        {/* HOME */}
        {page === "home" && <HomeView onNavigate={navigate} />}

        {/* ANALYZE */}
        {page === "analyze" && (
          <div className="analyzer-view">
            {/* Left: SQL editor */}
            <div className="az-left">
              <div className="pane-hdr">
                <span className="pane-title">SQL Editor</span>
                {result && (
                  <span className="pane-badge">{result.recommendations.length} rec{result.recommendations.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              <div className="editor-body">
                <label className="editor-label" htmlFor="ex-select">Load example</label>
                <select
                  id="ex-select"
                  className="ex-select"
                  value=""
                  onChange={(e) => {
                    const ex = EXAMPLES.find((x) => x.label === e.target.value);
                    if (ex) { setQuery(ex.query); setError(""); }
                  }}
                >
                  <option value="" disabled>Select an example…</option>
                  {EXAMPLES.map((ex) => (
                    <option key={ex.label} value={ex.label}>{ex.label} — {ex.description}</option>
                  ))}
                </select>

                <div className="sql-wrap">
                  <div className="sql-lnums" aria-hidden="true">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div className="sql-lnum" key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    className="sql-ta"
                    aria-label="SQL query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    spellCheck="false"
                    placeholder="SELECT * FROM orders WHERE status = 'paid';"
                  />
                </div>

                <div className="editor-actions">
                  <button
                    className="btn-clear"
                    type="button"
                    onClick={() => { setQuery(""); setError(""); setResult(null); setPlan(null); }}
                  >
                    Clear
                  </button>
                  <button
                    className="btn-run"
                    type="button"
                    onClick={runAnalysis}
                    disabled={loading}
                  >
                    {loading ? <><span className="spinner" /> Analyzing…</> : "▶ Run Analysis"}
                  </button>
                </div>

                {error && (
                  <div className="err-banner" role="alert">⚠ {error}</div>
                )}

                {/* Export — shown below editor when result is ready */}
                <ExportButton query={query} result={result} plan={plan} />
              </div>
            </div>

            {/* Center: results */}
            <div className="az-center">
              <div className="az-tabs">
                <button className={`az-tab${centerTab === "results" ? " active" : ""}`} onClick={() => setCenterTab("results")}>Recommendations</button>
                <button className={`az-tab${centerTab === "steps" ? " active" : ""}`} onClick={() => setCenterTab("steps")}>Analysis Steps</button>
                <button className={`az-tab${centerTab === "analysis" ? " active" : ""}`} onClick={() => setCenterTab("analysis")}>Query Analysis</button>
                <button className={`az-tab${centerTab === "viz" ? " active" : ""}`} onClick={() => setCenterTab("viz")}>Visualizations</button>
              </div>
              <div className="az-content">
                {centerTab === "results" && (
                  loading ? (
                    <div className="az-loading"><span className="spinner" /> Analyzing query…</div>
                  ) : !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">⚡</div>
                      <div className="az-empty-title">Ready to analyze</div>
                      <div className="az-empty-desc">Enter a SELECT query in the editor and click Run Analysis to see index recommendations.</div>
                    </div>
                  ) : (
                    <RecommendationPanel result={result} loading={false} />
                  )
                )}
                {centerTab === "steps" && (
                  !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">🪜</div>
                      <div className="az-empty-title">No analysis yet</div>
                      <div className="az-empty-desc">Run a query to walk through the step-by-step explanation of how the recommendation was produced.</div>
                    </div>
                  ) : (
                    <AnalysisSteps
                      result={result}
                      plan={plan}
                      query={query}
                      schema={schema}
                      onGoViz={() => setCenterTab("viz")}
                    />
                  )
                )}
                {centerTab === "analysis" && (
                  !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">🔎</div>
                      <div className="az-empty-title">No analysis yet</div>
                      <div className="az-empty-desc">Run a query to see detected access patterns and the SQLite query plan.</div>
                    </div>
                  ) : (
                    <AnalysisPanel result={result} plan={plan} />
                  )
                )}
                {centerTab === "viz" && (
                  !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">📊</div>
                      <div className="az-empty-title">No visualization yet</div>
                      <div className="az-empty-desc">Run a query first, then explore the interactive visualizations here.</div>
                    </div>
                  ) : (
                    <VisualizationsPanel
                      result={result}
                      plan={plan}
                      query={query}
                      activeTab={vizTab}
                      onTabChange={setVizTab}
                    />
                  )
                )}
              </div>
            </div>

            {/* Right: schema + insight */}
            <div className="az-right">
              <div className="pane-hdr">
                <span className="pane-title">Schema & Insights</span>
              </div>
              <div className="rp-section">
                <SchemaPanel schema={schema} error={schemaError} />
              </div>
              <div className="rp-section">
                <div className="insight-card">
                  <div className="insight-title">How the engine decides</div>
                  <div className="insight-text">
                    The engine checks WHERE filters, JOIN columns, ORDER BY, and GROUP BY.
                    It scores candidates and rejects any already covered by a primary key or existing index.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISUALIZE */}
        {page === "visualize" && (
          <div className="viz-view">
            <div className="viz-hdr">
              <div className="viz-tabs">
                {[
                  { id: "flow", label: "Execution Flow" },
                  { id: "scan", label: "Table Scan" },
                  { id: "tree", label: "B+ Tree" },
                  { id: "comparison", label: "Plan Comparison" },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`viz-tab${vizTab === t.id ? " active" : ""}`}
                    onClick={() => setVizTab(t.id)}
                    type="button"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <span className="viz-badge">Educational models</span>
            </div>
            <div className="viz-body">
              {!result ? (
                <div className="viz-no-result">
                  <div className="viz-no-result-icon">📊</div>
                  <div className="viz-no-result-title">No query analyzed yet</div>
                  <div className="viz-no-result-desc">
                    Go to the <button className="inline-link" onClick={() => setPage("analyze")}>Analyze</button> page, run a query, then come back to explore visualizations.
                  </div>
                </div>
              ) : (
                <VisualizationsPanel
                  result={result}
                  plan={plan}
                  query={query}
                  activeTab={vizTab}
                  onTabChange={setVizTab}
                />
              )}
            </div>
          </div>
        )}

        {/* LEARN */}
        {page === "learn" && <LearnView />}

        {/* EXAMPLES */}
        {page === "examples" && <ExamplesView onOpen={(q) => navigate("analyze", q)} />}

        {/* HISTORY */}
        {page === "history" && (
          <HistoryView onOpen={openHistoryEntry} />
        )}

      </main>
    </div>
  );
}
