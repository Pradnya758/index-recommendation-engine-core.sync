
# Recommendation Algorithm

The recommendation engine is deterministic and evidence-based. AI is not used to create, score, rank, or override index recommendations. The engine analyzes SQL features, inspects the schema, applies SQLite-specific rules, and evaluates candidate indexes using isolated SQLite query-plan experiments.

## Pipeline

1. **Validation:** SQLGlot parses the input using the SQLite dialect. Empty input, multiple statements, and statements other than a supported single query are rejected.
2. **Parsing:** The analyzer builds an abstract syntax tree, resolves table aliases, and verifies tables and columns against the inspected schema.
3. **Feature extraction:** The analyzer collects columns and expressions used in equality filters, range filters, joins, `ORDER BY`, `GROUP BY`, and other supported query features.
4. **Schema inspection:** Existing indexes, indexed columns, and primary-key metadata are inspected to identify existing access paths and possible redundancy.
5. **Candidate generation:** The engine creates single-column candidates and selected composite candidates based on extracted query features.
6. **Redundancy filtering:** Candidates are checked against primary keys and existing indexes. Redundancy decisions must account for relevant index properties and should not rely on column names alone.
7. **Evidence validation:** Candidate indexes are evaluated in an isolated SQLite database copy. The engine compares baseline and candidate query plans and records whether the candidate is used and whether relevant plan changes occur.
8. **Output:** The API returns recommendations, rejected candidates, applicable SQLite rules, evidence, evidence status, and SQL statements where available.

## SQLite Rules

The rule catalogue contains the following rules:

| Rule | Purpose |
| --- | --- |
| R1 | Search predicates and filtering conditions |
| R2 | Composite indexes, leftmost-prefix behavior, and range exceptions |
| R3 | Covering-index opportunities |
| R4 | Sorting and grouping |
| R5 | Join access paths |
| R6 | Expressions, functions, and `LIKE` conditions |
| R7 | Statistics and uncertainty |
| R8 | Redundant or overlapping indexes |
| R9 | Rowid and primary-key access |
| R10 | General index storage and write-overhead trade-offs |
| R11 | Composite-index column-order design |

These rules explain relevant database principles and candidate considerations. A rule match alone does not prove that an index improves execution. Recommendations should be interpreted alongside schema information and query-plan evidence.

## Evidence Status

Recommendations use three evidence statuses:

- **SUPPORTED:** The isolated experiment provides relevant query-plan evidence supporting the candidate.
- **UNCHANGED:** The experiment did not show a relevant query-plan change.
- **UNCERTAIN:** The experiment failed or the available evidence is insufficient to determine the candidate's effect.

The experiment compares the query plan before and after creating a candidate index in an isolated database copy. Relevant evidence can include a table scan being replaced by an indexed search or a temporary B-tree operation being eliminated.

A changed query plan does not prove faster execution. The evidence describes the observed plan, not a guaranteed performance improvement. Execution-time benchmarks are required to establish actual timing differences.

## Candidate Generation

The engine generates candidate indexes from the query features supported by its analyzer. Candidate types may include single-column indexes for search predicates, join columns, sorting, or grouping, as well as selected composite indexes.

Composite candidates are considered where the detected query features justify examining multiple columns together. Column order matters: SQLite composite indexes generally follow leftmost-prefix behavior, and equality, range, and ordering requirements can affect whether an index is useful.

Candidate generation is an educational strategy, not an exhaustive search of every possible index. The engine's output depends on the SQL features and schema information it can recognize.

## Redundancy Rules

The engine inspects existing indexes and primary-key metadata to identify candidates that may be unnecessary.

Index redundancy cannot always be decided by comparing column lists alone. Uniqueness, partial-index predicates, collations, indexed expressions, and column order can affect whether two indexes are equivalent or whether one can replace another.

Rejected candidates should include an explanation when the engine has enough information to provide one. A candidate that appears to overlap with an existing index should not be described as redundant unless the available metadata supports that conclusion.

## Generated SQL

Recommendations may include quoted `CREATE INDEX` SQL and a matching `DROP INDEX IF EXISTS` statement where applicable. These statements are provided for inspection and experimentation; generating a recommendation does not itself apply the index to the original database.

The SQL Workspace provides a separate environment for experimenting with SQL. Changes made in that isolated workspace do not modify the original demonstration database.

## Complexity

Parsing and feature extraction depend on the size and structure of the query. Candidate generation depends on the number of extracted features and the composite candidates considered. Redundancy filtering depends on the candidates and existing schema indexes. Sorting, where performed, depends on the number of candidates being ordered.

Isolated evidence collection adds work for copying the demonstration database, inspecting metadata, creating candidate indexes, running analysis, and obtaining query plans. Actual cost depends on database size and the number of candidates evaluated.

## Limitations

The engine is intended for education and experimentation, not as a replacement for a production database optimizer.

- Query-plan evidence is not execution-time benchmarking.
- Workload frequency and the importance of individual queries are not comprehensively modeled.
- Data distribution and selectivity may not be fully represented by the available evidence.
- A candidate index may not be used by SQLite for every query or dataset.
- Indexes consume storage and can add work to `INSERT`, `UPDATE`, and `DELETE` operations.
- SQL, schema structures, and index features are limited to what the analyzer and evidence collector support.
- A recommendation or a favorable query-plan change does not guarantee faster execution in every workload.
