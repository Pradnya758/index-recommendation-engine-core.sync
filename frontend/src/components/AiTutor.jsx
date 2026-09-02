import { useEffect, useRef, useState } from "react";
import { askFollowup, explainAnalysis } from "../api";

const SECTIONS = [
  { key: "query_summary",        label: "What the query does",    icon: "📝" },
  { key: "features_detected",    label: "Features detected",      icon: "🧩" },
  { key: "why_this_index",       label: "Why this index?",        icon: "🏆" },
  { key: "simple_explanation",   label: "Simple explanation",     icon: "💡" },
  { key: "technical_explanation",label: "Technical explanation",  icon: "⚙️" },
  { key: "tradeoffs",            label: "Trade-offs",             icon: "⚖️" },
  { key: "query_plan_meaning",   label: "Query plan meaning",     icon: "📋" },
];

const SUGGESTED = [
  "Why is this a composite index?",
  "What does EXPLAIN QUERY PLAN mean?",
  "What are the trade-offs?",
  "Why is column order important?",
];

function SourceBadge({ source }) {
  return (
    <span className={`ai-source-badge ai-source-${source}`}>
      {source === "openai" ? "✦ AI explanation" : "⚙ Local explanation"}
    </span>
  );
}

function Section({ icon, label, text, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  if (!text) return null;
  return (
    <div className={`ai-section${open ? " open" : ""}`}>
      <button
        className="ai-section-hdr"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
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

export default function AiTutor({ result, plan }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [question, setQuestion]       = useState("");
  const [answer, setAnswer]           = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const inputRef = useRef(null);

  // reset when a new result arrives
  useEffect(() => {
    setExplanation(null);
    setError("");
    setAnswer("");
    setQuestion("");
  }, [result]);

  async function handleExplain() {
    setLoading(true);
    setError("");
    setExplanation(null);
    setAnswer("");
    try {
      const data = await explainAnalysis(result, plan);
      setExplanation(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowup(q) {
    const text = (q ?? question).trim();
    if (!text) return;
    setAnswerLoading(true);
    setAnswer("");
    try {
      const data = await askFollowup(text, result, plan);
      setAnswer(data.answer);
    } catch (e) {
      setAnswer("Could not get an answer. Please try again.");
    } finally {
      setAnswerLoading(false);
    }
    if (!q) setQuestion("");
  }

  if (!result) return null;

  return (
    <div className="ai-tutor">
      {/* ── header ── */}
      <div className="ai-tutor-hdr">
        <div className="ai-tutor-title-row">
          <span className="ai-tutor-icon">🤖</span>
          <div>
            <div className="ai-tutor-title">AI Tutor</div>
            <div className="ai-tutor-sub">Educational explanations only · Does not change the recommendation</div>
          </div>
        </div>
        {!explanation && !loading && (
          <button className="ai-explain-btn" type="button" onClick={handleExplain}>
            Explain with AI
          </button>
        )}
        {explanation && <SourceBadge source={explanation.source} />}
      </div>

      {/* ── loading ── */}
      {loading && (
        <div className="ai-loading">
          <span className="spinner" />
          <span>Generating explanation…</span>
        </div>
      )}

      {/* ── error ── */}
      {error && (
        <div className="err-banner" role="alert">⚠ {error}</div>
      )}

      {/* ── sections ── */}
      {explanation && (
        <div className="ai-sections">
          {SECTIONS.map((s, i) => (
            <Section
              key={s.key}
              icon={s.icon}
              label={s.label}
              text={explanation[s.key]}
              defaultOpen={i < 2}
            />
          ))}
        </div>
      )}

      {/* ── follow-up ── */}
      {explanation && (
        <div className="ai-followup">
          <div className="ai-followup-title">Ask a follow-up question</div>
          <div className="ai-suggested-row">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                className="ai-suggested-btn"
                type="button"
                onClick={() => handleFollowup(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="ai-input-row">
            <input
              ref={inputRef}
              className="ai-input"
              type="text"
              placeholder="Ask anything about this recommendation…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFollowup()}
              maxLength={500}
            />
            <button
              className="ai-ask-btn"
              type="button"
              onClick={() => handleFollowup()}
              disabled={!question.trim() || answerLoading}
            >
              {answerLoading ? <span className="spinner" /> : "Ask"}
            </button>
          </div>
          {answer && (
            <div className="ai-answer">
              <div className="ai-answer-label">Answer</div>
              <div className="ai-answer-text">{answer}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
