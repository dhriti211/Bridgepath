"""The student agent: an F-1 student's profile and chosen goal in, a sourced work-visa roadmap out.

Two calls, so the person can pick a goal in between:
  `goals`  form + CV -> structured profile and 3 suggested goals (Nano, then Super)
  `run`    profile + goal -> the same event stream as the licensing agent
"""

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import date

from ..llm import LLM
from ..models import Deadline, Goal, Goals, Requirement, Source, StudentForm, StudentProfile
from ..search import Search
from . import prompts
from .dates import student_deadlines
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
        except Exception as e:  # surface failures to the UI instead of a dead stream
            yield {"type": "error", "message": f"{type(e).__name__}: {e}"}

    async def _run(self, profile: StudentProfile, goal: Goal) -> AsyncIterator[dict]:
        yield {"type": "profile", "profile": profile.model_dump()}
        yield step("intake", "done", profile.summary or "Profile ready")

        # 1. Key dates (deterministic, from the F-1 rules)
        deadlines = student_deadlines(profile)
        dated = sum(bool(d.end) for d in deadlines)
        yield step("dates", "done", f"Worked out {plural(dated, 'key date')} from your program dates")

        # 2. Research (Tavily), queries in parallel, results streamed as they land.
        yield step("research", "running", "Searching USCIS and other official sources")
        all_sources: dict[str, Source] = {}

        async def search_one(q: str) -> tuple[str, list[Source]]:
            return q, await self.search.search(q)

        for done in asyncio.as_completed([search_one(q) for q in student_queries(profile, goal)]):
            q, sources = await done
            for s in sources:
                all_sources.setdefault(s.url, s)
            yield {"type": "sources", "query": q, "sources": [s.model_dump() for s in sources]}
        yield step("research", "done", f"Found {plural(len(all_sources), 'source')}")

        # 3. Synthesis (Super)
        yield step("synthesis", "running", "Reading the current rules")
        requirements = await self.synthesize(profile, goal, list(all_sources.values()))
        yield step("synthesis", "done", f"Found {plural(len(requirements), 'rule')} that apply to you")

        # 4. Planning (Ultra)
        yield step("plan", "running", "Building your step-by-step roadmap")
        plan = await self.plan(profile, goal, deadlines, requirements)
        yield step("plan", "done", f"{plural(len(plan.steps), 'step')} planned")

        # 5. Verification (deterministic)
        yield step("verify", "running", "Checking every step against its source")
        roadmap = finalize(plan, goal.visa_path, all_sources, mode="student", deadlines=deadlines)
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
            "requirements": [r.model_dump() for r in requirements],
        }, indent=2)
        return await self.llm.chat_json("reasoning", prompts.STUDENT_PLAN, user, PlanOut)
