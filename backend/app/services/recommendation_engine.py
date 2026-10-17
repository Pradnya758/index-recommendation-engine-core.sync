
from __future__ import annotations
from app.services.sqlite_rules import get_sqlite_rules

from collections import defaultdict
from dataclasses import dataclass, field

from app.models.schemas import (
    IndexRecommendation,
    QueryFeatures,
    RecommendationEvidence,
    RecommendationResponse,
    RejectedCandidate,
    SchemaInspectionResponse,
)
from app.services.index_evidence import (
    CandidateEvidence,
    collect_candidate_evidence,
    failed_candidate_evidence,
)
from app.services.sql_analyzer import extract_query_features


@dataclass
class _Candidate:
    table: str
    columns: tuple[str, ...]
    reasons: list[str] = field(default_factory=list)
    evidence: list[RecommendationEvidence] = field(default_factory=list)

    def add(self, reason: str, evidence: RecommendationEvidence) -> None:
        if reason not in self.reasons:
            self.reasons.append(reason)

        if not any(
            item.feature == evidence.feature
            and item.table == evidence.table
            and item.column == evidence.column
            for item in self.evidence
        ):
            self.evidence.append(evidence)


def _priority_order(priority: str) -> int:
    # These are application labels, not official SQLite categories.
    if priority == "highly_preferred":
        return 0
    if priority == "preferred":
        return 1
    return 2


def build_recommendations(
    query: str,
    schema: SchemaInspectionResponse,
    evidence_collector=collect_candidate_evidence,
) -> RecommendationResponse:
    """Generate recommendations using SQLite query-plan evidence."""

    schema_columns = {
        table.name: {column.name for column in table.columns}
        for table in schema.tables
    }

    features = extract_query_features(query, schema_columns)
    candidates = _generate_candidates(features)

    existing_indexes = _existing_indexes(schema)
    primary_keys = _primary_keys(schema)

    recommendations: list[IndexRecommendation] = []
    rejected: list[RejectedCandidate] = []

    for candidate in candidates.values():
        primary_key = primary_keys.get(candidate.table, ())

        rejection_reason = _rejection_reason(
            candidate,
            existing_indexes.get(candidate.table, []),
            primary_key,
        )

        if rejection_reason:
            rejected.append(
                RejectedCandidate(
                    table=candidate.table,
                    columns=list(candidate.columns),
                    reason=rejection_reason,
                )
            )
            continue

        try:
            database_evidence = evidence_collector(
                query,
                candidate.table,
                candidate.columns,
                features,
            )
        except Exception as error:
            database_evidence = failed_candidate_evidence(
                candidate.table,
                candidate.columns,
                error,
            )

        reasons, evidence = _explain_evidence(
            candidate,
            database_evidence,
        )

        recommendation = _recommendation_status(database_evidence)
        priority = _recommendation_priority(database_evidence)

        index_name = _index_name(candidate.table, candidate.columns)
        create_sql = _create_index_sql(
            index_name,
            candidate.table,
            candidate.columns,
        )
        drop_sql = f'DROP INDEX IF EXISTS "{index_name}";'
        recommendations.append(
            IndexRecommendation(
                table=candidate.table,
                columns=list(candidate.columns),
                create_index_sql=create_sql,
                drop_index_sql=drop_sql,
                recommendation=recommendation,
                priority=priority,
                reasons=reasons,
                evidence=evidence,
                rules=_match_sqlite_rules(
                    reasons,
                    candidate,
                    features=features,
                    database_evidence=database_evidence,
                ),
                evidence_status=_evidence_status(database_evidence),
            )
        )

    recommendations.sort(
        key=lambda item: (
            _priority_order(item.priority),
            item.table,
            item.columns,
        )
    )
    rejected.sort(key=lambda item: (item.table, item.columns))

    return RecommendationResponse(
        query=query,
        analysis=features,
        recommendations=recommendations,
        rejected_candidates=rejected,
    )


def _generate_candidates(
    features: QueryFeatures,
) -> dict[tuple[str, tuple[str, ...]], _Candidate]:
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate] = {}

    equality_by_table: dict[str, list[str]] = defaultdict(list)
    range_by_table: dict[str, list[str]] = defaultdict(list)
    order_by_by_table: dict[str, list[str]] = defaultdict(list)

    for column in features.equality_filters:
        equality_by_table[column.table].append(column.column)
        _add_feature(
            candidates,
            column.table,
            (column.column,),
            "equality_filter",
            f"Column {column.table}.{column.column} is used in an equality filter.",
        )

    for column in features.range_filters:
        range_by_table[column.table].append(column.column)
        _add_feature(
            candidates,
            column.table,
            (column.column,),
            "range_filter",
            f"Column {column.table}.{column.column} is used in a range filter.",
        )

    for column in features.join_columns:
        _add_feature(
            candidates,
            column.table,
            (column.column,),
            "join",
            f"Column {column.table}.{column.column} participates in a join.",
        )

    for column in features.order_by_columns:
        order_by_by_table[column.table].append(column.column)
        _add_feature(
            candidates,
            column.table,
            (column.column,),
            "order_by",
            f"Column {column.table}.{column.column} is used for ordering.",
        )

    for column in features.group_by_columns:
        _add_feature(
            candidates,
            column.table,
            (column.column,),
            "group_by",
            f"Column {column.table}.{column.column} is used for grouping.",
        )

    tables = (
        set(equality_by_table)
        | set(range_by_table)
        | set(order_by_by_table)
    )

    for table in sorted(tables):
        equality_columns = _unique(equality_by_table[table])
        range_columns = _unique(range_by_table[table])
        order_columns = _unique(order_by_by_table[table])

        if len(equality_columns) >= 2:
            _add_composite(
                candidates,
                table,
                tuple(equality_columns),
                "Multiple equality filters can be combined into a composite index.",
            )

        if equality_columns and range_columns:
            _add_composite(
                candidates,
                table,
                tuple(equality_columns + [range_columns[0]]),
                "Equality columns followed by a range column can support this query pattern.",
            )

        if equality_columns and order_columns:
            _add_composite(
                candidates,
                table,
                tuple(equality_columns + order_columns),
                "Equality-filter columns followed by ORDER BY columns may allow searching and sorting with one index.",
            )

    return candidates


def _add_feature(
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate],
    table: str,
    columns: tuple[str, ...],
    feature: str,
    reason: str,
) -> None:
    key = (table, columns)
    candidate = candidates.setdefault(
        key,
        _Candidate(table=table, columns=columns),
    )
    candidate.add(
        reason,
        RecommendationEvidence(
            feature=feature,
            table=table,
            column=columns[0],
            detail=reason,
        ),
    )


def _add_composite(
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate],
    table: str,
    columns: tuple[str, ...],
    reason: str,
) -> None:
    key = (table, columns)
    candidate = candidates.setdefault(
        key,
        _Candidate(table=table, columns=columns),
    )
    candidate.add(
        reason,
        RecommendationEvidence(
            feature="composite",
            table=table,
            column=", ".join(columns),
            detail=reason,
        ),
    )


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []

    for value in values:
        if value not in result:
            result.append(value)

    return result


def _evidence_status(database_evidence: CandidateEvidence) -> str:
    """Classify observed SQLite plan evidence without claiming faster execution."""
    if not database_evidence.experiment_succeeded:
        return "UNCERTAIN"

    if not database_evidence.candidate_used and not database_evidence.plan_changed:
        return "UNCHANGED"

    if (
        database_evidence.candidate_used
        and (
            database_evidence.scan_replaced_by_search
            or database_evidence.temp_btree_removed
        )
    ):
        return "SUPPORTED"

    if not database_evidence.plan_changed:
        return "UNCHANGED"

    return "UNCERTAIN"

def _recommendation_status(database_evidence: CandidateEvidence) -> str:
    """
    Recommend only when the candidate is used and the query plan
    shows a relevant observed change.

    A plan change is evidence about SQLite's chosen plan, not proof
    of a measured execution-time improvement.
    """

    if not database_evidence.experiment_succeeded:
        return "not_recommended"

    if not database_evidence.candidate_used:
        return "not_recommended"

    if not database_evidence.plan_changed:
        return "not_recommended"

    if (
        database_evidence.scan_replaced_by_search
        or database_evidence.temp_btree_removed
    ):
        return "recommended"

    return "not_recommended"


def _recommendation_priority(database_evidence: CandidateEvidence) -> str:
    """
    Retain the existing API field for compatibility.

    Priority labels are project-defined descriptions of observed
    plan changes, not official SQLite recommendation categories.
    """

    if not database_evidence.experiment_succeeded:
        return "not_preferred"

    if not database_evidence.candidate_used:
        return "not_preferred"

    if not database_evidence.plan_changed:
        return "not_preferred"

    if (
        database_evidence.scan_replaced_by_search
        and database_evidence.temp_btree_removed
    ):
        return "highly_preferred"

    if (
        database_evidence.scan_replaced_by_search
        or database_evidence.temp_btree_removed
    ):
        return "preferred"

    return "not_preferred"


def _explain_evidence(
    candidate: _Candidate,
    database_evidence: CandidateEvidence,
) -> tuple[list[str], list[RecommendationEvidence]]:
    reasons = list(candidate.reasons)
    evidence = list(candidate.evidence)
    
    column_label = ", ".join(candidate.columns)

    if not database_evidence.experiment_succeeded:
        detail = (
            "SQLite evidence could not be collected: "
            f"{database_evidence.error or 'unknown error'}."
        )
        reasons.append(detail)
        evidence.append(
            RecommendationEvidence(
                feature="evidence_unavailable",
                table=candidate.table,
                column=column_label,
                detail=detail,
            )
        )
        return reasons, evidence

    evidence.append(
        RecommendationEvidence(
            feature="database_statistics",
            table=candidate.table,
            column=column_label,
            detail=(
                "SQLite ANALYZE was run in the isolated experiment "
                "before and after creating the candidate index. "
                "This describes the experiment setup; it does not "
                "by itself establish that the index is beneficial."
            ),
        )
    )

    if database_evidence.candidate_used:
        detail = "SQLite selected the candidate index in the experiment."
    else:
        detail = "SQLite did not select the candidate index in the experiment."

    evidence.append(
        RecommendationEvidence(
            feature="candidate_plan",
            table=candidate.table,
            column=column_label,
            detail=detail,
        )
    )

    if database_evidence.plan_changed:
        detail = "The candidate changed EXPLAIN QUERY PLAN."
    else:
        detail = "The candidate did not change EXPLAIN QUERY PLAN."

    evidence.append(
        RecommendationEvidence(
            feature="plan_change",
            table=candidate.table,
            column=column_label,
            detail=detail,
        )
    )

    if database_evidence.scan_replaced_by_search:
        detail = "Target-table access changed from SCAN to SEARCH."
        reasons.append(detail)
    else:
        detail = "No target-table SCAN-to-SEARCH change was observed."

    evidence.append(
        RecommendationEvidence(
            feature="scan_to_search",
            table=candidate.table,
            column=column_label,
            detail=detail,
        )
    )

    if database_evidence.temp_btree_removed:
        detail = "The candidate removed temporary B-tree work."
        reasons.append(detail)
    else:
        detail = "No temporary B-tree removal was observed."

    evidence.append(
        RecommendationEvidence(
            feature="temporary_btree",
            table=candidate.table,
            column=column_label,
            detail=detail,
        )
    )

    if len(candidate.columns) > 1:
        if database_evidence.composite_prefix_used:
            detail = (
                "The query plan indicates use of the composite index "
                "with the candidate column order."
            )
            reasons.append(detail)
        else:
            detail = (
                "The query-plan text did not confirm use of the "
                "expected composite-index columns in order."
            )

        evidence.append(
            RecommendationEvidence(
                feature="composite_prefix",
                table=candidate.table,
                column=column_label,
                detail=detail,
            )
        )

    return reasons, evidence


def _existing_indexes(
    schema: SchemaInspectionResponse,
) -> dict[str, list[tuple[str, tuple[str, ...]]]]:
    result: dict[str, list[tuple[str, tuple[str, ...]]]] = {}

    for table in schema.tables:
        result[table.name] = [
            (index.name, tuple(index.columns))
            for index in table.indexes
        ]

    return result


def _primary_keys(
    schema: SchemaInspectionResponse,
) -> dict[str, tuple[str, ...]]:
    return {
        table.name: tuple(table.primary_keys)
        for table in schema.tables
    }


def _rejection_reason(
    candidate: _Candidate,
    existing_indexes: list[tuple[str, tuple[str, ...]]],
    primary_key: tuple[str, ...],
) -> str | None:
    if (
        primary_key
        and candidate.columns[:len(primary_key)] == primary_key
    ):
        return (
            "Rejected because the candidate duplicates or extends "
            "the table primary key."
        )

    for index_name, index_columns in existing_indexes:
        if (
            index_columns
            and index_columns[:len(candidate.columns)] == candidate.columns
        ):
            return (
                "Rejected because existing index "
                f"'{index_name}' ({', '.join(index_columns)}) "
                "already covers this candidate's leftmost columns."
            )

    return None


def _index_name(table: str, columns: tuple[str, ...]) -> str:
    return "idx_" + table + "_" + "_".join(columns)


def _create_index_sql(
    index_name: str,
    table: str,
    columns: tuple[str, ...],
) -> str:
    quoted_columns = ", ".join(
        f'"{column.replace(chr(34), chr(34) * 2)}"'
        for column in columns
    )
    quoted_index = index_name.replace('"', '""')
    quoted_table = table.replace('"', '""')

    return (
        f'CREATE INDEX "{quoted_index}" '
        f'ON "{quoted_table}" ({quoted_columns});'
    )




def _match_sqlite_rules(
    reasons: list[str],
    candidate: _Candidate | None = None,
    features: QueryFeatures | None = None,
    database_evidence: CandidateEvidence | None = None,
) -> list[dict[str, str]]:
    """Match catalogue rules against explicit analysis evidence."""
    import re

    reason_text = " ".join(reasons).lower()
    matched_ids: set[str] = set()

    def contains_any(*phrases: str) -> bool:
        return any(phrase in reason_text for phrase in phrases)

    def contains_word(word: str) -> bool:
        return re.search(
            rf"\b{re.escape(word.lower())}\b",
            reason_text,
        ) is not None

    # R1: Explicit predicate/filter evidence.
    if contains_any(
        "equality filter",
        "range filter",
        "predicate column",
        "search condition",
        "where clause",
    ):
        matched_ids.add("R1")

    # R2: Composite prefix/range evidence, only for composite candidates.
    is_composite = candidate is not None and len(candidate.columns) > 1

    if is_composite and contains_any(
        "equality columns followed by a range column",
        "composite prefix",
        "leftmost prefix",
    ):
        matched_ids.add("R2")

   
    # R3: Only attach when SQLite confirms a covering-index plan.
    if (
        database_evidence is not None
        and database_evidence.experiment_succeeded
        and database_evidence.candidate_used
        and any(
            "covering index" in detail.lower()
            for detail in database_evidence.candidate_plan
        )
    ):
        matched_ids.add("R3")

    
    # R4: Sorting/grouping, based on extracted query features.
    if features is not None and (
        features.order_by_columns or features.group_by_columns
    ):
        matched_ids.add("R4")
    elif contains_any(
        "order by",
        "group by",
        "ordering",
        "grouping",
        "temporary b-tree",
        "temp b-tree",
    ):
        matched_ids.add("R4")

    # R5: Join columns, based on extracted query features.
    if features is not None and features.join_columns:
        matched_ids.add("R5")
    elif contains_any(
        "participates in a join",
        "join key",
        "join column",
        "join condition",
    ):
        matched_ids.add("R5")


    

    # R6: Match expression-index requirements or LIKE patterns
    # that may be eligible for SQLite's LIKE optimization.
    like_patterns = features.like_patterns if features is not None else []

    has_eligible_like_pattern = any(
        pattern
        and not pattern.startswith(("%", "_"))
        for pattern in like_patterns
    )

    has_expression_or_collation = (
        features is not None
        and bool(features.expression_columns or features.collations)
    )

    if has_eligible_like_pattern or has_expression_or_collation:
        matched_ids.add("R6")
    elif contains_any("expression index", "function-wrapped", "collation"):
        matched_ids.add("R6")




    # R7: Explicit uncertainty or unavailable evidence/statistics.
    if contains_any(
        "statistics unavailable",
        "insufficient evidence",
        "evidence unavailable",
        "uncertain",
        "statistics are missing",
    ):
        matched_ids.add("R7")

    # R8: Existing-index/redundancy evidence.
    if contains_any(
        "redundant index",
        "redundant",
        "existing index",
        "already indexed",
        "already covers",
    ):
        matched_ids.add("R8")

    # R9: Primary-key/rowid evidence.
    if contains_word("rowid") or contains_any(
        "primary key",
        "primary-key",
    ):
        matched_ids.add("R9")

    # R10: Explicit write/storage overhead evidence.
    if contains_any(
        "write overhead",
        "storage overhead",
        "index maintenance",
        "write cost",
    ):
        matched_ids.add("R10")

    # R11: Composite equality filters followed by ORDER BY columns.
    if is_composite and contains_any(
        "equality-filter columns followed by order by columns",
        "equality columns followed by order by columns",
    ):
        matched_ids.add("R11")

    # Preserve catalogue order and the existing API response structure.
    return [
        {
            "rule_id": rule.rule_id,
            "title": rule.title,
            "description": rule.description,
            "source_url": rule.source_url,
        }
        for rule in get_sqlite_rules()
        if rule.rule_id in matched_ids
    ]
