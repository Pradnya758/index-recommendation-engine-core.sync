"""Unit tests for the recommendation engine service layer."""
import pytest

from app.services.recommendation_engine import build_recommendations
from app.services.sqlite_inspector import inspect_demo_schema


@pytest.fixture(scope="module")
def schema():
    return inspect_demo_schema()


def rec_cols(result):
    return {(r.table, tuple(r.columns)) for r in result.recommendations}


# ── TC-07: WHERE equality ─────────────────────────────────────────────────────

def test_recommends_index_for_where_filter(schema):
    result = build_recommendations("SELECT * FROM orders WHERE status = 'paid'", schema)
    assert ("orders", ("status",)) in rec_cols(result)
    assert result.recommendations[0].score == 45
    assert result.analysis.equality_filters[0].model_dump() == {"table": "orders", "column": "status"}


# ── TC-08: JOIN ───────────────────────────────────────────────────────────────

def test_recommends_indexes_for_join_columns(schema):
    result = build_recommendations(
        "SELECT o.order_id, p.product_name FROM orders o JOIN products p ON o.product_id = p.product_id",
        schema,
    )
    assert ("orders", ("product_id",)) in rec_cols(result)
    orders_join = next(r for r in result.recommendations if r.table == "orders" and r.columns == ["product_id"])
    assert orders_join.score == 35
    # products.product_id is PK — must be rejected, not recommended
    assert ("products", ("product_id",)) not in rec_cols(result)
    assert any(c.columns == ["product_id"] and "primary key" in c.reason for c in result.rejected_candidates)


# ── TC-09: ORDER BY ───────────────────────────────────────────────────────────

def test_recommends_index_for_order_by(schema):
    result = build_recommendations("SELECT * FROM orders ORDER BY order_date DESC", schema)
    assert ("orders", ("order_date",)) in rec_cols(result)
    assert result.recommendations[0].evidence[0].feature == "order_by"
    assert result.recommendations[0].score == 15


# ── GROUP BY ──────────────────────────────────────────────────────────────────

def test_extracts_group_by_and_recommends_index(schema):
    result = build_recommendations("SELECT status, COUNT(*) FROM orders GROUP BY status", schema)
    assert result.analysis.group_by_columns[0].model_dump() == {"table": "orders", "column": "status"}
    assert ("orders", ("status",)) in rec_cols(result)
    assert result.recommendations[0].score == 15


def test_range_filter_uses_project_score(schema):
    result = build_recommendations("SELECT * FROM orders WHERE order_date >= '2025-01-01'", schema)
    assert result.recommendations[0].columns == ["order_date"]
    assert result.recommendations[0].score == 25


# ── TC-10: Composite ──────────────────────────────────────────────────────────

def test_recommends_composite_index_for_equality_and_range(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01'",
        schema,
    )
    composite = next(r for r in result.recommendations if r.columns == ["status", "order_date"])
    assert composite.table == "orders"
    assert composite.score == 65
    assert composite.confidence == "high"
    assert composite.create_index_sql == 'CREATE INDEX "idx_orders_status_order_date" ON "orders" ("status", "order_date");'


def test_multiple_equality_composite_uses_fixed_project_score(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE customer_id = 10 AND status = 'paid' ORDER BY order_date",
        schema,
    )
    composite = next(r for r in result.recommendations if r.columns == ["customer_id", "status"])
    order_by = next(r for r in result.recommendations if r.columns == ["order_date"])
    assert composite.score == 65
    assert order_by.score == 15
    assert all(r.score not in {75, 33} for r in result.recommendations)


def test_plain_select_produces_no_recommendation(schema):
    result = build_recommendations("SELECT * FROM students", schema)
    assert result.recommendations == []


# ── TC-11: No-useful-index (PK lookup) ───────────────────────────────────────

def test_returns_no_recommendation_for_primary_key_lookup(schema):
    result = build_recommendations("SELECT * FROM orders WHERE order_id = 1", schema)
    assert result.recommendations == []
    assert result.rejected_candidates[0].columns == ["order_id"]
    assert "primary key" in result.rejected_candidates[0].reason


# ── TC-06: Existing-index detection ──────────────────────────────────────────

def test_rejects_candidate_covered_by_existing_index(schema):
    result = build_recommendations("SELECT * FROM orders WHERE customer_id = 42", schema)
    assert result.recommendations == []
    assert "idx_orders_customer_id" in result.rejected_candidates[0].reason


# ── TC-12: Duplicate/redundant candidate ─────────────────────────────────────

def test_rejects_candidate_covered_by_students_major_index(schema):
    result = build_recommendations("SELECT * FROM students WHERE major = 'CS'", schema)
    assert result.recommendations == []
    assert any("idx_students_major" in c.reason for c in result.rejected_candidates)


def test_rejects_candidate_covered_by_products_category_index(schema):
    result = build_recommendations("SELECT * FROM products WHERE category = 'Electronics'", schema)
    assert result.recommendations == []
    assert any("idx_products_category" in c.reason for c in result.rejected_candidates)


# ── Confidence thresholds ─────────────────────────────────────────────────────

def test_composite_score_gives_high_confidence(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01'",
        schema,
    )
    composite = next(r for r in result.recommendations if len(r.columns) > 1)
    assert composite.confidence == "high"


def test_single_order_by_gives_low_confidence(schema):
    result = build_recommendations("SELECT * FROM orders ORDER BY order_date DESC", schema)
    rec = next(r for r in result.recommendations if r.columns == ["order_date"])
    assert rec.score == 15
    assert rec.confidence == "low"


# ── Score cap ─────────────────────────────────────────────────────────────────

def test_score_does_not_exceed_100(schema):
    # equality + join + order_by on same column would accumulate; cap must hold
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01' ORDER BY order_date",
        schema,
    )
    for rec in result.recommendations:
        assert rec.score <= 100


# ── Drop SQL ──────────────────────────────────────────────────────────────────

def test_drop_index_sql_is_correct(schema):
    result = build_recommendations("SELECT * FROM orders WHERE status = 'paid'", schema)
    rec = result.recommendations[0]
    assert rec.drop_index_sql == 'DROP INDEX IF EXISTS "idx_orders_status";'
