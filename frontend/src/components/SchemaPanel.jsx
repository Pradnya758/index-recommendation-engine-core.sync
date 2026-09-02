export default function SchemaPanel({ schema, error }) {
  if (error) {
    return (
      <div>
        <div className="eyebrow">Database</div>
        <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "6px" }}>⚠ Schema unavailable: {error}</p>
      </div>
    );
  }

  if (!schema) {
    return (
      <div>
        <div className="eyebrow">Database</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "11px", color: "var(--text2)" }}>
          <span className="spinner" style={{ width: "12px", height: "12px" }} />
          Loading schema…
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div className="eyebrow">Schema Explorer</div>
        <span className="rp-db-dot" />
      </div>
      <div className="rp-db-row">
        <span className="rp-db-dot" />
        {schema.database}
      </div>
      {schema.tables.map((table) => (
        <details key={table.name} className="tbl-details">
          <summary className="tbl-summary">
            <span>{table.name}</span>
            <span className="tbl-col-count">{table.columns.length} cols</span>
          </summary>
          <div className="col-list">
            {table.columns.map((col) => (
              <div className="col-row" key={col.name}>
                <span className="col-nm">{col.name}</span>
                <span className="col-tp">{col.data_type}</span>
                {col.primary_key_position && <span className="col-pk">PK</span>}
              </div>
            ))}
          </div>
          {table.indexes.length > 0 && (
            <div className="idx-list">
              <div className="idx-lbl">Indexes</div>
              {table.indexes.map((idx) => (
                <div className="idx-item" key={idx.name}>{idx.name} ({idx.columns.join(", ")})</div>
              ))}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
