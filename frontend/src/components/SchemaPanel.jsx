export default function SchemaPanel({ schema, error }) {
  if (error) {
    return <p className="muted">Schema unavailable: {error}</p>;
  }
  if (!schema) {
    return <p className="muted">Loading demo database...</p>;
  }

  return (
    <section className="side-card schema-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Database</p>
          <h2>Schema explorer</h2>
        </div>
        <span className="database-dot" title="SQLite demo database" />
      </div>
      <p className="muted">{schema.database}</p>
      <div className="schema-tables">
        {schema.tables.map((table) => (
          <details key={table.name} className="table-details">
            <summary>
              <span>{table.name}</span>
              <small>{table.columns.length} columns</small>
            </summary>
            <div className="column-list">
              {table.columns.map((column) => (
                <div className="column-row" key={column.name}>
                  <code>{column.name}</code>
                  <span>{column.data_type}</span>
                  {column.primary_key_position && <b>PK</b>}
                </div>
              ))}
            </div>
            <div className="index-list">
              <p>Existing indexes</p>
              {table.indexes.map((index) => (
                <code key={index.name}>{index.name} ({index.columns.join(", ")})</code>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
