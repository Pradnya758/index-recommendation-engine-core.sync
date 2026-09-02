import pytest

from app.services.sql_validator import SqlValidationError, validate_select_query


# ── TC-01: Valid SELECT ───────────────────────────────────────────────────────

def test_accepts_simple_select():
    result = validate_select_query("SELECT * FROM students WHERE major = 'Computer Science'")
    assert "SELECT" in result.upper()


def test_accepts_select_with_join():
    result = validate_select_query(
        "SELECT o.order_id FROM orders o JOIN customers c ON o.customer_id = c.customer_id"
    )
    assert result


def test_accepts_select_with_order_by():
    result = validate_select_query("SELECT * FROM orders ORDER BY order_date DESC")
    assert result


# ── TC-02: Empty SQL ──────────────────────────────────────────────────────────

def test_rejects_empty_string():
    with pytest.raises(SqlValidationError, match="empty"):
        validate_select_query("")


def test_rejects_whitespace_only():
    with pytest.raises(SqlValidationError, match="empty"):
        validate_select_query("   \n\t  ")


# ── TC-03: Malformed SQL ──────────────────────────────────────────────────────

def test_rejects_malformed_sql():
    with pytest.raises(SqlValidationError):
        validate_select_query("SELEKT * FORM orders")


def test_rejects_incomplete_select():
    with pytest.raises(SqlValidationError):
        validate_select_query("SELECT FROM")


# ── TC-04: Destructive SQL — INSERT ──────────────────────────────────────────

def test_rejects_insert():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("INSERT INTO students VALUES (1, 'Alice', 'a@b.com', 'CS', 2024)")


# ── TC-04: Destructive SQL — UPDATE ──────────────────────────────────────────

def test_rejects_update():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("UPDATE orders SET status = 'paid'")


# ── TC-04: Destructive SQL — DELETE ──────────────────────────────────────────

def test_rejects_delete():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("DELETE FROM orders WHERE order_id = 1")


# ── TC-04: Destructive SQL — DROP ────────────────────────────────────────────

def test_rejects_drop():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("DROP TABLE customers")


# ── TC-04: Destructive SQL — ALTER ───────────────────────────────────────────

def test_rejects_alter():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("ALTER TABLE orders ADD COLUMN notes TEXT")


# ── TC-04: Destructive SQL — CREATE ──────────────────────────────────────────

def test_rejects_create():
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query("CREATE TABLE new_table (id INTEGER PRIMARY KEY)")


# ── TC-05: Multiple statements ────────────────────────────────────────────────

def test_rejects_multiple_statements():
    with pytest.raises(SqlValidationError, match="exactly one"):
        validate_select_query("SELECT * FROM students; DELETE FROM students")


def test_rejects_two_selects():
    with pytest.raises(SqlValidationError, match="exactly one"):
        validate_select_query("SELECT * FROM students; SELECT * FROM orders")


# ── Parametrized sweep ────────────────────────────────────────────────────────

@pytest.mark.parametrize("query", [
    "INSERT INTO students VALUES (1, 'A', 'a@b.com', 'CS', 2024)",
    "UPDATE orders SET status = 'paid'",
    "DELETE FROM orders",
    "DROP TABLE customers",
    "ALTER TABLE orders ADD COLUMN notes TEXT",
    "CREATE TABLE t (id INTEGER PRIMARY KEY)",
])
def test_all_destructive_types_rejected(query: str):
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query(query)
