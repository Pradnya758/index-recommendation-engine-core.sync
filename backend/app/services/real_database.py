import sqlite3
from pathlib import Path

DATA_DIRECTORY = Path(__file__).resolve().parent.parent / "data"

REAL_DATABASE_PATH = DATA_DIRECTORY / "Chinook_Sqlite.sqlite"


def get_real_database_connection():
    if not REAL_DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"Database not found: {REAL_DATABASE_PATH}"
        )

    connection = sqlite3.connect(REAL_DATABASE_PATH)
    connection.execute("PRAGMA foreign_keys = ON")

    return connection