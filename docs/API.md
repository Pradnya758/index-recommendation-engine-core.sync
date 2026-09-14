# API Reference

The FastAPI backend uses the `/api` prefix. When running locally, interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Confirm that the backend is running. |
| `GET` | `/api/schema` | Return demo tables, columns, primary keys, and indexes. |
| `POST` | `/api/sql/validate` | Validate and normalize one SQLite query without executing it. |
| `POST` | `/api/query-plan` | Return SQLite `EXPLAIN QUERY PLAN` steps. |
| `POST` | `/api/recommendations` | Return extracted features, recommendations, and rejected candidates. |
| `GET` | `/api/history` | List saved analyses, newest first. |
| `POST` | `/api/history` | Save recommendation and plan payloads. |
| `GET` | `/api/history/{id}` | Retrieve one history entry. |
| `DELETE` | `/api/history/{id}` | Delete one history entry. |
| `DELETE` | `/api/history` | Clear all history entries. |
| `POST` | `/api/explain` | Explain a completed recommendation and query plan. |
| `POST` | `/api/explain/followup` | Answer a question about the current analysis. |

## Analysis Requests

The validation, query-plan, and recommendation endpoints accept the same request shape:

```json
{
  "query": "SELECT * FROM orders WHERE customer_id = 42"
}
```

These endpoints reject empty input, multiple statements, invalid SQLite syntax, and non-query statements with HTTP `422`. Query-plan and recommendation requests also reject unknown or ambiguous schema references when the query is analyzed against the demonstration database.

## Recommendation Response

The recommendation response contains:

- The normalized query.
- Extracted equality filters, range filters, join columns, ordering columns, and grouping columns.
- Ranked recommendations with table, columns, score, confidence, reasons, evidence, and generated `CREATE INDEX` and `DROP INDEX IF EXISTS` SQL.
- Rejected candidates with the reason each candidate was unnecessary.

## Query Plan Response

The query-plan endpoint validates the query and returns SQLite `EXPLAIN QUERY PLAN` rows. It does not execute the query itself or apply a proposed index.

## History Requests

Create a history entry with the complete recommendation and plan payloads:

```json
{
  "rec": {},
  "plan": {}
}
```

The create endpoint returns HTTP `201` with the new integer ID. Retrieving a missing entry returns HTTP `404`; successful deletion and clearing return HTTP `204`.

## AI Tutor Requests

Request an explanation with the current recommendation and plan payloads:

```json
{
  "rec": {},
  "plan": {}
}
```

For a follow-up question, include a non-empty question of at most 500 characters:

```json
{
  "question": "Why are equality columns placed first?",
  "rec": {},
  "plan": {}
}
```

The Tutor uses the supplied deterministic analysis as context. It does not alter recommendation scores or results.