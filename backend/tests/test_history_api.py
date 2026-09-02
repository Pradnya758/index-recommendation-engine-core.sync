"""Tests for the /api/history endpoints."""
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

_REC = {
    "query": "SELECT * FROM orders WHERE status = 'paid'",
    "analysis": {
        "tables": ["orders"],
        "where_conditions": [],
        "equality_filters": [{"table": "orders", "column": "status"}],
        "range_filters": [],
        "join_columns": [],
        "order_by_columns": [],
        "group_by_columns": [],
    },
    "recommendations": [
        {
            "table": "orders",
            "columns": ["status"],
            "create_index_sql": 'CREATE INDEX "idx_orders_status" ON "orders" ("status");',
            "drop_index_sql": 'DROP INDEX IF EXISTS "idx_orders_status";',
            "score": 45,
            "confidence": "medium",
            "reasons": ["Equality filters are highly selective."],
            "evidence": [{"feature": "equality_filter", "table": "orders", "column": "status", "detail": "orders.status appears in EQUALITY FILTER"}],
        }
    ],
    "rejected_candidates": [],
}

_PLAN = {
    "query": "SELECT * FROM orders WHERE status = 'paid'",
    "plan": [{"id": 2, "parent": 0, "detail": "SCAN orders"}],
}


def test_save_and_retrieve_history():
    r = client.post("/api/history", json={"rec": _REC, "plan": _PLAN})
    assert r.status_code == 201
    entry_id = r.json()["id"]

    r2 = client.get(f"/api/history/{entry_id}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["id"] == entry_id
    assert body["query"] == _REC["query"]
    assert body["rec"]["recommendations"][0]["columns"] == ["status"]
    assert body["plan"]["plan"][0]["detail"] == "SCAN orders"


def test_list_history_returns_entries():
    client.post("/api/history", json={"rec": _REC, "plan": _PLAN})
    r = client.get("/api/history")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_delete_history_entry():
    r = client.post("/api/history", json={"rec": _REC, "plan": _PLAN})
    entry_id = r.json()["id"]

    r2 = client.delete(f"/api/history/{entry_id}")
    assert r2.status_code == 204

    r3 = client.get(f"/api/history/{entry_id}")
    assert r3.status_code == 404


def test_clear_history():
    client.post("/api/history", json={"rec": _REC, "plan": _PLAN})
    r = client.delete("/api/history")
    assert r.status_code == 204

    r2 = client.get("/api/history")
    assert r2.json() == []


def test_get_nonexistent_entry_returns_404():
    r = client.get("/api/history/999999")
    assert r.status_code == 404
