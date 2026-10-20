"""Tavily web research with a small SQLite cache.

The cache keeps repeat searches (and the demo) fast and saves credits.
Entries expire after a week, because licensing rules do change.
"""

import asyncio
import json
import sqlite3
import time

from tavily import TavilyClient

from . import config
from .models import Source

CACHE_TTL_SECONDS = 7 * 24 * 3600

# Sites we trust most for licensing rules; results from these rank first.
_TRUSTED_SUFFIXES = (".gov", ".us", ".edu")
_TRUSTED_DOMAINS = (
    "ncsbn.org", "cgfns.org", "nursys.com", "ncees.org", "wes.org", "ece.org",
    "ets.org", "ielts.org", "nasdtec.net", "naces.org",
)


class Search:
    def __init__(self, client: TavilyClient | None = None, db_path=None):
        self.client = client or TavilyClient(api_key=config.TAVILY_API_KEY or "missing")
        self.db_path = db_path or config.CACHE_DB
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as db:
            db.execute("CREATE TABLE IF NOT EXISTS cache (q TEXT PRIMARY KEY, at REAL, data TEXT)")

    def _get(self, q: str) -> list[dict] | None:
        with sqlite3.connect(self.db_path) as db:
            row = db.execute("SELECT at, data FROM cache WHERE q = ?", (q,)).fetchone()
        if row and time.time() - row[0] < CACHE_TTL_SECONDS:
            return json.loads(row[1])
        return None

    def _put(self, q: str, data: list[dict]) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("INSERT OR REPLACE INTO cache VALUES (?, ?, ?)", (q, time.time(), json.dumps(data)))

    async def search(self, query: str, max_results: int = 5) -> list[Source]:
        cached = self._get(query)
        if cached is None:
            resp = await asyncio.to_thread(
                self.client.search, query, search_depth="advanced", max_results=max_results
            )
            cached = [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", "")}
                for r in resp.get("results", [])
            ]
            self._put(query, cached)
        sources = [Source(**r) for r in cached]
        sources.sort(key=lambda s: not is_trusted(s.url))
        return sources


def is_trusted(url: str) -> bool:
    host = url.split("//", 1)[-1].split("/", 1)[0].lower()
    return host.endswith(_TRUSTED_SUFFIXES) or any(host.endswith(d) for d in _TRUSTED_DOMAINS)
