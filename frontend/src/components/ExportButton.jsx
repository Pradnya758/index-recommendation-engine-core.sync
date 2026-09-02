import { useState } from "react";

function buildHtmlReport(query, result, plan, ts) {
  const rec0 = result.recommendations[0];
  const { analysis } = result;

  const colRef = (arr) =>
    arr.length ? arr.map((c) => `${c.table}.${c.column}`).join(", ") : "None";

  const planRows = (plan?.plan ?? [])
    .map((s) => `<tr><td>${s.id}</td><td>${s.detail}</td></tr>`)
    .join("");

  const recSection = result.recommendations.length
    ? result.recommendations
        .map(
          (r) => `
      <div class="rec-block">
        <div class="rec-title">${r.table} (${r.columns.join(", ")})</div>
        <div class="badges">
          <span class="badge conf-${r.confidence}">${r.confidence}</span>
          <span class="badge score">score ${r.score}</span>
        </div>
        <pre class="sql">${r.create_index_sql}</pre>
        <pre class="sql drop">${r.drop_index_sql}</pre>
        <ul>${r.reasons.map((x) => `<li>${x}</li>`).join("")}</ul>
      </div>`
        )
        .join("")
    : "<p>No new index recommended — existing indexes already cover this query.</p>";

  const rejectedSection = result.rejected_candidates.length
    ? `<ul>${result.rejected_candidates.map((r) => `<li>${r.table}(${r.columns.join(", ")}) — ${r.reason}</li>`).join("")}</ul>`
    : "<p>None.</p>";

  const stepSummary = [
    { n: 1, title: "SQL Input",            body: `<pre class="sql">${query}</pre>` },
    { n: 2, title: "Query Parsing",        body: `Tables: <strong>${analysis.tables.join(", ") || "none"}</strong>` },
    { n: 3, title: "Feature Extraction",   body: `WHERE equality: ${colRef(analysis.equality_filters)}<br>WHERE range: ${colRef(analysis.range_filters)}<br>JOIN: ${colRef(analysis.join_columns)}<br>ORDER BY: ${colRef(analysis.order_by_columns)}<br>GROUP BY: ${colRef(analysis.group_by_columns)}` },
    { n: 4, title: "Existing Index Check", body: rejectedSection },
    { n: 5, title: "Candidate Generation", body: result.recommendations.flatMap((r) => r.evidence).map((e) => `<div>${e.table}.${e.column} — ${e.detail}</div>`).join("") || "No candidates." },
    { n: 6, title: "Candidate Ranking",    body: result.recommendations.map((r) => `${r.table}(${r.columns.join(", ")}) → score ${r.score}`).join("<br>") || "No ranked candidates." },
    { n: 7, title: "Final Recommendation", body: rec0 ? `${rec0.table}(${rec0.columns.join(", ")}) — ${rec0.confidence} confidence, score ${rec0.score}` : "No recommendation." },
    { n: 8, title: "Visualization",        body: "See the Visualize page for interactive Execution Flow, Table Scan, B+ Tree, and Plan Comparison diagrams." },
  ]
    .map(
      (s) => `<div class="step"><div class="step-n">Step ${s.n}</div><div class="step-title">${s.title}</div><div class="step-body">${s.body}</div></div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Index Recommendation Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;font-size:13px;color:#1e293b;background:#fff;padding:32px;max-width:860px;margin:auto}
  h1{font-size:22px;font-weight:800;color:#1e3a5f;margin-bottom:4px}
  h2{font-size:14px;font-weight:700;color:#1e3a5f;margin:24px 0 8px;padding-bottom:4px;border-bottom:2px solid #e2e8f0}
  .meta{font-size:11px;color:#64748b;margin-bottom:24px}
  pre.sql{background:#f0f4ff;border:1px solid #c7d7f5;border-radius:5px;padding:10px 12px;font-size:12px;color:#1d4ed8;white-space:pre-wrap;word-break:break-all;margin:6px 0}
  pre.sql.drop{color:#dc2626;background:#fff5f5;border-color:#fecaca}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
  th,td{text-align:left;padding:6px 10px;border:1px solid #e2e8f0}
  th{background:#f8fafc;font-weight:600}
  .rec-block{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px;margin-bottom:10px}
  .rec-title{font-size:14px;font-weight:700;color:#1e3a5f;margin-bottom:6px;font-family:monospace}
  .badges{display:flex;gap:6px;margin-bottom:8px}
  .badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase}
  .conf-high{background:#d1fae5;color:#065f46}.conf-medium{background:#fef3c7;color:#92400e}.conf-low{background:#f1f5f9;color:#475569}
  .score{background:#dbeafe;color:#1e40af}
  ul{padding-left:18px;margin-top:6px}li{margin-bottom:3px;line-height:1.5}
  .step{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9}
  .step-n{font-size:10px;font-weight:700;color:#2563eb;min-width:44px;padding-top:2px}
  .step-title{font-size:12px;font-weight:700;color:#1e293b;min-width:160px}
  .step-body{font-size:12px;color:#475569;line-height:1.6;flex:1}
  @media print{body{padding:16px}h2{page-break-after:avoid}.rec-block{page-break-inside:avoid}}
</style>
</head>
<body>
<h1>Index Recommendation Report</h1>
<div class="meta">Generated: ${ts} &nbsp;·&nbsp; Index Recommendation Engine &nbsp;·&nbsp; Rule-based · No AI</div>

<h2>SQL Query</h2>
<pre class="sql">${query}</pre>

<h2>Detected Features</h2>
<table>
  <tr><th>Clause</th><th>Columns</th></tr>
  <tr><td>WHERE equality</td><td>${colRef(analysis.equality_filters)}</td></tr>
  <tr><td>WHERE range</td><td>${colRef(analysis.range_filters)}</td></tr>
  <tr><td>JOIN</td><td>${colRef(analysis.join_columns)}</td></tr>
  <tr><td>ORDER BY</td><td>${colRef(analysis.order_by_columns)}</td></tr>
  <tr><td>GROUP BY</td><td>${colRef(analysis.group_by_columns)}</td></tr>
</table>

<h2>Recommendations</h2>
${recSection}

<h2>Rejected Candidates</h2>
${rejectedSection}

<h2>Query Plan (EXPLAIN QUERY PLAN)</h2>
<table>
  <tr><th>ID</th><th>Detail</th></tr>
  ${planRows || "<tr><td colspan='2'>No plan available.</td></tr>"}
</table>

<h2>Step-by-Step Analysis</h2>
${stepSummary}

<h2>Visualization Summary</h2>
<p>The Execution Flow diagram shows the query pipeline. The Table Scan simulation compares full-scan vs index-lookup row counts.
The B+ Tree diagram illustrates sorted index storage. The Plan Comparison shows actual EXPLAIN QUERY PLAN output before and after the recommended index.</p>
</body>
</html>`;
}

export default function ExportButton({ query, result, plan }) {
  const [feedback, setFeedback] = useState("");

  if (!result) return null;

  function flash(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2400);
  }

  function downloadHtml() {
    const ts = new Date().toLocaleString();
    const html = buildHtmlReport(query, result, plan, ts);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `index-report-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Report downloaded ✓");
  }

  function downloadJson() {
    const payload = {
      generated: new Date().toISOString(),
      query,
      analysis: result.analysis,
      recommendations: result.recommendations,
      rejected_candidates: result.rejected_candidates,
      query_plan: plan?.plan ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `index-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("JSON exported ✓");
  }

  return (
    <div className="export-row">
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
