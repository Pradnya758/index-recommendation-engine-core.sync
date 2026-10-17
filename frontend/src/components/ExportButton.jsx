
import { useState } from "react";

/* ---------- Safe formatting helpers ---------- */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function display(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatTime(date) {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status) {
  switch (status) {
    case "SUPPORTED":
      return "Supported by query-plan evidence";
    case "UNCHANGED":
      return "No relevant query-plan change";
    default:
      return "Uncertain evidence";
  }
}

function statusClass(status) {
  switch (status) {
    case "SUPPORTED":
      return "supported";
    case "UNCHANGED":
      return "unchanged";
    default:
      return "uncertain";
  }
}

function renderTable(headers, rows) {
  if (!rows.length) {
    return `<p class="muted">No data available for this section.</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td>${esc(display(cell))}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderEvidence(evidence) {
  const items = list(evidence);

  if (!items.length) {
    return `<p class="muted">No query-plan evidence was provided for this candidate.</p>`;
  }

  return `<ul>${items
    .map((item) => {
      if (typeof item === "string") return `<li>${esc(item)}</li>`;

      const title = [item.feature, item.table, item.column]
        .filter(Boolean)
        .join(" · ");

      return `<li>
        ${title ? `<strong>${esc(title)}</strong> — ` : ""}
        ${esc(item.detail ?? item.description ?? JSON.stringify(item))}
      </li>`;
    })
    .join("")}</ul>`;
}

function renderRules(rules) {
  const items = list(rules);

  if (!items.length) {
    return `<p class="muted">No specific SQLite rule references were provided.</p>`;
  }

  return `<ul>${items
    .map((rule) => {
      if (typeof rule === "string") return `<li>${esc(rule)}</li>`;

      const title = [rule.rule_id, rule.title].filter(Boolean).join(" — ");

      return `<li>
        <strong>${esc(title || "SQLite rule")}</strong>
        ${rule.description ? `<div>${esc(rule.description)}</div>` : ""}
        ${
          rule.source_url
            ? `<div><a href="${esc(rule.source_url)}">${esc(
                "View documentation"
              )}</a></div>`
            : ""
        }
      </li>`;
    })
    .join("")}</ul>`;
}

function renderCandidate(candidate, index) {
  const table = candidate.table ?? "Unknown table";
  const columns = list(candidate.columns);
  const status = candidate.evidence_status ?? "UNCERTAIN";

  return `
    <article class="candidate">
      <div class="candidate-header">
        <div>
          <h3>${esc(table)} (${esc(columns.join(", ") || "—")})</h3>
          <p class="muted">Candidate ${index + 1}</p>
        </div>
        <span class="status ${statusClass(status)}">
          ${esc(statusLabel(status))}
        </span>
      </div>

      <h4>Create index</h4>
      <pre>${esc(candidate.create_index_sql)}</pre>

      <h4>Rollback SQL</h4>
      <pre>${esc(candidate.drop_index_sql)}</pre>

      <h4>Why this candidate was evaluated</h4>
      ${
        list(candidate.reasons).length
          ? `<ul>${list(candidate.reasons)
              .map((reason) => `<li>${esc(reason)}</li>`)
              .join("")}</ul>`
          : `<p class="muted">No additional explanation was provided.</p>`
      }

      <h4>Query-plan evidence</h4>
      ${renderEvidence(candidate.evidence)}

      <h4>Applicable SQLite rules</h4>
      ${renderRules(candidate.rules)}
    </article>`;
}

/* ---------- Report builder ---------- */

function buildHtmlReport(query, result, plan, schema, timestamp) {
  const analysis = result?.analysis ?? {};
  const recommendations = list(result?.recommendations);
  const rejected = list(result?.rejected_candidates);

  const recommended = recommendations.filter(
    (candidate) => candidate.recommendation === "recommended"
  );

  const notRecommended = recommendations.filter(
    (candidate) => candidate.recommendation === "not_recommended"
  );

  // Support either a schema object with a tables property or a tables array.
  const tables = Array.isArray(schema) ? schema : list(schema?.tables);
  const queryTables = new Set(list(analysis.tables));

  const existingIndexes = tables
    .filter((table) => queryTables.has(table.name))
    .flatMap((table) => [
      ...list(table.primary_keys).map((column) => [
        table.name,
        "PRIMARY KEY",
        column,
        "—",
      ]),
      ...list(table.indexes).map((index) => [
        table.name,
        index.name,
        list(index.columns).join(", "),
        index.unique ? "UNIQUE" : "Non-unique",
      ]),
    ]);

  const featureRows = [
    ["WHERE equality", analysis.equality_filters],
    ["WHERE range", analysis.range_filters],
    ["JOIN", analysis.join_columns],
    ["ORDER BY", analysis.order_by_columns],
    ["GROUP BY", analysis.group_by_columns],
  ].map(([name, items]) => [
    name,
    list(items)
      .map((item) =>
        typeof item === "string"
          ? item
          : [item.table, item.column].filter(Boolean).join(".")
      )
      .join(", ") || "—",
  ]);

  // Query-plan responses may expose their rows under plan or another
  // common property. Keep the complete original response in JSON export.
  const planRows = Array.isArray(plan)
    ? plan
    : list(plan?.plan ?? plan?.query_plan ?? plan?.rows);

  const planHtml = planRows.length
    ? renderTable(
        ["ID", "Parent", "Detail"],
        planRows.map((row) => [
          row.id ?? row.selectid ?? "—",
          row.parent ?? row.parent_id ?? "—",
          row.detail ?? row.description ?? JSON.stringify(row),
        ])
      )
    : `<pre>${esc(
        plan ? JSON.stringify(plan, null, 2) : "No query plan available."
      )}</pre>`;

  const recommendationsHtml = recommended.length
    ? recommended.map(renderCandidate).join("")
    : `<p class="muted">No candidates are currently classified as recommended.</p>`;

  const notRecommendedHtml = notRecommended.length
    ? notRecommended.map(renderCandidate).join("")
    : `<p class="muted">No tested-but-not-recommended candidates were returned.</p>`;

  const rejectedHtml = rejected.length
    ? renderTable(
        ["Table", "Columns", "Reason"],
        rejected.map((item) => [
          item.table,
          list(item.columns).join(", "),
          item.reason,
        ])
      )
    : `<p class="muted">No existing-index rejections were returned.</p>`;

  const otherRecommendations = recommendations.filter(
    (candidate) =>
      candidate.recommendation !== "recommended" &&
      candidate.recommendation !== "not_recommended"
  );

  const otherHtml = otherRecommendations.length
    ? otherRecommendations.map(renderCandidate).join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Index Recommendation Report</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f7fb;color:#1e293b;font:14px/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}
.page{max-width:960px;margin:24px auto;background:#fff;padding:36px}
.toolbar{display:flex;gap:10px;margin-bottom:28px}
button{padding:10px 16px;border:1px solid #2563eb;border-radius:7px;background:#2563eb;color:#fff;font-weight:600;cursor:pointer}
.secondary{background:#fff;color:#1d4ed8}
.cover{border-bottom:3px solid #1d4ed8;padding-bottom:20px;margin-bottom:24px}
h1{margin:0 0 6px;color:#1e3a8a;font-size:28px}
h2{font-size:17px;color:#1e3a8a;border-bottom:1px solid #dbeafe;padding-bottom:8px;margin-top:30px}
h3{font-size:15px;margin:0 0 6px;overflow-wrap:anywhere}
h4{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569;margin:16px 0 5px}
.meta{display:flex;gap:18px;flex-wrap:wrap;color:#64748b;font-size:12px;margin-top:14px}
.notice{background:#eff6ff;border-left:4px solid #3b82f6;padding:12px;margin:18px 0}
.muted{color:#64748b;font-size:12px}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5f9;border:1px solid #e2e8f0;padding:12px;border-radius:6px;font-size:12px}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}
th,td{padding:9px;border:1px solid #dbe3ee;text-align:left;vertical-align:top;overflow-wrap:anywhere}
th{background:#eff6ff}
.candidate{border:1px solid #dbe3ee;border-radius:8px;padding:16px;margin:14px 0;break-inside:avoid}
.candidate-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}
.status{display:inline-block;padding:5px 9px;border-radius:5px;font-size:11px;font-weight:700}
.supported{background:#dcfce7;color:#166534}
.unchanged{background:#fef3c7;color:#92400e}
.uncertain{background:#e2e8f0;color:#334155}
li{margin:5px 0;overflow-wrap:anywhere}
section{break-inside:auto}
a{color:#1d4ed8}
@media(max-width:650px){.page{margin:0;padding:20px}h1{font-size:23px}}
@media print{
body{background:#fff;font-size:11px}
.page{max-width:none;margin:0;padding:0}
.toolbar{display:none}
h2{break-after:avoid}
.candidate{break-inside:avoid}
}
</style>
</head>
<body>
<div class="page">
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>

  <header class="cover">
    <h1>Index Recommendation Report</h1>
    <p>Evidence-based SQLite index analysis</p>
    <div class="meta">
      <span><strong>Generated:</strong> ${esc(timestamp)}</span>
      <span><strong>Tables:</strong> ${esc(list(analysis.tables).join(", ") || "—")}</span>
      <span><strong>Recommended:</strong> ${recommended.length}</span>
      <span><strong>Tested, not recommended:</strong> ${notRecommended.length}</span>
    </div>
  </header>

  <div class="notice">
    Recommendations and evidence are reported as returned by the current analysis.
    Query-plan evidence does not by itself guarantee faster execution.
    No legacy score or confidence value is invented by this report.
  </div>

  <section>
    <h2>1. SQL Query</h2>
    <pre>${esc(query)}</pre>
  </section>

  <section>
    <h2>2. Detected Query Features</h2>
    ${renderTable(["Clause", "Detected columns"], featureRows)}
  </section>

  <section>
    <h2>3. Existing Indexes</h2>
    ${renderTable(
      ["Table", "Index name", "Columns", "Type"],
      existingIndexes
    )}
  </section>

  <section>
    <h2>4. Recommended Indexes</h2>
    ${recommendationsHtml}
  </section>

  <section>
    <h2>5. Tested but Not Recommended</h2>
    ${notRecommendedHtml}
  </section>

  ${
    otherHtml
      ? `<section><h2>6. Other Candidate Results</h2>${otherHtml}</section>`
      : ""
  }

  <section>
    <h2>7. Existing-Index Rejections</h2>
    ${rejectedHtml}
  </section>

  <section>
    <h2>8. Query Plan</h2>
    ${planHtml}
  </section>

  <section>
    <h2>9. Analysis Summary</h2>
    <p>Analysis data is taken from the current result supplied by the application.</p>
    <p><strong>Tables:</strong> ${esc(list(analysis.tables).join(", ") || "—")}</p>
    <p><strong>Total candidates:</strong> ${recommendations.length}</p>
    <p><strong>Recommended candidates:</strong> ${recommended.length}</p>
    <p><strong>Tested but not recommended:</strong> ${notRecommended.length}</p>
    <p><strong>Rejected due to existing coverage:</strong> ${rejected.length}</p>
  </section>
</div>
</body>
</html>`;
}

/* ---------- Export component ---------- */

export default function ExportButton({ query, result, plan, schema }) {
  const [feedback, setFeedback] = useState("");

  if (!result) return null;

  function flash(message) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2600);
  }

  function createReportBlob() {
    const html = buildHtmlReport(
      query,
      result,
      plan,
      schema,
      formatTime(new Date())
    );

    return new Blob([html], { type: "text/html;charset=utf-8" });
  }

  function openReport() {
    const url = URL.createObjectURL(createReportBlob());
    const reportWindow = window.open(url, "_blank");

    if (!reportWindow) {
      URL.revokeObjectURL(url);
      flash("Allow pop-ups to open the printable report.");
      return;
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    flash("Current analysis report opened.");
  }

  function downloadHtml() {
    const url = URL.createObjectURL(createReportBlob());
    const link = document.createElement("a");

    link.href = url;
    link.download = `index-report-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Current analysis report downloaded.");
  }

  function downloadJson() {
    const payload = {
      generated: new Date().toISOString(),
      query,
      analysis: result.analysis ?? {},
      recommendations: list(result.recommendations),
      rejected_candidates: list(result.rejected_candidates),
      query_plan: plan ?? null,
      schema: schema ?? null,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `index-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Current analysis JSON exported.");
  }

  return (
    <div className="export-row">
      <button
        className="export-btn export-btn-print"
        type="button"
        onClick={openReport}
      >
        🖨 Print / Save as PDF
      </button>

      <button
        className="export-btn"
        type="button"
        onClick={downloadHtml}
      >
        ⬇ Download Report
      </button>

      <button
        className="export-btn export-btn-secondary"
        type="button"
        onClick={downloadJson}
      >
        {"{ }"} Export JSON
      </button>

      {feedback && (
        <span className="export-feedback" role="status">
          {feedback}
        </span>
      )}
    </div>
  );
}
