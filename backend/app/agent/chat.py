"""Follow-up questions about a roadmap ("What if I move to Texas?")."""

import json

from pydantic import BaseModel

from ..llm import LLM
from ..models import ChatRequest, Source
from ..search import Search
from . import prompts


class Route(BaseModel):
    needs_search: bool
    query: str = ""


async def answer(req: ChatRequest, llm: LLM, search: Search) -> dict:
    context = json.dumps({"profile": req.profile,
                          "roadmap": req.roadmap.model_dump(exclude={"sources"})})

    route = await llm.chat_json("fast", prompts.CHAT_ROUTER,
                                f"Context:\n{context}\n\nQuestion: {req.question}", Route)
    sources: list[Source] = []
    if route.needs_search and route.query:
        sources = (await search.search(route.query, max_results=4))[:4]

    found = "\n\n".join(f"{s.title}\nURL: {s.url}\n{s.snippet[:1000]}" for s in sources)
    system = prompts.STUDENT_CHAT if req.roadmap.mode == "student" else prompts.CHAT
    messages = [{"role": "system", "content": system + "\n\nContext:\n" + context}]
    messages += [m for m in req.history[-8:] if m.get("role") in ("user", "assistant")]
    messages.append({"role": "user", "content": req.question
                     + (f"\n\nFresh search results:\n{found}" if found else "")})
    reply = await llm.chat("medium", messages, temperature=0.3, max_tokens=1200)
    return {"answer": reply, "sources": [s.model_dump() for s in sources]}
