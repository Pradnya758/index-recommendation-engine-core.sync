
from pydantic import BaseModel, Field


class SqlQueryRequest(BaseModel):
    query: str = Field(
        min_length=1,
        max_length=20_000,
        description="One SQLite SELECT query",
    )


class SqlValidationResponse(BaseModel):
    valid: bool
    normalized_query: str
    statement_type: str


class ColumnInfo(BaseModel):
    name: str
    data_type: str
    nullable: bool
    primary_key_position: int | None = None


class IndexInfo(BaseModel):
    name: str
    columns: list[str]
    unique: bool
    origin: str


class TableInfo(BaseModel):
    name: str
    columns: list[ColumnInfo]
    primary_keys: list[str]
    indexes: list[IndexInfo]


class SchemaInspectionResponse(BaseModel):
    database: str
    tables: list[TableInfo]


class QueryPlanStep(BaseModel):
    id: int
    parent: int
    detail: str


class QueryPlanResponse(BaseModel):
    query: str
    plan: list[QueryPlanStep]


class ColumnReference(BaseModel):
    table: str
    column: str


class WhereCondition(BaseModel):
    table: str
    column: str
    operator: str
    kind: str


class JoinCondition(BaseModel):
    left: ColumnReference
    right: ColumnReference



class QueryFeatures(BaseModel):
    tables: list[str]
    where_conditions: list[WhereCondition]
    equality_filters: list[ColumnReference]
    range_filters: list[ColumnReference]
    join_columns: list[ColumnReference]
    order_by_columns: list[ColumnReference]
    group_by_columns: list[ColumnReference]
    like_patterns: list[str] = []
    expression_columns: list[str] = []
    collations: list[str] = []



class RecommendationEvidence(BaseModel):
    feature: str
    table: str
    column: str
    detail: str



class IndexRecommendation(BaseModel):
    table: str
    columns: list[str]
    create_index_sql: str
    drop_index_sql: str
    recommendation: str
    priority: str
    reasons: list[str]
    evidence: list[RecommendationEvidence]
    rules: list[dict[str, str]] = []
    evidence_status: str = "UNCERTAIN"


class RejectedCandidate(BaseModel):
    table: str
    columns: list[str]
    reason: str


class RecommendationResponse(BaseModel):
    query: str
    analysis: QueryFeatures
    recommendations: list[IndexRecommendation]
    rejected_candidates: list[RejectedCandidate]
