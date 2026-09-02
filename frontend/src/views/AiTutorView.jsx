import { useRef, useState } from "react";
import { askFollowup, explainAnalysis } from "../api";

const SECTIONS = [
  { key: "query_summary",         label: "What the query does",   icon: "📝" },
  { key: "features_detected",     label: "Features detected",     icon: "🧩" },
  { key: "why_this_index",        label: "Why this index?",       icon: "🏆" },
  { key: "simple_explanation",    label: "Simple explanation",    icon: "💡" },
  { key: "technical_explanation", label: "Technical explanation", icon: "⚙️" },
  { key: "tradeoffs",             label: "Trade-offs",            icon: "⚖️" },
  { key: "query_plan_meaning",    label: "Query plan meaning",    icon: "📋" },
];

const QUICK_PROMPTS = [
  { label: "Explain simply",       q: "Give me a simple beginner-friendly explanation of this recommendation." },
  { label: "Explain technically",  q: "Give me a detailed technical explanation of this recommendation." },
  { label: "Give an example",      q: "Give a concrete example of how this index would speed up a query." },
  { label: "Why does this matter?",q: "Why does this index recommendation matter for database performance?" },
  { label: "What are trade-offs?", q: "What are the trade-offs of adding this index?" },
  { label: "Column order?",        q: "Why is column order important in a composite index?" },
];

const GENERAL_PROMPTS = [
  "What is a database index?",
  "What does EXPLAIN QUERY PLAN mean?",
  "What is a B+ tree?",
  "When should I NOT add an index?",
  "What is a composite index?",
  "What is a table scan?",
];

function ExplainSection({ icon, label, text, open, onToggle }) {
  if (!text) return null;
  return (
    <div className={`ai-section${open ? " open" : ""}`}>
      <button className="ai-section-hdr" type="button" onClick={onToggle} aria-expanded={open}>
        <span className="ai-section-icon">{icon}</span>
        <span className="ai-section-label">{label}</span>
        <span className="ai-section-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="ai-section-body">
          {text.split("\n").map((line, i) =>
            line.trim() ? <p key={i} className="ai-section-line">{line}</p> : null
          )}
        </div>
      )}
    </div>
  );
}

export default function AiTutorView({ result, plan, onGoAnalyze }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [openSection, setOpenSection] = useState(null);
  const [question, setQuestion]       = useState("");
  const [answer, setAnswer]           = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [conversation, setConversation]   = useState([]);
  const inputRef = useRef(null);
  const answerRef = useRef(null);

  const hasContext = !!result;

  async function handleExplain() {
    if (!hasContext) return;
    setLoading(true);
    setError("");
    setExplanation(null);
    setOpenSection(null);
    try {
      const data = await explainAnalysis(result, plan);
      setExplanation(data);
      setOpenSection(SECTIONS[0].key);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAsk(q) {
    const text = (q ?? question).trim();
    if (!text) return;
    setAnswerLoading(true);
    const entry = { q: text, a: null };
    setConversation((prev) => [...prev, entry]);
    if (!q) setQuestion("");
    try {
      const data = await askFollowup(text, result ?? {}, plan ?? {});
      setConversation((prev) =>
        prev.map((e, i) => (i === prev.length - 1 ? { ...e, a: data.answer } : e))
      );
    } catch {
      setConversation((prev) =>
        prev.map((e, i) => (i === prev.length - 1 ? { ...e, a: "Could not get an answer. Please try again." } : e))
      );
    } finally {
      setAnswerLoading(false);
      setTimeout(() => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  }

  return (
    <div className="aitutor-view">
      <div className="aitutor-inner">

        {/* ── page header ── */}
        <div className="aitutor-page-hdr">
          <div className="aitutor-page-hdr-left">
            <div className="eyebrow">Educational · AI-assisted</div>
            <h1 className="aitutor-page-title">AI Tutor</h1>
            <p className="aitutor-page-sub">
              Ask questions about indexes, query plans, and recommendations.
              AI explains — the rule-based engine always decides.
            </p>
          </div>
          <div className="aitutor-page-hdr-right">
            {hasContext ? (
              <div className="aitutor-ctx-badge">
                <span className="aitutor-ctx-dot" />
                Analysis context loaded
              </div>
            ) : (
              <div className="aitutor-ctx-badge aitutor-ctx-none">
                No analysis context —{" "}
                <button className="inline-link" type="button" onClick={onGoAnalyze}>
                  run a query first
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="aitutor-layout">

          {/* ── left: explain panel ── */}
          <div className="aitutor-explain-col">
            <div className="aitutor-panel">
              <div className="aitutor-panel-hdr">
                <span className="aitutor-panel-title">🤖 Explain current analysis</span>
                {explanation && (
                  <span className={`ai-source-badge ai-source-${explanation.source}`}>
                    {explanation.source === "openai" ? "✦ AI" : "⚙ Local"}
                  </span>
                )}
              </div>

              {!hasContext && (
                <div className="aitutor-no-ctx">
                  <div className="aitutor-no-ctx-icon">🔬</div>
                  <div>Run a query on the Analyze page first, then come back to get a full explanation.</div>
                  <button className="hcard-reopen" type="button" onClick={onGoAnalyze}>
                    Go to Analyze
                  </button>
                </div>
              )}

              {hasContext && !explanation && !loading && (
                <div className="aitutor-explain-prompt">
                  <p className="aitutor-explain-hint">
                    Get a structured explanation of the current recommendation — what the query does,
                    why this index was chosen, trade-offs, and what the query plan means.
                  </p>
                  <button className="ai-explain-btn" type="button" onClick={handleExplain}>
                    Explain with AI
                  </button>
                  <div className="aitutor-quick-row">
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        className="ai-suggested-btn"
                        type="button"
                        onClick={() => handleAsk(p.q)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="ai-loading">
                  <span className="spinner" />
                  <span>Generating explanation…</span>
                </div>
              )}

              {error && <div className="err-banner" role="alert">⚠ {error}</div>}

              {explanation && (
                <>
                  <div className="ai-sections">
                    {SECTIONS.map((s) => (
                      <ExplainSection
                        key={s.key}
                        icon={s.icon}
                        label={s.label}
                        text={explanation[s.key]}
                        open={openSection === s.key}
                        onToggle={() => setOpenSection((prev) => (prev === s.key ? null : s.key))}
                      />
                    ))}
                  </div>
                  <div className="aitutor-quick-row" style={{ marginTop: 10 }}>
                    {QUICK_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        className="ai-suggested-btn"
                        type="button"
                        onClick={() => handleAsk(p.q)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── right: Q&A ── */}
          <div className="aitutor-qa-col">
            <div className="aitutor-panel">
              <div className="aitutor-panel-hdr">
                <span className="aitutor-panel-title">💬 Ask a question</span>
              </div>

              {/* General suggested questions */}
              <div className="aitutor-general-qs">
                <div className="ai-followup-title">General questions</div>
                <div className="ai-suggested-row">
                  {GENERAL_PROMPTS.map((q) => (
                    <button
                      key={q}
                      className="ai-suggested-btn"
                      type="button"
                      onClick={() => handleAsk(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation */}
              <div className="aitutor-convo">
                {conversation.length === 0 && (
                  <div className="aitutor-convo-empty">
                    Ask any question about database indexes, query plans, or this recommendation.
                  </div>
                )}
                {conversation.map((entry, i) => (
                  <div key={i} className="aitutor-convo-entry" ref={i === conversation.length - 1 ? answerRef : null}>
                    <div className="aitutor-convo-q">
                      <span className="aitutor-convo-q-icon">You</span>
                      {entry.q}
                    </div>
                    <div className="aitutor-convo-a">
                      <span className="aitutor-convo-a-icon">🤖</span>
                      {entry.a === null
                        ? <span className="ai-loading"><span className="spinner" /></span>
                        : <span className="ai-answer-text">{entry.a}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="ai-input-row" style={{ marginTop: "auto", paddingTop: 10 }}>
                <input
                  ref={inputRef}
                  className="ai-input"
                  type="text"
                  placeholder="Ask anything about indexes, query plans, or this recommendation…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  maxLength={500}
                />
                <button
                  className="ai-ask-btn"
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!question.trim() || answerLoading}
                >
                  {answerLoading ? <span className="spinner" /> : "Ask"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
