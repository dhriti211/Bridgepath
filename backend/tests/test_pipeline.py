"""Pipeline tests with a scripted LLM and search, so they run without API keys."""

import asyncio
import json

import pytest

from app.agent import prompts
from app.agent.pipeline import Agent, PlanOut, critical_path, finalize
from app.llm import LLM, extract_json, strip_thinking
from app.models import Equivalency, IntakeForm, Source, Step

URL = "https://www.azbn.gov/licensure"


class ScriptedLLM(LLM):
    def __init__(self):
        self._models = {"fast": "nano", "medium": "super", "reasoning": "ultra"}
        self._resolved = True
        self.calls = []

    async def chat(self, tier, messages, temperature=0.2, max_tokens=4096):
        system = messages[0]["content"]
        self.calls.append(tier)
        if system.startswith(prompts.INTAKE):
            return json.dumps({"profession": "nurse", "country": "Philippines",
                               "degree": "BSc Nursing", "target_state": "Arizona",
                               "summary": "Filipino RN with 5 years of ICU experience."})
        if system.startswith(prompts.EQUIVALENCY):
            return "<think>hmm</think>" + json.dumps({
                "us_equivalent": "BSN", "evaluation_service": "CGFNS",
                "evaluation_reason": "Arizona requires it."})
        if system.startswith(prompts.SYNTHESIS):
            return "```json\n" + json.dumps({"requirements": [
                {"name": "CGFNS report", "detail": "Required", "source_url": URL}]}) + "\n```"
        if system.startswith(prompts.PLAN):
            return json.dumps({"headline": "About a year to practice in Arizona.", "steps": [
                {"id": "s1", "title": "Get CGFNS report", "description": "...",
                 "cost_usd_min": 400, "cost_usd_max": 500, "duration_weeks_min": 8,
                 "duration_weeks_max": 12, "source_url": URL},
                {"id": "s2", "title": "Pass NCLEX", "description": "...", "depends_on": ["s1"],
                 "cost_usd_min": 200, "cost_usd_max": 200, "duration_weeks_min": 6,
                 "duration_weeks_max": 10, "source_url": "https://made-up.example.com"},
            ]})
        raise AssertionError(f"unexpected prompt: {system[:60]}")


class FakeSearch:
    async def search(self, query, max_results=5):
        return [Source(title="AZ Board of Nursing", url=URL, snippet="CGFNS required")]


def test_pipeline_end_to_end():
    agent = Agent(ScriptedLLM(), FakeSearch())
    form = IntakeForm(profession="nurse", country="Philippines", degree="BSc Nursing",
                      target_state="AZ", years_experience=5, notes="family visa")

    async def collect():
        return [e async for e in agent.run(form)]

    events = asyncio.run(collect())
    assert not [e for e in events if e["type"] == "error"], events
    roadmap = events[-1]["roadmap"]
    assert events[-1]["type"] == "roadmap"
    assert roadmap["us_equivalent"] == "BSN"
    # Real link kept and verified; invented link dropped.
    assert roadmap["steps"][0]["verified"] and roadmap["steps"][0]["source_url"] == URL
    assert roadmap["steps"][0]["official"]
    assert not roadmap["steps"][1]["verified"] and roadmap["steps"][1]["source_url"] == ""
    assert roadmap["total_cost_usd_min"] == 600
    assert (roadmap["total_weeks_min"], roadmap["total_weeks_max"]) == (14, 22)
    assert any(e["type"] == "sources" for e in events)
    # Form facts win over anything the intake model wrote.
    profile = next(e["profile"] for e in events if e["type"] == "profile")
    assert profile["years_experience"] == 5 and profile["notes"] == "family visa"


def test_critical_path_parallel_and_cycles():
    steps = [Step(id="a", title="", description="", duration_weeks_min=4, duration_weeks_max=4),
             Step(id="b", title="", description="", duration_weeks_min=10, duration_weeks_max=10),
             Step(id="c", title="", description="", duration_weeks_min=1, duration_weeks_max=1,
                  depends_on=["a", "b", "c", "missing"])]
    assert critical_path(steps) == (11, 11)
    loop = [Step(id="x", title="", description="", duration_weeks_min=1, depends_on=["y"]),
            Step(id="y", title="", description="", duration_weeks_min=1, depends_on=["x"])]
    assert critical_path(loop)[0] == 2


def test_finalize_sources_only_cited():
    plan = PlanOut(headline="h", steps=[Step(id="s1", title="t", description="d", source_url=URL + "/")])
    eq = Equivalency(us_equivalent="BSN", evaluation_service="CGFNS", evaluation_reason="r")
    sources = {URL: Source(title="a", url=URL), "https://other.gov": Source(title="b", url="https://other.gov")}
    rm = finalize(plan, eq, sources)
    assert rm.steps[0].verified
    assert [s.url for s in rm.sources] == [URL]


@pytest.mark.parametrize("text", [
    '{"a": 1}', 'Sure! {"a": 1} hope that helps', '```json\n{"a": 1}\n```', '{"a": 1, "b": "}"} x',
])
def test_extract_json(text):
    assert extract_json(text)["a"] == 1


def test_strip_thinking():
    assert strip_thinking("<think>x</think> hi") == "hi"
    assert strip_thinking("reasoning...</think>answer") == "answer"


def test_official_flag_only_for_official_sites():
    plan = PlanOut(headline="h", steps=[
        Step(id="s1", title="t", description="d", source_url=URL),
        Step(id="s2", title="t", description="d", source_url="https://www.archerreview.com/x")])
    eq = Equivalency(us_equivalent="BSN", evaluation_service="CGFNS", evaluation_reason="r")
    sources = {u: Source(title="a", url=u) for u in (URL, "https://www.archerreview.com/x")}
    rm = finalize(plan, eq, sources)
    assert [s.official for s in rm.steps] == [True, False]
    assert all(s.verified for s in rm.steps)
