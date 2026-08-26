from pydantic import BaseModel, Field


class SqlQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=20_000, description="One SQLite SELECT query")


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
