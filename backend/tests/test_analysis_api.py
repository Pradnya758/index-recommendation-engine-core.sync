from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_check_is_preserved():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_schema_endpoint_returns_demo_schema():
    response = client.get("/api/schema")

    assert response.status_code == 200
    assert len(response.json()["tables"]) == 4


def test_sql_validation_endpoint_rejects_destructive_sql():
    response = client.post("/api/sql/validate", json={"query": "DELETE FROM orders"})

    assert response.status_code == 422
    assert "Only SELECT queries" in response.json()["detail"]


def test_query_plan_endpoint_returns_structured_steps():
    response = client.post("/api/query-plan", json={"query": "SELECT * FROM orders WHERE customer_id = 42"})

    assert response.status_code == 200
    body = response.json()
    assert body["plan"]
    assert {"id", "parent", "detail"} <= set(body["plan"][0])


def test_recommendations_endpoint_returns_rule_based_result():
    response = client.post("/api/recommendations", json={"query": "SELECT * FROM orders WHERE status = 'paid'"})

    assert response.status_code == 200
    body = response.json()
    assert body["recommendations"][0]["columns"] == ["status"]
    assert body["recommendations"][0]["create_index_sql"].startswith("CREATE INDEX")
