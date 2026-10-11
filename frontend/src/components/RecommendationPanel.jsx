
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
              <div className="rec-score">✓</div>
              <div className="rec-score-lbl">
                SQLite evidence
              </div>
            </div>
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
            <div>
              <div className="rec-sec-title">
                Why this helps
              </div>

              {rec.reasons?.length > 0 ? (
                <ul className="rec-list">
                  {rec.reasons.map((reason, index) => (
                    <li key={`${reason}-${index}`}>{reason}</li>
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

            <div>
              <div className="rec-sec-title">
                Query evidence
              </div>

              <ul className="rec-list">
                {(rec.evidence ?? []).map((item, index) => (
                  <li
                    key={`${item.feature}-${item.column}-${index}`}
                  >
                    {item.detail}
                  </li>
                ))}
              </ul>
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
            These candidate indexes were tested against SQLite's
            query plan, but the available evidence was insufficient
            to recommend them.
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

                <div style={{ marginTop: "4px" }}>
                  {(rec.reasons ?? []).map((reason, index) => (
                    <div key={`${reason}-${index}`}>• {reason}</div>
                  ))}
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
                {candidate.reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
