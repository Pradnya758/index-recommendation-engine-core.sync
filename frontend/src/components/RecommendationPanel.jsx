
export default function RecommendationPanel({ result, loading }) {
  if (loading) {
    return (
      <div className="az-loading">
        <span className="spinner" />
        Analyzing query structure and index coverage…
      </div>
    );
  }

  if (!result) {
    return (
      <div className="az-empty">
        <div className="az-empty-icon">⚡</div>
        <div className="az-empty-title">No analysis yet</div>
        <div className="az-empty-desc">
          Enter a SELECT query and click Run Analysis to see index
          recommendations.
        </div>
      </div>
    );
  }

  const recommendations = result.recommendations ?? [];
  const rejectedCandidates = result.rejected_candidates ?? [];

  const recommended = recommendations.filter(
    (rec) => rec.recommendation === "recommended"
  );

  const notRecommended = recommendations.filter(
    (rec) => rec.recommendation === "not_recommended"
  );

  const statusLabel = (status) => {
    switch (status) {
      case "SUPPORTED":
        return "✓ SUPPORTED";
      case "UNCHANGED":
        return "— UNCHANGED";
      default:
        return "? UNCERTAIN";
    }
  };

  const statusClass = (status) => {
    switch (status) {
      case "SUPPORTED":
        return "supported";
      case "UNCHANGED":
        return "unchanged";
      default:
        return "uncertain";
    }
  };

  const renderRules = (rules) => {
    if (!rules?.length) {
      return (
        <p
          style={{
            color: "var(--text2)",
            fontSize: "12px",
          }}
        >
          No specific rule was matched for this candidate yet.
        </p>
      );
    }

    return (
      <ul className="rec-list">
        {rules.map((rule) => (
          <li key={rule.rule_id}>
            <strong>
              {rule.rule_id} — {rule.title}
            </strong>

            <div>{rule.description}</div>

            {rule.source_url && (
              <a
                href={rule.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View documentation
              </a>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const renderEvidence = (evidence) => {
    if (!evidence?.length) {
      return (
        <p
          style={{
            color: "var(--text2)",
            fontSize: "12px",
          }}
        >
          No query-plan evidence is available.
        </p>
      );
    }

    return (
      <ul className="rec-list">
        {evidence.map((item, index) => (
          <li
            key={`${item.feature}-${item.column}-${index}`}
          >
            {item.detail}
          </li>
        ))}
      </ul>
    );
  };

  if (!recommendations.length) {
    return (
      <div className="no-rec">
        <div className="no-rec-hdr">
          <span className="no-rec-icon">ℹ️</span>
          <span className="no-rec-title">
            No new index is recommended
          </span>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text2)",
            marginBottom: "8px",
          }}
        >
          This can happen when existing indexes cover the candidates
          or no candidate demonstrates a useful improvement.
        </p>

        {rejectedCandidates.length > 0 && (
          <div className="rejected-list">
            {rejectedCandidates.map((candidate) => (
              <div
                className="rejected-item"
                key={`${candidate.table}-${candidate.columns.join("-")}`}
              >
                {candidate.reason}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Recommended indexes */}
      {recommended.map((rec) => (
        <article
          className="rec-card"
          key={`${rec.table}-${rec.columns.join("-")}`}
        >
          <div className="rec-hdr">
            <div>
              <div className="rec-eyebrow">
                Recommended Index
              </div>

              <div className="rec-name">
                {rec.table}
                <span className="dot">.</span>
                <span className="col">
                  {rec.columns.join(", ")}
                </span>
              </div>
            </div>

            <div className="rec-score-wrap">
              <div className="rec-score">
                {rec.evidence_status === "SUPPORTED"
                  ? "✓"
                  : rec.evidence_status === "UNCHANGED"
                    ? "—"
                    : "?"}
              </div>

              <div className="rec-score-lbl">
                {statusLabel(rec.evidence_status)}
              </div>
            </div>
          </div>

          {/* Evidence status explanation */}
          <div className={`rec-evidence-status ${statusClass(rec.evidence_status)}`}>
            {rec.evidence_status === "SUPPORTED"
              ? "The query plan provides relevant evidence supporting this candidate. This does not prove faster execution."
              : rec.evidence_status === "UNCHANGED"
                ? "The experiment did not show a relevant query-plan change."
                : "The available experiment evidence is insufficient to determine the candidate's effect."}
          </div>

          {/* Create index SQL */}
          <div className="rec-sql">
            <span className="sql-kw">CREATE</span>
            <span className="sql-code">
              {rec.create_index_sql}
            </span>
          </div>

          {/* Drop index SQL */}
          <div className="rec-sql">
            <span className="sql-kw drop">DROP</span>
            <span className="sql-code">
              {rec.drop_index_sql}
            </span>
          </div>

          <div className="rec-body">
            {/* Reasons */}
            <div>
              <div className="rec-sec-title">
                Why this helps
              </div>

              {rec.reasons?.length > 0 ? (
                <ul className="rec-list">
                  {rec.reasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  style={{
                    color: "var(--text2)",
                    fontSize: "12px",
                  }}
                >
                  No positive query-plan improvements were recorded.
                </p>
              )}
            </div>

            {/* Query evidence */}
            <div>
              <div className="rec-sec-title">
                Query evidence
              </div>

              {renderEvidence(rec.evidence)}
            </div>

            {/* Rule catalogue references */}
            <div>
              <div className="rec-sec-title">
                Applicable SQLite rules
              </div>

              {renderRules(rec.rules)}
            </div>

            {/* Index overhead */}
            <div>
              <div className="rec-sec-title">
                Index trade-offs
              </div>

              <p
                style={{
                  color: "var(--text2)",
                  fontSize: "12px",
                }}
              >
                An additional index consumes storage and can add
                maintenance work to INSERT, UPDATE and DELETE
                operations. Consider the overall workload before
                creating it.
              </p>
            </div>
          </div>
        </article>
      ))}

      {/* Tested but not recommended */}
      {notRecommended.length > 0 && (
        <div className="no-rec">
          <div className="no-rec-hdr">
            <span className="no-rec-icon">ℹ️</span>
            <span className="no-rec-title">
              Tested but not recommended
            </span>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text2)",
              marginBottom: "10px",
            }}
          >
            These candidates were tested against SQLite's query
            plan, but the available evidence was insufficient to
            recommend them.
          </p>

          <div className="rejected-list">
            {notRecommended.map((rec) => (
              <div
                className="rejected-item"
                key={`${rec.table}-${rec.columns.join("-")}`}
              >
                <strong>
                  {rec.table}({rec.columns.join(", ")})
                </strong>

                <div
                  className={`rec-evidence-status ${statusClass(rec.evidence_status)}`}
                  style={{ marginTop: "8px" }}
                >
                  {statusLabel(rec.evidence_status)}
                </div>

                <div style={{ marginTop: "4px" }}>
                  {(rec.reasons ?? []).map((reason, index) => (
                    <div key={`${reason}-${index}`}>
                      • {reason}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <strong>Applicable rules</strong>
                  {renderRules(rec.rules)}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <strong>Query evidence</strong>
                  {renderEvidence(rec.evidence)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing index coverage */}
      {rejectedCandidates.length > 0 && (
        <div className="no-rec">
          <div className="no-rec-hdr">
            <span className="no-rec-icon">✓</span>
            <span className="no-rec-title">
              Existing index coverage
            </span>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text2)",
              marginBottom: "8px",
            }}
          >
            These candidates were not recommended because an
            existing index or primary key already covers them.
          </p>

          <div className="rejected-list">
            {rejectedCandidates.map((candidate) => (
              <div
                className="rejected-item"
                key={`${candidate.table}-${candidate.columns.join("-")}`}
              >
                <strong>
                  {candidate.table}({candidate.columns.join(", ")})
                </strong>
                <div>{candidate.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
