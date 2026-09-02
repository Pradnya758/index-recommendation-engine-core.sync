import { useRef, useState } from "react";
import { askFollowup } from "../api";

const SUGGESTED_TOPICS = [
  { label: "What is an index?",            q: "What is a database index and why is it useful?" },
  { label: "Table scan vs index scan",     q: "What is the difference between a table scan and an index scan?" },
  { label: "Composite index rules",        q: "How does a composite index work and what is the left-prefix rule?" },
  { label: "B+ tree structure",            q: "What is a B+ tree and how does it help with index lookups?" },
  { label: "EXPLAIN QUERY PLAN",           q: "What does EXPLAIN QUERY PLAN output mean in SQLite?" },
  { label: "Index trade-offs",             q: "What are the trade-offs of adding a database index?" },
  { label: "When NOT to index",            q: "When should you NOT add a database index?" },
  { label: "Confidence score meaning",     q: "What do the score and confidence values mean in this engine?" },
  { label: "Why column order matters",     q: "Why does column order matter in a composite index?" },
  { label: "Covering index",               q: "What is a covering index and when is it useful?" },
];

const RELATED_CONCEPTS = [
  "B+ Tree", "Table Scan", "Index Scan", "Composite Index",
  "EXPLAIN QUERY PLAN", "Selectivity", "Primary Key", "Trade-offs",
  "WHERE Clause", "JOIN Indexing", "ORDER BY", "Covering Index",
];

export default function DoubtSolverView({ result, plan }) {
  const [question, setQuestion]       = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading]         = useState(false);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  async function handleAsk(q) {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    if (!q) setQuestion("");
    setLoading(true);
    setConversation((prev) => [...prev, { q: text, a: null }]);
    try {
      const data = await askFollowup(text, result ?? {}, plan ?? {});
      setConversation((prev) =>
        prev.map((e, i) => (i === prev.length - 1 ? { ...e, a: data.answer } : e))
      );
    } catch {
      setConversation((prev) =>
        prev.map((e, i) =>
          i === prev.length - 1
            ? { ...e, a: "Could not get an answer. Please check the backend is running." }
            : e
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  function handleClear() {
    setConversation([]);
  }

  return (
    <div className="ds-view">
      <div className="ds-inner">

        {/* Header */}
        <div className="ds-page-hdr">
          <div>
            <div className="eyebrow">Practice</div>
            <h1 className="ds-page-title">Doubt Solver</h1>
            <p className="ds-page-sub">
              Ask any question about database indexing, query plans, or this project.
              Uses the AI tutor infrastructure — works without an API key.
            </p>
          </div>
          {conversation.length > 0 && (
            <button className="history-clear-btn" type="button" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        <div className="ds-layout">

          {/* ── left: topics + concepts ── */}
          <div className="ds-sidebar-col">
            <div className="ds-topics-panel">
              <div className="ds-panel-title">Suggested topics</div>
              <div className="ds-topics-list">
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t.label}
                    className="ds-topic-btn"
                    type="button"
                    onClick={() => handleAsk(t.q)}
                  >
                    <span className="ds-topic-arrow">›</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ds-topics-panel" style={{ marginTop: 12 }}>
              <div className="ds-panel-title">Related concepts</div>
              <div className="ds-concepts-row">
                {RELATED_CONCEPTS.map((c) => (
                  <button
                    key={c}
                    className="ai-suggested-btn"
                    type="button"
                    onClick={() => handleAsk(`Explain the concept: ${c}`)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── right: conversation ── */}
          <div className="ds-convo-col">
            <div className="ds-convo-area">
              {conversation.length === 0 ? (
                <div className="ds-convo-empty">
                  <div className="ds-convo-empty-icon">💬</div>
                  <div className="ds-convo-empty-title">No questions yet</div>
                  <div className="ds-convo-empty-desc">
                    Pick a topic from the left or type your own question below.
                  </div>
                </div>
              ) : (
                conversation.map((entry, i) => (
                  <div
                    key={i}
                    className="aitutor-convo-entry"
                    ref={i === conversation.length - 1 ? bottomRef : null}
                  >
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
                ))
              )}
            </div>

            {/* Input */}
            <div className="ds-input-area">
              <div className="ai-input-row">
                <input
                  ref={inputRef}
                  className="ai-input"
                  type="text"
                  placeholder="Ask about indexes, query plans, B+ trees, trade-offs…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  maxLength={500}
                />
                <button
                  className="ai-ask-btn"
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!question.trim() || loading}
                >
                  {loading ? <span className="spinner" /> : "Ask"}
                </button>
              </div>
              <div className="ds-input-hint">
                Works without an API key · Answers use the local explanation engine
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
