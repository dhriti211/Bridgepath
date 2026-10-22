"""Spend guard and saved-response tests."""

import asyncio

import pytest

from app import config, replay
from app.guard import Budget, BudgetExceeded, RateLimiter


@pytest.fixture
def db(tmp_path):
    return tmp_path / "cache.db"


def test_daily_and_total_caps(db, monkeypatch):
    monkeypatch.setattr(config, "MAX_LLM_CALLS_PER_DAY", 2)
    monkeypatch.setattr(config, "MAX_LLM_CALLS_TOTAL", 100)
    b = Budget(db)
    b.spend("llm"); b.spend("llm")
    with pytest.raises(BudgetExceeded):
        b.spend("llm")
    assert b.usage()["llm"] == {"today": 2, "total": 2}

    monkeypatch.setattr(config, "MAX_LLM_CALLS_PER_DAY", 100)
    monkeypatch.setattr(config, "MAX_LLM_CALLS_TOTAL", 2)
    with pytest.raises(BudgetExceeded):
        b.spend("llm")
    b.spend("search")  # searches have their own cap


def test_cached_mode_blocks_all_paid_calls(db, monkeypatch):
    monkeypatch.setattr(config, "DEMO_MODE", "cached")
    with pytest.raises(BudgetExceeded):
        Budget(db).spend("search")


def test_rate_limiter_per_visitor():
    rl = RateLimiter(limit=2)
    assert rl.allow("a") and rl.allow("a") and not rl.allow("a")
    assert rl.allow("b")


async def _run(events):
    for e in events:
        yield e


def collect(gen):
    async def go():
        return [e async for e in gen]
    return asyncio.run(go())


def test_finished_runs_are_replayed_not_rerun(db, tmp_path, monkeypatch):
    monkeypatch.setattr(replay, "REPLAY_DELAY", 0)
    store = replay.Store(db, bundled=tmp_path / "none.json")
    run = [{"type": "step"}, {"type": "roadmap", "roadmap": {}}]
    assert collect(store.events("k", _run(run))) == run

    async def boom():
        raise AssertionError("should not run again")
        yield
    assert collect(store.events("k", boom())) == run


def test_failed_runs_are_not_saved_and_cached_mode_never_runs(db, tmp_path, monkeypatch):
    monkeypatch.setattr(replay, "REPLAY_DELAY", 0)
    store = replay.Store(db, bundled=tmp_path / "none.json")
    collect(store.events("k", _run([{"type": "error", "message": "x"}])))
    assert store.get("k") is None

    monkeypatch.setattr(config, "DEMO_MODE", "cached")

    async def boom():
        raise AssertionError("cached mode must not call out")
        yield
    out = collect(store.events("k", boom()))
    assert out[-1]["type"] == "error" and out[-1]["limit"]


def test_saved_runs_expire_when_the_agent_changes(monkeypatch):
    before = replay.key("student", {"a": 1})
    monkeypatch.setattr(replay, "VERSION", "changed")
    assert replay.key("student", {"a": 1}) != before
