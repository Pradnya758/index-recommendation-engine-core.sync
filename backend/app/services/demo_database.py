import sqlite3
from datetime import date, timedelta
from pathlib import Path

DATA_DIRECTORY = Path(__file__).resolve().parent.parent / "data"
DEMO_DATABASE_PATH = DATA_DIRECTORY / "index_engine_demo.db"
DEMO_SCHEMA_PATH = DATA_DIRECTORY / "demo_schema.sql"


def get_demo_database_path() -> Path:
    """Create the reproducible demo database on first use and return its path."""
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    if DEMO_DATABASE_PATH.exists():
        return DEMO_DATABASE_PATH

    with sqlite3.connect(DEMO_DATABASE_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(DEMO_SCHEMA_PATH.read_text(encoding="utf-8"))
        _seed_demo_data(connection)

    return DEMO_DATABASE_PATH


def _seed_demo_data(connection: sqlite3.Connection) -> None:
    majors = ["Computer Science", "Business", "Engineering", "Psychology", "Mathematics"]
    regions = ["North", "South", "East", "West"]
    categories = ["Books", "Electronics", "Home", "Stationery"]
    statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
    base_date = date(2024, 1, 1)

    connection.executemany(
        "INSERT INTO students (student_id, full_name, email, major, enrollment_year) VALUES (?, ?, ?, ?, ?)",
        [
            (student_id, f"Student {student_id}", f"student{student_id}@college.edu", majors[student_id % len(majors)], 2021 + student_id % 4)
            for student_id in range(1, 401)
        ],
    )
    connection.executemany(
        "INSERT INTO customers (customer_id, full_name, email, region, joined_on) VALUES (?, ?, ?, ?, ?)",
        [
            (customer_id, f"Customer {customer_id}", f"customer{customer_id}@example.com", regions[customer_id % len(regions)], (base_date + timedelta(days=customer_id % 700)).isoformat())
            for customer_id in range(1, 801)
        ],
    )
    connection.executemany(
        "INSERT INTO products (product_id, product_name, sku, category, unit_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)",
        [
            (product_id, f"Product {product_id}", f"SKU-{product_id:04d}", categories[product_id % len(categories)], round(8.5 + product_id * 1.75, 2), 10 + product_id % 250)
            for product_id in range(1, 121)
        ],
    )
    connection.executemany(
        "INSERT INTO orders (order_id, customer_id, product_id, order_date, status, quantity, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
            (
                order_id,
                (order_id % 800) + 1,
                (order_id % 120) + 1,
                (base_date + timedelta(days=order_id % 900)).isoformat(),
                statuses[order_id % len(statuses)],
                (order_id % 5) + 1,
                round(((order_id % 120) * 1.75 + 8.5) * ((order_id % 5) + 1), 2),
            )
            for order_id in range(1, 5001)
        ],
    )
