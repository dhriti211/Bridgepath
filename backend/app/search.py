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
from .guard import budget
from .models import Source

CACHE_TTL_SECONDS = 7 * 24 * 3600
NEWS_TTL_SECONDS = 12 * 3600  # news goes stale fast

# Sites we trust most for licensing rules; results from these rank first.
# Universities (.edu) are left out: their pages describe their own admission rules,
# not state licensing rules.
_TRUSTED_SUFFIXES = (".gov", ".us")
_TRUSTED_DOMAINS = (
    "ncsbn.org", "cgfns.org", "trumerit.org", "nursys.com", "ncees.org", "wes.org", "ece.org",
    "ets.org", "ielts.org", "nasdtec.net", "naces.org", "nclex.com", "pearsonvue.com",
    # Official rule text republished by legal databases
    "law.cornell.edu", "regulations.justia.com", "law.justia.com",
)


# Government sites for rules that must come from the source (USCIS, DHS, DOL, the Federal Register).
OFFICIAL_DOMAINS = ("uscis.gov", "studyinthestates.dhs.gov", "dhs.gov", "ice.gov", "dol.gov",
                    "federalregister.gov", "ecfr.gov", "state.gov")


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
        ttl = NEWS_TTL_SECONDS if q.startswith("news|") else CACHE_TTL_SECONDS
        if row and time.time() - row[0] < ttl:
            return json.loads(row[1])
        return None

    def _put(self, q: str, data: list[dict]) -> None:
        with sqlite3.connect(self.db_path) as db:
            db.execute("INSERT OR REPLACE INTO cache VALUES (?, ?, ?)", (q, time.time(), json.dumps(data)))

    async def search(self, query: str, max_results: int = 5,
                     domains: tuple[str, ...] | None = None) -> list[Source]:
        """Web search; `domains` restricts results to those sites (e.g. OFFICIAL_DOMAINS)."""
        key = query if not domains else f"{query}|{','.join(domains)}"
        cached = self._get(key)
        if cached is None:
            budget().spend("search")  # raises BudgetExceeded once the daily cap is hit
            kwargs = {"include_domains": list(domains)} if domains else {}
            resp = await asyncio.to_thread(
                self.client.search, query, search_depth="advanced", max_results=max_results, **kwargs
            )
            cached = [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", "")}
                for r in resp.get("results", [])
            ]
            self._put(key, cached)
        sources = [Source(**r, official=is_trusted(r["url"])) for r in cached]
        sources.sort(key=lambda s: not s.official)
        return sources

    async def news(self, query: str, days: int = 30, max_results: int = 6) -> list[Source]:
        """Recent news articles (Tavily news search), newest first."""
        key = f"news|{query}|{days}"
        cached = self._get(key)
        if cached is None:
            budget().spend("search")
            resp = await asyncio.to_thread(self.client.search, query, topic="news", days=days,
                                           max_results=max_results)
            cached = [
                {"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("content", ""),
                 "published": r.get("published_date", "")}
                for r in resp.get("results", [])
            ]
            self._put(key, cached)
        return [Source(**r, official=is_trusted(r["url"])) for r in cached]

    async def extract(self, urls: list[str], query: str = "") -> dict[str, str]:
        """The parts of each page most relevant to `query` (Tavily Extract), so the agent reads
        more of an official page than the search snippet."""
        out: dict[str, str] = {}
        missing = []
        for u in urls:
            hit = self._get(f"extract|{query}|{u}")
            if hit is not None:
                out[u] = hit[0]["text"] if hit else ""
            else:
                missing.append(u)
        if missing:
            budget().spend("search")
            kwargs = {"query": query, "chunks_per_source": 3} if query else {}
            resp = await asyncio.to_thread(self.client.extract, missing, **kwargs)
            for r in resp.get("results", []):
                text = r.get("raw_content") or ""
                out[r.get("url", "")] = text
                self._put(f"extract|{query}|{r.get('url', '')}", [{"text": text}])
        return out


def is_trusted(url: str) -> bool:
    host = url.split("//", 1)[-1].split("/", 1)[0].lower()
    return host.endswith(_TRUSTED_SUFFIXES) or any(host.endswith(d) for d in _TRUSTED_DOMAINS)
