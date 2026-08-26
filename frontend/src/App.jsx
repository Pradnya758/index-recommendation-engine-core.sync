import { useEffect, useState } from "react";

import { analyzeQuery, getSchema } from "./api";
import AnalysisPanel from "./components/AnalysisPanel";
import RecommendationPanel from "./components/RecommendationPanel";
import SchemaPanel from "./components/SchemaPanel";
import VisualizationsPanel from "./components/VisualizationsPanel";
import { EXAMPLES } from "./examples";

const STARTER_QUERY = EXAMPLES[3].query;

export default function App() {
  const [query, setQuery] = useState(STARTER_QUERY);
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState("");
  const [result, setResult] = useState(null);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getSchema().then(setSchema).catch((requestError) => setSchemaError(requestError.message));
  }, []);

  async function runAnalysis() {
    if (!query.trim()) {
      setError("Enter a SELECT query before running analysis.");
      setResult(null);
      setPlan(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [recommendationResult, planResult] = await analyzeQuery(query);
      setResult(recommendationResult);
      setPlan(planResult);
    } catch (requestError) {
      setError(requestError.message);
      setResult(null);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  function loadExample(event) {
    const example = EXAMPLES.find((item) => item.label === event.target.value);
    if (example) {
      setQuery(example.query);
      setError("");
    }
  }

  return (
    <main className="app-shell">
      <aside className="command-panel">
        <a className="brand" href="#top"><span>IX</span><div>Index<small>recommendation engine</small></div></a>
        <div className="nav-label">Workspace</div>
        <div className="active-nav">Query analysis <b>01</b></div>
        <section className="input-section">
          <div className="section-heading"><div><p className="eyebrow">SQL workspace</p><h2>Test a query</h2></div></div>
          <label className="example-label" htmlFor="examples">Load a working example</label>
          <select id="examples" defaultValue="" onChange={loadExample}>
            <option value="" disabled>Select an example</option>
            {EXAMPLES.map((example) => <option value={example.label} key={example.label}>{example.label}</option>)}
          </select>
          <textarea aria-label="SQL query" value={query} onChange={(event) => setQuery(event.target.value)} spellCheck="false" />
          <div className="input-actions">
            <button className="clear-button" onClick={() => { setQuery(""); setError(""); setResult(null); setPlan(null); }}>Clear</button>
            <button className="run-button" onClick={runAnalysis} disabled={loading}>{loading ? "Analyzing..." : "Run analysis"}</button>
          </div>
          {error && <div className="error-message" role="alert">{error}</div>}
        </section>
        <div className="phase-note"><span>Phase 4</span><p>Rule-based analysis with educational execution and index visualizations.</p></div>
      </aside>

      <section className="content-panel" id="top">
        <header className="page-header">
          <div><p className="eyebrow">SQLite learning lab</p><h1>See which indexes your query <i>actually</i> needs.</h1></div>
          <div className="status-pill"><span /> Engine online</div>
        </header>
        <section className="results-section">
          <div className="section-heading"><div><p className="eyebrow">Recommendation output</p><h2>Index decisions</h2></div>{result && <span className="count-label">{result.recommendations.length} proposed</span>}</div>
          <RecommendationPanel result={result} loading={loading} />
        </section>
        <AnalysisPanel result={result} plan={plan} />
        <VisualizationsPanel result={result} plan={plan} query={query} />
      </section>

      <aside className="insight-panel">
        <SchemaPanel schema={schema} error={schemaError} />
        <section className="side-card read-note"><p className="eyebrow">How to read this</p><h2>Transparent rules</h2><p>The engine checks filters, joins, ordering, grouping, existing indexes, and primary keys before it proposes anything.</p></section>
      </aside>
    </main>
  );
}
