from app.services.real_sqlite_inspector import inspect_real_schema


schema = inspect_real_schema()

print("Database:", schema.database)
print("Number of tables:", len(schema.tables))

print("\nTables:")

for table in schema.tables:
    print(f"\n{table.name}")
    print("  Columns:", [column.name for column in table.columns])
    print("  Primary keys:", table.primary_keys)
    print(
        "  Indexes:",
        [(index.name, index.columns) for index in table.indexes],
    )