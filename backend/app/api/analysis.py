from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    QueryPlanResponse,
    RecommendationResponse,
    SchemaInspectionResponse,
    SqlQueryRequest,
    SqlValidationResponse,
)
from app.services.recommendation_engine import build_recommendations
from app.services.sql_analyzer import SqlAnalysisError
from app.services.sqlite_inspector import get_query_plan, inspect_demo_schema
from app.services.sql_validator import SqlValidationError, validate_select_query

router = APIRouter(tags=["analysis"])


@router.get("/schema", response_model=SchemaInspectionResponse)
async def schema_inspection() -> SchemaInspectionResponse:
    """Return the tables, columns, primary keys, and indexes in the demo database."""
    return inspect_demo_schema()


@router.post("/sql/validate", response_model=SqlValidationResponse)
async def validate_sql(request: SqlQueryRequest) -> SqlValidationResponse:
    """Validate a single SQLite SELECT statement without executing it."""
    try:
        normalized_query = validate_select_query(request.query)
    except SqlValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return SqlValidationResponse(valid=True, normalized_query=normalized_query, statement_type="SELECT")


@router.post("/query-plan", response_model=QueryPlanResponse)
async def query_plan(request: SqlQueryRequest) -> QueryPlanResponse:
    """Return SQLite EXPLAIN QUERY PLAN output for a validated SELECT statement."""
    try:
        normalized_query = validate_select_query(request.query)
        plan = get_query_plan(normalized_query)
    except SqlValidationError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return QueryPlanResponse(query=normalized_query, plan=plan)


@router.post("/recommendations", response_model=RecommendationResponse)
async def recommendations(request: SqlQueryRequest) -> RecommendationResponse:
    """Generate rule-based index recommendations for a validated demo-database query."""
    try:
        normalized_query = validate_select_query(request.query)
        return build_recommendations(normalized_query, inspect_demo_schema())
    except (SqlValidationError, SqlAnalysisError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
