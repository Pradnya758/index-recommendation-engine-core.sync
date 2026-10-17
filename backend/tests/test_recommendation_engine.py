"""Unit tests for the recommendation engine service layer."""

import pytest

from app.services.recommendation_engine import build_recommendations
from app.services.sqlite_inspector import inspect_demo_schema


@pytest.fixture(scope="module")
def schema():
    return inspect_demo_schema()


def rec_cols(result):
    return {
        (r.table, tuple(r.columns))
        for r in result.recommendations
    }


def get_rec(result, table, columns):
    return next(
        r
        for r in result.recommendations
        if r.table == table
        and r.columns == list(columns)
    )


# ======================================================================
# TC-07: WHERE equality
# ======================================================================


def test_recommends_index_for_where_filter(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid'",
        schema,
    )

    assert ("orders", ("status",)) in rec_cols(result)

    recommendation = get_rec(
        result,
        "orders",
        ("status",),
    )

    assert recommendation.recommendation in {
        "recommended",
        "not_recommended",
    }

    assert result.analysis.equality_filters[0].model_dump() == {
        "table": "orders",
        "column": "status",
    }

    assert any(
        evidence.feature == "equality_filter"
        for evidence in recommendation.evidence
    )


# ======================================================================
# TC-08: JOIN
# ======================================================================


def test_recommends_indexes_for_join_columns(schema):
    result = build_recommendations(
        """
        SELECT o.order_id, p.product_name
        FROM orders o
        JOIN products p
        ON o.product_id = p.product_id
        """,
        schema,
    )

    assert ("orders", ("product_id",)) in rec_cols(result)

    orders_join = get_rec(
        result,
        "orders",
        ("product_id",),
    )

    assert orders_join.recommendation in {
        "recommended",
        "not_recommended",
    }

    assert any(
        evidence.feature == "join"
        for evidence in orders_join.evidence
    )

    # products.product_id is a PK.
    # It must be rejected rather than recommended.
    assert (
        "products",
        ("product_id",),
    ) not in rec_cols(result)

    assert any(
        candidate.columns == ["product_id"]
        and "primary key" in candidate.reason.lower()
        for candidate in result.rejected_candidates
    )


# ======================================================================
# TC-09: ORDER BY
# ======================================================================


def test_recommends_index_for_order_by(schema):
    result = build_recommendations(
        "SELECT * FROM orders ORDER BY order_date DESC",
        schema,
    )

    assert (
        "orders",
        ("order_date",),
    ) in rec_cols(result)

    recommendation = get_rec(
        result,
        "orders",
        ("order_date",),
    )

    assert any(
        evidence.feature == "order_by"
        for evidence in recommendation.evidence
    )

    assert recommendation.recommendation in {
        "recommended",
        "not_recommended",
    }


# ======================================================================
# GROUP BY
# ======================================================================


def test_extracts_group_by_and_recommends_index(schema):
    result = build_recommendations(
        "SELECT status, COUNT(*) FROM orders GROUP BY status",
        schema,
    )

    assert (
        result.analysis.group_by_columns[0].model_dump()
        == {
            "table": "orders",
            "column": "status",
        }
    )

    assert (
        "orders",
        ("status",),
    ) in rec_cols(result)

    recommendation = get_rec(
        result,
        "orders",
        ("status",),
    )

    assert any(
        evidence.feature == "group_by"
        for evidence in recommendation.evidence
    )


# ======================================================================
# RANGE FILTER
# ======================================================================


def test_range_filter_produces_candidate(schema):
    result = build_recommendations(
        "SELECT * FROM orders "
        "WHERE order_date >= '2025-01-01'",
        schema,
    )

    recommendation = get_rec(
        result,
        "orders",
        ("order_date",),
    )

    assert recommendation.columns == [
        "order_date"
    ]

    assert any(
        evidence.feature == "range_filter"
        for evidence in recommendation.evidence
    )


# ======================================================================
# TC-10: Composite equality + range
# ======================================================================


def test_recommends_composite_index_for_equality_and_range(schema):
    result = build_recommendations(
        """
        SELECT *
        FROM orders
        WHERE status = 'paid'
        AND order_date >= '2025-01-01'
        """,
        schema,
    )

    composite = get_rec(
        result,
        "orders",
        ("status", "order_date"),
    )

    assert composite.table == "orders"

    assert composite.columns == [
        "status",
        "order_date",
    ]

    assert composite.create_index_sql == (
        'CREATE INDEX "idx_orders_status_order_date" '
        'ON "orders" ("status", "order_date");'
    )

    assert composite.recommendation in {
        "recommended",
        "not_recommended",
    }

    assert any(
        evidence.feature == "composite"
        for evidence in composite.evidence
    )

    assert any(
        evidence.feature == "composite_prefix"
        for evidence in composite.evidence
    )


# ======================================================================
# Multiple equality predicates
# ======================================================================


def test_multiple_equality_composite_is_generated(schema):
    result = build_recommendations(
        """
        SELECT *
        FROM orders
        WHERE customer_id = 10
        AND status = 'paid'
        ORDER BY order_date
        """,
        schema,
    )

    composite = get_rec(
        result,
        "orders",
        ("customer_id", "status"),
    )

    assert composite.columns == [
        "customer_id",
        "status",
    ]

    assert composite.recommendation in {
        "recommended",
        "not_recommended",
    }

    assert any(
        evidence.feature == "composite"
        for evidence in composite.evidence
    )


# ======================================================================
# Plain SELECT
# ======================================================================


def test_plain_select_produces_no_recommendation(schema):
    result = build_recommendations(
        "SELECT * FROM students",
        schema,
    )

    assert result.recommendations == []


# ======================================================================
# TC-11: Primary-key lookup
# ======================================================================


def test_returns_no_recommendation_for_primary_key_lookup(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE order_id = 1",
        schema,
    )

    assert result.recommendations == []

    assert result.rejected_candidates

    assert (
        result.rejected_candidates[0].columns
        == ["order_id"]
    )

    assert (
        "primary key"
        in result.rejected_candidates[0].reason.lower()
    )


# ======================================================================
# TC-06: Existing-index detection
# ======================================================================


def test_rejects_candidate_covered_by_existing_index(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE customer_id = 42",
        schema,
    )

    assert result.recommendations == []

    assert "idx_orders_customer_id" in (
        result.rejected_candidates[0].reason
    )


# ======================================================================
# TC-12: Duplicate/redundant candidates
# ======================================================================


def test_rejects_candidate_covered_by_students_major_index(schema):
    result = build_recommendations(
        "SELECT * FROM students WHERE major = 'CS'",
        schema,
    )

    assert result.recommendations == []

    assert any(
        "idx_students_major" in candidate.reason
        for candidate in result.rejected_candidates
    )


def test_rejects_candidate_covered_by_products_category_index(schema):
    result = build_recommendations(
        "SELECT * FROM products "
        "WHERE category = 'Electronics'",
        schema,
    )

    assert result.recommendations == []

    assert any(
        "idx_products_category" in candidate.reason
        for candidate in result.rejected_candidates
    )


# ======================================================================
# Evidence-based recommendation tests
# ======================================================================


def test_recommended_status_is_evidence_based(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid'",
        schema,
    )

    recommendation = get_rec(
        result,
        "orders",
        ("status",),
    )

    assert recommendation.recommendation in {
        "recommended",
        "not_recommended",
    }

    # Every recommendation must contain evidence explaining
    # the SQLite experiment.
    assert recommendation.evidence

    evidence_features = {
        evidence.feature
        for evidence in recommendation.evidence
    }

    assert "candidate_plan" in evidence_features
    assert "plan_change" in evidence_features
    assert "scan_to_search" in evidence_features


def test_composite_candidate_contains_sqlite_evidence(schema):
    result = build_recommendations(
        """
        SELECT *
        FROM orders
        WHERE status = 'paid'
        AND order_date >= '2025-01-01'
        """,
        schema,
    )

    composite = get_rec(
        result,
        "orders",
        ("status", "order_date"),
    )

    evidence_features = {
        evidence.feature
        for evidence in composite.evidence
    }

    assert "composite" in evidence_features
    assert "candidate_plan" in evidence_features
    assert "plan_change" in evidence_features
    assert "composite_prefix" in evidence_features
    assert "database_statistics" in evidence_features


def test_order_by_candidate_contains_order_by_evidence(schema):
    result = build_recommendations(
        "SELECT * FROM orders ORDER BY order_date DESC",
        schema,
    )

    recommendation = get_rec(
        result,
        "orders",
        ("order_date",),
    )

    assert any(
        evidence.feature == "order_by"
        for evidence in recommendation.evidence
    )

    assert any(
        evidence.feature == "candidate_plan"
        for evidence in recommendation.evidence
    )


# ======================================================================
# No artificial score/confidence system
# ======================================================================


def test_recommendation_uses_status_instead_of_project_score(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid'",
        schema,
    )

    recommendation = get_rec(
        result,
        "orders",
        ("status",),
    )

    assert recommendation.recommendation in {
        "recommended",
        "not_recommended",
    }

    # The new design deliberately does not use the old
    # project-defined numerical score/confidence system.
    assert not hasattr(
        recommendation,
        "score",
    )

    assert not hasattr(
        recommendation,
        "confidence",
    )


# ======================================================================
# Drop SQL
# ======================================================================


def test_drop_index_sql_is_correct(schema):
    result = build_recommendations(
        "SELECT * FROM orders WHERE status = 'paid'",
        schema,
    )

    rec = get_rec(
        result,
        "orders",
        ("status",),
    )

    assert rec.drop_index_sql == (
        'DROP INDEX IF EXISTS "idx_orders_status";'
    )
    
from app.services.recommendation_engine import _evidence_status
from app.services.index_evidence import CandidateEvidence


def test_evidence_status_supported():
    evidence = CandidateEvidence(
        table="orders",
        columns=("customer_id",),
        baseline_plan=["SCAN orders"],
        candidate_plan=["SEARCH orders USING INDEX idx_orders_customer_id"],
        table_row_count=100,
        candidate_used=True,
        plan_changed=True,
        scan_replaced_by_search=True,
        temp_btree_removed=False,
        composite_prefix_used=False,
        existing_indexes=(),
        primary_key=(),
        experiment_succeeded=True,
        error=None,
    )

    assert _evidence_status(evidence) == "SUPPORTED"


def test_evidence_status_unchanged():
    evidence = CandidateEvidence(
        table="orders",
        columns=("customer_id",),
        baseline_plan=["SCAN orders"],
        candidate_plan=["SCAN orders"],
        table_row_count=100,
        candidate_used=False,
        plan_changed=False,
        scan_replaced_by_search=False,
        temp_btree_removed=False,
        composite_prefix_used=False,
        existing_indexes=(),
        primary_key=(),
        experiment_succeeded=True,
        error=None,
    )

    assert _evidence_status(evidence) == "UNCHANGED"


def test_evidence_status_uncertain():
    evidence = CandidateEvidence(
        table="orders",
        columns=("customer_id",),
        baseline_plan=[],
        candidate_plan=[],
        table_row_count=0,
        candidate_used=False,
        plan_changed=False,
        scan_replaced_by_search=False,
        temp_btree_removed=False,
        composite_prefix_used=False,
        existing_indexes=(),
        primary_key=(),
        experiment_succeeded=False,
        error="experiment failed",
    )

    assert _evidence_status(evidence) == "UNCERTAIN"

def test_composite_rule_matching_requires_composite_candidate():
    from app.services.recommendation_engine import _match_sqlite_rules

    reasons = ["Equality columns followed by a range column"]

    assert "R2" not in {
        rule["rule_id"]
        for rule in _match_sqlite_rules(reasons)
    }


def test_ordering_rule_does_not_automatically_trigger_r11():
    from app.services.recommendation_engine import _match_sqlite_rules

    reasons = ["The query contains an ORDER BY clause"]

    assert "R11" not in {
        rule["rule_id"]
        for rule in _match_sqlite_rules(reasons)
    }

from app.services.recommendation_engine import _match_sqlite_rules


def test_r6_does_not_match_leading_wildcard_without_evidence():
    rules = _match_sqlite_rules(
        ["Query uses LIKE '%phone'."]
    )
    assert "R6" not in {rule["rule_id"] for rule in rules}


def test_r6_does_not_match_unrelated_word_containing_like():
    rules = _match_sqlite_rules(
        ["This candidate is likely to be useful."]
    )
    assert "R6" not in {rule["rule_id"] for rule in rules}
