import { useEffect, useState } from "react";
import { clearHistory, deleteHistoryEntry, fetchHistory } from "../api";

/* ── helpers ─────────────────────────────────────────────────── */

function fmtTs(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).replace(",", " ·");
}

function confClass(c) {
  return `conf-badge conf-${c}`;
}

function matches(item, q) {
  if (!q.trim()) return true;
  const lq = q.toLowerCase();
  const rec0 = item.rec?.recommendations?.[0];
  return (
    item.query.toLowerCase().includes(lq) ||
    (item.rec?.analysis?.tables ?? []).some((t) => t.toLowerCase().includes(lq)) ||
    (rec0?.columns ?? []).some((c) => c.toLowerCase().includes(lq)) ||
    (rec0?.table ?? "").toLowerCase().includes(lq)
  );
}

/* ── card ────────────────────────────────────────────────────── */

function HistoryCard({ item, runNumber, onOpen, onDelete, deleting }) {
  const rec0       = item.rec?.recommendations?.[0];
  const tables     = item.rec?.analysis?.tables ?? [];
  const planDetail = item.plan?.plan?.[0]?.detail ?? "";
  const ts         = fmtTs(item.ts);

  return (
    <article className="hcard">
      {/* ── top bar ── */}
      <div className="hcard-topbar">
        <span className="hcard-run">Run #{runNumber}</span>
        <span className="hcard-ts">{ts}</span>
        <button
          className="hitem-del"
          type="button"
          title="Delete this entry"
          disabled={deleting}
          onClick={onDelete}
          aria-label="Delete entry"
        >
          {deleting ? "…" : "✕"}
        </button>
      </div>

      {/* ── SQL ── */}
      <div className="hcard-section">
        <span className="hcard-label">SQL</span>
        <pre className="hcard-sql">{item.query}</pre>
      </div>

      {/* ── details grid ── */}
      <div className="hcard-grid">
        <div className="hcard-field">
          <span className="hcard-label">Table{tables.length !== 1 ? "s" : ""}</span>
          <div className="hcard-field-val">
            {tables.length
              ? tables.map((t) => (
                  <span key={t} className="hitem-chip hitem-chip-blue">{t}</span>
                ))
              : <span className="hcard-none">—</span>}
          </div>
        </div>

        {rec0 ? (
          <>
            <div className="hcard-field">
              <span className="hcard-label">Recommended index</span>
              <div className="hcard-field-val">
                <span className="hitem-chip hitem-chip-cyan hcard-idx">
                  ({rec0.columns.join(", ")})
                </span>
              </div>
            </div>

            <div className="hcard-field">
              <span className="hcard-label">Confidence</span>
              <div className="hcard-field-val">
                <span className={confClass(rec0.confidence)}>{rec0.confidence}</span>
              </div>
            </div>

            <div className="hcard-field">
              <span className="hcard-label">Score</span>
              <div className="hcard-field-val">
                <span className="hcard-score-val">{rec0.score}</span>
                <div className="hcard-score-bar-wrap">
                  <div
                    className="hcard-score-bar"
                    style={{ width: `${Math.min(rec0.score, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="hcard-field hcard-field-span">
            <span className="hcard-label">Recommendation</span>
            <div className="hcard-field-val">
              <span className="hitem-chip hitem-chip-green">No new index needed</span>
            </div>
          </div>
        )}

        {planDetail && (
          <div className="hcard-field hcard-field-span">
            <span className="hcard-label">Query plan</span>
            <code className="hcard-plan">{planDetail}</code>
          </div>
        )}
      </div>

      {/* ── footer ── */}
      <div className="hcard-footer">
        <button
          className="hcard-reopen"
          type="button"
          onClick={onOpen}
        >
          ↗ Reopen Analysis
        </button>
      </div>
    </article>
  );
}

/* ── view ────────────────────────────────────────────────────── */

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
      setEntries(await fetchHistory());
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
    } catch { /* ignore */ }
    finally { setDeleting(null); }
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

  const filtered = entries.filter((e) => matches(e, search));

  /* total count for run numbering — entries are newest-first from backend */
  const total = entries.length;

  return (
    <div className="history-view">
      <div className="history-inner">

        {/* ── page header ── */}
        <div className="history-page-hdr">
          <div>
            <div className="eyebrow">Persistent · SQLite</div>
            <h1 className="history-page-title">Query History</h1>
            <p className="history-page-sub">
              Every analysis is saved to the backend database. Click{" "}
              <strong>Reopen Analysis</strong> on any card to restore it.
            </p>
          </div>
          {entries.length > 0 && (
            <button className="history-clear-btn" type="button" onClick={handleClear}>
              Clear all
            </button>
          )}
        </div>

        {/* ── search ── */}
        {entries.length > 0 && (
          <div className="hv-search-wrap">
            <span className="hv-search-icon">🔍</span>
            <input
              className="history-search hv-search-input"
              type="search"
              placeholder="Search by SQL, table, or column…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search history"
            />
            {search && (
              <span className="hv-search-count">
                {filtered.length} of {total}
              </span>
            )}
          </div>
        )}

        {/* ── loading ── */}
        {loading && (
          <div className="history-empty">
            <span className="spinner" />
            <div className="history-empty-title" style={{ marginTop: 12 }}>Loading history…</div>
          </div>
        )}

        {/* ── error ── */}
        {!loading && error && (
          <div className="err-banner" role="alert">⚠ {error}</div>
        )}

        {/* ── empty ── */}
        {!loading && !error && filtered.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">{search ? "🔎" : "🕑"}</div>
            <div className="history-empty-title">
              {search ? "No matching analyses" : "No analyses yet"}
            </div>
            <div className="history-empty-desc">
              {search
                ? "Try a different search term — SQL text, table name, or column name."
                : "Run a query on the Analyze page to start building your history."}
            </div>
          </div>
        )}

        {/* ── list ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="hv-list">
            {filtered.map((item, i) => {
              /* run number: entry with highest id = run #total, descending */
              const runNumber = total - entries.indexOf(item);
              return (
                <HistoryCard
                  key={item.id}
                  item={item}
                  runNumber={runNumber}
                  onOpen={() => onOpen(item)}
                  onDelete={(e) => handleDelete(item.id, e)}
                  deleting={deleting === item.id}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
