"""Research questions the agent asks the web for each profession.

Hand-written so the research is reliable and covers every stage of the
pathway; the agent fills in the state and country.
"""

from ..models import Profile

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
