
"""Version-controlled, evidence-based SQLite index recommendation rules.

These rules describe SQLite planner behaviour. They do not assign arbitrary
numeric scores or guarantee that an index will improve query performance.
"""

from dataclasses import dataclass


SQLITE_QUERY_PLANNER = "https://www.sqlite.org/queryplanner.html"
SQLITE_OPTIMIZER = "https://www.sqlite.org/optoverview.html"
SQLITE_EQP = "https://sqlite.org/eqp.html"


@dataclass(frozen=True)
class SQLiteRule:
    rule_id: str
    title: str
    description: str
    source_type: str
    source_url: str
    patterns: tuple[str, ...]
    conditions: tuple[str, ...]
    exceptions: tuple[str, ...]
    reasons: tuple[str, ...]


_RULES = (
    SQLiteRule(
        "R1",
        "Search predicates",
        "Indexes may help SQLite locate rows matching search predicates.",
        "query-planner",
        SQLITE_QUERY_PLANNER,
        ("equality", "IN", "IS", "range"),
        ("A predicate references an indexed table column.",),
        ("Low-selectivity predicates may not benefit from an index.",),
        ("The candidate targets a column used by a search predicate.",),
    ),
    SQLiteRule(
        "R2",
        "Composite index prefixes",
        "A composite index is generally usable through its leftmost columns.",
        "optimizer",
        SQLITE_OPTIMIZER,
        ("composite", "leftmost-prefix", "equality-plus-range"),
        ("Leading index columns match usable query constraints.",),
        ("Gaps in constrained columns and constraints after a range can limit use.",),
        ("Column order must match the query's usable constraint prefix.",),
    ),
    SQLiteRule(
        "R3",
        "Covering indexes",
        "An index may cover a query when it contains all required table values.",
        "query-planner",
        SQLITE_QUERY_PLANNER,
        ("covering-index", "projection", "predicate"),
        ("The plan or index structure supports a covering access path.",),
        ("A covering index can increase storage and write costs.",),
        ("Check EXPLAIN QUERY PLAN for a covering-index indication.",),
    ),
    SQLiteRule(
        "R4",
        "Sorting and grouping",
        "Indexes may help satisfy ORDER BY, GROUP BY, or DISTINCT operations.",
        "eqp",
        SQLITE_EQP,
        ("ORDER BY", "GROUP BY", "DISTINCT", "temporary-b-tree"),
        ("Index order is compatible with the required ordering or grouping.",),
        ("Expressions, direction, collation, and query shape can prevent use.",),
        ("Compare plans for temporary B-tree usage before and after the candidate.",),
    ),
    SQLiteRule(
        "R5",
        "Join lookups",
        "Indexes may help inner-loop table lookups in nested-loop joins.",
        "optimizer",
        SQLITE_OPTIMIZER,
        ("JOIN", "join-key", "nested-loop"),
        ("A join column is used to look up matching rows.",),
        ("The best access path depends on join order and available constraints.",),
        ("Inspect each table's access operation in the query plan.",),
    ),
    SQLiteRule(
        "R6",
        "Expressions and LIKE",
        "Expression and pattern predicates have specific index requirements.",
        "optimizer",
        SQLITE_OPTIMIZER,
        ("expression", "function", "LIKE", "collation"),
        ("The indexed expression or collation matches SQLite's requirements.",),
        ("A plain column index may not serve a function-wrapped column; LIKE optimisation depends on pattern and collation.",),
        ("Do not assume a normal column index supports every expression or LIKE predicate.",),
    ),
    SQLiteRule(
        "R7",
        "Statistics and uncertainty",
        "Planner choices can depend on statistics and data distribution.",
        "optimizer",
        SQLITE_OPTIMIZER,
        ("ANALYZE", "statistics", "selectivity"),
        ("Planner estimates or representative data affect candidate evaluation.",),
        ("Small or synthetic datasets may not represent production behaviour.",),
        ("Mark inconclusive or unrepresentative experiments as uncertain.",),
    ),
    SQLiteRule(
        "R8",
        "Redundant indexes",
        "An existing index may make a proposed index unnecessary.",
        "query-planner",
        SQLITE_QUERY_PLANNER,
        ("redundancy", "existing-index", "composite-prefix"),
        ("An existing index provides a compatible access path.",),
        ("Column order, uniqueness, partial-index predicates, and collation matter.",),
        ("Check index definitions and semantics before rejecting a candidate as redundant.",),
    ),
    SQLiteRule(
        "R9",
        "Rowid and primary keys",
        "SQLite rowid tables and primary-key structures affect index usefulness.",
        "query-planner",
        SQLITE_QUERY_PLANNER,
        ("rowid", "INTEGER PRIMARY KEY", "primary-key"),
        ("The table's rowid and primary-key representation is understood.",),
        ("WITHOUT ROWID tables and non-integer primary keys have different storage behaviour.",),
        ("Avoid recommending an index that merely duplicates an existing primary-key access path.",),
    ),
    SQLiteRule(
        "R10",
        "Index maintenance overhead",
        "Indexes consume storage and add work to data modifications.",
        "general-database-principle",
        SQLITE_QUERY_PLANNER,
        ("write-overhead", "storage", "maintenance"),
        ("A recommendation adds a persistent index.",),
        ("The cost depends on workload, index size, and write frequency.",),
        ("Explain storage and write-maintenance trade-offs; do not claim a measured cost without measurements.",),
    ),
    SQLiteRule(
        "R11",
        "Composite ordering heuristic",
        "Composite column order should reflect usable constraints and requested ordering.",
        "optimizer",
        SQLITE_OPTIMIZER,
        ("composite-order", "equality-before-range", "ordering"),
        ("The proposed order matches the query's constraints and access requirements.",),
        ("This is a heuristic, not a universal rule; selectivity and planner choices vary.",),
        ("Explain the proposed column order and validate it against the query plan.",),
    ),
)


SQLITE_RULES: tuple[SQLiteRule, ...] = _RULES
SQLITE_RULES_BY_ID = {rule.rule_id: rule for rule in SQLITE_RULES}


def get_sqlite_rules() -> tuple[SQLiteRule, ...]:
    """Return all catalogue rules in stable R1–R11 order."""
    return SQLITE_RULES


def get_sqlite_rule(rule_id: str) -> SQLiteRule | None:
    """Return one rule by ID, or None when the ID is unknown."""
    return SQLITE_RULES_BY_ID.get(rule_id)


def validate_rule_catalogue() -> None:
    """Raise an error if rule IDs are missing, duplicated, or out of order."""
    expected = tuple(f"R{i}" for i in range(1, 12))
    actual = tuple(rule.rule_id for rule in SQLITE_RULES)

    if actual != expected:
        raise ValueError(f"Expected rule IDs {expected}, got {actual}")

    for rule in SQLITE_RULES:
        if not rule.title or not rule.description or not rule.source_url:
            raise ValueError(f"Incomplete rule definition: {rule.rule_id}")
