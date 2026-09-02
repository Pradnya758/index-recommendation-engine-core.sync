"""Persistent analysis history stored in a local SQLite database."""
import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path

_DB_PATH = Path(__file__).parent.parent / "data" / "history.db"
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _lock, _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                ts        TEXT    NOT NULL,
                query     TEXT    NOT NULL,
                rec_json  TEXT    NOT NULL,
                plan_json TEXT    NOT NULL
            )
        """)
        conn.commit()


_init_db()


def save_analysis(rec: dict, plan: dict) -> int:
    ts = datetime.now(timezone.utc).isoformat()
    with _lock, _connect() as conn:
        cur = conn.execute(
            "INSERT INTO analysis_history (ts, query, rec_json, plan_json) VALUES (?, ?, ?, ?)",
            (ts, rec.get("query", ""), json.dumps(rec), json.dumps(plan)),
        )
        conn.commit()
        return cur.lastrowid


def list_history(limit: int = 100) -> list[dict]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT id, ts, query, rec_json, plan_json FROM analysis_history ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_entry(entry_id: int) -> dict | None:
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT id, ts, query, rec_json, plan_json FROM analysis_history WHERE id = ?",
            (entry_id,),
        ).fetchone()
    return _row_to_dict(row) if row else None


def delete_entry(entry_id: int) -> bool:
    with _lock, _connect() as conn:
        cur = conn.execute("DELETE FROM analysis_history WHERE id = ?", (entry_id,))
        conn.commit()
        return cur.rowcount > 0


def clear_history() -> int:
    with _lock, _connect() as conn:
        cur = conn.execute("DELETE FROM analysis_history")
        conn.commit()
        return cur.rowcount


def _row_to_dict(row: sqlite3.Row) -> dict:
    rec = json.loads(row["rec_json"])
    plan = json.loads(row["plan_json"])
    return {
        "id":   row["id"],
        "ts":   row["ts"],
        "query": row["query"],
        "rec":  rec,
        "plan": plan,
    }
