"""Saved responses, so identical requests never pay twice.

Every finished roadmap (and every goal suggestion) is stored under a hash of its
request. A repeat request is replayed from storage instead of calling Nebius or
Tavily. `demo_cache.json` ships saved example runs with the app, so the cached
demo mode (DEMO_MODE=cached) works on a fresh server; refresh it with
scripts/export_demo.py.
"""

import asyncio
import hashlib
import json
import sqlite3
import time
from collections.abc import AsyncIterator
from pathlib import Path

from . import config

BUNDLED = Path(__file__).with_name("demo_cache.json")
# Saved runs are only reused while the agent's prompts, research queries and date rules
# are unchanged; editing any of them makes every request run fresh again.
_AGENT_FILES = ("agent/prompts.py", "agent/queries.py", "agent/dates.py")
VERSION = hashlib.sha256(b"".join(
    (Path(__file__).parent / f).read_bytes() for f in _AGENT_FILES)).hexdigest()[:12]
TTL_SECONDS = 7 * 24 * 3600  # rules change; live-mode saves expire after a week
REPLAY_DELAY = 0.12  # seconds between replayed events, so the live feed still animates
CACHED_MISS = ("Live mode is paused for this demo, so it can only show the example plans. "
               "Pick one of the examples to see a full roadmap.")


def key(kind: str, payload) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str) + VERSION
    return kind + ":" + hashlib.sha256(raw.encode()).hexdigest()[:32]


class Store:
    def __init__(self, db_path=None, bundled: Path = BUNDLED):
        self.db_path = db_path or config.CACHE_DB
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as db:
            db.execute("CREATE TABLE IF NOT EXISTS responses (k TEXT PRIMARY KEY, at REAL, data TEXT)")
        self.bundled = json.loads(bundled.read_text()) if bundled.exists() else {}

    def get(self, k: str):
        if k in self.bundled:
            return self.bundled[k]
        with sqlite3.connect(self.db_path) as db:
            row = db.execute("SELECT at, data FROM responses WHERE k = ?", (k,)).fetchone()
        if row and (config.DEMO_MODE == "cached" or time.time() - row[0] < TTL_SECONDS):
            return json.loads(row[1])
        return None

    def put(self, k: str, data) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("INSERT OR REPLACE INTO responses VALUES (?, ?, ?)", (k, time.time(), json.dumps(data)))

    def all(self) -> dict:
        with sqlite3.connect(self.db_path) as db:
            return {k: json.loads(d) for k, d in db.execute("SELECT k, data FROM responses")}

    async def events(self, k: str, run: AsyncIterator[dict]) -> AsyncIterator[dict]:
        """Replay a saved run, or (in live mode) run it and save it if it finishes."""
        saved = self.get(k)
        if saved is not None:
            for event in saved:
                await asyncio.sleep(REPLAY_DELAY)
                yield event
            return
        if config.DEMO_MODE == "cached":
            await run.aclose()
            yield {"type": "error", "message": CACHED_MISS, "limit": True}
            return
        seen = []
        async for event in run:
            seen.append(event)
            yield event
        if seen and seen[-1].get("type") == "roadmap":
            self.put(k, seen)
