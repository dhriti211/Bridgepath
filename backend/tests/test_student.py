"""Student agent and F-1 date tests, with a scripted LLM and search."""

import asyncio
import json
from datetime import date

from app.agent import prompts
from app.agent.dates import student_deadlines
from app.agent.queries import student_queries
from app.agent.student import StudentAgent
from app.models import Goal, Source, StudentForm, StudentProfile
from tests.test_pipeline import ScriptedLLM

USCIS = "https://www.uscis.gov/opt"
GOAL = Goal(id="g1", title="Data engineer at a large tech company", why="Fits your Spark work.",
            visa_path="OPT → STEM OPT → H-1B")


class StudentLLM(ScriptedLLM):
    async def chat(self, tier, messages, temperature=0.2, max_tokens=4096):
        system = messages[0]["content"]
        self.calls.append(tier)
        if system.startswith(prompts.STUDENT_INTAKE):
            return json.dumps({"degree_level": "Master's", "major": "Data Science",
                               "target_role": "Data engineer", "skills": ["Python", "Spark"],
                               "stage": "opt", "summary": "MS Data Science student."})
        if system.startswith(prompts.GOALS):
            return json.dumps({"goals": [GOAL.model_dump()] + [
                {"id": f"g{i}", "title": f"Goal {i}", "why": "...", "visa_path": "OPT → H-1B"}
                for i in range(2, 5)]})
        if system.startswith(prompts.STUDENT_SYNTHESIS):
            return json.dumps({"requirements": [
                {"name": "OPT filing window", "detail": "90 days before to 60 after",
                 "source_url": USCIS}]})
        if system.startswith(prompts.STUDENT_PLAN):
            return json.dumps({"headline": "Your path to data engineering in the US.", "steps": [
                {"id": "s1", "title": "Ask your DSO to recommend OPT", "description": "...",
                 "duration_weeks_min": 1, "duration_weeks_max": 2, "source_url": USCIS},
                {"id": "s2", "title": "File Form I-765", "description": "...", "depends_on": ["s1"],
                 "cost_usd_min": 470, "cost_usd_max": 520, "duration_weeks_min": 8,
                 "duration_weeks_max": 16, "source_url": "https://invented.example.com"},
            ]})
        raise AssertionError(f"unexpected prompt: {system[:60]}")


class FakeSearch:
    async def search(self, query, max_results=5):
        return [Source(title="OPT | USCIS", url=USCIS, snippet="OPT rules", official=True)]


def profile(**kw) -> StudentProfile:
    base = dict(degree_level="Master's", major="Data Science", target_role="Data engineer",
                stem="yes", stage="studying", program_end="2027-05-15")
    return StudentProfile(**{**base, **kw})


def test_goals_keep_form_facts():
    form = StudentForm(degree_level="Master's", major="Data Science", target_role="Data engineer",
                       stage="studying", program_end="2027-05-15", notes="CPT internship at a bank")
    p, goals = asyncio.run(StudentAgent(StudentLLM(), FakeSearch()).goals(form, "CV text"))
    assert len(goals) == 3 and goals[0].id == "g1"
    # The form wins over the model: it said "opt", the form says "studying".
    assert p.stage == "studying" and p.program_end == "2027-05-15"
    assert p.notes == "CPT internship at a bank" and p.skills == ["Python", "Spark"]


def test_student_roadmap_end_to_end():
    agent = StudentAgent(StudentLLM(), FakeSearch())

    async def collect():
        return [e async for e in agent.run(profile(), GOAL)]

    events = asyncio.run(collect())
    assert not [e for e in events if e["type"] == "error"], events
    roadmap = events[-1]["roadmap"]
    assert roadmap["mode"] == "student" and roadmap["us_equivalent"] == GOAL.visa_path
    assert roadmap["steps"][0]["official"] and not roadmap["steps"][1]["verified"]
    assert roadmap["total_cost_usd_max"] == 520
    labels = [d["label"] for d in roadmap["deadlines"]]
    assert "Apply for post-completion OPT" in labels


def test_opt_window_from_program_end():
    ds = {d.label: d for d in student_deadlines(profile(), today=date(2026, 10, 21))}
    opt = ds["Apply for post-completion OPT"]
    assert (opt.start, opt.end) == ("2027-02-14", "2027-07-14")
    assert ds["End of your 60-day grace period"].end == "2027-07-14"
    h1b = ds["H-1B registration season"]
    assert h1b.start == "2027-03-01" and h1b.approximate


def test_stem_opt_window_only_when_on_opt():
    ds = {d.label: d for d in student_deadlines(profile(stage="opt", opt_end="2027-08-01"),
                                                today=date(2026, 10, 21))}
    stem = ds["Apply for the 24-month STEM OPT extension"]
    assert (stem.start, stem.end) == ("2027-05-03", "2027-08-01")
    assert "Apply for post-completion OPT" not in ds
    no_stem = {d.label for d in student_deadlines(profile(stage="opt", stem="no", opt_end="2027-08-01"))}
    assert not any("STEM" in label for label in no_stem)


def test_student_queries_fill_role_and_drop_anywhere():
    qs = student_queries(profile(target_state="Anywhere in the US"), GOAL, today=date(2026, 10, 21))
    assert "H-1B cap registration 2027" in " ".join(qs)
    assert any(q == "Data engineer jobs that sponsor H-1B" for q in qs)
