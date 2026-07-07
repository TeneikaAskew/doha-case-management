"""Procedural roster of 12 lighter subjects around the 3 hero cases."""
from datetime import date, timedelta

import documents as docs
from hero_cases import TODAY  # fixed reference date, re-exported for the generator

# id-suffix, name, position, tier, stage, status, eligibility, risk, guidelines, days, cv, alerts
ROSTER = [
    (4,  "Alicia M. Grant",   "Software Developer",     "T5", "INITIATION",         "CLEAR",           "NONE",       5,  [],    3,  False, 0),
    (5,  "Tomas E. Herrera",  "Facilities Technician",  "T1", "INITIATION",         "CLEAR",           "NONE",       4,  [],    7,  False, 0),
    (6,  "Renee L. Calloway", "Program Analyst",        "T3", "INVESTIGATION",      "NEEDS_REVIEW",    "INTERIM",   45,  ["E"], 33, False, 0),
    (7,  "Victor A. Osei",    "Network Administrator",  "T5", "INVESTIGATION",      "NEEDS_REVIEW",    "INTERIM",   52,  ["M"], 58, False, 0),
    (8,  "Hannah J. Whitmore","Contracts Specialist",   "T2", "INVESTIGATION",      "CLEAR",           "NONE",      11,  [],   19, False, 0),
    (9,  "Derek S. Nakamura", "Intelligence Analyst",   "T5", "ADJUDICATION",       "NEEDS_REVIEW",    "INTERIM",   58,  ["H"], 27, False, 0),
    (10, "Fatima R. Aziz",    "Linguist",               "T5", "ADJUDICATION",       "CLEAR",           "INTERIM",   14,  [],   12, False, 0),
    (11, "Gregory P. Stone",  "Security Escort",        "T1", "ADJUDICATION",       "CLEAR",           "NONE",       6,  [],    8,  False, 0),
    (12, "Monica V. Reyes",   "Supply Chain Manager",   "T3", "CONTINUOUS_VETTING", "CLEAR",           "SECRET",    10,  [],  340,  True, 0),
    (13, "Samuel K. Boateng", "Systems Administrator",  "T5", "CONTINUOUS_VETTING", "NEEDS_REVIEW",    "TOP_SECRET",49,  ["K"],120,  True, 1),
    (14, "Laura D. Ferris",   "Budget Analyst",         "T3", "CONTINUOUS_VETTING", "CLEAR",           "SECRET",     9,  [],  510,  True, 0),
    (15, "Ethan C. Marsh",    "Test Engineer",          "T3", "CONTINUOUS_VETTING", "ACTION_REQUIRED", "SECRET",    71,  ["F"], 21,  True, 1),
]

GENDERS = ["Female", "Male"]
RACES = ["White", "Black or African American", "Asian", "Hispanic or Latino"]
EYES = ["Brown", "Blue", "Green", "Hazel"]
HAIR = ["Brown", "Black", "Blond", "Gray"]
MARITAL = ["Single", "Married", "Divorced"]
BIRTHPLACES = ["Richmond, VA", "Baltimore, MD", "Columbus, OH", "San Antonio, TX",
               "Tacoma, WA", "Dayton, OH"]
HEIGHTS = ["5' 4\"", "5' 6\"", "5' 7\"", "5' 9\"", "5' 10\"", "6' 0\"",
           "6' 1\"", "5' 5\""]
STREETS = ["Cedarfield Ln", "Halstead Ct", "Mill Race Dr", "Bright Leaf Way",
           "Stonebridge Ter", "Foxhall Pl", "Larkspur Ct", "Weatherby Rd",
           "Glen Forest Dr", "Saddlebrook Ln", "Copper Creek Ct", "Waverly Row"]
CITIES = [("Arlington, VA", "22204"), ("Alexandria, VA", "22310"),
          ("Springfield, VA", "22153"), ("Fairfax, VA", "22031"),
          ("Woodbridge, VA", "22192"), ("Silver Spring, MD", "20902")]
# (employer, full street address) - current and prior, cycled per subject
CURRENT_EMPLOYERS = [
    ("Vantage Federal Group", "1550 Crystal Dr Suite 700, Arlington, VA 22202"),
    ("Meridian National Services", "8280 Greensboro Dr Suite 550, McLean, VA 22102"),
    ("Clearwater Mission Systems", "5875 Trinity Pkwy Suite 300, Centreville, VA 20120"),
    ("Summit Bridge Partners", "12015 Lee Jackson Memorial Hwy, Fairfax, VA 22033"),
]
PRIOR_EMPLOYERS = [
    ("Ardent Federal Systems", "2101 Wilson Blvd Suite 900, Arlington, VA 22201"),
    ("Blue Ridge Integration", "110 Thomas Johnson Dr, Frederick, MD 21702"),
    ("Capital Meridian Group", "7918 Jones Branch Dr Suite 400, McLean, VA 22102"),
    ("Dominion Applied Research", "2214 Rock Hill Rd Suite 600, Herndon, VA 20170"),
    ("Irongate Technologies", "13873 Park Center Rd Suite 120, Herndon, VA 20171"),
    ("Chesapeake Mission Services", "1420 Spring Hill Rd Suite 210, McLean, VA 22102"),
]

# Hand-authored executive summaries, keyed by subject number. Every case gets
# concrete, case-grounded detail (facts, dates, amounts, posture, next step),
# clean cases included.
SUMMARIES = {
    4: "Clean T5 initial vetting for a software developer, initiated this week "
       "via NBIS eApp. SF-86 validated with no discrepancies, fingerprints "
       "enrolled, and automated checks (NCIC, tri-bureau credit, DMV) returned "
       "clear. Risk score 5 makes this a fast-track candidate for favorable "
       "eAdjudication once tier coverage completes.",
    5: "T1 case for a facilities technician, one week into initiation. "
       "Automated checks returned clear: no criminal record, all accounts "
       "current, valid driver license. No foreign contacts or travel reported. "
       "Routine processing toward a T1 suitability determination.",
    6: "Employment verification surfaced a job application that omitted a 2022 "
       "termination for cause (Guideline E); every other source returned "
       "clear. The AG ¶ 16(a) candor concern turns on intent, which is "
       "unresolved. Fieldwork continues under an interim determination; "
       "recommend LOI for the subject's account before adjudicative action.",
    7: "UAM audit logs recorded an unauthorized USB device on a standalone lab "
       "system (Guideline M); no exfiltration identified. Remaining T5 "
       "coverage is clear to date, with fieldwork and the subject interview "
       "outstanding. Interim access continues; recommend LOI so the subject "
       "can address intent and policy awareness.",
    8: "Clean T2 case in week three of investigation. Automated record checks "
       "complete with no adverse information and no SF-86 discrepancies; tier "
       "fieldwork in progress. On pace for favorable eAdjudication at "
       "coverage completion.",
    9: "Single developed issue: self-reported marijuana use on four occasions, "
       "most recent in 2024 before sponsorship (Guideline H). Disclosure and "
       "abstinence weigh toward mitigation, but recency keeps AG ¶ 26(a) "
       "partial. ROI is complete and otherwise clear; recommend LOI for a "
       "signed statement of intent before decision.",
    10: "Clean T5 ROI awaiting adjudication: coverage certified, automated "
        "checks and the SEAD-5 social media review returned no adverse "
        "information, no SF-86 discrepancies. Interim eligibility in place; "
        "favorable final determination recommended.",
    11: "Clean T1 determination ready for decision: criminal, credit, and "
        "driver checks all clear and coverage certified. Risk score 6; "
        "favorable adjudication recommended as routine.",
    12: "CV-enrolled Secret holder, 11 months in monitoring. Four low-severity "
        "alerts in that span: high credit utilization and reported vacation "
        "travel both adjudicated no-action, an unattended badge incident "
        "validated and documented, and a cured delinquency pending routine "
        "closure. Nothing met an investigative threshold; eligibility "
        "unaffected.",
    13: "Top Secret holder with one security infraction: a classified document "
        "left unsecured in 2025, resurfaced as a suitability alert on "
        "2026-06-18 (Guideline K). A 2025 SAR and a tradeline dispute were "
        "previously adjudicated no-action; an eligibility pattern review is "
        "open. AG ¶ 34(g) applies with 35(a) partial; recommend LOI for the "
        "subject's account before any eligibility action.",
    14: "CV-enrolled Secret holder with 17 months of monitoring history. Four "
        "suitability and credit alerts (HOA judgment, lapsed certification, an "
        "unlawful detainer filing, and a hard-inquiry cluster) were each "
        "validated or adjudicated without eligibility action. Profile remains "
        "clear; continue standard monitoring.",
    15: "CV credit monitoring reported two delinquent accounts totaling $9,800 "
        "on 2026-06-18: first delinquent 2026-02, no payment activity since "
        "2026-03 (Guideline F). Prior currency-transaction reports and a "
        "dismissed charge were adjudicated no-action. AG ¶ 19(a) applies with "
        "20(b) partial; recommend LOI for a subject response and documented "
        "repayment plan before eligibility action.",
}

GUIDELINE_TEMPLATES = {
    "E": dict(name="Personal Conduct", severity="B", provider="Employment records",
              evidence="Employment application omitted a 2022 termination for cause",
              dq=("AG ¶ 16(a)", "Deliberate omission of relevant facts from any personnel "
                  "security questionnaire"),
              mit=("AG ¶ 17(c)", "The offense is so minor or infrequent", "PARTIAL"),
              reasoning="The 2022 termination for cause was omitted from the "
                        "employment application and surfaced through employer "
                        "records on 2026-05-15. AG ¶ 16(a) applies to the "
                        "omission; ¶ 17(c) is at best partial because the "
                        "underlying conduct is minor but the omission is recent "
                        "and unexplained. The subject interview should establish "
                        "intent before adjudicative weight is assigned."),
    "M": dict(name="Use of Information Technology", severity="B", provider="UAM audit logs",
              evidence="Unauthorized USB device connected to a standalone lab system",
              dq=("AG ¶ 40(c)", "Use of any information technology system to gain unauthorized "
                  "access"),
              mit=("AG ¶ 41(a)", "So much time has elapsed / unusual circumstances", "PARTIAL"),
              reasoning="UAM audit logs place an unauthorized USB device on a "
                        "standalone lab system; AG ¶ 40(c) applies. No "
                        "exfiltration was identified and the system is isolated, "
                        "which leaves ¶ 41(a) partially available. Whether this "
                        "was a misunderstanding of policy or deliberate "
                        "circumvention should be resolved in the subject "
                        "interview."),
    "H": dict(name="Drug Involvement and Substance Misuse", severity="B",
              provider="SF-86 self-report",
              evidence="Self-reported marijuana use x4, most recent 2024, prior to sponsorship",
              dq=("AG ¶ 25(a)", "Any substance misuse"),
              mit=("AG ¶ 26(a)", "Behavior happened so long ago / unlikely to recur", "PARTIAL"),
              reasoning="Self-reported marijuana use on four occasions, most "
                        "recent in 2024 and prior to sponsorship, establishes "
                        "AG ¶ 25(a). Voluntary disclosure and abstinence since "
                        "weigh toward ¶ 26(a), but recency keeps the mitigator "
                        "partial. A signed statement of intent with automatic "
                        "revocation consent would strengthen mitigation."),
    "K": dict(name="Handling Protected Information", severity="B",
              provider="Security incident reports",
              evidence="One security infraction: classified document left unsecured (2025)",
              dq=("AG ¶ 34(g)", "Any failure to comply with rules for the protection of "
                  "classified information"),
              mit=("AG ¶ 35(a)", "So much time has elapsed / infrequent", "PARTIAL"),
              reasoning="A classified document left unsecured in 2025 is "
                        "documented in the security incident report; AG ¶ 34(g) "
                        "applies. A single infraction with no compromise "
                        "determined weighs toward ¶ 35(a), assessed partial "
                        "pending the subject's account and any pattern evidence "
                        "from the open 2026 eligibility review."),
    "F": dict(name="Financial Considerations", severity="B", provider="TransUnion",
              evidence="Two delinquent accounts totaling $9,800",
              dq=("AG ¶ 19(a)", "Inability to satisfy debts"),
              mit=("AG ¶ 20(b)", "Conditions largely beyond the person's control", "PARTIAL"),
              reasoning="Two delinquent accounts totaling $9,800, first "
                        "delinquent 2026-02 with no payment activity since "
                        "2026-03, establish AG ¶ 19(a). Mitigation ¶ 20(b) is "
                        "partial: no triggering hardship is documented and there "
                        "is no evidence yet of responsible action. A documented "
                        "repayment plan would shift the assessment."),
}


def _guideline_card(code: str, precedent_fn) -> dict:
    t = GUIDELINE_TEMPLATES[code]
    return dict(
        code=code, name=t["name"], severity=t["severity"],
        aiReasoning=t["reasoning"],
        evidence=[dict(provider=t["provider"], type="Record check",
                       description=t["evidence"], date="2026-05-15")],
        disqualifiers=[dict(code=t["dq"][0], description=t["dq"][1], evidence=t["evidence"])],
        mitigators=[dict(code=t["mit"][0], description=t["mit"][1],
                         applicability=t["mit"][2],
                         reasoning="Assessed from record evidence; subject response pending.")],
        precedents=precedent_fn(code),
    )


def _identity_identifiers(idx: int, subj: dict) -> list[dict]:
    """Six-identifier scorecard with deterministic, realistic record variants:
    provider records carry uppercase names, unformatted phones, stale or
    ZIP+4 addresses, and rarely a matching email."""
    first, last = subj["name"].split()[0], subj["name"].split()[-1]
    phone_digits = "".join(ch for ch in subj["phone"] if ch.isdigit())
    stale_address = idx % 4 == 0  # every 4th subject: bureau file has old address
    if stale_address:
        record_addr = subj["addressHistory"][1]["address"].upper()
        addr_score, addr_match = 0.57, False
    else:
        record_addr = f"{subj['address'].upper()}-{1000 + (idx * 7) % 9000:04d}"
        addr_score, addr_match = round(0.9 + (idx % 5) * 0.015, 2), True
    return [
        dict(field="Name", subjectValue=subj["name"],
             recordValue=subj["name"].upper(), match=True,
             score=round(0.95 + (idx % 4) * 0.01, 2)),
        dict(field="DOB", subjectValue=subj["dob"], recordValue=subj["dob"],
             match=True, score=1.0),
        dict(field="SSN", subjectValue=subj["ssn"], recordValue=subj["ssn"],
             match=True, score=1.0),
        dict(field="Phone", subjectValue=subj["phone"],
             recordValue=f"{phone_digits[:3]}-{phone_digits[3:6]}-{phone_digits[6:]}",
             match=True, score=0.98),
        dict(field="Email", subjectValue=subj["email"],
             recordValue=f"{first[0].lower()}{last.lower()}{idx % 90:02d}"
                         "@mailhost.example",
             match=False, score=round(0.25 + (idx % 4) * 0.04, 2)),
        dict(field="Address", subjectValue=subj["address"],
             recordValue=record_addr, match=addr_match, score=addr_score),
    ]


def _roster_alert(idx: int, subj: dict, code: str) -> dict:
    category = "FINANCIAL" if code == "F" else "SUITABILITY"
    provider = {"F": "TransUnion", "K": "DISS / prior adjudications"}.get(code, "LexisNexis")
    return dict(
        id=f"ALERT-{300 + idx}", subjectId=subj["id"], subjectName=subj["name"],
        category=category, severity="MODERATE", priorityScore=55 + idx, state="NEW",
        receivedDate="2026-06-18",
        provider=provider,
        description=GUIDELINE_TEMPLATES[code]["evidence"] + ".",
        identityMatch=dict(confidence=0.93,
                           identifiers=_identity_identifiers(idx, subj)),
        threshold=dict(rule="Category threshold met", met=True,
                       detail="Meets CV investigative-standard threshold."),
        priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
        history=[dict(state="NEW", date="2026-06-18", actor="System",
                      note=f"Alert received via {provider} feed")],
    )


def _whole_person(clean: bool, code, alert_id, doc_ref) -> list[dict]:
    """Nine canonical factors; single-issue rosters attach their alert/doc evidence."""
    issue = None if clean else GUIDELINE_TEMPLATES[code]["evidence"]
    rows = []
    for i, factor in enumerate(docs.WHOLE_PERSON_FACTORS):
        if clean:
            rows.append(dict(
                factor=factor, evidence=[],
                aiRating="FAVORABLE" if i == 0 else "NEUTRAL",
                assessment=("No adverse information across all checked sources."
                            if i == 0 else
                            "Not applicable - no adverse information developed.")))
            continue
        evidence = []
        if i == 0:
            if alert_id:
                evidence.append(dict(type="ALERT", ref=alert_id, label="CV alert"))
            if doc_ref:
                evidence.append(dict(type="DOCUMENT", ref=doc_ref[0], label=doc_ref[1]))
        rows.append(dict(
            factor=factor, evidence=evidence,
            aiRating="CONCERN" if i == 0 else "NEUTRAL",
            assessment=(f"Single developed issue: {issue}." if i == 0 else
                        "Single-issue case; no additional adverse factors developed.")))
    return rows


ROI_ITEM_BY_CODE = {"F": "Financial", "E": "Employment", "H": "Criminal",
                    "K": "General", "M": "General"}


def _roi_entries(clean: bool, code, stage: str) -> list[dict]:
    """Standard ROI coverage entries mirroring the record-check results."""
    entries = [dict(
        date="2026-05-15", investigator="M. Delgado", item="General",
        text="Automated record checks complete - NCIC criminal history, "
             "tri-bureau credit, and DMV. "
             + ("No adverse information developed; all sources returned clear."
                if clean else
                "One item of adverse information developed; see coverage entry "
                "below."))]
    if not clean:
        t = GUIDELINE_TEMPLATES[code]
        entries.append(dict(
            date="2026-05-28", investigator="M. Delgado",
            item=ROI_ITEM_BY_CODE.get(code, "General"),
            text=f"{t['evidence']}; corroborated by {t['provider']} records. "
                 "Documentation placed in file; subject response to be obtained "
                 "before adjudicative action."))
    entries.append(dict(
        date="2026-06-01", investigator="M. Delgado", item="General",
        text=("Tier-scoped fieldwork complete; no additional issues developed. "
              "Coverage certified for adjudication."
              if stage != "INVESTIGATION" else
              "Tier-scoped fieldwork in progress; interviews and local records "
              "outstanding. No additional issues developed to date.")))
    return entries


def _whole_person_summary(clean: bool, code) -> str:
    if clean:
        return ("No adverse information developed across the nine whole-person "
                "factors; routine processing.")
    name = GUIDELINE_TEMPLATES[code]["name"]
    return (f"Single developed issue under Guideline {code} ({name}). The remaining "
            "whole-person factors show no additional adverse information; assess "
            "the flagged conduct on its own weight.")


def _profile(n: int, name: str, position: str) -> dict:
    """Deterministic, fully-populated biographic profile for roster subject n.

    Fictional-but-safe identifiers: 900-series SSNs (never issued by SSA),
    555-01xx phone numbers (reserved for fiction), example-domain emails.
    """
    first, last = name.split()[0], name.split()[-1]
    city, zip_ = CITIES[n % len(CITIES)]
    prior_city, prior_zip = CITIES[(n + 2) % len(CITIES)]
    address = f"{100 + n * 31 % 800} {STREETS[n % len(STREETS)]}, {city} {zip_}"
    prior_address = (f"{300 + n * 17 % 600} {STREETS[(n + 5) % len(STREETS)]} "
                     f"Apt {2 + n % 9}, {prior_city} {prior_zip}")
    moved = f"20{16 + n % 7}-0{1 + n % 9}-{10 + (n * 3) % 18}"
    prior_from = f"20{9 + n % 6:02d}-0{1 + (n + 4) % 9}-{10 + (n * 5) % 18}"
    hired = f"20{14 + n % 8}-0{1 + (n + 2) % 9}-{10 + (n * 7) % 18}"
    cur_employer, cur_emp_addr = CURRENT_EMPLOYERS[n % len(CURRENT_EMPLOYERS)]
    prior_employer, prior_emp_addr = PRIOR_EMPLOYERS[n % len(PRIOR_EMPLOYERS)]
    return dict(
        ssn=f"9{20 + n:02d}-{10 + (n * 7) % 80:02d}-{1000 + n * 37:04d}",
        dob=f"19{80 + (n % 15)}-0{1 + n % 9}-1{n % 9}",
        placeOfBirth=BIRTHPLACES[n % len(BIRTHPLACES)],
        citizenship="United States (by birth)", nationality="American",
        gender=GENDERS[n % 2], race=RACES[n % 4],
        height=HEIGHTS[n % len(HEIGHTS)], weight=f"{140 + n * 5} lb",
        eyeColor=EYES[n % 4], hairColor=HAIR[n % 4],
        maritalStatus=MARITAL[n % 3],
        phone=f"(703) 555-01{n:02d}",
        email=f"{first.lower()}.{last.lower()}@contractor.example",
        address=address,
        addressHistory=[
            dict(address=address, fromDate=moved, toDate=None),
            dict(address=prior_address, fromDate=prior_from, toDate=moved),
        ],
        employmentHistory=[
            dict(employer=cur_employer, title=position, address=cur_emp_addr,
                 fromDate=hired, toDate=None),
            dict(employer=prior_employer, title=f"Associate {position}",
                 address=prior_emp_addr, fromDate=prior_from, toDate=hired),
        ],
    )


ALERT_EVENT_LABELS = {
    "CRIMINAL": "Criminal", "FINANCIAL": "Financial", "CREDIT": "Credit",
    "FOREIGN_TRAVEL": "Foreign travel", "TERRORISM": "Terrorism",
    "ELIGIBILITY": "Eligibility", "SUITABILITY": "Suitability",
}
GRANT_LABELS = {"SECRET": "Secret", "TOP_SECRET": "Top Secret", "INTERIM": "Interim"}


def _timeline(stage: str, elig: str, days: int, alerts: list[dict]) -> list[dict]:
    """Standard lifecycle timeline: concise source-free titles, dates derived
    from daysInStage, one '<Category> alert received' event per alert."""
    today = date.fromisoformat(TODAY)
    stage_start = today - timedelta(days=days)
    iso = date.isoformat
    initiated = dict(actor="K. Rivas", role="FSO", event="Case initiated",
                     note="SF-86 submitted via NBIS eApp")
    rows = []
    if stage == "INITIATION":
        rows = [dict(date=iso(stage_start), **initiated)]
    elif stage == "INVESTIGATION":
        rows = [
            dict(date=iso(stage_start - timedelta(days=14)), **initiated),
            dict(date=iso(stage_start), actor="System", role="System",
                 event="Investigation opened", note=None),
            dict(date=iso(stage_start + timedelta(days=13)), actor="System",
                 role="System", event="Record checks completed", note=None),
        ]
    elif stage == "ADJUDICATION":
        rows = [
            dict(date=iso(stage_start - timedelta(days=90)), **initiated),
            dict(date=iso(stage_start - timedelta(days=76)), actor="System",
                 role="System", event="Investigation opened", note=None),
            dict(date=iso(stage_start - timedelta(days=60)), actor="System",
                 role="System", event="Record checks completed", note=None),
            dict(date=iso(stage_start), actor="D. Foley", role="Investigator",
                 event="ROI transmitted", note=None),
        ]
    else:  # CONTINUOUS_VETTING - adjudicated in the past, then enrolled
        adjudicated = stage_start - timedelta(days=7)
        rows = [
            dict(date=iso(adjudicated - timedelta(days=150)), **initiated),
            dict(date=iso(adjudicated - timedelta(days=30)), actor="D. Foley",
                 role="Investigator", event="ROI transmitted", note=None),
            dict(date=iso(adjudicated), actor="Adjudicator L. Ortiz",
                 role="Adjudicator",
                 event=f"Favorable adjudication - {GRANT_LABELS[elig]} granted",
                 note=None),
            dict(date=iso(stage_start), actor="System", role="CV",
                 event="Enrolled in CV", note=None),
        ]
    for a in alerts:
        rows.append(dict(
            date=a["receivedDate"], actor="System", role="CV",
            event=f"{ALERT_EVENT_LABELS[a['category']]} alert received",
            note=a["description"].rstrip(".")))
    return rows


def _record_checks(n: int, tier: str, stage: str, codes: list, doc_ref) -> list[dict]:
    """Category-first record checks: one entry per category, source in context."""
    clean = not codes
    issue = None if clean else GUIDELINE_TEMPLATES[codes[0]]["evidence"]
    financial_issue = codes and codes[0] == "F"
    checks = [
        dict(item="Criminal history check", category="CRIMINAL", status="COMPLETE",
             provider="FBI CJIS / NCIC + Rap Back",
             requestedDate="2026-05-02", completedDate="2026-05-15",
             scope="NGI fingerprint submission, NCIC query, DMV",
             resultSummary="No criminal record.", documentUrl=None),
        dict(item="Credit check", category="FINANCIAL", status="COMPLETE",
             provider=["TransUnion", "Equifax", "Experian"][n % 3],
             requestedDate="2026-05-02", completedDate="2026-05-15",
             scope="Tri-bureau credit pull",
             resultSummary=(issue + "." if financial_issue else
                            "All accounts current; no derogatory tradelines."),
             documentUrl=(doc_ref[0] if financial_issue and doc_ref else None)),
        dict(item="Tier-required fieldwork", category="FIELDWORK",
             status="COMPLETE" if stage != "INVESTIGATION" else "PENDING",
             provider="DCSA field operations",
             requestedDate="2026-05-02",
             completedDate="2026-06-01" if stage != "INVESTIGATION" else None,
             scope="Tier-scoped interviews and local records",
             resultSummary=("Fieldwork complete." if stage != "INVESTIGATION"
                            else "Fieldwork in progress."),
             documentUrl=None),
    ]
    checks.append(dict(
        item="Driver record check", category="CRIMINAL", status="COMPLETE",
        provider="DMV records",
        requestedDate="2026-05-02", completedDate="2026-05-15",
        scope="State driver history and license status",
        resultSummary="Valid license; no violations on record.",
        documentUrl=None))
    if stage != "INITIATION":
        checks.append(dict(
            item="Tax compliance check", category="FINANCIAL", status="COMPLETE",
            provider="IRS / tax records",
            requestedDate="2026-05-02", completedDate="2026-05-20",
            scope="Federal return filing status and lien search",
            resultSummary="Returns filed; no liens or levies.",
            documentUrl=None))
    if tier == "T5":
        checks.append(dict(
            item="Social media review (PAEI)", category="SECURITY",
            status="COMPLETE", provider="SEAD-5 Social media (PAEI)",
            requestedDate="2026-05-02", completedDate="2026-05-25",
            scope="Publicly available electronic information sweep",
            resultSummary="No publicly available adverse information.",
            documentUrl=None))
    if codes and not financial_issue:
        checks.append(dict(
            item="Security & conduct records", category="SECURITY",
            status="COMPLETE", provider="DISS / prior adjudications",
            requestedDate="2026-05-02", completedDate="2026-06-18",
            scope="Security incident history, prior adjudications, "
                  "conduct records",
            resultSummary=issue + ".",
            documentUrl=(doc_ref[0] if doc_ref else None)))
    return checks


def build_roster_cases(precedent_fn) -> list[dict]:
    cases = []
    for row in ROSTER:
        (n, name, position, tier, stage, status, elig, risk, codes, days, cv, n_alerts) = row
        subj = dict(
            id=f"SUBJ-{n:03d}", name=name, position=position, tier=tier, stage=stage,
            status=status, eligibility=elig, riskScore=risk,
            fastTrack=(risk < 15 and stage in ("INITIATION", "INVESTIGATION")),
            flaggedGuidelines=codes, daysInStage=days, cvEnrolled=cv, openAlerts=n_alerts,
            **_profile(n, name, position),
        )
        alerts = [_roster_alert(n, subj, codes[0])] if n_alerts else []
        clean = not codes

        source_documents = {}
        doc_ref = None
        if n_alerts and codes[0] == "F":
            url, doc = docs.credit_extract(
                subj["id"], "credit-extract-20260618", bureau="TransUnion",
                account_name="Two delinquent accounts (summary)",
                account_number="(2 accounts)", account_type="Installment/revolving",
                balance="$9,800", past_due="$9,800", days_past_due="90+",
                date_reported="2026-06-18",
                payment_status="Delinquent - reported via CV credit monitoring",
                history="Two accounts first delinquent 2026-02; no payment activity "
                        "since 2026-03.",
                received="2026-06-18")
            source_documents[url] = doc
            doc_ref = (url, "TransUnion credit-file extract")
        elif n_alerts:
            url, doc = docs.incident_report(
                subj["id"], "incident-report-2025-0142",
                incident_id="SIR-2025-0142", date="2025-12-02",
                facility="Fort Meade annex B-2", category="Security infraction",
                summary=GUIDELINE_TEMPLATES[codes[0]]["evidence"] + ". Reported by "
                        "facility security officer; no compromise determined.",
                received="2026-06-18")
            source_documents[url] = doc
            doc_ref = (url, "Security incident report")
        if alerts and doc_ref:
            alerts[0]["documents"] = [dict(title=doc_ref[1], url=doc_ref[0])]

        sf_url, sf_doc = docs.sf86_excerpt(
            subj["id"], "sf86-section22", form_version="SF-86 (Nov 2016)",
            submitted="2026-04-15", section="Section 22 - Police record",
            question="In the last seven (7) years, have you been arrested by any "
                     "police officer, sheriff, marshal, or any other type of law "
                     "enforcement official?",
            response="No.", received="2026-04-15")
        source_documents[sf_url] = sf_doc

        cases.append(dict(
            subject=subj,
            aiSummary=SUMMARIES[n],
            timeline=_timeline(stage, elig, days, alerts),
            wholePersonSummary=_whole_person_summary(clean,
                                                     codes[0] if codes else None),
            wholePerson=_whole_person(clean, codes[0] if codes else None,
                                      alerts[0]["id"] if alerts else None, doc_ref),
            guidelines=[_guideline_card(c, precedent_fn) for c in codes],
            investigation=dict(
                recordChecks=_record_checks(n, tier, stage, codes, doc_ref),
                sf86Sections=[dict(
                    section="Section 22", title="Police record",
                    subjectReport="No police record", matchedResult="NCIC: no record",
                    discrepancy=False, providers=["FBI CJIS/NCIC"], guideline=None)],
                interviews=[],
                roiEntries=_roi_entries(clean, codes[0] if codes else None,
                                        stage)),
            adjudication=dict(
                recommendation=dict(
                    action="GRANT" if clean else "LOI", aiSuggested=True,
                    rationale="No issues developed." if clean
                              else "Obtain subject response on the developed issue."),
                sorDraft=None, decisions=[]),
            alerts=alerts,
            documents=[dict(title="SF-86 excerpt - Section 22", type="SF-86",
                            description="Police-record response, submitted 2026-04-15",
                            url=sf_url)],
            sourceDocuments=source_documents,
        ))
    return cases
