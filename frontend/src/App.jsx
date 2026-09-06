import { useEffect, useState } from "react";
import {
  BarChart3,
  Beaker,
  BookOpen,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  FileCode2,
  GraduationCap,
  History,
  Home,
  Info,
  Menu,
  Moon,
  Sparkles,
  Sun,
  TestTube2,
  Users,
  X,
} from "lucide-react";

import { analyzeQuery, getSchema, saveHistory } from "./api";
import AnalysisPanel from "./components/AnalysisPanel";
import AnalysisSteps from "./components/AnalysisSteps";
import ExportButton from "./components/ExportButton";
import RecommendationPanel from "./components/RecommendationPanel";
import SchemaPanel from "./components/SchemaPanel";
import VisualizationsPanel from "./components/VisualizationsPanel";
import { EXAMPLES } from "./examples";
import AiTutorView from "./views/AiTutorView";
import AlgorithmView from "./views/AlgorithmView";
import DoubtSolverView from "./views/DoubtSolverView";
import DevelopedByView from "./views/DevelopedByView";
import ExamplesView from "./views/ExamplesView";
import HistoryView from "./views/HistoryView";
import HomeView from "./views/HomeView";
import KnowledgeTestView from "./views/KnowledgeTestView";
import LearnView from "./views/LearnView";
import LimitationsView from "./views/LimitationsView";
import TestingView from "./views/TestingView";
import AiUsageView from "./views/AiUsageView";
import UserManualView from "./views/UserManualView";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { id: "home", label: "Home", icon: Home },
      { id: "analyze", label: "Analyze", icon: Beaker },
      { id: "visualize", label: "Visualize", icon: BarChart3 },
    ],
  },
  {
    label: "Learn",
    items: [
      { id: "learn", label: "Learn", icon: BookOpen },
      { id: "examples", label: "Examples", icon: FileCode2 },
    ],
  },
  {
    label: "Practice",
    items: [
      { id: "test", label: "Knowledge Test", icon: GraduationCap },
      { id: "doubts", label: "Doubt Solver", icon: BrainCircuit },
      { id: "tutor", label: "AI Tutor", icon: Bot },
    ],
  },
  {
    label: "Project",
    items: [
      { id: "history", label: "History", icon: History },
      { id: "testing", label: "Testing", icon: TestTube2 },
      { id: "aiusage", label: "AI Usage", icon: Sparkles },
      { id: "algorithm", label: "Algorithm", icon: Code2 },
      { id: "limitations", label: "Limitations", icon: Info },
      { id: "developed", label: "Developed By", icon: Users },
    ],
  },
];

export default function App() {
  const [page, setPage]               = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [light, setLight]             = useState(false);
  const [query, setQuery]             = useState(EXAMPLES[3].query);
  const [schema, setSchema]           = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [result, setResult]           = useState(null);
  const [plan, setPlan]               = useState(null);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [vizTab, setVizTab]           = useState("flow");
  const [lineCount, setLineCount]     = useState(1);
  const [centerTab, setCenterTab]     = useState("results");
  const [inlineError, setInlineError] = useState("");

  useEffect(() => {
    getSchema().then(setSchema).catch((e) => setSchemaError(e.message));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light", light);
  }, [light]);

  useEffect(() => {
    setLineCount(query.split("\n").length || 1);
    const trimmed = query.trim();
    if (!trimmed) {
      setInlineError("Enter a SQL query before running analysis.");
    } else if (/^\s*(insert|update|delete|drop|alter|create)\b/i.test(trimmed)) {
      setInlineError("Only SELECT queries are allowed for analysis.");
    } else {
      setInlineError("");
    }
  }, [query]);

  function navigate(target, preloadQuery) {
    if (preloadQuery) setQuery(preloadQuery);
    setPage(target);
    setSidebarOpen(false);
  }

  function openDownloads() {
    navigate("analyze");
    window.setTimeout(() => document.querySelector(".export-row")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  async function runAnalysis() {
    if (inlineError) { setError(inlineError); return; }
    if (!query.trim()) { setError("Enter a SQL query before running analysis."); return; }
    setLoading(true); setError(""); setResult(null); setPlan(null);
    try {
      const [rec, planResult] = await analyzeQuery(query);
      setResult(rec); setPlan(planResult);
      saveHistory(rec, planResult).catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openHistoryEntry(entry) {
    setQuery(entry.query); setResult(entry.rec); setPlan(entry.plan);
    setError(""); setCenterTab("results"); setPage("analyze");
  }

  return (
    <div className={`shell lab-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}${sidebarOpen ? " sidebar-open" : ""}`}>
      <header className="mobile-header">
        <button className="mobile-nav-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-expanded={sidebarOpen} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <button className="mobile-brand" type="button" onClick={() => navigate("home")}>
          <span>IRE</span>
          <small>Index Recommendation Engine</small>
        </button>
      </header>

      <aside className="lab-sidebar" aria-label="Application navigation">
        <div className="sidebar-brand-row">
          <button className="sidebar-brand" type="button" onClick={() => navigate("home")} aria-label="Index Recommendation Engine home">
            <span className="sidebar-monogram">IRE</span>
            <span className="sidebar-brand-copy">Index Recommendation <strong>Engine</strong></span>
          </button>
          <button className="sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <div className="sidebar-status"><span /> Interactive DBMS laboratory</div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <section className="sidebar-group" key={group.label} aria-labelledby={`nav-${group.label}`}>
              <div className="sidebar-group-label" id={`nav-${group.label}`}>{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button className={`sidebar-link${page === item.id ? " active" : ""}`} type="button" key={item.id} onClick={() => navigate(item.id)} title={sidebarCollapsed ? item.label : undefined} aria-current={page === item.id ? "page" : undefined}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className={`sidebar-link${page === "manual" ? " active" : ""}`} type="button" onClick={() => navigate("manual")} title={sidebarCollapsed ? "Help" : undefined}>
            <CircleHelp size={17} strokeWidth={1.8} /><span>Help</span>
          </button>
          <button className="sidebar-link" type="button" onClick={openDownloads} title={sidebarCollapsed ? "Download" : undefined}>
            <Download size={17} strokeWidth={1.8} /><span>Download</span>
          </button>
          <button className="sidebar-link theme-control" type="button" onClick={() => setLight((value) => !value)} title={sidebarCollapsed ? (light ? "Night mode" : "Day mode") : undefined}>
            {light ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={17} strokeWidth={1.8} />}
            <span>{light ? "Night mode" : "Day mode"}</span>
          </button>
          <button className="sidebar-collapse" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            <span>Collapse</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="nav-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* ── WORKSPACE ── */}
      <main className="workspace">

        {page === "home" && <HomeView onNavigate={navigate} />}

        {page === "analyze" && (
          <div className="analyzer-view">
            <div className="az-left">
              <div className="pane-hdr">
                <span className="pane-title">SQL Editor</span>
                {result && (
                  <span className="pane-badge">
                    {result.recommendations.length} rec{result.recommendations.length !== 1 ? "s" : ""}
                  </span>
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
                  <button className="btn-clear" type="button"
                    onClick={() => { setQuery(""); setError(""); setResult(null); setPlan(null); }}>
                    Clear
                  </button>
                  <button className="btn-run" type="button" onClick={runAnalysis} disabled={loading || !!inlineError}>
                    {loading ? <><span className="spinner" /> Analyzing…</> : "▶ Run Analysis"}
                  </button>
                </div>
                {inlineError && <div className="inline-validation" role="status">{inlineError}</div>}
                {error && <div className="err-banner" role="alert">⚠ {error}</div>}
                <ExportButton query={query} result={result} plan={plan} schema={schema} />
              </div>
            </div>

            <div className="az-center">
              <div className="az-tabs">
                <button className={`az-tab${centerTab === "results"  ? " active" : ""}`} onClick={() => setCenterTab("results")}>Recommendations</button>
                <button className={`az-tab${centerTab === "steps"    ? " active" : ""}`} onClick={() => setCenterTab("steps")}>Analysis Steps</button>
                <button className={`az-tab${centerTab === "analysis" ? " active" : ""}`} onClick={() => setCenterTab("analysis")}>Query Analysis</button>
                <button className={`az-tab${centerTab === "viz"      ? " active" : ""}`} onClick={() => setCenterTab("viz")}>Visualizations</button>
              </div>
              <div className="az-content">
                {centerTab === "results" && (
                  loading ? (
                    <div className="az-loading"><span className="spinner" /> Analyzing query…</div>
                  ) : !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">⚡</div>
                      <div className="az-empty-title">Ready to analyze</div>
                      <div className="az-empty-desc">Enter a SELECT query and click Run Analysis.</div>
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
                      <div className="az-empty-desc">Run a query to walk through the step-by-step explanation.</div>
                    </div>
                  ) : (
                    <AnalysisSteps result={result} plan={plan} query={query} schema={schema} onGoViz={() => setCenterTab("viz")} />
                  )
                )}
                {centerTab === "analysis" && (
                  !result ? (
                    <div className="az-empty">
                      <div className="az-empty-icon">🔎</div>
                      <div className="az-empty-title">No analysis yet</div>
                      <div className="az-empty-desc">Run a query to see detected access patterns.</div>
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
                      <div className="az-empty-desc">Run a query first, then explore visualizations.</div>
                    </div>
                  ) : (
                    <VisualizationsPanel result={result} plan={plan} query={query} activeTab={vizTab} onTabChange={setVizTab} />
                  )
                )}
              </div>
            </div>

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
                  <button key={t.id} className={`viz-tab${vizTab === t.id ? " active" : ""}`}
                    onClick={() => setVizTab(t.id)} type="button">
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
                    Go to <button className="inline-link" onClick={() => setPage("analyze")}>Analyze</button>, run a query, then come back.
                  </div>
                </div>
              ) : (
                <VisualizationsPanel result={result} plan={plan} query={query} activeTab={vizTab} onTabChange={setVizTab} />
              )}
            </div>
          </div>
        )}

        {page === "history"     && <HistoryView onOpen={openHistoryEntry} />}
        {page === "learn"        && <LearnView />}
        {page === "algorithm"    && <AlgorithmView />}
        {page === "limitations"  && <LimitationsView />}
        {page === "test"     && <KnowledgeTestView />}
        {page === "doubts"   && <DoubtSolverView result={result} plan={plan} />}
        {page === "tutor"    && <AiTutorView result={result} plan={plan} onGoAnalyze={() => setPage("analyze")} />}
        {page === "examples" && <ExamplesView onOpen={(q) => navigate("analyze", q)} />}
        {page === "testing"  && <TestingView />}
        {page === "aiusage"  && <AiUsageView />}
        {page === "manual"   && <UserManualView onNavigate={navigate} />}
        {page === "developed" && <DevelopedByView />}

      </main>
    </div>
  );
}
