"""Spend guard: hard caps on paid API calls and a per-visitor rate limit.

Nebius credits are not a spending cap (usage past the credit is billed), so the app
enforces its own limits. Counts live in SQLite so they survive restarts.
"""

import sqlite3
import threading
import time
from collections import defaultdict, deque
from datetime import UTC, datetime

from . import config

LIMIT_MESSAGE = ("This demo has reached its usage limit for now, so it can't build new plans. "
                 "Try one of the examples, or come back tomorrow.")


class BudgetExceeded(Exception):
    def __init__(self, message: str = LIMIT_MESSAGE):
        super().__init__(message)


class Budget:
    """Counts paid calls per UTC day and in total, and refuses calls over the caps."""

    def __init__(self, db_path=None):
        self.db_path = db_path or config.CACHE_DB
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        with sqlite3.connect(self.db_path) as db:
            db.execute("CREATE TABLE IF NOT EXISTS usage "
                       "(day TEXT, kind TEXT, n INTEGER, PRIMARY KEY (day, kind))")

    def limits(self, kind: str) -> tuple[int, int | None]:
        if kind == "llm":
            return config.MAX_LLM_CALLS_PER_DAY, config.MAX_LLM_CALLS_TOTAL
        return config.MAX_SEARCHES_PER_DAY, None

    def spend(self, kind: str) -> None:
        """Record one paid call, or raise BudgetExceeded if it would go over a cap."""
        if config.DEMO_MODE == "cached":
            raise BudgetExceeded("Live mode is paused for this demo. Try one of the examples.")
        per_day, total = self.limits(kind)
        day = datetime.now(UTC).date().isoformat()
        with self._lock, sqlite3.connect(self.db_path) as db:
            row = db.execute("SELECT n FROM usage WHERE day = ? AND kind = ?", (day, kind)).fetchone()
            today = row[0] if row else 0
            overall = db.execute("SELECT COALESCE(SUM(n), 0) FROM usage WHERE kind = ?", (kind,)).fetchone()[0]
            if today >= per_day or (total is not None and overall >= total):
                raise BudgetExceeded()
            db.execute("INSERT INTO usage VALUES (?, ?, 1) ON CONFLICT(day, kind) DO UPDATE SET n = n + 1",
                       (day, kind))

    def usage(self) -> dict:
        day = datetime.now(UTC).date().isoformat()
        with sqlite3.connect(self.db_path) as db:
            rows = db.execute("SELECT kind, SUM(n), SUM(CASE WHEN day = ? THEN n ELSE 0 END) "
                              "FROM usage GROUP BY kind", (day,)).fetchall()
        return {kind: {"today": today, "total": total} for kind, total, today in rows}


class RateLimiter:
    """At most `limit` requests per visitor in any rolling hour (in memory)."""

    def __init__(self, limit: int | None = None, window: float = 3600):
        self.limit = config.RATE_LIMIT_PER_HOUR if limit is None else limit
        self.window = window
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            return True


_budget: Budget | None = None


def budget() -> Budget:
    global _budget
    if _budget is None:
        _budget = Budget()
    return _budget
