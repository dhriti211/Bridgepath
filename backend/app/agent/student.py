"""The student agent: an F-1 student's profile and chosen goal in, a sourced work-visa roadmap out.

Two calls, so the person can pick a goal in between:
  `goals`  form + CV -> structured profile and 3 suggested goals (Nano, then Super)
  `run`    profile + goal -> the same event stream as the licensing agent
"""

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import date

from ..guard import BudgetExceeded
from ..llm import LLM
from ..models import Deadline, Goal, Goals, Requirement, Source, StudentForm, StudentProfile
from ..search import OFFICIAL_DOMAINS, Search
from . import prompts
from .dates import h1b_seasons, student_deadlines
from .facts import CHECKED_FACTS, NEWS_QUERY, POLICY_WATCH
from .pipeline import PlanOut, Requirements, finalize, format_sources, plural, step
from .queries import student_queries


class StudentAgent:
    def __init__(self, llm: LLM, search: Search):
        self.llm = llm
        self.search = search

    async def goals(self, form: StudentForm, cv_text: str = "") -> tuple[StudentProfile, list[Goal]]:
        user = "Form:\n" + form.model_dump_json(indent=2)
        if cv_text.strip():
            user += "\n\nCV text:\n" + cv_text[:8000]
        profile = await self.llm.chat_json("fast", prompts.STUDENT_INTAKE, user, StudentProfile)
        # The form is the source of truth; the model only adds structure from the CV.
        profile = profile.model_copy(update=form.model_dump())
        out = await self.llm.chat_json("medium", prompts.GOALS, profile.model_dump_json(indent=2), Goals)
        return profile, out.goals[:3]

    async def run(self, profile: StudentProfile, goal: Goal) -> AsyncIterator[dict]:
        try:
            async for event in self._run(profile, goal):
                yield event
        except BudgetExceeded as e:
            yield {"type": "error", "message": str(e), "limit": True}
        except Exception as e:  # surface failures to the UI instead of a dead stream
            yield {"type": "error", "message": f"{type(e).__name__}: {e}"}

    async def _run(self, profile: StudentProfile, goal: Goal) -> AsyncIterator[dict]:
        yield {"type": "profile", "profile": profile.model_dump()}
        yield step("intake", "done", profile.summary or "Profile ready")

        # 1. Key dates (deterministic, from the F-1 rules)
        deadlines = student_deadlines(profile)
        dated = sum(bool(d.end) for d in deadlines)
        yield step("dates", "done", f"Worked out {plural(dated, 'key date')} from your program dates")

        # 2. Research (Tavily). Rules come from government sites only; employers from the whole web.
        #    Hand-checked facts (fees, the H-1B lottery) go first so the model never guesses them.
        yield step("research", "running", "Searching USCIS, DHS and DOL")
        found: dict[str, Source] = {}

        async def search_one(q: str, official: bool) -> tuple[str, list[Source]]:
            return q, await self.search.search(q, domains=OFFICIAL_DOMAINS if official else None)

        news_task = asyncio.create_task(self.search.news(NEWS_QUERY))
        searches = [search_one(q, official) for q, official in student_queries(profile, goal)]
        for done in asyncio.as_completed(searches):
            q, sources = await done
            for s in sources:
                found.setdefault(s.url, s)
            yield {"type": "sources", "query": q, "sources": [s.model_dump() for s in sources]}

        # Read the top official pages in full, not just the search snippet.
        top = [u for u, s in found.items() if s.official][:4]
        if top:
            yield step("research", "running", f"Reading {plural(len(top), 'official page')} in full")
            pages = await self.search.extract(top, query=f"F-1 OPT STEM OPT H-1B {goal.title}")
            for u, text in pages.items():
                if u in found and text:
                    found[u] = found[u].model_copy(update={"snippet": text})

        all_sources = {s.url: s for s in CHECKED_FACTS}
        all_sources.update({u: s for u, s in found.items() if u not in all_sources})
        yield step("research", "done", f"Found {plural(len(found), 'source')}, plus "
                   f"{plural(len(CHECKED_FACTS), 'checked fact')}")

        # 3. Recent changes: the curated policy list, plus live news so nothing new is missed.
        yield step("policy", "running", "Checking for recent rule changes")
        try:
            news = await news_task
        except Exception:  # news is a bonus; never fail the roadmap over it
            news = []
        yield step("policy", "done", f"{plural(len(POLICY_WATCH), 'rule change')} to watch, "
                   f"{plural(len(news), 'news article')} this month")

        # 4. Synthesis (Super)
        yield step("synthesis", "running", "Reading the current rules")
        requirements = await self.synthesize(profile, goal, list(all_sources.values()))
        yield step("synthesis", "done", f"Found {plural(len(requirements), 'rule')} that apply to you")

        # 5. Planning (Ultra)
        yield step("plan", "running", "Building your step-by-step roadmap")
        plan = await self.plan(profile, goal, deadlines, requirements)
        yield step("plan", "done", f"{plural(len(plan.steps), 'step')} planned")

        # 6. Verification (deterministic)
        yield step("verify", "running", "Checking every step against its source")
        roadmap = finalize(plan, goal.visa_path, all_sources, mode="student", deadlines=deadlines,
                           h1b_seasons=h1b_seasons(profile), policy=POLICY_WATCH, news=news)
        official = sum(s.official for s in roadmap.steps)
        verified = sum(s.verified for s in roadmap.steps)
        yield step("verify", "done", f"{official} of {len(roadmap.steps)} steps backed by an official "
                   f"source, {verified - official} by other sites")

        yield {"type": "roadmap", "roadmap": roadmap.model_dump()}

    async def synthesize(self, profile: StudentProfile, goal: Goal,
                         sources: list[Source]) -> list[Requirement]:
        user = (f"Profile:\n{profile.model_dump_json(indent=2)}\n\nGoal:\n{goal.model_dump_json()}"
                f"\n\nSearch results:\n{format_sources(sources)}")
        out = await self.llm.chat_json("medium", prompts.STUDENT_SYNTHESIS, user, Requirements)
        return out.requirements

    async def plan(self, profile: StudentProfile, goal: Goal, deadlines: list[Deadline],
                   requirements: list[Requirement]) -> PlanOut:
        user = json.dumps({
            "today": date.today().isoformat(),
            "profile": profile.model_dump(),
            "goal": goal.model_dump(),
            "key_dates": [d.model_dump() for d in deadlines],
            "h1b_lottery_seasons": [h.model_dump() for h in h1b_seasons(profile)],
            "checked_facts": [f.model_dump(include={"title", "url", "snippet"}) for f in CHECKED_FACTS],
            "policy_status": [p.model_dump() for p in POLICY_WATCH],
            "requirements": [r.model_dump() for r in requirements],
        }, indent=2)
        return await self.llm.chat_json("reasoning", prompts.STUDENT_PLAN, user, PlanOut)
