"""Tests for /api/explain and /api/explain/followup (local fallback path)."""
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

_REC = {
    "query": "SELECT * FROM orders WHERE customer_id = 10 AND status = 'paid' ORDER BY order_date",
    "analysis": {
        "tables": ["orders"],
        "where_conditions": [],
        "equality_filters": [
            {"table": "orders", "column": "customer_id"},
            {"table": "orders", "column": "status"},
        ],
        "range_filters": [],
        "join_columns": [],
        "order_by_columns": [{"table": "orders", "column": "order_date"}],
        "group_by_columns": [],
    },
    "recommendations": [
        {
            "table": "orders",
            "columns": ["customer_id", "status"],
            "create_index_sql": 'CREATE INDEX "idx_orders_customer_id_status" ON "orders" ("customer_id", "status");',
            "drop_index_sql": 'DROP INDEX IF EXISTS "idx_orders_customer_id_status";',
            "score": 65,
            "confidence": "high",
            "reasons": ["Multiple equality filters are best placed together in a composite index."],
            "evidence": [
                {"feature": "equality_filter", "table": "orders", "column": "customer_id", "detail": "orders.customer_id appears in EQUALITY FILTER"},
                {"feature": "equality_filter", "table": "orders", "column": "status", "detail": "orders.status appears in EQUALITY FILTER"},
            ],
        }
    ],
    "rejected_candidates": [],
}

_PLAN = {
    "query": "SELECT * FROM orders WHERE customer_id = 10 AND status = 'paid' ORDER BY order_date",
    "plan": [{"id": 2, "parent": 0, "detail": "SCAN orders"}],
}


def test_explain_returns_all_sections():
    r = client.post("/api/explain", json={"rec": _REC, "plan": _PLAN})
    assert r.status_code == 200
    body = r.json()
    for key in ("source", "query_summary", "features_detected", "why_this_index",
                "simple_explanation", "technical_explanation", "tradeoffs", "query_plan_meaning"):
        assert key in body, f"Missing key: {key}"


def test_explain_source_is_local_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    r = client.post("/api/explain", json={"rec": _REC, "plan": _PLAN})
    assert r.status_code == 200
    assert r.json()["source"] == "local"


def test_explain_contains_actual_table_name():
    r = client.post("/api/explain", json={"rec": _REC, "plan": _PLAN})
    body = r.json()
    assert "orders" in body["query_summary"]


def test_explain_contains_recommendation_details():
    r = client.post("/api/explain", json={"rec": _REC, "plan": _PLAN})
    body = r.json()
    assert "customer_id" in body["why_this_index"] or "customer_id" in body["technical_explanation"]


def test_followup_returns_answer():
    r = client.post("/api/explain/followup", json={
        "question": "Why is this a composite index?",
        "rec": _REC,
        "plan": _PLAN,
    })
    assert r.status_code == 200
    body = r.json()
    assert "answer" in body
    assert len(body["answer"]) > 20


def test_followup_scan_question():
    r = client.post("/api/explain/followup", json={
        "question": "What does EXPLAIN QUERY PLAN mean?",
        "rec": _REC,
        "plan": _PLAN,
    })
    assert r.status_code == 200
    assert "answer" in r.json()


def test_explain_no_recommendation():
    rec_no_recs = {**_REC, "recommendations": [], "rejected_candidates": [
        {"table": "orders", "columns": ["customer_id"], "reason": "Rejected because existing index covers this."}
    ]}
    r = client.post("/api/explain", json={"rec": rec_no_recs, "plan": _PLAN})
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "local"
    assert len(body["simple_explanation"]) > 10
