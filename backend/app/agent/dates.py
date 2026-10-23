"""Key F-1 dates, computed from the student's own dates by fixed rules.

These come from the F-1 regulations (8 CFR 214.2(f)) and are stable, so they are
calculated here rather than left to the model. Anything set fresh each year (such as
the H-1B registration dates) is marked approximate and checked by the live research.
"""

from datetime import date, timedelta

from ..models import Deadline, H1BSeason, StudentProfile


def parse(value: str) -> date | None:
    try:
        return date.fromisoformat(value.strip()[:10])
    except (ValueError, AttributeError):
        return None


def student_deadlines(profile: StudentProfile, today: date | None = None) -> list[Deadline]:
    today = today or date.today()
    end = parse(profile.program_end)
    opt_end = parse(profile.opt_end)
    stem = profile.stem != "no"
    out: list[Deadline] = []

    if profile.stage == "studying" and end:
        out.append(Deadline(
            label="Ask your DSO to recommend OPT",
            start=(end - timedelta(days=120)).isoformat(),
            end=(end + timedelta(days=30)).isoformat(),
            detail="Your DSO enters the OPT recommendation in SEVIS, and you must file within 30 days "
                   "of it. Ask a few weeks before your OPT window opens, so the recommendation is "
                   "ready on day one but does not expire before you can file.",
        ))
        out.append(Deadline(
            label="Apply for post-completion OPT",
            start=(end - timedelta(days=90)).isoformat(),
            end=(end + timedelta(days=60)).isoformat(),
            detail="USCIS must receive your Form I-765 between 90 days before and 60 days after "
                   "your program end date, and within 30 days of your DSO recommending OPT in SEVIS. "
                   "You don't need a job offer to apply. Filing early helps, because processing "
                   "can take months and you can't start work until your EAD start date.",
        ))
        out.append(Deadline(
            label="End of your 60-day grace period",
            end=(end + timedelta(days=60)).isoformat(),
            detail="If you do not apply for OPT, transfer to a new program or change status, you "
                   "must leave the US within 60 days of your program end date.",
        ))

    if profile.stage in ("studying", "opt"):
        out.append(Deadline(
            label="OPT unemployment limit",
            detail="On post-completion OPT you can be unemployed for at most 90 days in total. "
                   "The count starts on your EAD start date.",
        ))

    if stem and opt_end and profile.stage == "opt":
        out.append(Deadline(
            label="Apply for the 24-month STEM OPT extension",
            start=(opt_end - timedelta(days=90)).isoformat(),
            end=opt_end.isoformat(),
            detail="First complete Form I-983 (training plan) with an E-Verify employer and get a "
                   "new STEM OPT recommendation from your DSO. Then file Form I-765 within 60 days of "
                   "that recommendation and before your current OPT ends. Filing on time lets you "
                   "keep working for up to 180 days while it is pending.",
        ))
    elif stem and profile.stage == "studying":
        out.append(Deadline(
            label="STEM OPT extension (later)",
            detail="If your degree is on the DHS STEM list, you can extend OPT by 24 months. You "
                   "apply up to 90 days before your first OPT ends, with a Form I-983 training plan "
                   "from an E-Verify employer and a new DSO recommendation.",
        ))

    if profile.stage == "stem_opt":
        out.append(Deadline(
            label="STEM OPT unemployment limit",
            detail="Across OPT and STEM OPT combined you can be unemployed for at most 150 days.",
        ))
        if opt_end:
            out.append(Deadline(
                label="STEM OPT ends",
                end=opt_end.isoformat(),
                detail="Plan your next status (for example H-1B or a new degree) before this date.",
            ))

    # H-1B registration usually runs in March for jobs starting October 1.
    year = first_lottery_year(profile, today)
    out.append(Deadline(
        label="H-1B registration season",
        start=date(year, 3, 1).isoformat(),
        end=date(year, 3, 31).isoformat(),
        detail="Employers register you for the H-1B lottery, usually in March, for jobs starting "
               "October 1. USCIS announces the exact dates each year.",
        approximate=True,
    ))

    return sorted(out, key=lambda d: (d.start or d.end or "9999", d.label))


def first_lottery_year(profile: StudentProfile, today: date) -> int:
    """The first March the student can be entered in the H-1B lottery.

    The H-1B needs a bachelor's degree by the time the petition is filed (April 1 to June 30).
    A master's or PhD student already has one; a bachelor's student must graduate first.
    """
    year = today.year if today < date(today.year, 4, 1) else today.year + 1
    end = parse(profile.program_end)
    if profile.stage == "studying" and end and profile.degree_level.lower().startswith("bachelor"):
        year = max(year, end.year if end <= date(end.year, 6, 30) else end.year + 1)
    return year


def _add_months(d: date, months: int) -> date:
    y, m = divmod(d.month - 1 + months, 12)
    return date(d.year + y, m + 1, min(d.day, 28))


def work_authorization_end(profile: StudentProfile) -> date | None:
    """Roughly when the student's F-1 work time runs out, if every extension they qualify for is used."""
    stem = profile.stem != "no"
    if profile.stage == "studying":
        end = parse(profile.program_end)
        return end and _add_months(end, 36 if stem else 12)
    opt_end = parse(profile.opt_end)
    if profile.stage == "opt":
        return opt_end and (_add_months(opt_end, 24) if stem else opt_end)
    if profile.stage == "stem_opt":
        return opt_end
    return None


def h1b_seasons(profile: StudentProfile, today: date | None = None) -> list[H1BSeason]:
    """The H-1B lottery seasons (March each year) the student can be entered in while authorized.

    An employer must file the petition from April 1 while the student is still in status, which
    includes the 60-day grace period after OPT ends; cap-gap then carries them to October 1.
    """
    today = today or date.today()
    last = work_authorization_end(profile)
    if not last:
        return []
    last += timedelta(days=60)
    out = []
    year = first_lottery_year(profile, today)
    end = parse(profile.program_end)
    while date(year, 4, 1) <= last:
        n = len(out) + 1
        note = ("Your first chance" if n == 1 else f"Chance {n}")
        if profile.stage == "studying" and end and date(year, 3, 1) < end:
            note += ": before you graduate, an employer can still register you"
        out.append(H1BSeason(label=f"March {year}", fiscal_year=year + 1, note=note))
        year += 1
    return out
