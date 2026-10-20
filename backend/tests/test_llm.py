"""Model selection and the thinking switch, with a fake Token Factory client."""

import asyncio
from types import SimpleNamespace as NS

import httpx
import pytest
from openai import BadRequestError

from app.llm import LLM, is_specialized

IDS = ["nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", "nvidia/Nemotron-3.5-Super-VL",
       "nvidia/nemotron-3-super-120b-a12b", "nvidia/Nemotron-3-Ultra-550b-a55b",
       "meta-llama/Llama-3.3-70B-Instruct"]


class FakeCompletions:
    def __init__(self, reject_kwargs=False, content="ready"):
        self.reject_kwargs, self.content, self.calls = reject_kwargs, content, []

    async def create(self, **kw):
        self.calls.append(kw)
        if self.reject_kwargs and "extra_body" in kw:
            req = httpx.Request("POST", "http://x")
            raise BadRequestError("bad", response=httpx.Response(400, request=req), body=None)
        return NS(choices=[NS(message=NS(content=self.content), finish_reason="stop")])


def fake_client(**kw):
    async def list_models():
        return NS(data=[NS(id=i) for i in IDS])
    return NS(models=NS(list=list_models), chat=NS(completions=FakeCompletions(**kw)))


def test_resolve_prefers_general_models():
    models = asyncio.run(LLM(fake_client()).resolve_models())
    assert models == {"fast": "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
                      "medium": "nvidia/nemotron-3-super-120b-a12b",
                      "reasoning": "nvidia/Nemotron-3-Ultra-550b-a55b"}


def test_is_specialized():
    assert is_specialized("nvidia/Nemotron-3.5-Super-VL")
    assert not is_specialized("nvidia/nemotron-3-super-120b-a12b")


def test_thinking_switch_per_tier_and_fallback():
    client = fake_client()
    llm = LLM(client)
    asyncio.run(llm.chat("fast", [{"role": "user", "content": "hi"}]))
    asyncio.run(llm.chat("reasoning", [{"role": "user", "content": "hi"}]))
    calls = client.chat.completions.calls
    assert calls[0]["extra_body"]["chat_template_kwargs"]["enable_thinking"] is False
    assert calls[1]["extra_body"]["chat_template_kwargs"]["enable_thinking"] is True

    client = fake_client(reject_kwargs=True)
    llm = LLM(client)
    assert asyncio.run(llm.chat("fast", [{"role": "user", "content": "hi"}])) == "ready"
    assert "extra_body" not in client.chat.completions.calls[-1]


def test_empty_answer_raises():
    with pytest.raises(RuntimeError, match="empty answer"):
        asyncio.run(LLM(fake_client(content="")).chat("fast", [{"role": "user", "content": "hi"}]))
