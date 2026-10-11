from pathlib import Path

from real_database import get_real_database_connection


WORKLOAD_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "workload"
    / "queries.sql"
)


connection = get_real_database_connection()
cursor = connection.cursor()

sql_text = WORKLOAD_PATH.read_text(encoding="utf-8")

queries = [
    query.strip()
    for query in sql_text.split(";")
    if query.strip()
]

for number, query in enumerate(queries, start=1):

    print("\n" + "=" * 70)
    print(f"QUERY {number}")
    print("=" * 70)

    print(query)

    print("\nQUERY PLAN:")
    
    cursor.execute(
        "EXPLAIN QUERY PLAN " + query
    )

    plan = cursor.fetchall()

    for row in plan:
        print(row)

connection.close()