# Recommendation Algorithm

The recommendation engine is deterministic and rule-based. AI is not used to create, score, rank, or override recommendations.

## Pipeline

1. **Validation:** SQLGlot parses the input with the SQLite dialect. Empty input, multiple statements, and statements other than a single query are rejected.
2. **Parsing:** The analyzer builds an abstract syntax tree, resolves table aliases, and verifies tables against the demonstration schema.
3. **Feature extraction:** The analyzer collects columns used in equality filters, range filters, joins, `ORDER BY`, and `GROUP BY`.
4. **Schema inspection:** Existing indexes and primary keys are read from SQLite metadata.
5. **Candidate generation:** The engine creates single-column candidates and selected composite candidates.
6. **Redundancy filtering:** Candidates covered by a primary key or an existing index's left prefix are rejected.
7. **Scoring and ranking:** Surviving candidates receive project-defined heuristic scores and are sorted deterministically.
8. **Output:** The API returns recommendations, rejected candidates, evidence, confidence, and reversible SQL statements.

## Scoring Rules

| Evidence | Points |
| --- | ---: |
| Equality filter | 45 |
| Join column | 35 |
| Range filter | 25 |
| `ORDER BY` column | 15 |
| `GROUP BY` column | 15 |
| Composite predicate candidate | 65 |

These are fixed educational heuristics. Composite candidates score exactly 65; database evidence, selectivity, query-plan changes, statistics, and measured performance do not add score bonuses. Confidence is a separate response field derived from the score:

| Score | Confidence |
| --- | --- |
| 65 or above | High |
| 35 to 64 | Medium |
| Below 35 | Low |

These weights are project-defined educational heuristics based on query structure. They are not derived from datasets, machine learning, SQLite's cost model, benchmarks, measured timings, or workload statistics.

## Candidate Generation

The engine creates a single-column candidate for each detected feature. If a table has at least two equality-filter columns, it also creates a composite candidate containing those columns. If a table has equality and range filters, it creates another composite candidate with the equality columns first and the first detected range column last.

For each candidate, repeated feature evidence is deduplicated rather than creating duplicate candidates. Recommendations are sorted by descending heuristic score, then table and column names, so the same query and schema produce the same result.

## Redundancy Rules

A candidate is rejected when either of these conditions is true:

- Its leading columns duplicate or extend the table's primary key.
- An existing index on the same table already covers all candidate columns as its left prefix.

Rejected candidates remain in the response with an explanation. This lets learners see why an apparently useful index is unnecessary.

## Generated SQL

Index names use the form `idx_{table}_{column1}_{column2}`. Each recommendation includes quoted `CREATE INDEX` SQL and a matching `DROP INDEX IF EXISTS` statement. The application displays these statements for study; it does not apply recommended indexes to the database.

## Complexity

Parsing and feature extraction scale with the query representation. Candidate generation is linear in the number of extracted feature references, redundancy filtering compares candidates with the small set of indexes on the relevant table, and final ranking sorts the surviving candidates.

The engine is intended for education and experimentation. It does not use workload frequency, cardinality, data distribution, index size, write cost, or measured before-and-after performance.