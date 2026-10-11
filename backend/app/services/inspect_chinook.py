from real_database import get_real_database_connection


connection = get_real_database_connection()
cursor = connection.cursor()

cursor.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name;
""")

tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    print("\n" + "=" * 50)
    print("TABLE:", table)
    print("=" * 50)

    cursor.execute(f"PRAGMA table_info('{table}')")

    for column in cursor.fetchall():
        print(
            f"Column: {column[1]:20} "
            f"Type: {column[2]:10} "
            f"PK: {column[5]}"
        )

    cursor.execute(f"PRAGMA foreign_key_list('{table}')")

    foreign_keys = cursor.fetchall()

    if foreign_keys:
        print("\nForeign Keys:")

        for fk in foreign_keys:
            print(
                f"  {fk[3]} -> "
                f"{fk[2]}.{fk[4]}"
            )

connection.close()