"""The Bridgepath agent: form in, sourced relicensing roadmap out.

`run` is an async generator of events so the UI can show each step live:
  {"type": "step", "step": "...", "status": "running" | "done", "message": "..."}
  {"type": "sources", "query": "...", "sources": [...]}
  {"type": "profile", "profile": {...}}
  {"type": "roadmap", "roadmap": {...}}
  {"type": "error", "message": "..."}
"""

import asyncio
import json
from collections.abc import AsyncIterator

from pydantic import BaseModel

from ..llm import LLM
from ..models import (BridgeJob, Equivalency, IntakeForm, Profile, Requirement,
                      Roadmap, Source, Step)
from ..search import Search, is_trusted
from . import prompts
from .queries import research_queries

MAX_SOURCES_FOR_SYNTHESIS = 18
SNIPPET_CHARS = 1200


class Requirements(BaseModel):
    requirements: list[Requirement]


class PlanOut(BaseModel):
    headline: str
    steps: list[Step]
    bridge_jobs: list[BridgeJob] = []
    warnings: list[str] = []


def plural(n: int, word: str) -> str:
    return f"{n} {word}" + ("" if n == 1 else "s")


def step(name: str, status: str, message: str) -> dict:
    return {"type": "step", "step": name, "status": status, "message": message}


class Agent:
    def __init__(self, llm: LLM, search: Search):
        self.llm = llm
        self.search = search

    async def run(self, form: IntakeForm, cv_text: str = "") -> AsyncIterator[dict]:
        try:
            async for event in self._run(form, cv_text):
                yield event
        except Exception as e:  # surface failures to the UI instead of a dead stream
            yield {"type": "error", "message": f"{type(e).__name__}: {e}"}

    async def _run(self, form: IntakeForm, cv_text: str) -> AsyncIterator[dict]:
        # 1. Intake (Nano)
        yield step("intake", "running", "Reading your background")
        profile = await self.intake(form, cv_text)
        yield {"type": "profile", "profile": profile.model_dump()}
        yield step("intake", "done", profile.summary or "Profile ready")

        # 2. Equivalency (Ultra) runs while we search the web.
        yield step("equivalency", "running", f"Estimating the US equivalent of your {profile.degree}")
        equivalency_task = asyncio.create_task(self.equivalency(profile))

        # 3. Research (Tavily), queries in parallel, results streamed as they land.
        queries = research_queries(profile)
        yield step("research", "running", f"Searching official sources for {profile.target_state}")
        all_sources: dict[str, Source] = {}

        async def search_one(q: str) -> tuple[str, list[Source]]:
            return q, await self.search.search(q)

        for done in asyncio.as_completed([search_one(q) for q in queries]):
            q, sources = await done
            for s in sources:
                all_sources.setdefault(s.url, s)
            yield {"type": "sources", "query": q, "sources": [s.model_dump() for s in sources]}
        yield step("research", "done", f"Found {plural(len(all_sources), 'source')}")

        equivalency = await equivalency_task
        yield step("equivalency", "done",
                   f"Closest US equivalent: {equivalency.us_equivalent}. "
                   f"Evaluation: {equivalency.evaluation_service}")

        # 4. Synthesis (Super)
        yield step("synthesis", "running", "Reading the sources and pulling out requirements")
        requirements = await self.synthesize(profile, list(all_sources.values()))
        yield step("synthesis", "done", f"Found {plural(len(requirements), 'requirement')}")

        # 5. Planning (Ultra)
        yield step("plan", "running", "Building your step-by-step roadmap")
        plan = await self.plan(profile, equivalency, requirements)
        yield step("plan", "done", f"{plural(len(plan.steps), 'step')} planned")

        # 6. Verification (deterministic): every link must come from real search results.
        yield step("verify", "running", "Checking every step against its source")
        roadmap = finalize(plan, equivalency.us_equivalent, all_sources)
        official = sum(s.official for s in roadmap.steps)
        verified = sum(s.verified for s in roadmap.steps)
        yield step("verify", "done", f"{official} of {len(roadmap.steps)} steps backed by an official "
                   f"source, {verified - official} by other sites")

        yield {"type": "roadmap", "roadmap": roadmap.model_dump()}

    async def intake(self, form: IntakeForm, cv_text: str) -> Profile:
        user = "Form:\n" + form.model_dump_json(indent=2)
        if cv_text.strip():
            user += "\n\nCV / transcript text:\n" + cv_text[:8000]
        profile = await self.llm.chat_json("fast", prompts.INTAKE, user, Profile)
        # The form is the source of truth; the model only adds structure from the CV.
        return profile.model_copy(update={
            "profession": form.profession, "country": form.country, "degree": form.degree,
            "years_experience": form.years_experience, "english_test": form.english_test,
            "notes": form.notes,
        })

    async def equivalency(self, profile: Profile) -> Equivalency:
        return await self.llm.chat_json("reasoning", prompts.EQUIVALENCY,
                                        profile.model_dump_json(indent=2), Equivalency)

    async def synthesize(self, profile: Profile, sources: list[Source]) -> list[Requirement]:
        docs = format_sources(sources)
        user = f"Profile:\n{profile.model_dump_json(indent=2)}\n\nSearch results:\n{docs}"
        out = await self.llm.chat_json("medium", prompts.SYNTHESIS, user, Requirements)
        return out.requirements

    async def plan(self, profile: Profile, equivalency: Equivalency,
                   requirements: list[Requirement]) -> PlanOut:
        user = json.dumps({
            "profile": profile.model_dump(),
            "equivalency": equivalency.model_dump(),
            "requirements": [r.model_dump() for r in requirements],
        }, indent=2)
        return await self.llm.chat_json("reasoning", prompts.PLAN, user, PlanOut)


def format_sources(sources: list[Source]) -> str:
    """Search results as numbered, labeled documents for a synthesis prompt."""
    return "\n\n".join(
        f"[{i + 1}] [{'OFFICIAL' if s.official else 'THIRD-PARTY'}] {s.title}\n"
        f"URL: {s.url}\n{s.snippet[:SNIPPET_CHARS]}"
        for i, s in enumerate(sources[:MAX_SOURCES_FOR_SYNTHESIS])
    )


def finalize(plan: PlanOut, us_equivalent: str, sources: dict[str, Source],
             **extra) -> Roadmap:
    """Verify links, then compute total cost and the critical-path duration."""
    known = {u.rstrip("/") for u in sources}
    steps = []
    for s in plan.steps:
        url = s.source_url.strip()
        ok = bool(url) and url.rstrip("/") in known
        steps.append(s.model_copy(update={"source_url": url if ok else "", "verified": ok,
                                          "official": ok and is_trusted(url)}))

    weeks_min, weeks_max = critical_path(steps)
    cited = {s.source_url.rstrip("/") for s in steps if s.source_url}
    return Roadmap(
        headline=plan.headline,
        us_equivalent=us_equivalent,
        steps=steps,
        bridge_jobs=plan.bridge_jobs,
        warnings=plan.warnings,
        total_cost_usd_min=sum(s.cost_usd_min for s in steps),
        total_cost_usd_max=sum(s.cost_usd_max for s in steps),
        total_weeks_min=weeks_min,
        total_weeks_max=weeks_max,
        sources=[s for u, s in sources.items() if u.rstrip("/") in cited],
        **extra,
    )


def critical_path(steps: list[Step]) -> tuple[float, float]:
    """Longest chain of dependent steps, for min and max durations."""
    by_id = {s.id: s for s in steps}
    memo: dict[tuple[str, str], float] = {}

    def finish(sid: str, attr: str, seen: frozenset = frozenset()) -> float:
        if (sid, attr) in memo:
            return memo[(sid, attr)]
        s = by_id[sid]
        deps = [d for d in s.depends_on if d in by_id and d not in seen and d != sid]
        start = max((finish(d, attr, seen | {sid}) for d in deps), default=0)
        memo[(sid, attr)] = start + getattr(s, attr)
        return memo[(sid, attr)]

    if not steps:
        return 0, 0
    return (max(finish(s.id, "duration_weeks_min") for s in steps),
            max(finish(s.id, "duration_weeks_max") for s in steps))
