"""Data shapes shared by the agent and the API."""

from typing import Literal

from pydantic import BaseModel, Field

Profession = Literal["nurse", "engineer", "teacher"]


class IntakeForm(BaseModel):
    """What the user types into the form."""

    profession: Profession
    country: str = Field(description="Country where the degree was earned")
    degree: str = Field(description="Degree title, e.g. 'BSc Nursing'")
    years_experience: int = 0
    target_state: str = Field(description="US state, e.g. 'Arizona'")
    english_test: str = Field("", description="e.g. 'IELTS 7.0', 'none yet'")
    notes: str = ""


class Profile(BaseModel):
    """Structured profile the agent works from."""

    profession: Profession
    country: str
    degree: str
    field_of_study: str = ""
    years_experience: int = 0
    target_state: str
    english_test: str = ""
    specialties: list[str] = []
    licenses_held: list[str] = []
    notes: str = Field("", description="Copied verbatim from the form; never invented")
    summary: str = ""


class Equivalency(BaseModel):
    us_equivalent: str
    evaluation_service: str
    evaluation_reason: str
    likely_gaps: list[str] = []


class Source(BaseModel):
    title: str
    url: str
    snippet: str = ""
    official: bool = False


class Requirement(BaseModel):
    name: str
    detail: str
    source_url: str = ""


class Step(BaseModel):
    id: str
    title: str
    description: str
    cost_usd_min: float = 0
    cost_usd_max: float = 0
    duration_weeks_min: float = 0
    duration_weeks_max: float = 0
    depends_on: list[str] = []
    documents: list[str] = []
    source_url: str = ""
    verified: bool = False  # link came from real search results
    official: bool = False  # and that link is a government or official exam/evaluation body


class BridgeJob(BaseModel):
    title: str
    why: str
    typical_pay: str = ""


class Roadmap(BaseModel):
    headline: str
    us_equivalent: str
    steps: list[Step]
    bridge_jobs: list[BridgeJob] = []
    warnings: list[str] = []
    total_cost_usd_min: float = 0
    total_cost_usd_max: float = 0
    total_weeks_min: float = 0
    total_weeks_max: float = 0
    sources: list[Source] = []


class ChatRequest(BaseModel):
    question: str
    profile: Profile
    roadmap: Roadmap
    history: list[dict] = []
