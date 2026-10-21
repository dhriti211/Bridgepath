"""Bridgepath API: streams the agent's progress and roadmap, answers follow-ups."""

import hashlib
import io
import json
import logging

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from pypdf import PdfReader

from . import config
from .agent import chat
from .agent.pipeline import Agent
from .agent.student import StudentAgent
from .guard import BudgetExceeded, RateLimiter, budget
from .llm import LLM
from .models import ChatRequest, IntakeForm, StudentForm, StudentRoadmapRequest
from .replay import CACHED_MISS, Store, key
from .search import Search

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Bridgepath")
_llm: LLM | None = None
_search: Search | None = None
_store: Store | None = None
_limiter = RateLimiter()


def services() -> tuple[LLM, Search]:
    global _llm, _search
    if _llm is None:
        _llm, _search = LLM(), Search()
    return _llm, _search


def store() -> Store:
    global _store
    if _store is None:
        _store = Store()
    return _store


def rate_limited(request: Request) -> None:
    """Per-visitor limit on endpoints that can call Nebius or Tavily."""
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    if not _limiter.allow(ip):
        raise HTTPException(429, "You've made a lot of requests in the last hour. Please wait a bit and try again.")


def cv_hash(cv_text: str) -> str:
    return hashlib.sha256(cv_text.encode()).hexdigest() if cv_text.strip() else ""


@app.get("/api/health")
async def health():
    return {"ok": True, "nebius_key": bool(config.NEBIUS_API_KEY),
            "tavily_key": bool(config.TAVILY_API_KEY), "demo_mode": config.DEMO_MODE,
            "usage": budget().usage()}


@app.get("/api/models")
async def models():
    if config.DEMO_MODE == "cached":
        return {}
    llm, _ = services()
    return await llm.resolve_models()


MAX_UPLOAD_BYTES = 5 * 1024 * 1024


async def read_cv(file: UploadFile | None) -> str:
    if file is None or not file.filename:
        return ""
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large (max 5 MB)")
    if file.filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages[:10])
    return data.decode("utf-8", errors="ignore")


@app.post("/api/roadmap")
async def roadmap(
    profession: str = Form(...),
    country: str = Form(...),
    degree: str = Form(...),
    target_state: str = Form(...),
    years_experience: int = Form(0),
    english_test: str = Form(""),
    notes: str = Form(""),
    cv: UploadFile | None = File(None),
    _: None = Depends(rate_limited),
):
    try:
        form = IntakeForm(profession=profession, country=country, degree=degree,
                          target_state=target_state, years_experience=years_experience,
                          english_test=english_test, notes=notes)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False))
    cv_text = await read_cv(cv)
    k = key("license", {"form": form.model_dump(), "cv": cv_hash(cv_text)})
    return sse(store().events(k, Agent(*services()).run(form, cv_text)))


def sse(events) -> StreamingResponse:
    async def stream():
        async for event in events:
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.post("/api/student/goals")
async def student_goals(
    degree_level: str = Form(...),
    major: str = Form(...),
    target_role: str = Form(...),
    school: str = Form(""),
    country: str = Form(""),
    stem: str = Form("not sure"),
    stage: str = Form("studying"),
    program_end: str = Form(""),
    opt_end: str = Form(""),
    target_state: str = Form("Anywhere in the US"),
    notes: str = Form(""),
    cv: UploadFile | None = File(None),
    _: None = Depends(rate_limited),
):
    try:
        form = StudentForm(degree_level=degree_level, major=major, target_role=target_role,
                           school=school, country=country, stem=stem, stage=stage,
                           program_end=program_end, opt_end=opt_end,
                           target_state=target_state, notes=notes)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False))
    cv_text = await read_cv(cv)
    k = key("goals", {"form": form.model_dump(), "cv": cv_hash(cv_text)})
    if (saved := store().get(k)) is not None:
        return saved
    if config.DEMO_MODE == "cached":
        raise HTTPException(429, CACHED_MISS)
    try:
        profile, goals = await StudentAgent(*services()).goals(form, cv_text)
    except BudgetExceeded as e:
        raise HTTPException(429, str(e))
    except Exception as e:
        logging.exception("goal suggestion failed")
        raise HTTPException(502, f"Could not suggest goals: {type(e).__name__}: {e}")
    out = {"profile": profile.model_dump(), "goals": [g.model_dump() for g in goals]}
    store().put(k, out)
    return out


@app.post("/api/student/roadmap")
async def student_roadmap(req: StudentRoadmapRequest, _: None = Depends(rate_limited)):
    k = key("student", req.model_dump())
    return sse(store().events(k, StudentAgent(*services()).run(req.profile, req.goal)))


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, _: None = Depends(rate_limited)):
    if config.DEMO_MODE == "cached":
        raise HTTPException(429, "Follow-up questions are paused in this demo.")
    try:
        return await chat.answer(req, *services())
    except BudgetExceeded as e:
        raise HTTPException(429, str(e))


# Serve the built React app (frontend/dist) when present.
if config.FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=config.FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    async def spa(path: str):
        file = config.FRONTEND_DIST / path
        if path and file.is_file() and config.FRONTEND_DIST in file.resolve().parents:
            return FileResponse(file)
        return FileResponse(config.FRONTEND_DIST / "index.html")
