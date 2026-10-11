
import sqlite3
from dataclasses import dataclass

from app.models.schemas import QueryFeatures
from app.services.real_database import REAL_DATABASE_PATH


@dataclass(frozen=True)
class RealCandidateEvidence:
    table: str
    columns: tuple[str, ...]
    baseline_plan: tuple[str, ...]
    candidate_plan: tuple[str, ...]
    table_row_count: int
    candidate_used: bool
    plan_changed: bool
    scan_replaced_by_search: bool
    temp_btree_removed: bool
    composite_prefix_used: bool
    existing_indexes: tuple[tuple[str, tuple[str, ...]], ...]
    primary_key: tuple[str, ...]
    experiment_succeeded: bool = True
    error: str | None = None


def collect_real_candidate_evidence(
    query: str,
    table: str,
    columns: tuple[str, ...],
    features: QueryFeatures,
) -> RealCandidateEvidence:
    """Compare SQLite query plans before and after adding a test index."""

    source = sqlite3.connect(REAL_DATABASE_PATH)
    experiment = sqlite3.connect(":memory:")

    try:
        source.backup(experiment)

        valid_columns, existing_indexes, primary_key = _schema_metadata(
            experiment,
            table,
        )

        if not columns or any(column not in valid_columns for column in columns):
            raise ValueError(
                "Candidate contains a column that is not present "
                "in the inspected table."
            )

        # Gather statistics before evaluating the baseline plan.
        experiment.execute("ANALYZE")

        baseline_plan = _query_plan(experiment, query)

        table_row_count = experiment.execute(
            f"SELECT COUNT(*) FROM {_quote(table)}"
        ).fetchone()[0]

        index_name = f"idx_real_experiment_{table}_{'_'.join(columns)}"
        quoted_columns = ", ".join(_quote(column) for column in columns)

        # The index exists only in this isolated in-memory experiment.
        experiment.execute(
            f"CREATE INDEX {_quote(index_name)} "
            f"ON {_quote(table)} ({quoted_columns})"
        )
        experiment.execute("ANALYZE")

        candidate_plan = _query_plan(experiment, query)

        baseline_target_scan = _has_target_scan(baseline_plan, table)
        candidate_target_search = _has_target_search(candidate_plan, table)

        candidate_used = any(
            index_name.casefold() in step.casefold()
            for step in candidate_plan
        )

        baseline_temp_btree = _has_temp_btree(baseline_plan)
        candidate_temp_btree = _has_temp_btree(candidate_plan)

        composite_prefix_used = (
            len(columns) > 1
            and candidate_used
            and _uses_columns(candidate_plan, columns)
        )

        return RealCandidateEvidence(
            table=table,
            columns=columns,
            baseline_plan=baseline_plan,
            candidate_plan=candidate_plan,
            table_row_count=table_row_count,
            candidate_used=candidate_used,
            plan_changed=baseline_plan != candidate_plan,
            scan_replaced_by_search=(
                baseline_target_scan and candidate_target_search
            ),
            temp_btree_removed=(
                baseline_temp_btree and not candidate_temp_btree
            ),
            composite_prefix_used=composite_prefix_used,
            existing_indexes=existing_indexes,
            primary_key=primary_key,
        )

    except Exception as error:
        return failed_real_candidate_evidence(table, columns, error)

    finally:
        experiment.close()
        source.close()


def failed_real_candidate_evidence(
    table: str,
    columns: tuple[str, ...],
    error: Exception,
) -> RealCandidateEvidence:
    return RealCandidateEvidence(
        table=table,
        columns=columns,
        baseline_plan=(),
        candidate_plan=(),
        table_row_count=0,
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


def _query_plan(
    connection: sqlite3.Connection,
    query: str,
) -> tuple[str, ...]:
    clean_query = _clean_query(query)

    return tuple(
        row[3]
        for row in connection.execute(
            f"EXPLAIN QUERY PLAN {clean_query}"
        )
    )


def _schema_metadata(
    connection: sqlite3.Connection,
    table: str,
) -> tuple[
    set[str],
    tuple[tuple[str, tuple[str, ...]], ...],
    tuple[str, ...],
]:
    table_rows = connection.execute(
        f"PRAGMA table_info({_quote(table)})"
    ).fetchall()

    if not table_rows:
        raise ValueError(
            "Candidate table is not present in the real database."
        )

    valid_columns = {row[1] for row in table_rows}

    primary_key = tuple(
        row[1]
        for row in sorted(table_rows, key=lambda row: row[5])
        if row[5]
    )

    indexes = []

    for index_row in connection.execute(
        f"PRAGMA index_list({_quote(table)})"
    ):
        index_name = index_row[1]

        index_columns = tuple(
            row[2]
            for row in connection.execute(
                f"PRAGMA index_info({_quote(index_name)})"
            )
        )

        indexes.append((index_name, index_columns))

    return valid_columns, tuple(indexes), primary_key


def _has_target_scan(
    plan: tuple[str, ...],
    table: str,
) -> bool:
    table_name = table.casefold()

    return any(
        "scan " in step.casefold() and table_name in step.casefold()
        for step in plan
    )


def _has_target_search(
    plan: tuple[str, ...],
    table: str,
) -> bool:
    table_name = table.casefold()

    return any(
        "search " in step.casefold() and table_name in step.casefold()
        for step in plan
    )


def _has_temp_btree(plan: tuple[str, ...]) -> bool:
    return any("use temp b-tree" in step.casefold() for step in plan)


def _uses_columns(
    plan: tuple[str, ...],
    columns: tuple[str, ...],
) -> bool:
    plan_text = " ".join(plan).casefold()

    positions = [
        plan_text.find(f"{column.casefold()}=")
        for column in columns
    ]

    return (
        all(position >= 0 for position in positions)
        and positions == sorted(positions)
    )


def _clean_query(query: str) -> str:
    """Remove a trailing statement terminator before EXPLAIN."""
    return query.strip().rstrip(";").strip()


def _quote(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'
