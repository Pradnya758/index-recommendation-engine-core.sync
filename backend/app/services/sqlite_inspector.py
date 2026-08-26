import sqlite3

from app.models.schemas import ColumnInfo, IndexInfo, QueryPlanStep, SchemaInspectionResponse, TableInfo
from app.services.demo_database import get_demo_database_path


def inspect_demo_schema() -> SchemaInspectionResponse:
    """Inspect the built-in SQLite database using SQLite metadata pragmas."""
    with sqlite3.connect(get_demo_database_path()) as connection:
        table_names = [
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
        ]
        tables = [_inspect_table(connection, table_name) for table_name in table_names]

    return SchemaInspectionResponse(database="index_engine_demo.db", tables=tables)


def get_query_plan(query: str) -> list[QueryPlanStep]:
    """Run SQLite's non-mutating EXPLAIN QUERY PLAN for an already validated query."""
    try:
        with sqlite3.connect(get_demo_database_path()) as connection:
            rows = connection.execute(f"EXPLAIN QUERY PLAN {query}").fetchall()
    except sqlite3.Error as error:
        raise ValueError(f"Unable to build a query plan: {error}") from error

    return [QueryPlanStep(id=row[0], parent=row[1], detail=row[3]) for row in rows]


def _inspect_table(connection: sqlite3.Connection, table_name: str) -> TableInfo:
    quoted_table = table_name.replace('"', '""')
    column_rows = connection.execute(f'PRAGMA table_info("{quoted_table}")').fetchall()
    columns = [
        ColumnInfo(
            name=row[1],
            data_type=row[2] or "UNKNOWN",
            nullable=not bool(row[3]),
            primary_key_position=row[5] or None,
        )
        for row in column_rows
    ]
    primary_keys = [row[1] for row in sorted(column_rows, key=lambda row: row[5]) if row[5]]
    indexes = _inspect_indexes(connection, table_name)
    return TableInfo(name=table_name, columns=columns, primary_keys=primary_keys, indexes=indexes)


def _inspect_indexes(connection: sqlite3.Connection, table_name: str) -> list[IndexInfo]:
    quoted_table = table_name.replace('"', '""')
    index_rows = connection.execute(f'PRAGMA index_list("{quoted_table}")').fetchall()
    indexes = []
    for row in index_rows:
        index_name, is_unique, origin = row[1], bool(row[2]), row[3]
        quoted_index = index_name.replace('"', '""')
        columns = [
            column_row[2]
            for column_row in connection.execute(f'PRAGMA index_info("{quoted_index}")').fetchall()
        ]
        indexes.append(IndexInfo(name=index_name, columns=columns, unique=is_unique, origin=origin))
    return indexes
