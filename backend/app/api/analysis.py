from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    QueryPlanResponse,
    RecommendationResponse,
    SchemaInspectionResponse,
    SqlQueryRequest,
    SqlValidationResponse,
)

from app.services.recommendation_engine import build_recommendations

from app.services.real_index_evidence import (
    collect_real_candidate_evidence,
)

from app.services.real_sqlite_inspector import (
    get_real_query_plan,
    inspect_real_schema,
)

from app.services.sql_analyzer import SqlAnalysisError
from app.services.sqlite_inspector import (
    get_query_plan,
    inspect_demo_schema,
)

from app.services.sql_validator import (
    SqlValidationError,
    validate_select_query,
)


router = APIRouter(tags=["analysis"])


# ============================================================
# DEMO DATABASE
# ============================================================

@router.get("/schema", response_model=SchemaInspectionResponse)
async def schema_inspection() -> SchemaInspectionResponse:
    """Return the tables, columns, primary keys, and indexes in the demo database."""
    return inspect_demo_schema()


@router.post("/sql/validate", response_model=SqlValidationResponse)
async def validate_sql(
    request: SqlQueryRequest,
) -> SqlValidationResponse:
    """Validate a single SQLite SELECT statement without executing it."""
    try:
        normalized_query = validate_select_query(request.query)

    except SqlValidationError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return SqlValidationResponse(
        valid=True,
        normalized_query=normalized_query,
        statement_type="SELECT",
    )


@router.post("/query-plan", response_model=QueryPlanResponse)
async def query_plan(
    request: SqlQueryRequest,
) -> QueryPlanResponse:
    """Return SQLite EXPLAIN QUERY PLAN output for the demo database."""
    try:
        normalized_query = validate_select_query(request.query)

        plan = get_query_plan(normalized_query)

    except SqlValidationError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return QueryPlanResponse(
        query=normalized_query,
        plan=plan,
    )


@router.post("/recommendations", response_model=RecommendationResponse)
async def recommendations(
    request: SqlQueryRequest,
) -> RecommendationResponse:
    """Generate rule-based index recommendations for the demo database."""
    try:
        normalized_query = validate_select_query(request.query)

        return build_recommendations(
            normalized_query,
            inspect_demo_schema(),
        )

    except (
        SqlValidationError,
        SqlAnalysisError,
    ) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


# ============================================================
# REAL CHINOOK DATABASE
# ============================================================

@router.get(
    "/real-schema",
    response_model=SchemaInspectionResponse,
)
async def real_schema_inspection() -> SchemaInspectionResponse:
    """Return the tables, columns, primary keys, and indexes in the Chinook database."""
    return inspect_real_schema()


@router.post(
    "/real-query-plan",
    response_model=QueryPlanResponse,
)
async def real_query_plan(
    request: SqlQueryRequest,
) -> QueryPlanResponse:
    """Return SQLite EXPLAIN QUERY PLAN output for the Chinook database."""
    try:
        normalized_query = validate_select_query(request.query)

        plan = get_real_query_plan(normalized_query)

    except SqlValidationError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return QueryPlanResponse(
        query=normalized_query,
        plan=plan,
    )


@router.post(
    "/real-recommendations",
    response_model=RecommendationResponse,
)
async def real_recommendations(
    request: SqlQueryRequest,
) -> RecommendationResponse:
    """Generate index recommendations using the real Chinook database and real query-plan evidence."""
    try:
        normalized_query = validate_select_query(request.query)

        return build_recommendations(
            normalized_query,
            inspect_real_schema(),
            collect_real_candidate_evidence,
        )

    except (
        SqlValidationError,
        SqlAnalysisError,
    ) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error