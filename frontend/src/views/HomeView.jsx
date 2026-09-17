import {
  ArrowRight,
  Bot,
  Braces,
  Database,
  GitBranch,
  Layers3,
  SearchCode,
} from "lucide-react";

const CAPABILITIES = [
  { icon: Database, label: "DBMS Concept" },
  { icon: GitBranch, label: "Interactive Visualizations" },
  { icon: Braces, label: "5+ Examples" },
  { icon: Layers3, label: "Step-by-Step Analysis" },
  { icon: Bot, label: "AI Tutor" },
  { icon: SearchCode, label: "Query Plan Analysis" },
];

function DbNetwork() {
  return (
    <div className="hero-visual db-hero-visual" aria-label="SQL query to index recommendation pipeline">
      <div className="db-orbit orbit-one" />
      <div className="db-orbit orbit-two" />
      <div className="sql-float-card">
        <span>SQL QUERY</span>
        <code>WHERE customer_id = 42</code>
      </div>
      <div className="database-stack" aria-hidden="true">
        <div className="database-disc disc-top"><Database size={30} /></div>
        <div className="database-disc disc-mid" />
        <div className="database-disc disc-base" />
        <div className="database-core">INDEX</div>
      </div>
      <div className="analysis-float-card">
        <span className="analysis-pulse" />
        <div><small>QUERY PLAN</small><strong>SEARCH USING INDEX</strong></div>
      </div>
      <div className="db-chip chip-tree">B+ TREE</div>
      <div className="db-chip chip-candidate">CANDIDATE INDEX</div>
      <div className="flow-caption">SQL <ArrowRight size={13} /> ANALYZE <ArrowRight size={13} /> RECOMMEND</div>
    </div>
  );
}

export default function HomeView({ onNavigate }) {
  return (
    <div className="home-view view active">
      <div className="home-inner">

        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Database Index Recommendation System
            </div>
            <h1 className="hero-title">
              Index Recommendation Engine
            </h1>
            <p className="hero-statement">
              Turn Your SQL Queries into <span className="hero-title-line2">Smarter Indexes</span>
            </p>
            <p className="hero-sub">
              Analyze SQL queries, discover suitable index candidates, and understand why they are recommended.
            </p>
            <div className="hero-actions">
              <button className="hero-cta-primary" onClick={() => onNavigate("analyze")}>
                Analyze a Query <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button className="hero-cta-secondary" onClick={() => onNavigate("visualize")}>
                Explore Visualizations
              </button>
            </div>
          </div>
          <DbNetwork />
        </section>

        <div className="capability-strip" aria-label="Project capabilities">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div className="capability-item" key={label}>
              <Icon size={17} strokeWidth={1.7} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="home-continuation">
          <div><span>01</span><strong>Read the query</strong></div>
          <ArrowRight size={16} />
          <div><span>02</span><strong>Inspect candidates</strong></div>
          <ArrowRight size={16} />
          <div><span>03</span><strong>Verify the plan</strong></div>
          <button type="button" onClick={() => onNavigate("learn")}>Open learning lab <ArrowRight size={15} /></button>
        </section>
      </div>
    </div>
  );
}
