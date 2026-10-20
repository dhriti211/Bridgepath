"""Nebius Token Factory client with Nemotron model routing.

Three tiers, each mapped to a Nemotron 3 model:
  fast      -> Nano   (intake parsing, cheap extraction)
  medium    -> Super  (reading search results, chat)
  reasoning -> Ultra  (equivalency reasoning, roadmap planning)
"""

import json
import logging
import re
from typing import Literal, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel, ValidationError

from . import config

log = logging.getLogger(__name__)

Tier = Literal["fast", "medium", "reasoning"]
T = TypeVar("T", bound=BaseModel)

# Substrings used to find each tier in the Token Factory model list.
_TIER_HINTS: dict[Tier, str] = {"fast": "nano", "medium": "super", "reasoning": "ultra"}
# If a tier's model is missing, fall back along this order.
_FALLBACK: dict[Tier, list[Tier]] = {
    "fast": ["fast", "medium", "reasoning"],
    "medium": ["medium", "reasoning", "fast"],
    "reasoning": ["reasoning", "medium", "fast"],
}


class LLM:
    def __init__(self, client: AsyncOpenAI | None = None):
        self.client = client or AsyncOpenAI(
            base_url=config.NEBIUS_BASE_URL, api_key=config.NEBIUS_API_KEY or "missing"
        )
        self._models: dict[Tier, str] = {
            t: m
            for t, m in {
                "fast": config.MODEL_FAST,
                "medium": config.MODEL_MEDIUM,
                "reasoning": config.MODEL_REASONING,
            }.items()
            if m
        }
        self._resolved = len(self._models) == 3

    async def resolve_models(self) -> dict[Tier, str]:
        """Pick Nemotron 3 models from the live model list for any tier not set in env."""
        if self._resolved:
            return self._models
        page = await self.client.models.list()
        ids = [m.id for m in page.data]
        nemotron = [i for i in ids if "nemotron" in i.lower()]
        for tier, hint in _TIER_HINTS.items():
            if tier in self._models:
                continue
            matches = [i for i in nemotron if hint in i.lower()]
            # Prefer the newest family (Nemotron 3) when several match.
            matches.sort(key=lambda i: ("nemotron-3" not in i.lower(), len(i)))
            if matches:
                self._models[tier] = matches[0]
        if not self._models:
            raise RuntimeError(f"No Nemotron models found on Token Factory. Available: {ids[:20]}")
        self._resolved = True
        log.info("Using models: %s", self._models)
        return self._models

    async def model_for(self, tier: Tier) -> str:
        models = await self.resolve_models()
        for t in _FALLBACK[tier]:
            if t in models:
                return models[t]
        raise RuntimeError("No model available")

    async def chat(self, tier: Tier, messages: list[dict], temperature: float = 0.2,
                   max_tokens: int = 4096) -> str:
        model = await self.model_for(tier)
        resp = await self.client.chat.completions.create(
            model=model, messages=messages, temperature=temperature, max_tokens=max_tokens
        )
        return strip_thinking(resp.choices[0].message.content or "")

    async def chat_json(self, tier: Tier, system: str, user: str, schema: type[T],
                        retries: int = 1) -> T:
        """Ask for JSON matching `schema`, retrying once with the validation error."""
        messages = [
            {"role": "system", "content": system + "\n\nRespond with a single JSON object only, "
             "no prose, matching this JSON schema:\n" + json.dumps(schema.model_json_schema())},
            {"role": "user", "content": user},
        ]
        last_err: Exception | None = None
        for _ in range(retries + 1):
            text = await self.chat(tier, messages)
            try:
                return schema.model_validate(extract_json(text))
            except (ValueError, ValidationError) as e:
                last_err = e
                messages += [
                    {"role": "assistant", "content": text},
                    {"role": "user", "content": f"That was not valid JSON for the schema: {e}. "
                     "Reply again with only the corrected JSON object."},
                ]
        raise ValueError(f"Model did not return valid JSON: {last_err}")


def strip_thinking(text: str) -> str:
    """Remove <think>...</think> reasoning blocks some models emit."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    if "</think>" in text:  # opening tag was in the prompt template
        text = text.split("</think>", 1)[1]
    return text.strip()


def extract_json(text: str) -> dict:
    """Pull the first JSON object out of a model reply (handles ```json fences)."""
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
    if fenced:
        text = fenced.group(1)
    start = text.find("{")
    if start < 0:
        raise ValueError("no JSON object in reply")
    depth, in_str, esc = 0, False, False
    for i, ch in enumerate(text[start:], start):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        elif ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError("unterminated JSON object in reply")
