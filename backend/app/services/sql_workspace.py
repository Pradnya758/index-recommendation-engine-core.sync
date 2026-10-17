
import re
import sqlite3
from typing import Any

from app.services.demo_database import get_demo_database_path


MAX_SQL_LENGTH = 20_000
MAX_ROWS = 500

# Only these PRAGMAs are allowed through the workspace API.
ALLOWED_PRAGMAS = {
    "table_info",
    "table_list",
    "index_list",
    "index_info",
    "foreign_key_list",
}


class WorkspaceError(ValueError):
    """Raised when a workspace SQL request is invalid or unsafe."""


def create_workspace() -> sqlite3.Connection:
    """Create an isolated in-memory copy of the demo database."""
    source = None
    workspace = sqlite3.connect(":memory:", check_same_thread=False)
    workspace.row_factory = sqlite3.Row

    try:
        source = sqlite3.connect(get_demo_database_path())
        source.backup(workspace)
        workspace.execute("PRAGMA foreign_keys = ON")
        return workspace
    except Exception:
        workspace.close()
        raise
    finally:
        if source is not None:
            source.close()


def _validate_sql(sql: str) -> str:
    if not isinstance(sql, str) or not sql.strip():
        raise WorkspaceError("Enter a SQL statement.")

    if len(sql) > MAX_SQL_LENGTH:
        raise WorkspaceError(
            f"SQL cannot exceed {MAX_SQL_LENGTH} characters."
        )

    return sql.strip()


def _split_statements(sql: str) -> list[str]:
    """Split SQL while respecting quoted strings and comments."""
    statements = []
    buffer = []
    quote = None
    line_comment = False
    block_comment = False
    i = 0

    while i < len(sql):
        char = sql[i]
        nxt = sql[i + 1] if i + 1 < len(sql) else ""

        if line_comment:
            if char == "\n":
                line_comment = False
                buffer.append(char)
            i += 1
            continue

        if block_comment:
            if char == "*" and nxt == "/":
                block_comment = False
                i += 2
            else:
                i += 1
            continue

        if quote:
            buffer.append(char)
            if char == quote:
                if nxt == quote and quote in ("'", '"', "`"):
                    buffer.append(nxt)
                    i += 2
                    continue
                quote = None
            elif char == "\\" and quote == "'":
                if nxt:
                    buffer.append(nxt)
                    i += 2
                    continue
            i += 1
            continue

        if char == "-" and nxt == "-":
            line_comment = True
            i += 2
            continue

        if char == "/" and nxt == "*":
            block_comment = True
            i += 2
            continue

        if char in ("'", '"', "`"):
            quote = char
            buffer.append(char)
            i += 1
            continue

        if char == "[":
            quote = "]"
            buffer.append(char)
            i += 1
            continue

        if char == ";":
            statement = "".join(buffer).strip()
            if statement:
                statements.append(statement)
            buffer = []
        else:
            buffer.append(char)

        i += 1

    statement = "".join(buffer).strip()
    if statement:
        statements.append(statement)

    if quote or block_comment:
        raise WorkspaceError("SQL contains an unterminated quote or comment.")

    return statements


def _check_statement(statement: str) -> None:
    """Reject commands that can escape the isolated SQLite workspace."""
    normalized = statement.strip()
    match = re.match(r"([A-Za-z]+)", normalized)

    if not match:
        raise WorkspaceError("Could not identify the SQL statement type.")

    command = match.group(1).upper()

    if command in {"ATTACH", "DETACH", "VACUUM", "LOAD_EXTENSION"}:
        raise WorkspaceError(f"{command} is not allowed in the workspace.")

    if command == "PRAGMA":
        pragma_match = re.match(
            r"PRAGMA\s+(?:[A-Za-z_][A-Za-z0-9_]*\.)?"
            r"([A-Za-z_][A-Za-z0-9_]*)",
            normalized,
            flags=re.IGNORECASE,
        )
        if not pragma_match:
            raise WorkspaceError("Invalid PRAGMA statement.")

        pragma_name = pragma_match.group(1).lower()
        if pragma_name not in ALLOWED_PRAGMAS:
            raise WorkspaceError(
                f"PRAGMA {pragma_name} is not allowed."
            )

        
        # Allow read-only schema inspection PRAGMAs with table arguments.
        # Continue rejecting assignment-style PRAGMAs.
        if "=" in normalized:
            raise WorkspaceError(
                "Only read-only schema inspection PRAGMAs are allowed."
            )

        if not re.fullmatch(
            r"PRAGMA\s+(?:[A-Za-z_][A-Za-z0-9_]*\.)?"
            r"(?:table_info|table_list|index_list|index_info|foreign_key_list)"
            r"(?:\s*\(\s*(?:'[^']*'|\"[^\"]*\"|[A-Za-z_][A-Za-z0-9_]*)\s*\))?\s*",
            normalized,
            flags=re.IGNORECASE,
        ):
            raise WorkspaceError(
                "Invalid or unsupported schema-inspection PRAGMA."
            )


    if command in {"GRANT", "REVOKE"}:
        raise WorkspaceError(
            "SQLite does not support GRANT or REVOKE statements."
        )


def execute_workspace_sql(
    connection: sqlite3.Connection,
    sql: str,
    parameters: list[Any] | None = None,
) -> dict[str, Any]:
    """
    Execute SQL in the isolated workspace.

    Multiple statements are supported sequentially. If one fails, the
    current transaction is rolled back.
    """
    sql = _validate_sql(sql)
    statements = _split_statements(sql)

    if not statements:
        raise WorkspaceError("Enter a SQL statement.")

    for statement in statements:
        _check_statement(statement)

    if parameters and len(statements) != 1:
        raise WorkspaceError(
            "Parameterized queries must contain exactly one statement."
        )

    results = []

    try:
        for statement in statements:
            cursor = connection.execute(
                statement,
                parameters or [],
            )

            if cursor.description:
                columns = [column[0] for column in cursor.description]
                rows = cursor.fetchmany(MAX_ROWS + 1)
                truncated = len(rows) > MAX_ROWS
                rows = rows[:MAX_ROWS]

                results.append(
                    {
                        "statement": statement,
                        "columns": columns,
                        "rows": [
                            {column: row[column] for column in columns}
                            for row in rows
                        ],
                        "row_count": len(rows),
                        "truncated": truncated,
                    }
                )
            else:
                results.append(
                    {
                        "statement": statement,
                        "columns": [],
                        "rows": [],
                        "row_count": cursor.rowcount,
                        "truncated": False,
                    }
                )

        return {
            "success": True,
            "results": results,
        }

    except sqlite3.Error as error:
        connection.rollback()
        raise WorkspaceError(str(error)) from error



def inspect_workspace_schema(
    connection: sqlite3.Connection,
) -> dict[str, Any]:
    """Return user tables, columns, and indexes in the workspace."""
    tables = connection.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()

    result = []

    for row in tables:
        name = row["name"]
        safe_name = name.replace('"', '""')

        columns = connection.execute(
            f'PRAGMA table_info("{safe_name}")'
        ).fetchall()

        index_rows = connection.execute(
            f'PRAGMA index_list("{safe_name}")'
        ).fetchall()

        indexes = []

        for index_row in index_rows:
            index_name = index_row["name"]
            safe_index_name = index_name.replace('"', '""')

            index_columns = connection.execute(
                f'PRAGMA index_info("{safe_index_name}")'
            ).fetchall()

            indexes.append(
                {
                    "name": index_name,
                    "unique": bool(index_row["unique"]),
                    "origin": index_row["origin"],
                    "partial": bool(index_row["partial"]),
                    "columns": [
                        index_column["name"]
                        for index_column in index_columns
                        if index_column["name"] is not None
                    ],
                }
            )

        result.append(
            {
                "name": name,
                "columns": [
                    {
                        "name": column["name"],
                        "type": column["type"],
                        "not_null": bool(column["notnull"]),
                        "primary_key_position": column["pk"],
                    }
                    for column in columns
                ],
                "indexes": indexes,
            }
        )

    return {"tables": result}

def explain_workspace_query(
    connection: sqlite3.Connection,
    query: str,
) -> dict[str, Any]:
    """Inspect a single SELECT query without changing workspace data."""
    statements = _split_statements(_validate_sql(query))

    if len(statements) != 1:
        raise WorkspaceError(
            "Query-plan inspection requires exactly one SELECT statement."
        )

    statement = statements[0]
    _check_statement(statement)

    if not re.match(r"^\s*(SELECT|WITH)\b", statement, re.IGNORECASE):
        raise WorkspaceError(
            "Query-plan inspection only accepts SELECT queries."
        )

    try:
        cursor = connection.execute(
            "EXPLAIN QUERY PLAN " + statement
        )
        return {
            "query": statement,
            "plan": [
                {
                    "id": row[0],
                    "parent": row[1],
                    "detail": row[3],
                }
                for row in cursor.fetchall()
            ],
        }
    except sqlite3.Error as error:
        raise WorkspaceError(str(error)) from error
