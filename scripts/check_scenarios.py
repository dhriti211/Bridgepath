"""Run six very different students through the real agent and check each plan automatically.

The F-1 rules are the same for every major; what changes a plan is STEM or not, the
student's stage, their dates and the goal. These six profiles cover those cases, and
each roadmap is checked against rules we know are true (see backend/app/agent/facts.py).

Run from the repo root (uses your .env keys, about 6 roadmaps' worth of credits):
    python scripts/check_scenarios.py
"""

import asyncio
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.agent.student import StudentAgent  # noqa: E402
from app.llm import LLM  # noqa: E402
from app.models import Goal, Roadmap, StudentProfile  # noqa: E402
from app.search import Search  # noqa: E402

BIG_TECH = Goal(id="g", title="Software engineer at a large tech company", why="",
                visa_path="OPT → STEM OPT → H-1B")

SCENARIOS = [
    ("MS CS, studying, big tech", dict(degree_level="Master's", major="Computer Science", stem="yes",
     stage="studying", program_end="2027-05-15", target_role="Software engineer"), BIG_TECH),
    ("BS Mechanical, studying, Texas", dict(degree_level="Bachelor's", major="Mechanical Engineering",
     stem="yes", stage="studying", program_end="2027-12-15", target_role="Mechanical design engineer",
     target_state="Texas"), Goal(id="g", title="Mechanical design engineer at an automotive company",
     why="", visa_path="OPT → STEM OPT → H-1B")),
    ("MBA (not STEM), studying", dict(degree_level="Master's", major="Business Administration", stem="no",
     stage="studying", program_end="2027-05-01", target_role="Product manager"),
     Goal(id="g", title="Product manager at a tech company", why="", visa_path="OPT → H-1B")),
    ("MS Data Science, on OPT", dict(degree_level="Master's", major="Data Science", stem="yes",
     stage="opt", program_end="2026-05-15", opt_end="2027-07-20", target_role="Data engineer"),
     Goal(id="g", title="Data engineer at a fintech company", why="", visa_path="STEM OPT → H-1B")),
    ("MS EE, on STEM OPT", dict(degree_level="Master's", major="Electrical Engineering", stem="yes",
     stage="stem_opt", program_end="2024-12-15", opt_end="2027-03-01", target_role="Hardware engineer"),
     Goal(id="g", title="Hardware engineer at a semiconductor company", why="", visa_path="H-1B")),
    ("PhD Biology, university lab", dict(degree_level="PhD", major="Computational Biology", stem="yes",
     stage="studying", program_end="2027-08-15", target_role="Research scientist"),
     Goal(id="g", title="Research scientist at a university (cap-exempt)", why="",
          visa_path="OPT → cap-exempt H-1B")),
]


def text(r: Roadmap) -> str:
    return " ".join([s.title + " " + s.description for s in r.steps] + r.warnings).lower()


def checks(p: StudentProfile, r: Roadmap) -> list[tuple[str, bool]]:
    t = text(r)
    stem_steps = [s for s in r.steps if "stem opt" in s.title.lower()]
    h1b = {s.id for s in r.steps if "h-1b" in s.title.lower() and "stem" not in s.title.lower()}
    fees = {(s.cost_usd_min, s.cost_usd_max) for s in r.steps if s.cost_usd_max}
    out = [
        ("Only real I-765 fees ($470/$520) as costs", fees <= {(470, 520), (470, 470), (520, 520)}),
        ("No invented $410 fee", "$410" not in t),
        ("No advance parole for F-1", "advance parole" not in t),
        ("Weighted lottery not hedged", "if applicable" not in t),
        ("Proposed $103,265 fee not called in effect",
         "103,265" not in t or bool(re.search(r"propos|not in effect", t))),
        ("STEM OPT never waits on the H-1B lottery",
         all(not (set(s.depends_on) & h1b) for s in stem_steps)),
        ("Every visa step has a source", all(s.verified for s in r.steps if s.kind != "career")),
        ("Policy watch and key dates present", bool(r.policy) and bool(r.deadlines)),
    ]
    if p.stem == "no":
        out.append(("No STEM OPT steps for a non-STEM degree", not stem_steps))
    if p.stage != "studying":
        out.append(("No initial OPT filing when already on OPT",
                    not any("post-completion opt" in s.title.lower() and "i-765" in s.title.lower()
                            for s in r.steps)))
    if p.stage == "studying":
        out.append(("Total cost includes the OPT fee", r.total_cost_usd_min >= 470))
    return out


async def run_one(agent: StudentAgent, name: str, fields: dict, goal: Goal) -> int:
    profile = StudentProfile(**{"target_state": "Anywhere in the US", **fields})
    roadmap = None
    async for e in agent.run(profile, goal):
        if e["type"] == "error":
            print(f"\n✗ {name}: {e['message']}")
            return 1
        if e["type"] == "roadmap":
            roadmap = Roadmap(**e["roadmap"])
    results = checks(profile, roadmap)
    failed = [label for label, ok in results if not ok]
    print(f"\n{'✓' if not failed else '✗'} {name}: {len(results) - len(failed)}/{len(results)} checks, "
          f"{len(roadmap.steps)} steps, {len(roadmap.h1b_seasons)} lottery chances")
    for label in failed:
        print(f"    ✗ {label}")
    return len(failed)


async def main() -> int:
    agent = StudentAgent(LLM(), Search())
    failures = 0
    for name, fields, goal in SCENARIOS:
        failures += await run_one(agent, name, fields, goal)
    print(f"\n{'All scenarios passed.' if not failures else f'{failures} check(s) failed.'}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
