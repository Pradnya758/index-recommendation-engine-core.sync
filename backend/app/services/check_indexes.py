from real_database import get_real_database_connection


connection = get_real_database_connection()
cursor = connection.cursor()

cursor.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name;
""")

tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    print("\n" + "=" * 50)
    print("TABLE:", table)
    print("=" * 50)

    cursor.execute(f"PRAGMA index_list('{table}')")

    indexes = cursor.fetchall()

    if not indexes:
        print("No indexes found.")
        continue

    for index in indexes:
        index_name = index[1]

        print("Index:", index_name)
        print("  Unique:", bool(index[2]))

        cursor.execute(f"PRAGMA index_info('{index_name}')")
        columns = cursor.fetchall()

        print("  Columns:", [column[2] for column in columns])


connection.close()