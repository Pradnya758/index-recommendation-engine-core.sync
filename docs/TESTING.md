# Testing

The backend test suite uses Pytest, pytest-asyncio, httpx, and FastAPI's TestClient.

## Run the Suite

From the `backend` directory with the virtual environment activated:

```bash
python -m pytest tests -q
```

On Windows, the environment's interpreter can also be invoked directly:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q
```

## Coverage

The suite covers:

- Empty, malformed, multiple, and non-`SELECT` statement rejection
- SQL normalization and statement validation
- Schema discovery and SQLite query plans
- Equality, range, join, ordering, grouping, and composite candidates
- Scoring and confidence thresholds
- Existing-index and primary-key rejection
- Analysis API response contracts and errors
- History creation, retrieval, deletion, and clearing
- AI Tutor local fallback behavior

## Representative Scenarios

| Scenario | Expected behavior |
| --- | --- |
| `WHERE status = 'paid'` | Recommend `orders.status` with equality-filter evidence. |
| Existing `orders.customer_id` index | Reject the duplicate candidate. |
| Join on a non-indexed foreign-key column | Recommend the uncovered join column and reject a primary-key duplicate. |
| `ORDER BY order_date` | Produce a lower-scored ordering candidate. |
| Equality plus range filters | Generate an equality-first composite candidate. |
| Primary-key lookup | Return no new recommendation and explain the rejection. |

## Current Scope

The repository contains backend automated tests. The frontend provides development, build, and preview scripts but does not currently define an automated unit or end-to-end test command in `frontend/package.json`.

Performance observations shown in the application are not backed by a repeatable benchmark harness. The project therefore does not claim measured query speedups or guaranteed response-time targets.