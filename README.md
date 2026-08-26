# Index Recommendation Engine

The dashboard includes a transparent, rule-based index recommendation engine and interactive educational visualizations. It uses SQLGlot to extract query features and SQLite schema metadata to reject duplicate, primary-key, and already-covered index candidates. AI, history, export, and sandbox benchmarking are intentionally not included yet.

## Run the backend

From the `backend` directory, activate the existing virtual environment and start Uvicorn:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive documentation is at `http://127.0.0.1:8000/docs`.

## Run the dashboard

In a second terminal, start the React dashboard from `frontend` after the backend is running:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` requests to the local FastAPI server, so the SQL input, schema explorer, recommendations, query analysis, and query-plan panels use the real backend rather than hardcoded results.

## Educational visualizations

After running an analysis, the dashboard includes a step-by-step analysis flow, a table-scan simulation, a conceptual B+ tree traversal, and a before/after plan comparison. The table scan and B+ tree are labeled educational models, not exact SQLite internals. The comparison uses actual current `EXPLAIN QUERY PLAN` output, but the proposed indexed path is clearly labeled conceptual because sandbox benchmarking is not implemented yet.

The demo database is generated automatically at `backend/app/data/index_engine_demo.db` on its first inspection. It includes `students`, `customers`, `products`, and 5,000 `orders` rows, with a deliberately small set of existing indexes.

## Phase 1 endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirm the backend is running. |
| `GET` | `/api/schema` | Return demo tables, columns, types, primary keys, and indexes. |
| `POST` | `/api/sql/validate` | Validate one SQLite `SELECT` query. |
| `POST` | `/api/query-plan` | Return `EXPLAIN QUERY PLAN` output for a valid `SELECT` query. |
| `POST` | `/api/recommendations` | Analyze a valid query and return rule-based index recommendations. |

Use this JSON body for the two `POST` endpoints:

```json
{
  "query": "SELECT * FROM orders WHERE customer_id = 42"
}
```

Only one `SELECT` statement is accepted. Data-changing and schema-changing statements such as `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, and `CREATE` return a clear `422` validation error.

## Recommendation rules

The engine is deterministic and does not use AI. It extracts equality and range filters, join columns, `ORDER BY` columns, and `GROUP BY` columns. It produces single-column candidates and composites with equality columns before one range column. Single-column scores accumulate equality filter `45`, join `35`, range filter `25`, and sorting/grouping `15` evidence; composite predicate candidates receive `65`. Candidates covered by an existing index or by a primary key are returned as rejected candidates instead of recommendations.

## Tests

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
```
