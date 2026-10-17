from collections.abc import Iterable

from sqlglot import exp, parse_one

from app.models.schemas import ColumnReference, JoinCondition, QueryFeatures, WhereCondition


class SqlAnalysisError(ValueError):
    """Raised when a valid SELECT cannot be mapped to the inspected schema."""



def extract_query_features(query: str, schema_tables: dict[str, set[str]]) -> QueryFeatures:
    """Extract index-relevant features from a SQLite SELECT using SQLGlot."""
    expression = parse_one(query, read="sqlite")
    aliases, tables = _table_aliases(expression, schema_tables)

    where_conditions: list[WhereCondition] = []
    equality_filters: list[ColumnReference] = []
    range_filters: list[ColumnReference] = []
    join_columns: list[ColumnReference] = []
    order_by_columns: list[ColumnReference] = []
    group_by_columns: list[ColumnReference] = []

    like_patterns: list[str] = []
    expression_columns: list[str] = []
    collations: list[str] = []

    # Existing WHERE-condition extraction.
    where = expression.args.get("where")
    if where:
        for condition in _split_and(where.this):
            condition_data = _where_condition(condition, aliases, schema_tables)
            if condition_data is None:
                continue

            column, operator, kind = condition_data
            where_conditions.append(
                WhereCondition(
                    table=column.table,
                    column=column.column,
                    operator=operator,
                    kind=kind,
                )
            )

            if kind == "equality":
                _append_unique(equality_filters, column)
            else:
                _append_unique(range_filters, column)

    # Extract LIKE patterns from the parsed SQL expression.
    for like_expression in expression.find_all(exp.Like):
        pattern_expression = like_expression.args.get("expression")
        if pattern_expression is not None:
            pattern = getattr(pattern_expression, "this", None)
            if isinstance(pattern, str) and pattern not in like_patterns:
                like_patterns.append(pattern)

    # Record function-wrapped columns, e.g. LOWER(name).
    for function in expression.find_all(exp.Func):
        for column_expression in function.find_all(exp.Column):
            column = _resolve_column(column_expression, aliases, schema_tables)
            if column is not None:
                label = f"{column.table}.{column.column}"
                if label not in expression_columns:
                    expression_columns.append(label)

    # Record explicit COLLATE expressions.
    for collate_expression in expression.find_all(exp.Collate):
        collation_expression = collate_expression.args.get("expression")
        collation_name = collate_expression.args.get("collation")

        if collation_name is not None:
            name = getattr(collation_name, "name", None)
            if not name:
                name = getattr(collation_name, "this", None)
            if name is not None:
                name = str(name)
                if name not in collations:
                    collations.append(name)

    # Existing JOIN extraction.
    for join in expression.find_all(exp.Join):
        on_clause = join.args.get("on")
        if not on_clause:
            continue

        for equality in on_clause.find_all(exp.EQ):
            left = _resolve_column(equality.left, aliases, schema_tables)
            right = _resolve_column(equality.right, aliases, schema_tables)

            if left is None or right is None:
                continue

            _append_unique(join_columns, left)
            _append_unique(join_columns, right)

    # Existing ORDER BY extraction.
    order = expression.args.get("order")
    if order:
        for ordered_expression in order.expressions:
            column = _resolve_column(
                ordered_expression.this, aliases, schema_tables
            )
            if column:
                _append_unique(order_by_columns, column)

    # Existing GROUP BY extraction.
    group = expression.args.get("group")
    if group:
        for group_expression in group.expressions:
            column = _resolve_column(
                group_expression, aliases, schema_tables
            )
            if column:
                _append_unique(group_by_columns, column)

    return QueryFeatures(
        tables=tables,
        where_conditions=where_conditions,
        equality_filters=equality_filters,
        range_filters=range_filters,
        join_columns=join_columns,
        order_by_columns=order_by_columns,
        group_by_columns=group_by_columns,
        like_patterns=like_patterns,
        expression_columns=expression_columns,
        collations=collations,
    )

def _table_aliases(expression: exp.Expression, schema_tables: dict[str, set[str]]) -> tuple[dict[str, str], list[str]]:
    aliases: dict[str, str] = {}
    tables: list[str] = []
    for table in expression.find_all(exp.Table):
        table_name = table.name
        if table_name not in schema_tables:
            raise SqlAnalysisError(f"Table '{table_name}' does not exist in the demo database.")
        aliases[table.alias_or_name] = table_name
        if table_name not in tables:
            tables.append(table_name)
    return aliases, tables


def _split_and(condition: exp.Expression) -> Iterable[exp.Expression]:
    if isinstance(condition, exp.And):
        yield from _split_and(condition.left)
        yield from _split_and(condition.right)
    else:
        yield condition


def _where_condition(
    condition: exp.Expression, aliases: dict[str, str], schema_tables: dict[str, set[str]]
) -> tuple[ColumnReference, str, str] | None:
    if isinstance(condition, exp.Between):
        column = _resolve_column(condition.this, aliases, schema_tables)
        return (column, "BETWEEN", "range") if column else None

    equality_operators = (exp.EQ,)
    range_operators = (exp.GT, exp.GTE, exp.LT, exp.LTE)
    if not isinstance(condition, equality_operators + range_operators):
        return None

    left = _resolve_column(condition.left, aliases, schema_tables)
    right = _resolve_column(condition.right, aliases, schema_tables)
    if (left is None) == (right is None):
        return None

    column = left or right
    kind = "equality" if isinstance(condition, equality_operators) else "range"
    return column, condition.key.upper(), kind


def _resolve_column(
    expression: exp.Expression, aliases: dict[str, str], schema_tables: dict[str, set[str]]
) -> ColumnReference | None:
    if not isinstance(expression, exp.Column):
        return None

    column_name = expression.name
    qualifier = expression.table
    if qualifier:
        table_name = aliases.get(qualifier, qualifier)
        if table_name not in schema_tables or column_name not in schema_tables[table_name]:
            return None
        return ColumnReference(table=table_name, column=column_name)

    # An unqualified column is resolved only against tables used by this query,
    # not every table in the demo schema.
    query_tables = set(aliases.values())
    matching_tables = [
        table_name for table_name, columns in schema_tables.items() if table_name in query_tables and column_name in columns
    ]
    if len(matching_tables) != 1:
        return None
    return ColumnReference(table=matching_tables[0], column=column_name)


def _append_unique(items: list[ColumnReference], item: ColumnReference) -> None:
    if item not in items:
        items.append(item)
