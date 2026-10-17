
import { useEffect, useState } from "react";
import {
  createWorkspace,
  executeWorkspaceSQL,
  explainWorkspaceQuery,
  deleteWorkspace,
  getWorkspaceSchema,
} from "../api";

export default function SQLWorkspaceView() {
  const [sessionId, setSessionId] = useState("");
  const [sql, setSql] = useState("SELECT * FROM products LIMIT 10;");
  const [results, setResults] = useState([]);
  const [queryPlan, setQueryPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [schema, setSchema] = useState([]);

  async function startWorkspace() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const workspace = await createWorkspace();

      setSessionId(workspace.session_id);
      setSchema(workspace.schema?.tables || []);
      setResults([]);
      setQueryPlan(null);
      setMessage("New isolated SQL workspace created.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startWorkspace();

    return () => {
      // Workspace cleanup is handled when the user explicitly resets it.
    };
  }, []);

  
async function runSQL() {
  if (!sessionId) {
    setError("Workspace is not ready. Please wait or reset the workspace.");
    return;
  }

  setLoading(true);
  setError("");
  setMessage("");
  setQueryPlan(null);

  try {
    const response = await executeWorkspaceSQL(sessionId, sql);

    setResults(response.results || []);

    const schemaResponse = await getWorkspaceSchema(sessionId);
    setSchema(schemaResponse.tables || []);

    setMessage("SQL executed successfully.");
  } catch (e) {
    setError(e.message);
    setResults([]);
  } finally {
    setLoading(false);
  }
}


  
async function inspectPlan() {
  if (!sessionId) {
    setError("Workspace is not ready. Please wait or reset the workspace.");
    return;
  }

  setLoading(true);
  setError("");
  setMessage("");

  try {
    const response = await explainWorkspaceQuery(sessionId, sql);

    console.log("QUERY PLAN RESPONSE:", response);

    setQueryPlan(response);
    setResults([]);
    setMessage("Query plan generated successfully.");
  } catch (e) {
    setError(e.message);
    setQueryPlan(null);
  } finally {
    setLoading(false);
  }
}


  function clearEditor() {
    setSql("");
    setError("");
    setMessage("");
    setResults([]);
    setQueryPlan(null);
  }

  async function resetWorkspace() {
    const confirmed = window.confirm(
      "Reset the SQL workspace? All tables, indexes, and data created in this workspace will be discarded."
    );

    if (!confirmed) {
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (sessionId) {
        await deleteWorkspace(sessionId);
      }

      setSessionId("");
      setSchema([]);
      setResults([]);
      setQueryPlan(null);
      setSql("SELECT * FROM products LIMIT 10;");

      const workspace = await createWorkspace();

      setSessionId(workspace.session_id);
      setSchema(workspace.schema?.tables || []);
      setMessage("Workspace reset successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sql-workspace">
      <header className="sql-workspace-header">
        <div>
          <h1>SQL Workspace</h1>
          <p>
            Experiment with SQL in an isolated SQLite database. Changes here
            do not modify the original demo database.
          </p>
        </div>

        <button
          type="button"
          onClick={resetWorkspace}
          disabled={loading}
        >
          Reset Workspace
        </button>
      </header>

      <div className="sql-workspace-layout">
        <aside className="sql-workspace-schema">
          <h2>Database Schema</h2>

          {schema.length === 0 ? (
            <p>No schema loaded yet.</p>
          ) : (
            schema.map((table) => (
              <details key={table.name}>
                <summary>{table.name}</summary>

                <h3>Columns</h3>
                <ul className="workspace-schema-columns">
                  {table.columns.map((column) => (
                    <li key={column.name}>
                      <strong>{column.name}</strong>
                      <span>{column.type || "No type"}</span>

                      {column.primary_key_position > 0 && (
                        <small>Primary key</small>
                      )}

                      {column.not_null && <small> NOT NULL</small>}
                    </li>
                  ))}
                </ul>

                <h3>Indexes</h3>

                {!table.indexes || table.indexes.length === 0 ? (
                  <p>No indexes found.</p>
                ) : (
                  <ul className="workspace-schema-indexes">
                    {table.indexes.map((index) => (
                      <li key={index.name}>
                        <strong>{index.name}</strong>

                        <div>
                          Columns: {index.columns.join(", ") || "Expression"}
                        </div>

                        <small>
                          {index.unique ? "Unique" : "Non-unique"}
                          {" · "}
                          {index.partial ? "Partial" : "Not partial"}
                          {" · "}
                          Origin: {index.origin}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            ))
          )}
        </aside>

        <div className="sql-workspace-main">
          <label htmlFor="workspace-sql-editor">SQL Editor</label>

          <textarea
            id="workspace-sql-editor"
            value={sql}
            onChange={(event) => setSql(event.target.value)}
            spellCheck={false}
            rows={10}
            placeholder="Write your SQL query here..."
          />

          <div className="sql-workspace-actions">
            <button
              type="button"
              onClick={runSQL}
              disabled={loading || !sessionId}
            >
              {loading ? "Running..." : "Run SQL"}
            </button>

            <button
              type="button"
              onClick={inspectPlan}
              disabled={loading || !sessionId}
            >
              Inspect Query Plan
            </button>

            <button
              type="button"
              onClick={clearEditor}
              disabled={loading}
            >
              Clear Editor
            </button>
          </div>

          {error && (
            <p className="sql-workspace-error">{error}</p>
          )}

          {message && (
            <p className="sql-workspace-message">{message}</p>
          )}

          <section className="sql-workspace-results">
            <h2>Results</h2>

            {results.length === 0 ? (
              <p>Run a query to see its results here.</p>
            ) : (
              results.map((result, index) => (
                <div key={`${index}-${result.statement}`}>
                  <p>
                    <strong>Rows:</strong> {result.row_count}
                    {result.truncated ? " (display limited)" : ""}
                  </p>

                  {result.columns.length > 0 ? (
                    <div className="sql-workspace-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {result.columns.map((column) => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {result.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {result.columns.map((column) => (
                                <td key={column}>
                                  {row[column] == null
                                    ? "NULL"
                                    : String(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>Statement completed.</p>
                  )}
                </div>
              ))
            )}
          </section>

          {queryPlan && (
            <section className="sql-workspace-plan">
              <h2>Query Plan</h2>
              <pre>{JSON.stringify(queryPlan, null, 2)}</pre>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
