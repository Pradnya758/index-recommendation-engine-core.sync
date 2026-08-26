import pytest

from app.services.recommendation_engine import build_recommendations
from app.services.sqlite_inspector import inspect_demo_schema


@pytest.fixture
def schema():
    return inspect_demo_schema()


def recommendation_columns(result):
    return {(recommendation.table, tuple(recommendation.columns)) for recommendation in result.recommendations}


def test_recommends_index_for_where_filter(schema):
    result = build_recommendations("SELECT * FROM orders WHERE status = 'paid'", schema)

    assert ("orders", ("status",)) in recommendation_columns(result)
    assert result.recommendations[0].score == 45
    assert result.analysis.equality_filters[0].model_dump() == {"table": "orders", "column": "status"}


def test_recommends_indexes_for_join_columns(schema):
    result = build_recommendations(
        "SELECT o.order_id, p.product_name FROM orders o JOIN products p ON o.product_id = p.product_id",
        schema,
    )

    assert ("orders", ("product_id",)) in recommendation_columns(result)
    assert ("products", ("product_id",)) not in recommendation_columns(result)
    assert any(candidate.columns == ["product_id"] and "primary key" in candidate.reason for candidate in result.rejected_candidates)


def test_recommends_index_for_order_by(schema):
    result = build_recommendations("SELECT * FROM orders ORDER BY order_date DESC", schema)

    assert ("orders", ("order_date",)) in recommendation_columns(result)
    recommendation = result.recommendations[0]
    assert recommendation.evidence[0].feature == "order_by"


def test_extracts_group_by_and_recommends_index(schema):
    result = build_recommendations("SELECT status, COUNT(*) FROM orders GROUP BY status", schema)

    assert result.analysis.group_by_columns[0].model_dump() == {"table": "orders", "column": "status"}
    assert ("orders", ("status",)) in recommendation_columns(result)


def test_recommends_composite_index_for_equality_and_range(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01'",
        schema,
    )

    composite = next(item for item in result.recommendations if item.columns == ["status", "order_date"])
    assert composite.table == "orders"
    assert composite.score == 65
    assert composite.confidence == "high"
    assert composite.create_index_sql == 'CREATE INDEX "idx_orders_status_order_date" ON "orders" ("status", "order_date");'


def test_returns_no_recommendation_for_primary_key_lookup(schema):
    result = build_recommendations("SELECT * FROM orders WHERE order_id = 1", schema)

    assert result.recommendations == []
    assert result.rejected_candidates[0].columns == ["order_id"]
    assert "primary key" in result.rejected_candidates[0].reason


def test_rejects_candidate_covered_by_existing_index(schema):
    result = build_recommendations("SELECT * FROM orders WHERE customer_id = 42", schema)

    assert result.recommendations == []
    assert "idx_orders_customer_id" in result.rejected_candidates[0].reason
