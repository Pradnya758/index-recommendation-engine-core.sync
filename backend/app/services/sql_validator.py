from sqlglot import exp, parse
from sqlglot.errors import ParseError


class SqlValidationError(ValueError):
    """Raised when a query is not one safe, supported SELECT statement."""


def validate_select_query(query: str) -> str:
    """Parse and normalize one SQLite SELECT query without executing user SQL."""
    if not query.strip():
        raise SqlValidationError("SQL query cannot be empty.")

    try:
        statements = parse(query, read="sqlite")
    except ParseError as error:
        raise SqlValidationError(f"Invalid SQLite SQL: {error}") from error

    if len(statements) != 1:
        raise SqlValidationError("Submit exactly one SQL statement. Multiple statements are not allowed.")

    statement = statements[0]
    if not isinstance(statement, exp.Query):
        statement_type = statement.key.upper() if statement.key else "UNKNOWN"
        raise SqlValidationError(
            f"Only SELECT queries are supported in Phase 1. Received {statement_type} statement."
        )

    return statement.sql(dialect="sqlite")
