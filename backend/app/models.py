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
    published: str = ""  # news articles only


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
    kind: str = "official"  # "career" steps (resume, job search) need no rule source
    verified: bool = False  # link came from real search results
    official: bool = False  # and that link is a government or official exam/evaluation body


class BridgeJob(BaseModel):
    title: str
    why: str
    typical_pay: str = ""


class Deadline(BaseModel):
    """A date computed from the student's own dates by fixed F-1 rules (see agent/dates.py)."""

    label: str
    start: str = ""  # ISO date; set for windows
    end: str = ""    # ISO date; the deadline itself
    detail: str
    approximate: bool = False


class PolicyItem(BaseModel):
    """A recent or pending rule change, with its legal status (see agent/facts.py)."""

    title: str
    status: Literal["in effect", "proposed", "blocked by court", "struck down"]
    date: str
    summary: str
    source_url: str


class H1BSeason(BaseModel):
    label: str          # e.g. "March 2027"
    fiscal_year: int    # the H-1B fiscal year this registration is for
    note: str


class Roadmap(BaseModel):
    mode: Literal["license", "student"] = "license"
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
    deadlines: list[Deadline] = []
    h1b_seasons: list[H1BSeason] = []
    policy: list[PolicyItem] = []
    news: list[Source] = []


# ---- International (F-1) students ----

Stage = Literal["studying", "opt", "stem_opt", "other"]


class StudentForm(BaseModel):
    """What an international student types into the form."""

    degree_level: str = Field(description="e.g. \"Master's\"")
    major: str = Field(description="e.g. 'Computer Science'")
    school: str = ""
    country: str = Field("", description="Country of citizenship")
    stem: Literal["yes", "no", "not sure"] = "not sure"
    stage: Stage = "studying"
    program_end: str = Field("", description="ISO date the program ends (I-20 end date)")
    opt_end: str = Field("", description="ISO date the current OPT/EAD card ends, if on OPT")
    target_role: str = Field(description="e.g. 'Data engineer'")
    target_state: str = "Anywhere in the US"
    notes: str = ""


class StudentProfile(BaseModel):
    """Structured profile for an international student."""

    degree_level: str
    major: str
    school: str = ""
    country: str = ""
    stem: str = "not sure"
    stage: Stage = "studying"
    program_end: str = ""
    opt_end: str = ""
    target_role: str
    target_state: str = "Anywhere in the US"
    skills: list[str] = []
    experience: list[str] = Field([], description="Internships and jobs, one line each")
    notes: str = Field("", description="Copied verbatim from the form; never invented")
    summary: str = ""


class Goal(BaseModel):
    id: str
    title: str = Field(description="The career goal, e.g. 'Data engineer at a STEM OPT employer'")
    why: str = Field(description="One or two sentences on why it fits this person")
    visa_path: str = Field(description="e.g. 'OPT → STEM OPT → H-1B'")


class Goals(BaseModel):
    goals: list[Goal]


class StudentRoadmapRequest(BaseModel):
    profile: StudentProfile
    goal: Goal


class ChatRequest(BaseModel):
    question: str
    profile: dict
    roadmap: Roadmap
    history: list[dict] = []
