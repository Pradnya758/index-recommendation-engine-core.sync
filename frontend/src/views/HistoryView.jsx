import { useEffect, useState } from "react";
import { clearHistory, deleteHistoryEntry, fetchHistory } from "../api";

function confClass(c) {
  return `conf-badge conf-${c}`;
}

export default function HistoryView({ onOpen }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [deleting, setDeleting] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchHistory();
      setEntries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id, e) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteHistoryEntry(id);
      setEntries((prev) => prev.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  }

  async function handleClear() {
    if (!window.confirm("Delete all history? This cannot be undone.")) return;
    try {
      await clearHistory();
      setEntries([]);
    } catch (e) {
      setError(e.message);
    }
  }

  const filtered = entries.filter((e) =>
    !search.trim() || e.query.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="history-view">
      <div className="history-inner">
        {/* Header */}
        <div className="history-page-hdr">
          <div>
            <div className="eyebrow">Persistent</div>
            <h1 className="history-page-title">Query History</h1>
            <p className="history-page-sub">
              Every analysis is saved to the backend database. Click any entry to reopen it.
            </p>
          </div>
          {entries.length > 0 && (
            <button className="history-clear-btn" type="button" onClick={handleClear}>
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        {entries.length > 0 && (
          <input
            className="history-search"
            type="search"
            placeholder="Search queries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {/* States */}
        {loading && (
          <div className="history-empty">
            <span className="spinner" />
            <div className="history-empty-title">Loading history…</div>
          </div>
        )}

        {!loading && error && (
          <div className="err-banner" role="alert">⚠ {error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">🕑</div>
            <div className="history-empty-title">
              {search ? "No matching queries" : "No history yet"}
            </div>
            <div className="history-empty-desc">
              {search
                ? "Try a different search term."
                : "Run an analysis on the Analyze page — it will appear here automatically."}
            </div>
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="history-list">
            {filtered.map((item, i) => {
              const rec0 = item.rec?.recommendations?.[0];
              const tables = item.rec?.analysis?.tables ?? [];
              const planDetail = item.plan?.plan?.[0]?.detail ?? "";
              const ts = new Date(item.ts).toLocaleString();

              return (
                <div
                  key={item.id}
                  className="history-item hitem-rich"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(item)}
                  onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div className="hitem-top">
                    <span className="history-num">#{item.id}</span>
                    <span className="hitem-ts">{ts}</span>
                    <button
                      className="hitem-del"
                      type="button"
                      title="Delete this entry"
                      disabled={deleting === item.id}
                      onClick={(e) => handleDelete(item.id, e)}
                    >
                      {deleting === item.id ? "…" : "✕"}
                    </button>
                  </div>

                  <div className="history-query">{item.query}</div>

                  <div className="hitem-meta">
                    {tables.length > 0 && (
                      <span className="hitem-chip hitem-chip-blue">
                        {tables.join(", ")}
                      </span>
                    )}
                    {rec0 ? (
                      <>
                        <span className="hitem-chip hitem-chip-cyan">
                          {rec0.table}({rec0.columns.join(", ")})
                        </span>
                        <span className={confClass(rec0.confidence)}>{rec0.confidence}</span>
                        <span className="hitem-score">score {rec0.score}</span>
                      </>
                    ) : (
                      <span className="hitem-chip hitem-chip-green">No new index needed</span>
                    )}
                    {planDetail && (
                      <span className="hitem-plan">{planDetail}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
