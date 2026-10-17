
from app.services.sql_workspace import (
    create_workspace,
    execute_workspace_sql,
    inspect_workspace_schema,
)


def test_workspaces_are_isolated():
    workspace_a = create_workspace()
    workspace_b = create_workspace()

    try:
        execute_workspace_sql(
            workspace_a,
            """
            CREATE TABLE isolation_test (
                id INTEGER PRIMARY KEY,
                message TEXT
            );
            INSERT INTO isolation_test (id, message)
            VALUES (1, 'Workspace A only');
            """,
        )

        schema_a = inspect_workspace_schema(workspace_a)
        schema_b = inspect_workspace_schema(workspace_b)

        names_a = {table["name"] for table in schema_a["tables"]}
        names_b = {table["name"] for table in schema_b["tables"]}

        assert "isolation_test" in names_a
        assert "isolation_test" not in names_b

    finally:
        workspace_a.close()
        workspace_b.close()

import pytest

from app.services.sql_workspace import WorkspaceError


def test_attach_is_blocked():
    connection = create_workspace()
    try:
        with pytest.raises(WorkspaceError):
            execute_workspace_sql(
                connection,
                "ATTACH DATABASE ':memory:' AS other_db;",
            )
    finally:
        connection.close()


def test_unsafe_pragma_is_blocked():
    connection = create_workspace()
    try:
        with pytest.raises(WorkspaceError):
            execute_workspace_sql(
                connection,
                "PRAGMA foreign_keys = OFF;",
            )
    finally:
        connection.close()


def test_allowed_schema_pragma_works():
    connection = create_workspace()
    try:
        result = execute_workspace_sql(
            connection,
            "PRAGMA table_list;",
        )
        assert result["success"] is True
    finally:
        connection.close()
