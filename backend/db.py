"""
数据库连接管理 — 自动切换 SQLite / MySQL
"""
import os
import sqlite3
from pathlib import Path

DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DB_PATH = Path(__file__).parent / "flow_warning.db"

def get_db():
    """根据环境变量自动选择数据库连接"""
    if DB_TYPE == "mysql":
        import MySQLdb
        conn = MySQLdb.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "root"),
            passwd=os.getenv("DB_PASSWORD", ""),
            db=os.getenv("DB_NAME", "flow_warning"),
            charset="utf8mb4",
        )
        conn.cursorclass = MySQLdb.cursors.DictCursor
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows):
    return [dict(r) for r in rows]
