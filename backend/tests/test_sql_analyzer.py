
from app.services.sql_analyzer import extract_query_features


def test_extracts_like_pattern():
    features = extract_query_features(
        "SELECT * FROM customers WHERE name LIKE 'phone%'",
        {"customers": {"name"}},
    )
    assert "phone%" in features.like_patterns


def test_extracts_leading_wildcard_pattern():
    features = extract_query_features(
        "SELECT * FROM customers WHERE name LIKE '%phone'",
        {"customers": {"name"}},
    )
    assert "%phone" in features.like_patterns


def test_extracts_function_wrapped_column():
    features = extract_query_features(
        "SELECT * FROM customers WHERE LOWER(name) = 'alice'",
        {"customers": {"name"}},
    )
    assert "customers.name" in features.expression_columns
