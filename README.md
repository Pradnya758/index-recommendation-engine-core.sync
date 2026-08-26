# Index Recommendation Engine

Phase 1 provides a FastAPI backend with a reproducible SQLite demo database, safe `SELECT` validation, schema/index inspection, and SQLite query-plan inspection. Index recommendations and the frontend dashboard are intentionally not included yet.

## Run the backend

From the `backend` directory, activate the existing virtual environment and start Uvicorn:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive documentation is at `http://127.0.0.1:8000/docs`.

The demo database is generated automatically at `backend/app/data/index_engine_demo.db` on its first inspection. It includes `students`, `customers`, `products`, and 5,000 `orders` rows, with a deliberately small set of existing indexes.

## Phase 1 endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirm the backend is running. |
| `GET` | `/api/schema` | Return demo tables, columns, types, primary keys, and indexes. |
| `POST` | `/api/sql/validate` | Validate one SQLite `SELECT` query. |
| `POST` | `/api/query-plan` | Return `EXPLAIN QUERY PLAN` output for a valid `SELECT` query. |

Use this JSON body for the two `POST` endpoints:

```json
{
  "query": "SELECT * FROM orders WHERE customer_id = 42"
}
```

Only one `SELECT` statement is accepted. Data-changing and schema-changing statements such as `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, and `CREATE` return a clear `422` validation error.

## Tests

From `backend`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
```
