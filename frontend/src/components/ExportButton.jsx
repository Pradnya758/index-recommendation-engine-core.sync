import { useState } from "react";

/* ── helpers ─────────────────────────────────────────────────── */

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colRef(arr) {
  return arr.length ? arr.map((c) => `${esc(c.table)}.${esc(c.column)}`).join(", ") : "—";
}

function fmtTs(d) {
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).replace(",", " ·");
}

/* ── HTML report builder ─────────────────────────────────────── */

function buildHtmlReport(query, result, plan, schema, ts) {
  const { analysis, recommendations, rejected_candidates } = result;

  /* relevant existing indexes — tables referenced in this query */
  const queryTables = new Set(analysis.tables);
  const relevantIndexRows = (schema?.tables ?? [])
    .filter((t) => queryTables.has(t.name))
    .flatMap((t) => [
      ...t.primary_keys.length
        ? [`<tr><td>${esc(t.name)}</td><td><em>PRIMARY KEY</em></td><td>${t.primary_keys.map(esc).join(", ")}</td><td>—</td></tr>`]
        : [],
      ...t.indexes.map(
        (idx) =>
          `<tr><td>${esc(t.name)}</td><td>${esc(idx.name)}</td><td>${idx.columns.map(esc).join(", ")}</td><td>${idx.unique ? "UNIQUE" : "—"}</td></tr>`
      ),
    ])
    .join("");

  /* recommendations section */
  const recSection = recommendations.length
    ? recommendations.map((r) => `
        <div class="rec-card">
          <div class="rec-card-hdr">
            <div class="rec-card-name">${esc(r.table)} <span class="rec-cols">(${r.columns.map(esc).join(", ")})</span></div>
            <div class="rec-badges">
              <span class="badge conf-${esc(r.confidence)}">${esc(r.confidence).toUpperCase()}</span>
              <span class="badge score-badge">Score ${r.score}</span>
            </div>
          </div>
          <table class="kv-table">
            <tr><th>CREATE INDEX</th><td><code>${esc(r.create_index_sql)}</code></td></tr>
            <tr><th>DROP INDEX (rollback)</th><td><code class="drop-code">${esc(r.drop_index_sql)}</code></td></tr>
          </table>
          <div class="rec-reasons-title">Why this index helps</div>
          <ul class="reason-list">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <div class="rec-reasons-title" style="margin-top:10px">Query evidence</div>
          <ul class="reason-list">${r.evidence.map((e) => `<li>${esc(e.detail)}</li>`).join("")}</ul>
        </div>`).join("")
    : `<p class="no-rec">No new index recommended — the relevant access path is already covered by a primary key or existing index.</p>`;

  /* rejected candidates */
  const rejectedSection = rejected_candidates.length
    ? `<table><tr><th>Table</th><th>Columns</th><th>Reason</th></tr>${
        rejected_candidates.map(
          (r) => `<tr><td>${esc(r.table)}</td><td>${r.columns.map(esc).join(", ")}</td><td>${esc(r.reason)}</td></tr>`
        ).join("")
      }</table>`
    : `<p class="muted">No candidates were rejected.</p>`;

  /* query plan */
  const planRows = (plan?.plan ?? []).map(
    (s) => `<tr><td class="plan-id">${s.id}</td><td>${esc(s.detail)}</td></tr>`
  ).join("");

  /* step-by-step */
  const steps = [
    {
      n: 1, title: "SQL Input",
      body: `<pre class="code-block">${esc(query)}</pre>`,
    },
    {
      n: 2, title: "Query Parsing",
      body: `<p>SQLGlot parsed the query and identified the following tables:</p>
             <p class="tag-row">${analysis.tables.length ? analysis.tables.map((t) => `<span class="tag">${esc(t)}</span>`).join(" ") : "<em>None</em>"}</p>`,
    },
    {
      n: 3, title: "Feature Extraction",
      body: `<table>
               <tr><th>Clause</th><th>Columns detected</th></tr>
               <tr><td>WHERE equality</td><td>${colRef(analysis.equality_filters)}</td></tr>
               <tr><td>WHERE range</td><td>${colRef(analysis.range_filters)}</td></tr>
               <tr><td>JOIN</td><td>${colRef(analysis.join_columns)}</td></tr>
               <tr><td>ORDER BY</td><td>${colRef(analysis.order_by_columns)}</td></tr>
               <tr><td>GROUP BY</td><td>${colRef(analysis.group_by_columns)}</td></tr>
             </table>`,
    },
    {
      n: 4, title: "Existing Index Check",
      body: rejected_candidates.length
        ? `<p>The following candidates were rejected because they duplicate existing coverage:</p>${rejectedSection}`
        : `<p class="muted">No candidates were rejected — all are new and non-duplicate.</p>`,
    },
    {
      n: 5, title: "Candidate Generation",
      body: recommendations.length
        ? `<ul class="reason-list">${recommendations.flatMap((r) => r.evidence).map((e) => `<li><strong>${esc(e.table)}.${esc(e.column)}</strong> — ${esc(e.detail)}</li>`).join("")}</ul>`
        : `<p class="muted">No new candidates generated.</p>`,
    },
    {
      n: 6, title: "Candidate Ranking",
      body: `<p>Scoring weights used by the rule-based engine:</p>
             <table>
               <tr><th>Evidence type</th><th>Points</th></tr>
               <tr><td>Equality filter</td><td>+45</td></tr>
               <tr><td>Join column</td><td>+35</td></tr>
               <tr><td>Range filter</td><td>+25</td></tr>
               <tr><td>ORDER BY / GROUP BY</td><td>+15</td></tr>
               <tr><td>Composite predicate</td><td>+65</td></tr>
             </table>
             ${recommendations.length
               ? `<p style="margin-top:10px">Ranked results:</p>
                  <table>
                    <tr><th>Candidate</th><th>Score</th><th>Confidence</th></tr>
                    ${recommendations.map((r) => `<tr><td>${esc(r.table)}(${r.columns.map(esc).join(", ")})</td><td>${r.score}</td><td>${esc(r.confidence)}</td></tr>`).join("")}
                  </table>`
               : ""}`,
    },
    {
      n: 7, title: "Final Recommendation",
      body: recommendations.length
        ? recommendations.map((r) => `<p><strong>${esc(r.table)}(${r.columns.map(esc).join(", ")})</strong> — ${esc(r.confidence)} confidence, score ${r.score}</p><pre class="code-block">${esc(r.create_index_sql)}</pre>`).join("")
        : `<p class="muted">No recommendation — existing indexes already cover this query.</p>`,
    },
    {
      n: 8, title: "Visualization",
      body: `<p>The application provides four interactive educational diagrams:</p>
             <ul class="reason-list">
               <li><strong>Execution Flow</strong> — the query processing pipeline from parse to execute, showing where the index intercepts the scan.</li>
               <li><strong>Table Scan Simulation</strong> — compares full-scan row traversal against index-lookup row counts for the recommended index.</li>
               <li><strong>B+ Tree Traversal</strong> — illustrates how the index stores column values in sorted order for O(log n) lookup.</li>
               <li><strong>Plan Comparison</strong> — shows the actual EXPLAIN QUERY PLAN output; the proposed indexed path is labelled conceptual.</li>
             </ul>`,
    },
  ];

  const stepsHtml = steps.map((s) => `
    <div class="step-row">
      <div class="step-num">Step ${s.n}</div>
      <div class="step-content">
        <div class="step-title">${s.title}</div>
        <div class="step-body">${s.body}</div>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Index Recommendation Report</title>
<style>
/* ── Reset & base ── */
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",system-ui,sans-serif;font-size:13px;line-height:1.6;color:#1e293b;background:#fff}

/* ── Page layout ── */
.page{max-width:820px;margin:0 auto;padding:48px 40px 64px}

/* ── Cover header ── */
.cover{border-bottom:3px solid #1e3a8a;padding-bottom:20px;margin-bottom:32px}
.cover-title{font-size:26px;font-weight:800;color:#1e3a8a;letter-spacing:-.02em;margin-bottom:4px}
.cover-sub{font-size:13px;color:#64748b;margin-bottom:12px}
.cover-meta{display:flex;gap:24px;flex-wrap:wrap;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:10px;margin-top:10px}
.cover-meta span{display:flex;align-items:center;gap:5px}
.cover-meta strong{color:#334155}

/* ── Section headings ── */
.section{margin-bottom:28px}
h2{font-size:13px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.07em;padding:6px 0 6px 10px;border-left:4px solid #2563eb;margin-bottom:12px}

/* ── Code blocks ── */
.code-block{font-family:"Cascadia Code","Fira Code","Courier New",monospace;font-size:12px;background:#f0f4ff;border:1px solid #c7d7f5;border-radius:5px;padding:10px 14px;white-space:pre-wrap;word-break:break-all;color:#1d4ed8;margin:6px 0}
.drop-code{color:#dc2626}

/* ── Tables ── */
table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0}
th,td{text-align:left;padding:7px 10px;border:1px solid #e2e8f0;vertical-align:top}
th{background:#f1f5f9;font-weight:600;color:#334155;white-space:nowrap}
tr:nth-child(even) td{background:#fafbfc}
.plan-id{font-family:monospace;color:#64748b;width:40px}
.kv-table th{width:200px}
.kv-table td code{font-family:"Cascadia Code","Fira Code","Courier New",monospace;font-size:11px;word-break:break-all}

/* ── Recommendation card ── */
.rec-card{border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:14px}
.rec-card-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:8px}
.rec-card-name{font-size:14px;font-weight:700;color:#1e3a8a;font-family:monospace}
.rec-cols{font-weight:400;color:#475569}
.rec-badges{display:flex;gap:6px;align-items:center}
.badge{font-size:10px;font-weight:700;padding:3px 9px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em}
.conf-high{background:#d1fae5;color:#065f46;border:1px solid #a7f3d0}
.conf-medium{background:#fef3c7;color:#92400e;border:1px solid #fde68a}
.conf-low{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
.score-badge{background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe}
.rec-reasons-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:10px 14px 4px}
.reason-list{padding:0 14px 10px 30px}
.reason-list li{margin-bottom:3px;color:#334155}
.no-rec{color:#059669;font-weight:600;padding:10px 0}
.muted{color:#94a3b8;font-style:italic}

/* ── Tags ── */
.tag-row{margin-top:6px}
.tag{display:inline-block;background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;border-radius:4px;padding:2px 8px;font-size:11px;font-family:monospace;margin:2px 3px 2px 0}

/* ── Step-by-step ── */
.step-row{display:flex;gap:16px;padding:12px 0;border-bottom:1px solid #f1f5f9}
.step-row:last-child{border-bottom:none}
.step-num{font-size:10px;font-weight:700;color:#2563eb;min-width:48px;padding-top:3px;font-family:monospace;letter-spacing:.03em}
.step-content{flex:1}
.step-title{font-size:12px;font-weight:700;color:#1e293b;margin-bottom:6px}
.step-body{font-size:12px;color:#475569}
.step-body p{margin-bottom:6px}
.step-body table{margin-top:4px}

/* ── Notice ── */
.notice{background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;font-size:11px;color:#92400e;margin-bottom:24px}

/* ── Print toolbar (screen only) ── */
.print-toolbar{display:flex;gap:10px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e2e8f0}
.print-btn{padding:8px 18px;font-size:12px;font-weight:600;border-radius:6px;border:1px solid #2563eb;background:#2563eb;color:#fff;cursor:pointer}
.print-btn:hover{background:#1d4ed8}
.print-btn-sec{background:#fff;color:#2563eb}
.print-btn-sec:hover{background:#eff6ff}

/* ── Print ── */
@media print{
  .print-toolbar{display:none}
  .page{padding:20px 24px 32px}
  .cover{padding-bottom:14px;margin-bottom:20px}
  h2{page-break-after:avoid}
  .rec-card{page-break-inside:avoid}
  .step-row{page-break-inside:avoid}
  @page{size:A4;margin:18mm 16mm}
}
</style>
</head>
<body>
<div class="page">

  <!-- Print toolbar (hidden when printing) -->
  <div class="print-toolbar">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
    <button class="print-btn print-btn-sec" onclick="window.close()">✕ Close</button>
  </div>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-title">Index Recommendation Report</div>
    <div class="cover-sub">Index Recommendation Engine · Rule-based · Deterministic · No AI</div>
    <div class="cover-meta">
      <span><strong>Generated:</strong> ${esc(ts)}</span>
      <span><strong>Tables:</strong> ${analysis.tables.length ? analysis.tables.map(esc).join(", ") : "—"}</span>
      <span><strong>Recommendations:</strong> ${recommendations.length}</span>
      <span><strong>Engine:</strong> SQLite / SQLGlot</span>
    </div>
  </div>

  <!-- Notice -->
  <div class="notice">
    ℹ Plan and recommendation evidence are based on the current analysis. The proposed indexed query plan is labelled conceptual — sandbox benchmarking is not implemented.
  </div>

  <!-- 1. SQL Query -->
  <div class="section">
    <h2>1 · SQL Query</h2>
    <pre class="code-block">${esc(query)}</pre>
  </div>

  <!-- 2. Detected Features -->
  <div class="section">
    <h2>2 · Detected Query Features</h2>
    <table>
      <tr><th>Clause</th><th>Columns</th></tr>
      <tr><td>WHERE equality</td><td>${colRef(analysis.equality_filters)}</td></tr>
      <tr><td>WHERE range</td><td>${colRef(analysis.range_filters)}</td></tr>
      <tr><td>JOIN</td><td>${colRef(analysis.join_columns)}</td></tr>
      <tr><td>ORDER BY</td><td>${colRef(analysis.order_by_columns)}</td></tr>
      <tr><td>GROUP BY</td><td>${colRef(analysis.group_by_columns)}</td></tr>
    </table>
  </div>

  <!-- 3. Existing Indexes -->
  <div class="section">
    <h2>3 · Relevant Existing Indexes</h2>
    ${relevantIndexRows
      ? `<table><tr><th>Table</th><th>Index name</th><th>Columns</th><th>Unique</th></tr>${relevantIndexRows}</table>`
      : `<p class="muted">No existing indexes found for the referenced tables.</p>`}
  </div>

  <!-- 4. Recommendations -->
  <div class="section">
    <h2>4 · Index Recommendations</h2>
    ${recSection}
  </div>

  <!-- 5. Rejected Candidates -->
  <div class="section">
    <h2>5 · Rejected Candidates</h2>
    ${rejectedSection}
  </div>

  <!-- 6. Query Plan -->
  <div class="section">
    <h2>6 · Query Plan (EXPLAIN QUERY PLAN)</h2>
    ${planRows
      ? `<table><tr><th>ID</th><th>Detail</th></tr>${planRows}</table>`
      : `<p class="muted">No query plan available.</p>`}
  </div>

  <!-- 7. Step-by-Step Analysis -->
  <div class="section">
    <h2>7 · Step-by-Step Analysis</h2>
    ${stepsHtml}
  </div>

  <!-- 8. Visualization Summary -->
  <div class="section">
    <h2>8 · Visualization Summary</h2>
    <p>The application provides four interactive educational diagrams accessible from the Visualize page:</p>
    <table style="margin-top:10px">
      <tr><th>Diagram</th><th>Description</th></tr>
      <tr><td><strong>Execution Flow</strong></td><td>Query processing pipeline — parse → plan → execute — showing where the index intercepts the scan.</td></tr>
      <tr><td><strong>Table Scan Simulation</strong></td><td>Compares full-scan row traversal against index-lookup row counts for the recommended index.</td></tr>
      <tr><td><strong>B+ Tree Traversal</strong></td><td>Illustrates how the index stores column values in sorted order for O(log n) lookup. Educational model, not exact SQLite internals.</td></tr>
      <tr><td><strong>Plan Comparison</strong></td><td>Shows actual EXPLAIN QUERY PLAN output. The proposed indexed path is labelled conceptual.</td></tr>
    </table>
  </div>

</div>
</body>
</html>`;
}

/* ── component ───────────────────────────────────────────────── */

export default function ExportButton({ query, result, plan, schema }) {
  const [feedback, setFeedback] = useState("");

  if (!result) return null;

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2600);
  }

  function openReport() {
    const ts  = fmtTs(new Date());
    const html = buildHtmlReport(query, result, plan, schema, ts);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    // open in new tab so the user can print/save-as-PDF from there
    window.open(url, "_blank", "noopener");
    // revoke after a generous delay to ensure the tab has loaded
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    flash("Report opened ✓");
  }

  function downloadHtml() {
    const ts  = fmtTs(new Date());
    const html = buildHtmlReport(query, result, plan, schema, ts);
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `index-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Report downloaded ✓");
  }

  function downloadJson() {
    const payload = {
      generated:           new Date().toISOString(),
      query,
      analysis:            result.analysis,
      recommendations:     result.recommendations,
      rejected_candidates: result.rejected_candidates,
      query_plan:          plan?.plan ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `index-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("JSON exported ✓");
  }

  return (
    <div className="export-row">
      <button className="export-btn export-btn-print" type="button" onClick={openReport}>
        🖨 Print / Save as PDF
      </button>
      <button className="export-btn" type="button" onClick={downloadHtml}>
        ⬇ Download Report
      </button>
      <button className="export-btn export-btn-secondary" type="button" onClick={downloadJson}>
        {"{ }"} Export JSON
      </button>
      {feedback && <span className="export-feedback">{feedback}</span>}
    </div>
  );
}
