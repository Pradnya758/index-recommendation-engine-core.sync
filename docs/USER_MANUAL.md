# User Manual

## Start the Application

Start the FastAPI backend on port `8000`, start the Vite frontend, and open `http://127.0.0.1:5173`. See the [Getting Started section](../README.md#getting-started) for installation and run commands.

## Analyze a Query

1. Open **Analyze**.
2. Choose a supplied example or enter a single SQLite `SELECT` query against the demonstration schema.
3. Select **Run Analysis**.
4. Review the detected features, recommendations, rejected candidates, and current query plan.

The editor accepts read queries only. Generated index statements are displayed for learning and are not applied to the database.

## Understand the Result

The **Recommendations** view shows each candidate's table, columns, generated SQL, score, confidence, reasons, and query evidence. If no new index is recommended, inspect the rejected candidates to see whether a primary key or existing index already covers the query.

Use **Query Analysis** to review columns detected in equality filters, range filters, joins, `ORDER BY`, and `GROUP BY`. Use **Analysis Steps** for a stage-by-stage explanation of how the result was produced.

## Explore Visualizations

Open **Visualize** after running an analysis. The available views cover execution flow, table scans, B+ tree traversal, and current-versus-conceptual plan comparison. See [Visualizations](VISUALIZATION.md) for each model's scope.

## Use the AI Tutor

Run an analysis first, then open **AI Tutor** and request an explanation. The Tutor explains the current recommendation and can answer follow-up questions using the same result as context. A deterministic local explanation is available when the optional remote integration is not configured or fails.

The Tutor does not generate or change the authoritative index recommendation.

## Reopen History

Successful analyses are saved automatically. Open **History** to browse earlier queries, restore a result in the analysis workspace, delete an entry, or clear the history.

## Export a Result

After an analysis, use the export controls to:

- Download the raw analysis as JSON.
- Download a formatted HTML report.
- Open a printable report and use the browser's print function to save it as PDF.

## Learn and Practice

Use the learning resources to review database and indexing concepts, browse example queries, and complete the knowledge test. The built-in algorithm, limitations, testing, and AI-usage views provide additional project context.

## Demonstration Database

The application operates on the included `students`, `customers`, `products`, and `orders` tables. Queries referencing tables outside this controlled schema are rejected.

## Common Issues

| Issue | Resolution |
| --- | --- |
| **Run Analysis** is disabled | Enter a non-empty `SELECT` query. |
| The frontend cannot reach the backend | Confirm that Uvicorn is running on port `8000`. |
| A table does not exist | Use a table from the included demonstration schema. |
| No recommendation is returned | Check rejected candidates for existing-index or primary-key coverage. |
| A visualization has no analysis data | Run or restore an analysis first. |
| The AI Tutor has nothing to explain | Run or restore an analysis before opening the Tutor. |