import sqlite3
from dataclasses import dataclass

from app.models.schemas import QueryFeatures
from app.services.demo_database import get_demo_database_path


@dataclass(frozen=True)
class CandidateEvidence:
    table: str
    columns: tuple[str, ...]
    baseline_plan: tuple[str, ...]
    candidate_plan: tuple[str, ...]
    table_row_count: int
    distinct_counts: tuple[int, ...]
    distinct_ratios: tuple[float, ...]
    result_row_count: int | None
    predicate_selectivity: float | None
    candidate_used: bool
    plan_changed: bool
    scan_replaced_by_search: bool
    temp_btree_removed: bool
    composite_prefix_used: bool
    existing_indexes: tuple[tuple[str, tuple[str, ...]], ...]
    primary_key: tuple[str, ...]
    experiment_succeeded: bool = True
    error: str | None = None


def collect_candidate_evidence(
    query: str,
    table: str,
    columns: tuple[str, ...],
    features: QueryFeatures,
) -> CandidateEvidence:
    """Evaluate one candidate in an isolated in-memory copy of the demo database."""
    source = sqlite3.connect(get_demo_database_path())
    experiment = sqlite3.connect(":memory:")
    try:
        source.backup(experiment)
        valid_columns, existing_indexes, primary_key = _schema_metadata(experiment, table)
        if not columns or any(column not in valid_columns for column in columns):
            raise ValueError("Candidate contains a column that is not present in the inspected table.")

        experiment.execute("ANALYZE")
        baseline_plan = _query_plan(experiment, query)
        table_row_count = experiment.execute(f"SELECT COUNT(*) FROM {_quote(table)}").fetchone()[0]
        distinct_counts = tuple(
            experiment.execute(
                f"SELECT COUNT(DISTINCT {_quote(column)}) FROM {_quote(table)}"
            ).fetchone()[0]
            for column in columns
        )
        distinct_ratios = tuple(
            count / table_row_count if table_row_count else 0.0 for count in distinct_counts
        )
        result_row_count, predicate_selectivity = _query_selectivity(
            experiment, query, table_row_count, features
        )

        index_name = f"idx_experiment_{table}_{'_'.join(columns)}"
        quoted_columns = ", ".join(_quote(column) for column in columns)
        experiment.execute(
            f"CREATE INDEX {_quote(index_name)} ON {_quote(table)} ({quoted_columns})"
        )
        experiment.execute("ANALYZE")
        candidate_plan = _query_plan(experiment, query)

        baseline_target_scan = _has_target_scan(baseline_plan, table)
        candidate_target_search = _has_target_search(candidate_plan, table)
        candidate_used = any(index_name.casefold() in step.casefold() for step in candidate_plan)
        baseline_temp_btree = _has_temp_btree(baseline_plan)
        candidate_temp_btree = _has_temp_btree(candidate_plan)
        composite_prefix_used = len(columns) > 1 and candidate_used and _uses_columns(
            candidate_plan, columns
        )

        return CandidateEvidence(
            table=table,
            columns=columns,
            baseline_plan=baseline_plan,
            candidate_plan=candidate_plan,
            table_row_count=table_row_count,
            distinct_counts=distinct_counts,
            distinct_ratios=distinct_ratios,
            result_row_count=result_row_count,
            predicate_selectivity=predicate_selectivity,
            candidate_used=candidate_used,
            plan_changed=baseline_plan != candidate_plan,
            scan_replaced_by_search=baseline_target_scan and candidate_target_search,
            temp_btree_removed=baseline_temp_btree and not candidate_temp_btree,
            composite_prefix_used=composite_prefix_used,
            existing_indexes=existing_indexes,
            primary_key=primary_key,
        )
    finally:
        experiment.close()
        source.close()


def failed_candidate_evidence(
    table: str, columns: tuple[str, ...], error: Exception
) -> CandidateEvidence:
    return CandidateEvidence(
        table=table,
        columns=columns,
        baseline_plan=(),
        candidate_plan=(),
        table_row_count=0,
        distinct_counts=(),
        distinct_ratios=(),
        result_row_count=None,
        predicate_selectivity=None,
        candidate_used=False,
        plan_changed=False,
        scan_replaced_by_search=False,
        temp_btree_removed=False,
        composite_prefix_used=False,
        existing_indexes=(),
        primary_key=(),
        experiment_succeeded=False,
        error=type(error).__name__,
    )


def _query_plan(connection: sqlite3.Connection, query: str) -> tuple[str, ...]:
    return tuple(row[3] for row in connection.execute(f"EXPLAIN QUERY PLAN {query}"))


def _schema_metadata(
    connection: sqlite3.Connection, table: str
) -> tuple[set[str], tuple[tuple[str, tuple[str, ...]], ...], tuple[str, ...]]:
    table_rows = connection.execute(f"PRAGMA table_info({_quote(table)})").fetchall()
    if not table_rows:
        raise ValueError("Candidate table is not present in the experiment database.")
    valid_columns = {row[1] for row in table_rows}
    primary_key = tuple(row[1] for row in sorted(table_rows, key=lambda row: row[5]) if row[5])
    indexes = []
    for index_row in connection.execute(f"PRAGMA index_list({_quote(table)})"):
        index_name = index_row[1]
        index_columns = tuple(
            row[2] for row in connection.execute(f"PRAGMA index_info({_quote(index_name)})")
        )
        indexes.append((index_name, index_columns))
    return valid_columns, tuple(indexes), primary_key


def _query_selectivity(
    connection: sqlite3.Connection,
    query: str,
    table_row_count: int,
    features: QueryFeatures,
) -> tuple[int | None, float | None]:
    if (
        table_row_count == 0
        or len(features.tables) != 1
        or not features.where_conditions
        or features.group_by_columns
    ):
        return None, None
    result_row_count = connection.execute(
        f"SELECT COUNT(*) FROM ({query}) AS evidence_query"
    ).fetchone()[0]
    return result_row_count, min(result_row_count / table_row_count, 1.0)


def _has_target_scan(plan: tuple[str, ...], table: str) -> bool:
    table_name = table.casefold()
    return any(
        "scan " in step.casefold() and table_name in step.casefold() for step in plan
    )


def _has_target_search(plan: tuple[str, ...], table: str) -> bool:
    table_name = table.casefold()
    return any(
        "search " in step.casefold() and table_name in step.casefold() for step in plan
    )


def _has_temp_btree(plan: tuple[str, ...]) -> bool:
    return any("use temp b-tree" in step.casefold() for step in plan)


def _uses_columns(plan: tuple[str, ...], columns: tuple[str, ...]) -> bool:
    plan_text = " ".join(plan).casefold()
    positions = [plan_text.find(f"{column.casefold()}=") for column in columns]
    return all(position >= 0 for position in positions) and positions == sorted(positions)


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'