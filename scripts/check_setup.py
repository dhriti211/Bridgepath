"""Check your API keys and show which Nemotron models Bridgepath will use.

Run from the repo root:  python scripts/check_setup.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import config  # noqa: E402
from app.llm import LLM  # noqa: E402


async def main() -> int:
    ok = True
    if not config.NEBIUS_API_KEY:
        print("✗ NEBIUS_API_KEY is missing from .env")
        ok = False
    if not config.TAVILY_API_KEY:
        print("✗ TAVILY_API_KEY is missing from .env")
        ok = False
    if not ok:
        return 1

    llm = LLM()
    page = await llm.client.models.list()
    available = sorted(m.id for m in page.data if "nemotron" in m.id.lower())
    print("✓ Token Factory reachable. Nemotron models on your account:")
    for model_id in available:
        print(f"    {model_id}")
    models = await llm.resolve_models()
    print("✓ Bridgepath will use:")
    for tier, model in models.items():
        print(f"    {tier:<10} {model}")
    for tier in ("fast", "medium", "reasoning"):
        reply = await llm.chat(tier, [{"role": "user", "content": "Reply with the word ready."}])
        print(f"✓ {tier} model replied: {reply[:60]!r}")

    from tavily import TavilyClient
    res = TavilyClient(api_key=config.TAVILY_API_KEY).search("Arizona State Board of Nursing",
                                                             max_results=1)
    print(f"✓ Tavily reachable: {res['results'][0]['url'] if res.get('results') else 'no results'}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
