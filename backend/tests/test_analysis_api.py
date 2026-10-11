"""Tests for /api/sql/validate, /api/query-plan, /api/recommendations, /api/schema."""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ── Health / Schema ───────────────────────────────────────────────────────────

def test_health_check_is_preserved():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_schema_endpoint_returns_four_demo_tables():
    response = client.get("/api/schema")
    assert response.status_code == 200
    tables = {t["name"] for t in response.json()["tables"]}
    assert tables == {"students", "customers", "products", "orders"}


def test_schema_includes_existing_indexes():
    response = client.get("/api/schema")
    orders = next(t for t in response.json()["tables"] if t["name"] == "orders")
    index_names = {idx["name"] for idx in orders["indexes"]}
    assert "idx_orders_customer_id" in index_names


# ── TC-01: Valid SELECT via HTTP ──────────────────────────────────────────────

def test_validate_endpoint_accepts_valid_select():
    response = client.post("/api/sql/validate", json={"query": "SELECT * FROM orders WHERE status = 'paid'"})
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["statement_type"] == "SELECT"


# ── TC-02: Empty SQL via HTTP ─────────────────────────────────────────────────

def test_validate_endpoint_rejects_empty_query():
    # Pydantic min_length=1 returns 422 before the service layer
    response = client.post("/api/sql/validate", json={"query": ""})
    assert response.status_code == 422


def test_recommendations_endpoint_rejects_whitespace_query():
    response = client.post("/api/recommendations", json={"query": "   "})
    assert response.status_code == 422


# ── TC-03: Malformed SQL via HTTP ─────────────────────────────────────────────

def test_validate_endpoint_rejects_malformed_sql():
    response = client.post("/api/sql/validate", json={"query": "SELEKT * FORM orders"})
    assert response.status_code == 422


# ── TC-04: Destructive SQL via HTTP ──────────────────────────────────────────

@pytest.mark.parametrize("query,label", [
    ("INSERT INTO students VALUES (1, 'A', 'a@b.com', 'CS', 2024)", "INSERT"),
    ("UPDATE orders SET status = 'paid'", "UPDATE"),
    ("DELETE FROM orders WHERE order_id = 1", "DELETE"),
    ("DROP TABLE customers", "DROP"),
    ("ALTER TABLE orders ADD COLUMN notes TEXT", "ALTER"),
    ("CREATE TABLE t (id INTEGER PRIMARY KEY)", "CREATE"),
])
def test_validate_endpoint_rejects_destructive_sql(query, label):
    response = client.post("/api/sql/validate", json={"query": query})
    assert response.status_code == 422, f"{label} should be rejected"
    assert "Only SELECT queries" in response.json()["detail"]


def test_recommendations_endpoint_rejects_destructive_sql():
    response = client.post("/api/recommendations", json={"query": "DELETE FROM orders"})
    assert response.status_code == 422
    assert "Only SELECT queries" in response.json()["detail"]


# ── TC-05: Multiple statements via HTTP ───────────────────────────────────────

def test_validate_endpoint_rejects_multiple_statements():
    response = client.post("/api/sql/validate", json={"query": "SELECT * FROM students; DELETE FROM students"})
    assert response.status_code == 422
    assert "exactly one" in response.json()["detail"]


# ── TC-06: Existing-index detection ──────────────────────────────────────────

def test_existing_index_produces_rejected_candidate():
    """customer_id is covered by idx_orders_customer_id — must be rejected, not recommended."""
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orders WHERE customer_id = 42"})
    assert response.status_code == 200
    body = response.json()
    assert body["recommendations"] == []
    assert any("idx_orders_customer_id" in c["reason"] for c in body["rejected_candidates"])


# ── TC-07: WHERE candidate ────────────────────────────────────────────────────

def test_where_equality_produces_recommendation():
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orders WHERE status = 'paid'"})
    assert response.status_code == 200
    body = response.json()
    cols = [r["columns"] for r in body["recommendations"]]
    assert ["status"] in cols


# ── TC-08: JOIN candidate ─────────────────────────────────────────────────────

def test_join_produces_recommendation_for_non_pk_side():
    response = client.post(
        "/api/recommendations",
        json={"query": "SELECT o.order_id, p.product_name FROM orders o JOIN products p ON o.product_id = p.product_id"},
    )
    assert response.status_code == 200
    body = response.json()
    rec_cols = [r["columns"] for r in body["recommendations"]]
    assert ["product_id"] in rec_cols  # orders.product_id has no index


# ── TC-09: ORDER BY candidate ─────────────────────────────────────────────────

def test_order_by_produces_recommendation():
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orders ORDER BY order_date DESC"})
    assert response.status_code == 200
    body = response.json()
    rec_cols = [r["columns"] for r in body["recommendations"]]
    assert ["order_date"] in rec_cols


# ── TC-10: Composite candidate ────────────────────────────────────────────────

def test_composite_candidate_for_equality_and_range():
    response = client.post(
        "/api/recommendations",
        json={"query": "SELECT * FROM orders WHERE status = 'paid' AND order_date >= '2025-01-01'"},
    )
    assert response.status_code == 200
    body = response.json()
    rec_cols = [r["columns"] for r in body["recommendations"]]
    assert ["status", "order_date"] in rec_cols


# ── TC-11: No-useful-index query ──────────────────────────────────────────────

def test_primary_key_lookup_produces_no_recommendation():
    """order_id is the PK — no new index should be recommended."""
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orders WHERE order_id = 1"})
    assert response.status_code == 200
    body = response.json()
    assert body["recommendations"] == []
    assert body["rejected_candidates"][0]["columns"] == ["order_id"]


# ── TC-12: Duplicate/redundant candidate rejection ────────────────────────────

def test_redundant_candidate_appears_in_rejected_not_recommendations():
    """major is covered by idx_students_major."""
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM students WHERE major = 'CS'"})
    assert response.status_code == 200
    body = response.json()
    assert body["recommendations"] == []
    assert any("idx_students_major" in c["reason"] for c in body["rejected_candidates"])


# ── TC-13: Query-plan endpoint ────────────────────────────────────────────────

def test_query_plan_endpoint_returns_structured_steps():
    response = client.post("/api/query-plan", json={"query": "SELECT * FROM orders WHERE customer_id = 42"})
    assert response.status_code == 200
    body = response.json()
    assert body["plan"]
    step = body["plan"][0]
    assert {"id", "parent", "detail"} <= set(step)


def test_query_plan_rejects_destructive_sql():
    response = client.post("/api/query-plan", json={"query": "DELETE FROM orders"})
    assert response.status_code == 422


# ── TC-14: History save/retrieve ──────────────────────────────────────────────
# (covered in test_history_api.py — cross-reference only; one smoke test here)

def test_history_save_returns_id():
    rec = client.post("/api/recommendations", json={"query": "SELECT * FROM orders WHERE status = 'paid'"}).json()
    plan = client.post("/api/query-plan", json={"query": "SELECT * FROM orders WHERE status = 'paid'"}).json()
    r = client.post("/api/history", json={"rec": rec, "plan": plan})
    assert r.status_code == 201
    assert "id" in r.json()


# ── TC-15: Export / report JSON structure ─────────────────────────────────────

def test_recommendations_response_has_export_fields():
    response = client.post(
    "/api/recommendations",
        json={
            "query": "SELECT * FROM orders WHERE status = 'paid'"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "recommendations" in data

    for recommendation in data["recommendations"]:
        required_fields = {
            "table",
            "columns",
            "create_index_sql",
            "drop_index_sql",
            "recommendation",
            "reasons",
            "evidence",
        }

        for field in required_fields:
            assert field in recommendation, (
                f"Missing export field: {field}"
            )

        assert recommendation["recommendation"] in {
            "recommended",
            "not_recommended",
        }

        assert isinstance(
            recommendation["reasons"],
            list,
        )

        assert isinstance(
            recommendation["evidence"],
            list,
        )


# ── Schema validation — unknown table ─────────────────────────────────────────

def test_unknown_table_returns_422_with_friendly_message():
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orderss WHERE status = 'paid'"})
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert "orderss" in detail or "does not exist" in detail.lower()


# ── Validation message quality ────────────────────────────────────────────────

def test_error_message_does_not_expose_stack_trace():
    response = client.post("/api/recommendations", json={"query": "DELETE FROM orders"})
    detail = response.json()["detail"]
    assert "Traceback" not in detail
    assert "File \"" not in detail

# ============================================================
# REAL CHINOOK DATABASE — USER INPUT TESTS
# ============================================================

def test_real_schema_endpoint_returns_chinook_tables():
    response = client.get("/api/real-schema")

    assert response.status_code == 200
    body = response.json()

    assert body["database"] == "Chinook_Sqlite.sqlite"

    table_names = {table["name"] for table in body["tables"]}

    assert {"Customer", "Invoice", "Track", "Artist"} <= table_names


def test_real_recommendations_accept_custom_select_query():
    query = """
        SELECT CustomerId, FirstName, LastName
        FROM Customer
        WHERE Country = 'USA'
    """

    response = client.post(
        "/api/real-recommendations",
        json={"query": query},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["query"]
    assert body["analysis"]["tables"] == ["Customer"]
    assert isinstance(body["recommendations"], list)
    assert isinstance(body["rejected_candidates"], list)


def test_real_recommendations_reject_multiple_statements():
    response = client.post(
        "/api/real-recommendations",
        json={
            "query": "SELECT * FROM Customer; SELECT * FROM Invoice"
        },
    )

    assert response.status_code == 422


def test_real_recommendations_reject_unknown_table():
    response = client.post(
        "/api/real-recommendations",
        json={"query": "SELECT * FROM CustomerUnknown"},
    )

    assert response.status_code == 422
    assert "CustomerUnknown" in response.json()["detail"]


def test_real_query_plan_accepts_custom_query():
    response = client.post(
        "/api/real-query-plan",
        json={
            "query": """
                SELECT InvoiceId, InvoiceDate
                FROM Invoice
                WHERE CustomerId = 5
                ORDER BY InvoiceDate DESC
            """
        },
    )

    assert response.status_code == 200
    assert response.json()["plan"]

def test_real_recommendations_rank_composite_index_higher():
    response = client.post(
        "/api/real-recommendations",
        json={
            "query": """
                SELECT InvoiceId, InvoiceDate, Total
                FROM Invoice
                WHERE CustomerId = 5
                ORDER BY InvoiceDate DESC
            """
        },
    )

    assert response.status_code == 200

    recommendations = response.json()["recommendations"]

    composite = next(
        recommendation
        for recommendation in recommendations
        if recommendation["columns"] == ["CustomerId", "InvoiceDate"]
    )

    assert composite["recommendation"] == "recommended"
    assert composite["priority"] == "preferred"
    assert composite["evidence"]

