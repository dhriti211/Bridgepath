"""Bridgepath API: streams the agent's progress and roadmap, answers follow-ups."""

import io
import json
import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from pypdf import PdfReader

from . import config
from .agent import chat
from .agent.pipeline import Agent
from .agent.student import StudentAgent
from .llm import LLM
from .models import ChatRequest, IntakeForm, StudentForm, StudentRoadmapRequest
from .search import Search

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Bridgepath")
_llm: LLM | None = None
_search: Search | None = None


def services() -> tuple[LLM, Search]:
    global _llm, _search
    if _llm is None:
        _llm, _search = LLM(), Search()
    return _llm, _search


@app.get("/api/health")
async def health():
    return {"ok": True, "nebius_key": bool(config.NEBIUS_API_KEY),
            "tavily_key": bool(config.TAVILY_API_KEY)}


@app.get("/api/models")
async def models():
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
):
    try:
        form = IntakeForm(profession=profession, country=country, degree=degree,
                          target_state=target_state, years_experience=years_experience,
                          english_test=english_test, notes=notes)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False))
    cv_text = await read_cv(cv)
    return sse(Agent(*services()).run(form, cv_text))


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
):
    try:
        form = StudentForm(degree_level=degree_level, major=major, target_role=target_role,
                           school=school, country=country, stem=stem, stage=stage,
                           program_end=program_end, opt_end=opt_end,
                           target_state=target_state, notes=notes)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False))
    cv_text = await read_cv(cv)
    try:
        profile, goals = await StudentAgent(*services()).goals(form, cv_text)
    except Exception as e:
        logging.exception("goal suggestion failed")
        raise HTTPException(502, f"Could not suggest goals: {type(e).__name__}: {e}")
    return {"profile": profile.model_dump(), "goals": [g.model_dump() for g in goals]}


@app.post("/api/student/roadmap")
async def student_roadmap(req: StudentRoadmapRequest):
    return sse(StudentAgent(*services()).run(req.profile, req.goal))


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    return await chat.answer(req, *services())


# Serve the built React app (frontend/dist) when present.
if config.FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=config.FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    async def spa(path: str):
        file = config.FRONTEND_DIST / path
        if path and file.is_file() and config.FRONTEND_DIST in file.resolve().parents:
            return FileResponse(file)
        return FileResponse(config.FRONTEND_DIST / "index.html")
