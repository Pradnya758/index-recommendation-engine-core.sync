# Visualizations

The application includes four interactive learning views. They connect a completed analysis to familiar database concepts without claiming to reproduce SQLite's internal storage structures.

## Execution Flow

The execution-flow view presents the stages from query submission through validation, parsing, feature extraction, candidate generation, recommendation, planning, and result presentation. It is a conceptual overview of the application's analysis pipeline.

## Table Scan

The table-scan view uses D3 to compare a sequential row scan with a direct indexed lookup. Its small visual dataset and row counts illustrate the difference between examining rows one by one and navigating through an index; they are not query benchmarks.

## B+ Tree

The B+ tree view illustrates traversal from internal nodes to a leaf value. Playback controls support play, pause, stepping, reset, and speed changes so learners can inspect the lookup process at their own pace.

The tree is a conceptual teaching model. It does not expose or recreate SQLite's actual page format, node capacity, or balancing behavior.

## Plan Comparison

The plan-comparison view places the current SQLite `EXPLAIN QUERY PLAN` output beside a conceptual path using the proposed index. The current plan comes from SQLite, while the proposed path explains the expected indexing idea without installing the index or measuring performance.

## Using the Views

Run an analysis before opening data-dependent views such as the table scan and plan comparison. Use the tabs to switch among visualizations and the playback controls where available to move through each illustration.