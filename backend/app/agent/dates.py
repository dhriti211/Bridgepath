"""Key F-1 dates, computed from the student's own dates by fixed rules.

These come from the F-1 regulations (8 CFR 214.2(f)) and are stable, so they are
calculated here rather than left to the model. Anything set fresh each year (such as
the H-1B registration dates) is marked approximate and checked by the live research.
"""

from datetime import date, timedelta

from ..models import Deadline, StudentProfile


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
            detail="File Form I-765 with a Form I-983 training plan from an E-Verify employer up "
                   "to 90 days before your current OPT ends. Filing on time lets you keep working "
                   "for up to 180 days while it is pending.",
        ))
    elif stem and profile.stage == "studying":
        out.append(Deadline(
            label="STEM OPT extension (later)",
            detail="If your degree is on the DHS STEM list, you can extend OPT by 24 months. You "
                   "apply up to 90 days before your first OPT ends, and you need an E-Verify employer.",
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
    year = today.year if today < date(today.year, 3, 1) else today.year + 1
    out.append(Deadline(
        label="H-1B registration season",
        start=date(year, 3, 1).isoformat(),
        end=date(year, 3, 31).isoformat(),
        detail="Employers register you for the H-1B lottery, usually in March, for jobs starting "
               "October 1. USCIS announces the exact dates each year.",
        approximate=True,
    ))

    return sorted(out, key=lambda d: (d.start or d.end or "9999", d.label))
