from collections import defaultdict
from dataclasses import dataclass, field

from app.models.schemas import (
    ColumnReference,
    IndexRecommendation,
    QueryFeatures,
    RecommendationEvidence,
    RecommendationResponse,
    RejectedCandidate,
    SchemaInspectionResponse,
)
from app.services.sql_analyzer import extract_query_features


@dataclass
class _Candidate:
    table: str
    columns: tuple[str, ...]
    score: int = 0
    reasons: list[str] = field(default_factory=list)
    evidence: list[RecommendationEvidence] = field(default_factory=list)

    def add(self, points: int, reason: str, evidence: RecommendationEvidence) -> None:
        self.score += points
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
        index_name = _index_name(candidate.table, candidate.columns)
        recommendations.append(
            IndexRecommendation(
                table=candidate.table,
                columns=list(candidate.columns),
                create_index_sql=_create_index_sql(index_name, candidate.table, candidate.columns),
                drop_index_sql=f'DROP INDEX IF EXISTS "{index_name}";',
                score=min(candidate.score, 100),
                confidence=_confidence(candidate.score),
                reasons=candidate.reasons,
                evidence=candidate.evidence,
            )
        )

    recommendations.sort(key=lambda recommendation: (-recommendation.score, recommendation.table, recommendation.columns))
    rejected.sort(key=lambda candidate: (candidate.table, candidate.columns))
    return RecommendationResponse(query=query, analysis=features, recommendations=recommendations, rejected_candidates=rejected)


def _generate_candidates(features: QueryFeatures) -> dict[tuple[str, tuple[str, ...]], _Candidate]:
    candidates: dict[tuple[str, tuple[str, ...]], _Candidate] = {}
    equality_by_table: dict[str, list[str]] = defaultdict(list)
    range_by_table: dict[str, list[str]] = defaultdict(list)

    for column in features.equality_filters:
        equality_by_table[column.table].append(column.column)
        _add_feature(candidates, column, "equality_filter", 45, "Equality filters are highly selective and benefit from direct index lookup.")
    for column in features.range_filters:
        range_by_table[column.table].append(column.column)
        _add_feature(candidates, column, "range_filter", 25, "Range filters benefit from ordered index traversal.")
    for column in features.join_columns:
        _add_feature(candidates, column, "join", 35, "Join columns benefit from faster row matching between tables.")
    for column in features.order_by_columns:
        _add_feature(candidates, column, "order_by", 15, "ORDER BY can use an index to reduce sorting work.")
    for column in features.group_by_columns:
        _add_feature(candidates, column, "group_by", 15, "GROUP BY can use ordered index values to reduce grouping work.")

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
    points: int,
    reason: str,
) -> None:
    candidate = candidates.setdefault((column.table, (column.column,)), _Candidate(column.table, (column.column,)))
    candidate.add(
        points,
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
        65,
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


def _confidence(score: int) -> str:
    if score >= 65:
        return "high"
    if score >= 35:
        return "medium"
    return "low"


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))
