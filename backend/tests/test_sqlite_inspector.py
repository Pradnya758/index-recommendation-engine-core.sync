from app.services.sqlite_inspector import get_query_plan, inspect_demo_schema


def test_inspects_demo_tables_and_indexes():
    schema = inspect_demo_schema()
    tables = {table.name: table for table in schema.tables}

    assert set(tables) == {"customers", "orders", "products", "students"}
    assert tables["orders"].primary_keys == ["order_id"]
    assert any(index.name == "idx_orders_customer_id" for index in tables["orders"].indexes)
    assert any(column.name == "status" and column.data_type == "TEXT" for column in tables["orders"].columns)


def test_returns_query_plan_for_valid_query():
    plan = get_query_plan("SELECT * FROM orders WHERE customer_id = 10")

    assert plan
    assert any("orders" in step.detail.lower() for step in plan)
