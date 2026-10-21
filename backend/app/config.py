"""Runtime settings, read from environment variables (or a .env file)."""

import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY", "")
NEBIUS_BASE_URL = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

# Optional explicit model IDs. When blank, llm.py picks Nemotron models
# from the Token Factory model list.
MODEL_FAST = os.getenv("MODEL_FAST", "")
MODEL_MEDIUM = os.getenv("MODEL_MEDIUM", "")
MODEL_REASONING = os.getenv("MODEL_REASONING", "")

DATA_DIR = Path(os.getenv("DATA_DIR", ROOT / "backend" / "data"))
CACHE_DB = DATA_DIR / "cache.db"
FRONTEND_DIST = ROOT / "frontend" / "dist"

# ---- Spend guard (see README "Keeping costs under control") ----
# Hard caps on paid API calls. Once hit, the app shows "demo limit reached" instead of calling out.
MAX_LLM_CALLS_PER_DAY = int(os.getenv("MAX_LLM_CALLS_PER_DAY", "150"))
MAX_LLM_CALLS_TOTAL = int(os.getenv("MAX_LLM_CALLS_TOTAL", "1500"))
MAX_SEARCHES_PER_DAY = int(os.getenv("MAX_SEARCHES_PER_DAY", "150"))
# Requests per visitor (IP address) per hour to endpoints that call Nebius or Tavily.
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", "20"))
# "live": call Nebius and Tavily (within the caps). "cached": replay saved roadmaps only,
# never call Nebius or Tavily.
DEMO_MODE = os.getenv("DEMO_MODE", "live").strip().lower()
