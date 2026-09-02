import { EXAMPLES } from "../examples";

const STATS = [
  { icon: "🗄️", value: "5+",  label: "Query Examples",      note: "Ready to analyze" },
  { icon: "⚡", value: "4",   label: "Visualization Modes",  note: "Interactive" },
  { icon: "📚", value: "16",  label: "Core Concepts",        note: "In Learn section" },
  { icon: "🌲", value: "B+",  label: "Tree Traversal",       note: "Animated" },
  { icon: "🔍", value: "100%", label: "Rule-Based Engine",   note: "Transparent" },
];

const HOW_STEPS = [
  { icon: "✏️", label: "Write SQL" },
  { icon: "⚙️", label: "Parse Query" },
  { icon: "🔎", label: "Detect Patterns" },
  { icon: "🗂️", label: "Check Indexes" },
  { icon: "💡", label: "Recommend" },
  { icon: "📊", label: "Visualize" },
];

const EXPLORE_CARDS = [
  { icon: "🔬", name: "Query Analyzer",       desc: "Enter any SELECT query and get instant index recommendations with explanations.", view: "analyze" },
  { icon: "💡", name: "Index Recommendations", desc: "See exactly which index to create, why it helps, and the CREATE INDEX SQL.", view: "analyze" },
  { icon: "🌲", name: "B+ Tree Visualization", desc: "Watch an animated B+ tree traversal to understand how indexes find data.", view: "visualize" },
  { icon: "📋", name: "Query Execution Flow",  desc: "Step through the 6-stage analysis pipeline from SQL to recommendation.", view: "visualize" },
  { icon: "📊", name: "Query Plan Comparison", desc: "Compare the current SQLite query plan against the proposed indexed path.", view: "visualize" },
  { icon: "📖", name: "Learn Concepts",        desc: "16 beginner-friendly explanations of indexing, B+ trees, and query plans.", view: "learn" },
];

export default function HomeView({ onNavigate }) {
  return (
    <div className="home-view view active">
      <div className="home-inner">

        {/* Hero */}
        <section className="hero">
          <div>
            <div className="hero-eyebrow">
              <span>🗄️</span> SQLite Index Intelligence
            </div>
            <h1 className="hero-title">
              Index<br />
              <span>Recommendation</span><br />
              Engine
            </h1>
            <p className="hero-sub">
              Understand how databases choose indexes — then see the impact for yourself.
              Enter a SQL query, get a rule-based recommendation, and explore interactive visualizations.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => onNavigate("analyze")}>
                ▶ Analyze a Query
              </button>
              <button className="btn-secondary" onClick={() => onNavigate("learn")}>
                📖 Explore Concepts
              </button>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-db-ring" />
            <div className="hero-db-ring2" />
            <div className="hero-db-core">🗄️</div>
            <div className="hero-node">⚡</div>
            <div className="hero-node">🌲</div>
            <div className="hero-node">🔍</div>
            <div className="hero-node">📊</div>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-row">
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-note">{s.note}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <section className="hiw">
          <div className="hiw-title-row">
            <div>
              <p className="eyebrow">Pipeline</p>
              <h2 className="section-title">How it works</h2>
            </div>
          </div>
          <div className="hiw-steps">
            {HOW_STEPS.map((s) => (
              <div className="hiw-step" key={s.label}>
                <div className="hiw-num">{s.icon}</div>
                <div className="hiw-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Explore */}
        <section className="explore">
          <p className="eyebrow">Features</p>
          <h2 className="section-title">What you can explore</h2>
          <div className="explore-grid">
            {EXPLORE_CARDS.map((c) => (
              <div
                className="explore-card"
                key={c.name}
                onClick={() => onNavigate(c.view)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onNavigate(c.view)}
              >
                <div className="explore-icon">{c.icon}</div>
                <div className="explore-name">{c.name}</div>
                <div className="explore-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Try examples */}
        <section className="try-section">
          <h2 className="try-title">Try a real example</h2>
          <p className="try-sub">Click any query to open it in the analyzer.</p>
          <div className="try-examples">
            {EXAMPLES.slice(0, 4).map((ex) => (
              <div
                className="try-card"
                key={ex.label}
                onClick={() => onNavigate("analyze", ex.query)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onNavigate("analyze", ex.query)}
              >
                <div className="try-card-label">{ex.label}</div>
                <div className="try-card-query">{ex.query}</div>
                <div className="try-card-desc">{ex.description}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
