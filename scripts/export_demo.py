"""Save the runs stored on this machine as the app's bundled demo data.

Run the example profiles in the app first (in live mode), then:
    python scripts/export_demo.py
and commit backend/app/demo_cache.json. With DEMO_MODE=cached the server replays
these runs and never calls Nebius or Tavily.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.replay import BUNDLED, Store  # noqa: E402

saved = Store(bundled=Path("/nonexistent")).all()
merged = {**(json.loads(BUNDLED.read_text()) if BUNDLED.exists() else {}), **saved}
BUNDLED.write_text(json.dumps(merged))
kinds = {}
for k in merged:
    kinds[k.split(":")[0]] = kinds.get(k.split(":")[0], 0) + 1
print(f"Wrote {len(merged)} saved runs to {BUNDLED}: {kinds}")
