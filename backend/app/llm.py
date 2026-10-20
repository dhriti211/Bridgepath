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

from openai import AsyncOpenAI, BadRequestError
from pydantic import BaseModel, ValidationError

from . import config

log = logging.getLogger(__name__)

Tier = Literal["fast", "medium", "reasoning"]
T = TypeVar("T", bound=BaseModel)

# Substrings used to find each tier in the Token Factory model list.
_TIER_HINTS: dict[Tier, str] = {"fast": "nano", "medium": "super", "reasoning": "ultra"}
# Specialized variants (vision, embeddings, safety...) are only used if nothing else matches.
_SPECIALIZED = {"vl", "omni", "embed", "embedding", "reward", "guard", "safety", "parse", "retriever"}
# Reasoning ("thinking") is on only for the tier that needs it; it costs tokens and time.
_THINKING: dict[Tier, bool] = {"fast": False, "medium": False, "reasoning": True}
_MAX_TOKENS: dict[Tier, int] = {"fast": 4096, "medium": 8192, "reasoning": 16384}
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
        self._template_kwargs_ok = True

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
            # Prefer general chat models, then the Nemotron 3 family, then the shortest name.
            matches.sort(key=lambda i: (is_specialized(i), "nemotron-3" not in i.lower(), len(i)))
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
                   max_tokens: int | None = None) -> str:
        model = await self.model_for(tier)
        kwargs = dict(model=model, messages=messages, temperature=temperature,
                      max_tokens=max_tokens or _MAX_TOKENS[tier])
        if self._template_kwargs_ok:
            try:
                resp = await self.client.chat.completions.create(
                    **kwargs,
                    extra_body={"chat_template_kwargs": {"enable_thinking": _THINKING[tier]}},
                )
            except BadRequestError:
                # This model or endpoint does not accept the thinking switch; stop sending it.
                self._template_kwargs_ok = False
                resp = await self.client.chat.completions.create(**kwargs)
        else:
            resp = await self.client.chat.completions.create(**kwargs)
        choice = resp.choices[0]
        text = strip_thinking(choice.message.content or "")
        if not text:
            raise RuntimeError(f"{model} returned an empty answer (finish_reason={choice.finish_reason}); "
                               "it may have spent its token budget reasoning")
        return text

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


def is_specialized(model_id: str) -> bool:
    return bool(set(re.split(r"[-_/.]", model_id.lower())) & _SPECIALIZED)


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
