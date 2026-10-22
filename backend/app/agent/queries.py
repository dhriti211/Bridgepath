"""Research questions the agent asks the web for each profession.

Hand-written so the research is reliable and covers every stage of the
pathway; the agent fills in the state and country.
"""

from datetime import date

from ..models import Goal, Profile, StudentProfile

_QUERIES = {
    "nurse": [
        "{state} board of nursing licensure requirements internationally educated nurses",
        "{state} administrative code registered nurse licensure by examination international graduate",
        "nclex.com NCLEX registration fees international scheduling fee",
        "CGFNS credentials evaluation report requirements for {state} registered nurse license",
        "NCLEX-RN registration fee and requirements for international applicants",
        "English proficiency test requirements internationally educated nurses {state}",
        "{state} bridge or refresher program for internationally educated nurses",
    ],
    "engineer": [
        "{state} board of technical registration professional engineer license foreign degree",
        "{state} administrative code professional engineer registration foreign education evaluation",
        "NCEES credentials evaluation for engineers with degrees from {country}",
        "NCEES FE exam registration fee and eligibility",
        "{state} PE license experience requirements and PE exam",
        "engineer in training certificate {state} application",
        "jobs for foreign-trained engineers while getting licensed in the US",
    ],
    "teacher": [
        "{state} department of education teaching certificate requirements foreign credentials",
        "{state} administrative code teacher certification foreign degree evaluation",
        "foreign transcript evaluation for {state} teacher certification approved agencies",
        "{state} teacher certification exams required and fees",
        "{state} alternative teacher certification pathway for career changers",
        "{state} fingerprint clearance card for teachers cost",
        "{state} teacher certification internationally trained teachers program",
    ],
}


def research_queries(profile: Profile) -> list[str]:
    return [
        q.format(state=profile.target_state, country=profile.country)
        for q in _QUERIES[profile.profession]
    ]


# Rules, fees and dates: searched on government sites only (see search.OFFICIAL_DOMAINS).
_STUDENT_RULE_QUERIES = [
    "optional practical training OPT F-1 students post-completion rules",
    "STEM OPT extension requirements E-Verify employer Form I-983",
    "OPT STEM OPT unemployment days reporting requirements",
    "H-1B cap registration {year} dates and selection process",
    "H-1B weighted selection wage level",
    "H-1B cap-gap extension F-1 students",
    "travel while OPT application pending re-entry EAD job offer",
    "DHS STEM designated degree program list {major}",
]

# Employers and career paths: the whole web, since no official site lists who sponsors.
_STUDENT_OPEN_QUERIES = [
    "cap-exempt H-1B employers universities nonprofit research organizations",
    "{role} jobs that sponsor H-1B {state}",
    "{goal} international student F-1",
]


def student_queries(profile: StudentProfile, goal: Goal,
                    today: date | None = None) -> list[tuple[str, bool]]:
    """(query, official_only) pairs for the student research step."""
    today = today or date.today()
    year = today.year if today.month < 4 else today.year + 1  # next H-1B registration season
    state = "" if profile.target_state.lower().startswith("anywhere") else profile.target_state

    def fill(q: str) -> str:
        return " ".join(q.format(year=year, major=profile.major, role=profile.target_role,
                                 state=state, goal=goal.title).split())

    return ([(fill(q), True) for q in _STUDENT_RULE_QUERIES]
            + [(fill(q), False) for q in _STUDENT_OPEN_QUERIES])
