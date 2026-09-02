import { useEffect, useRef } from "react";
import { EXAMPLES } from "../examples";

const METRICS = [
  { val: "5+",   valClass: "metric-val-accent", label: "Query Examples",     note: "Ready to run live" },
  { val: "4",    valClass: "metric-val-cyan",   label: "Visualization Modes", note: "Interactive" },
  { val: "16",   valClass: "metric-val-accent", label: "Learning Concepts",   note: "In Learn section" },
  { val: "100%", valClass: "metric-val-cyan",   label: "Rule-Based Engine",   note: "Transparent & deterministic" },
];

const PIPELINE = [
  { num: "01", icon: "✏️", label: "Input SQL",     desc: "Write or load a SELECT query" },
  { num: "02", icon: "⚙️", label: "Parse",         desc: "SQLGlot extracts structure" },
  { num: "03", icon: "🔎", label: "Detect",        desc: "WHERE, JOIN, ORDER BY, GROUP BY" },
  { num: "04", icon: "🗂️", label: "Score",         desc: "Candidates ranked by evidence" },
  { num: "05", icon: "💡", label: "Recommend",     desc: "Best index with CREATE SQL" },
  { num: "06", icon: "📊", label: "Visualize",     desc: "B+ tree, scan, plan comparison" },
];

const FEATURES = [
  {
    icon: "🔬", iconClass: "", name: "Query Analyzer",
    desc: "Enter any SELECT query and get instant, rule-based index recommendations with full explanations.",
    view: "analyze",
    preview: [
      { type: "kw", text: "SELECT" }, { type: "plain", text: " * " },
      { type: "kw", text: "FROM" }, { type: "plain", text: " orders " },
      { type: "kw", text: "WHERE" }, { type: "plain", text: " customer_id = " },
      { type: "val", text: "42" },
    ],
  },
  {
    icon: "💡", iconClass: "cyan-icon", name: "Index Recommendations",
    desc: "See exactly which index to create, why it helps, the score, confidence, and the CREATE INDEX SQL.",
    view: "analyze",
    preview: [
      { type: "comment", text: "-- Recommended" }, { type: "plain", text: "\n" },
      { type: "kw", text: "CREATE INDEX" }, { type: "plain", text: " idx\n  " },
      { type: "kw", text: "ON" }, { type: "plain", text: " orders(" },
      { type: "val", text: "customer_id" }, { type: "plain", text: ")" },
    ],
  },
  {
    icon: "🌲", iconClass: "", name: "B+ Tree Visualization",
    desc: "Watch an animated B+ tree traversal to understand how indexes find data without scanning every row.",
    view: "visualize",
    preview: [
      { type: "comment", text: "Root → Internal → Leaf" }, { type: "plain", text: "\n" },
      { type: "plain", text: "O(log n) lookup  " },
      { type: "val", text: "vs" }, { type: "plain", text: " O(n) scan" },
    ],
  },
  {
    icon: "📊", iconClass: "cyan-icon", name: "Query Plan Comparison",
    desc: "Compare the current SQLite EXPLAIN QUERY PLAN output against the proposed indexed execution path.",
    view: "visualize",
    preview: [
      { type: "comment", text: "-- Before" }, { type: "plain", text: "\n" },
      { type: "plain", text: "SCAN orders\n" },
      { type: "comment", text: "-- After (conceptual)" }, { type: "plain", text: "\n" },
      { type: "val", text: "SEARCH" }, { type: "plain", text: " USING INDEX" },
    ],
  },
  {
    icon: "📖", iconClass: "", name: "Learn Concepts",
    desc: "16 concise explanations of indexing, B+ trees, query plans, selectivity, and trade-offs.",
    view: "learn",
    preview: [
      { type: "val", text: "B+ Tree" }, { type: "plain", text: "  " },
      { type: "val", text: "Table Scan" }, { type: "plain", text: "\n" },
      { type: "val", text: "Composite" }, { type: "plain", text: "  " },
      { type: "val", text: "Selectivity" },
    ],
  },
  {
    icon: "✅", iconClass: "cyan-icon", name: "Knowledge Test",
    desc: "12 questions covering index concepts, scoring, B+ trees, and query plan interpretation.",
    view: "test",
    preview: [
      { type: "comment", text: "Q: What is a B+ tree?" }, { type: "plain", text: "\n" },
      { type: "plain", text: "A  B  " }, { type: "val", text: "C" }, { type: "plain", text: "  D\n" },
      { type: "val", text: "Score: 10/12" },
    ],
  },
];

/* ── Animated SVG network ── */
function DbNetwork() {
  const animRef = useRef(null);

  // Node positions: center + 6 satellites
  const cx = 240, cy = 200;
  const nodes = [
    { x: cx,       y: cy,       r: 36, label: "DB",    main: true },
    { x: cx,       y: cy - 130, r: 22, label: "SQL",   icon: "✏️" },
    { x: cx + 120, y: cy - 65,  r: 20, label: "IDX",   icon: "🗂️" },
    { x: cx + 120, y: cy + 65,  r: 20, label: "B+T",   icon: "🌲" },
    { x: cx,       y: cy + 130, r: 22, label: "PLAN",  icon: "📊" },
    { x: cx - 120, y: cy + 65,  r: 20, label: "SCAN",  icon: "📋" },
    { x: cx - 120, y: cy - 65,  r: 20, label: "REC",   icon: "💡" },
  ];

  const edges = [0,1,2,3,4,5,6].slice(1).map(i => ({ from: 0, to: i }));

  return (
    <div className="hero-visual" aria-hidden="true">
      <svg className="hero-svg" viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#4f46e5" />
          </radialGradient>
          <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(37,99,235,0.12)" />
            <stop offset="100%" stopColor="rgba(37,99,235,0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background glow */}
        <ellipse cx={cx} cy={cy} rx="180" ry="160" fill="url(#bgGlow)" />

        {/* Orbit rings */}
        <circle cx={cx} cy={cy} r="140" stroke="rgba(37,99,235,0.1)" strokeWidth="1" className="hero-orbit-1" />
        <circle cx={cx} cy={cy} r="100" stroke="rgba(6,182,212,0.08)" strokeWidth="1" strokeDasharray="3 7" className="hero-orbit-2" />

        {/* Connection lines */}
        {edges.map((e, i) => (
          <line
            key={i}
            x1={nodes[e.from].x} y1={nodes[e.from].y}
            x2={nodes[e.to].x}   y2={nodes[e.to].y}
            stroke="rgba(37,99,235,0.2)" strokeWidth="1"
            strokeDasharray="4 6"
            style={{ animation: `glowPulse ${2.5 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
          />
        ))}

        {/* Satellite nodes */}
        {nodes.slice(1).map((n, i) => (
          <g key={i} style={{ animation: `float ${3.5 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}>
            <circle cx={n.x} cy={n.y} r={n.r + 4} fill="rgba(37,99,235,0.06)" />
            <circle cx={n.x} cy={n.y} r={n.r} fill="#111e30" stroke="rgba(37,99,235,0.3)" strokeWidth="1.5" />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#8aafd8" fontFamily="Inter,sans-serif" fontWeight="600">{n.label}</text>
          </g>
        ))}

        {/* Core node */}
        <g style={{ animation: "float 4s ease-in-out infinite" }}>
          <circle cx={cx} cy={cy} r="48" fill="rgba(37,99,235,0.12)" />
          <circle cx={cx} cy={cy} r="40" fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.3)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="36" fill="url(#coreGrad)" filter="url(#glow)" />
          <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle" fontSize="18" fill="white">🗄️</text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="rgba(255,255,255,0.8)" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1">IRE</text>
        </g>

        {/* Animated particles on edges */}
        {edges.slice(0, 4).map((e, i) => {
          const x1 = nodes[e.from].x, y1 = nodes[e.from].y;
          const x2 = nodes[e.to].x,   y2 = nodes[e.to].y;
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return (
            <circle key={i} r="2.5" fill={i % 2 === 0 ? "#22d3ee" : "#60a5fa"}
              style={{ animation: `glowPulse ${1.8 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.6}s` }}
            >
              <animateMotion dur={`${2 + i * 0.5}s`} repeatCount="indefinite" begin={`${i * 0.7}s`}>
                <mpath href={`#path${i}`} />
              </animateMotion>
            </circle>
          );
        })}
        {edges.slice(0, 4).map((e, i) => (
          <path key={i} id={`path${i}`} d={`M${nodes[e.from].x},${nodes[e.from].y} L${nodes[e.to].x},${nodes[e.to].y}`} fill="none" />
        ))}
      </svg>
    </div>
  );
}

export default function HomeView({ onNavigate }) {
  return (
    <div className="home-view view active">
      <div className="home-inner">

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Interactive Database Lab · SQLite
            </div>
            <h1 className="hero-title">
              Index<br />
              <span className="hero-title-line2">Recommendation</span><br />
              Engine
            </h1>
            <p className="hero-statement">
              See how a database decides what to index.
            </p>
            <p className="hero-sub">
              Analyze a query, trace its execution, discover candidate indexes,
              and understand the decision visually — step by step.
            </p>
            <div className="hero-actions">
              <button className="hero-cta-primary" onClick={() => onNavigate("analyze")}>
                ⚡ Enter the Lab
              </button>
              <button className="hero-cta-secondary" onClick={() => onNavigate("learn")}>
                📖 Explore Concepts
              </button>
            </div>
          </div>
          <DbNetwork />
        </section>

        {/* ── Metrics ── */}
        <div className="metrics-strip">
          {METRICS.map((m) => (
            <div className="metric-cell" key={m.label}>
              <div className={`metric-val ${m.valClass}`}>{m.val}</div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-note">{m.note}</div>
            </div>
          ))}
        </div>

        {/* ── Pipeline ── */}
        <section className="pipeline-section">
          <div className="section-hdr">
            <div className="eyebrow eyebrow-accent">Analysis Pipeline</div>
            <h2 className="section-title">How it works</h2>
            <p className="section-sub">Six deterministic stages from SQL input to visual recommendation.</p>
          </div>
          <div className="pipeline-track">
            {PIPELINE.map((s) => (
              <div className="pipeline-step" key={s.num}>
                <div className="pipeline-num">{s.num}</div>
                <div className="pipeline-icon-wrap">{s.icon}</div>
                <div className="pipeline-label">{s.label}</div>
                <div className="pipeline-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="features-section">
          <div className="section-hdr">
            <div className="eyebrow eyebrow-cyan">Explore the Engine</div>
            <h2 className="section-title">What you can do</h2>
            <p className="section-sub">Click any panel to open it.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div
                className="feature-card"
                key={f.name}
                onClick={() => onNavigate(f.view)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onNavigate(f.view)}
              >
                <div className="feature-card-top">
                  <div className={`feature-icon-wrap ${f.iconClass}`}>{f.icon}</div>
                  <span className="feature-arrow">↗</span>
                </div>
                <div className="feature-name">{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
                <div className="feature-preview">
                  {f.preview.map((p, i) => {
                    if (p.type === "kw")      return <span key={i} className="feature-preview-kw">{p.text}</span>;
                    if (p.type === "val")     return <span key={i} className="feature-preview-val">{p.text}</span>;
                    if (p.type === "comment") return <span key={i} className="feature-preview-comment">{p.text}</span>;
                    return <span key={i}>{p.text}</span>;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Try examples ── */}
        <section className="try-section">
          <div className="try-section-hdr">
            <div className="eyebrow eyebrow-accent">Quick Start</div>
            <div className="try-title">Try a real example</div>
            <p className="try-sub">Click any query to open it in the analyzer and run it live against the backend.</p>
          </div>
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
