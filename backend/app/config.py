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
