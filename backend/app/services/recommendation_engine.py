from collections import defaultdict
from dataclasses import dataclass, field
import sqlite3

from app.models.schemas import (
    ColumnReference,
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


_HEURISTIC_SCORES = {
    "equality_filter": 45,
    "join": 35,
    "range_filter": 25,
    "order_by": 15,
    "group_by": 15,
    "composite": 65,
}


@dataclass
class _Candidate:
    table: str
    columns: tuple[str, ...]
    reasons: list[str] = field(default_factory=list)
    evidence: list[RecommendationEvidence] = field(default_factory=list)

    def add(self, reason: str, evidence: RecommendationEvidence) -> None:
        if reason not in self.reasons:
            self.reasons.append(reason)
        if evidence not in self.evidence:
            self.evidence.append(evidence)


def build_recommendations(query: str, schema: SchemaInspectionResponse) -> RecommendationResponse:
    """Generate explainable SQLite index candidates using deterministic rules only."""
    schema_columns = {table.name: {column.name for column in table.columns} for table in schema.tables}
    features = extract_query_features(query, schema_columns)
    candidates = _generate_candidates(features)
    existing_indexes = {
        table.name: [(index.name, tuple(index.columns)) for index in table.indexes] for table in schema.tables
    }
    primary_keys = {table.name: tuple(table.primary_keys) for table in schema.tables}

    recommendations: list[IndexRecommendation] = []
    rejected: list[RejectedCandidate] = []
    for candidate in candidates.values():
        rejection_reason = _rejection_reason(candidate, existing_indexes[candidate.table], primary_keys[candidate.table])
        if rejection_reason:
            rejected.append(RejectedCandidate(table=candidate.table, columns=list(candidate.columns), reason=rejection_reason))
            continue
        try:
            database_evidence = collect_candidate_evidence(
                query, candidate.table, candidate.columns, features
            )
        except (sqlite3.Error, ValueError) as error:
            database_evidence = failed_candidate_evidence(
                candidate.table, candidate.columns, error
            )
        score = _score_candidate(candidate)
        reasons, evidence = _explain_evidence(candidate, database_evidence)
        index_name = _index_name(candidate.table, candidate.columns)
        recommendations.append(
            IndexRecommendation(
                table=candidate.table,
                columns=list(candidate.columns),
                create_index_sql=_create_index_sql(index_name, candidate.table, candidate.columns),
                drop_index_sql=f'DROP INDEX IF EXISTS "{index_name}";',
                score=score,
                confidence=_confidence(score, database_evidence.experiment_succeeded),
                reasons=reasons,
                evidence=evidence,
            )
        )

    recommendations.sort(key=lambda recommendation: (-recommendation.score, recommendation.table, recommendation.columns))
    rejected.sort(key=lambda candidate: (candidate.table, candidate.columns))
    return RecommendationResponse(query=query, analysis=features, recommendations=recommendations, rejected_candidates=rejected)


def _score_candidate(candidate: _Candidate) -> int:
    features = {item.feature for item in candidate.evidence}
    if "composite" in features:
        return _HEURISTIC_SCORES["composite"]
    return sum(_HEURISTIC_SCORES.get(feature, 0) for feature in features)


def _generate_candidates(features: QueryFeatures) -> dict[tuple[str, tuple[str, ...]], _Candidate]:
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate] = {}
    equality_by_table: dict[str, list[str]] = defaultdict(list)
    range_by_table: dict[str, list[str]] = defaultdict(list)

    for column in features.equality_filters:
        equality_by_table[column.table].append(column.column)
        _add_feature(candidates, column, "equality_filter", "The candidate supports an equality predicate.")
    for column in features.range_filters:
        range_by_table[column.table].append(column.column)
        _add_feature(candidates, column, "range_filter", "The candidate supports a range predicate.")
    for column in features.join_columns:
        _add_feature(candidates, column, "join", "The candidate supports a join condition.")
    for column in features.order_by_columns:
        _add_feature(candidates, column, "order_by", "The candidate follows the ORDER BY column.")
    for column in features.group_by_columns:
        _add_feature(candidates, column, "group_by", "The candidate follows the GROUP BY column.")

    for table, equality_columns in equality_by_table.items():
        ordered_equality = _unique(equality_columns)
        ordered_ranges = _unique(range_by_table[table])
        if len(ordered_equality) >= 2:
            _add_composite(candidates, table, tuple(ordered_equality), "Multiple equality filters are best placed together in a composite index.")
        if ordered_equality and ordered_ranges:
            columns = tuple(ordered_equality + [ordered_ranges[0]])
            _add_composite(candidates, table, columns, "Equality columns first, followed by a range column, match SQLite composite-index usage.")

    return candidates


def _add_feature(
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate],
    column: ColumnReference,
    feature: str,
    reason: str,
) -> None:
    candidate = candidates.setdefault((column.table, (column.column,)), _Candidate(column.table, (column.column,)))
    candidate.add(
        reason,
        RecommendationEvidence(feature=feature, table=column.table, column=column.column, detail=f"{column.table}.{column.column} appears in {feature.replace('_', ' ').upper()}"),
    )


def _add_composite(
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate],
    table: str,
    columns: tuple[str, ...],
    reason: str,
) -> None:
    candidate = candidates.setdefault((table, columns), _Candidate(table, columns))
    candidate.add(
        reason,
        RecommendationEvidence(feature="composite", table=table, column=", ".join(columns), detail=f"Composite candidate uses {', '.join(columns)} in query predicate order."),
    )


def _rejection_reason(
    candidate: _Candidate, existing_indexes: list[tuple[str, tuple[str, ...]]], primary_key: tuple[str, ...]
) -> str | None:
    if primary_key and candidate.columns[: len(primary_key)] == primary_key:
        return "Rejected because the candidate duplicates or extends the table primary key."
    for index_name, index_columns in existing_indexes:
        if index_columns[: len(candidate.columns)] == candidate.columns:
            return f"Rejected because existing index '{index_name}' ({', '.join(index_columns)}) already covers this candidate."
    return None


def _create_index_sql(index_name: str, table: str, columns: tuple[str, ...]) -> str:
    quoted_columns = ", ".join(f'"{column}"' for column in columns)
    return f'CREATE INDEX "{index_name}" ON "{table}" ({quoted_columns});'


def _index_name(table: str, columns: tuple[str, ...]) -> str:
    return f"idx_{table}_{'_'.join(columns)}"


def _explain_evidence(
    candidate: _Candidate, database_evidence: CandidateEvidence
) -> tuple[list[str], list[RecommendationEvidence]]:
    reasons = list(candidate.reasons)
    evidence = list(candidate.evidence)
    column_label = ", ".join(candidate.columns)

    if not database_evidence.experiment_succeeded:
        reasons.append(
            "SQLite evidence was unavailable; the project-defined heuristic score is unchanged."
        )
        evidence.append(
            RecommendationEvidence(
                feature="evidence_unavailable",
                table=candidate.table,
                column=column_label,
                detail=f"Isolated SQLite experiment failed ({database_evidence.error}).",
            )
        )
        return reasons, evidence

    outcomes = [
        ("candidate_plan", database_evidence.candidate_used, "SQLite selected the candidate index.", "SQLite did not select the candidate index."),
        ("plan_change", database_evidence.plan_changed, "The candidate changed EXPLAIN QUERY PLAN.", "The candidate did not change EXPLAIN QUERY PLAN."),
        ("scan_to_search", database_evidence.scan_replaced_by_search, "The target-table access changed from SCAN to SEARCH.", "No target-table SCAN-to-SEARCH change was observed."),
        ("temporary_btree", database_evidence.temp_btree_removed, "The candidate removed temporary B-tree work.", "No temporary B-tree removal was observed."),
    ]
    if len(candidate.columns) > 1:
        outcomes.append(
            ("composite_prefix", database_evidence.composite_prefix_used, "SQLite used the expected composite-index prefix.", "SQLite did not use every expected composite-prefix column.")
        )
    for feature, observed, positive, negative in outcomes:
        detail = positive if observed else negative
        evidence.append(
            RecommendationEvidence(
                feature=feature,
                table=candidate.table,
                column=column_label,
                detail=detail,
            )
        )
        if observed:
            reasons.append(positive)

    statistics = (
        f"Table has {database_evidence.table_row_count} rows; candidate-column distinct counts are "
        f"{', '.join(str(value) for value in database_evidence.distinct_counts)}."
    )
    if database_evidence.predicate_selectivity is not None:
        statistics += f" Observed query selectivity is {database_evidence.predicate_selectivity:.3f}."
    evidence.append(
        RecommendationEvidence(
            feature="database_statistics",
            table=candidate.table,
            column=column_label,
            detail=statistics,
        )
    )
    return reasons, evidence


def _confidence(score: int, evidence_available: bool = True) -> str:
    if not evidence_available:
        return "low"
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))
