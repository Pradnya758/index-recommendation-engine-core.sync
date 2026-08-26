import pytest

from app.services.sql_validator import SqlValidationError, validate_select_query


def test_accepts_a_select_query():
    assert validate_select_query("SELECT * FROM students WHERE major = 'Computer Science'") == "SELECT * FROM students WHERE major = 'Computer Science'"


@pytest.mark.parametrize("query", ["INSERT INTO students VALUES (1, 'A', 'a@b.com', 'CS', 2024)", "UPDATE orders SET status = 'paid'", "DROP TABLE customers"])
def test_rejects_non_select_queries(query: str):
    with pytest.raises(SqlValidationError, match="Only SELECT queries"):
        validate_select_query(query)


def test_rejects_multiple_statements():
    with pytest.raises(SqlValidationError, match="exactly one"):
        validate_select_query("SELECT * FROM students; DELETE FROM students")
