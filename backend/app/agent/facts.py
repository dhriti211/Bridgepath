"""Hand-checked facts and the policy watch list for the student roadmap.

Fees and rule changes move fast and a wrong number hurts real students, so the
ones that matter most are checked by hand against the official source and given
to the agent as verified sources. Each entry says when it was last checked.
Update this file when a rule changes; the live news search flags anything newer.
"""

from ..models import PolicyItem, Source

CHECKED = "2026-10-22"

# Given to the planner as sources it can quote. Each one is copied from an official page.
CHECKED_FACTS = [
    Source(
        title="USCIS fee schedule (G-1055): Form I-765 for OPT and STEM OPT",
        url="https://www.uscis.gov/g-1055",
        snippet="Form I-765 filing fee for F-1 students applying for OPT or the STEM OPT extension: "
                "$470 if filed online, $520 if filed on paper. The student pays this fee.",
        official=True,
    ),
    Source(
        title="USCIS: H-1B electronic registration process",
        url="https://www.uscis.gov/working-in-the-united-states/temporary-workers/h-1b-specialty-occupations/h-1b-electronic-registration-process",
        snippet="Employers (not the student) register each H-1B cap beneficiary online during the "
                "annual registration period, usually in March, and pay a $215 registration fee per "
                "beneficiary. Selected registrants can file the H-1B petition from April 1 for "
                "employment starting October 1.",
        official=True,
    ),
    Source(
        title="Federal Register: Weighted selection process for cap-subject H-1B (final rule)",
        url="https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b",
        snippet="In effect from the FY 2027 cap season (registration in March 2026) onward. The H-1B "
                "lottery is weighted by the wage level of the offered job: level IV gets 4 entries, "
                "level III gets 3, level II gets 2 and level I (entry level) gets 1. Each person is "
                "still counted once, however many employers register them.",
        official=True,
    ),
    Source(
        title="8 CFR 214.2(f): STEM OPT extension filing rules",
        url="https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.2",
        snippet="To get the 24-month STEM OPT extension the student files a new Form I-765 up to 90 "
                "days before the current OPT EAD expires and within 60 days of the DSO entering the "
                "new STEM OPT recommendation in SEVIS. The student and an E-Verify employer must "
                "complete Form I-983 (training plan) first, and the DSO needs it to recommend STEM "
                "OPT. Filing on time extends work authorization for up to 180 days while pending. "
                "Cap-gap: if an H-1B petition for change of status is filed on time, F-1 status and "
                "work authorization that would end between April 1 and October 1 are extended to "
                "October 1.",
        official=True,
    ),
    Source(
        title="8 CFR 214.2(f): post-completion OPT filing rules",
        url="https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.2",
        snippet="USCIS must receive the post-completion OPT Form I-765 no earlier than 90 days before "
                "and no later than 60 days after the program end date, and within 30 days of the DSO "
                "entering the OPT recommendation in SEVIS. A job offer is not required to apply.",
        official=True,
    ),
]

# Shown to the student as the "Policy watch" panel. Status is the legal status as of CHECKED.
POLICY_WATCH = [
    PolicyItem(
        title="H-1B lottery weighted by wage level",
        status="in effect",
        date="Final rule Dec 29, 2025; used from the March 2026 season",
        summary="Higher-paid offers get more lottery entries (level IV: 4, level I: 1). An "
                "entry-level offer still has a chance, but a higher wage level improves your odds.",
        source_url="https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b",
    ),
    PolicyItem(
        title="$100,000 fee on new H-1B petitions (presidential proclamation)",
        status="struck down",
        date="Vacated by a federal court, June 2026",
        summary="The September 2025 proclamation's $100,000 payment is no longer being collected "
                "after a court ruling. A separate proposed fee (below) would replace it if finalized.",
        source_url="https://ifp.org/explaining-the-proposed-103k-fee-on-h-1bs/",
    ),
    PolicyItem(
        title="Proposed $103,265 fee on cap-subject H-1B petitions",
        status="proposed",
        date="Proposed Aug 25, 2026; comments closed Sept 24, 2026",
        summary="Would apply to cap-subject H-1B petitions, including a change of status from F-1. "
                "Not in effect. The employer would pay it, which could make some employers less "
                "willing to sponsor.",
        source_url="https://www.federalregister.gov/documents/2026/08/25/2026-17324/fee-for-certain-h-1b-petitions",
    ),
    PolicyItem(
        title="Proposed OPT and STEM OPT fees on schools",
        status="proposed",
        date="Proposed Oct 8, 2026; comments open until about Dec 7, 2026",
        summary="Would charge schools a fee for each OPT and STEM OPT recommendation, which schools "
                "may pass on to students. Not in effect. Filing for OPT under today's rules is not "
                "affected.",
        source_url="https://www.federalregister.gov/documents/2026/10/08/2026-20660/optional-practical-training-fees",
    ),
    PolicyItem(
        title="Fixed admission period instead of duration of status",
        status="blocked by court",
        date="Final rule July 17, 2026; postponed by a court on Sept 14, 2026",
        summary="Would give F-1 students a fixed end date and a 30-day grace period instead of 60. "
                "A court postponed it, so today's rules (duration of status, 60-day grace period) "
                "still apply.",
        source_url="https://internationalcenter.umich.edu/about/news/district-court-postpones-implementation-dhs-final-rule-eliminating-duration-status-f-and",
    ),
]

NEWS_QUERY = "F-1 international students OPT H-1B rule change USCIS DHS"
