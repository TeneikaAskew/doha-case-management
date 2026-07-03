"""Procedural roster of 12 lighter subjects around the 3 hero cases."""
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
# (employer, full street address) — current and prior, cycled per subject
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

GUIDELINE_TEMPLATES = {
    "E": dict(name="Personal Conduct", severity="B", provider="Employment records",
              evidence="Employment application omitted a 2022 termination for cause",
              dq=("AG ¶ 16(a)", "Deliberate omission of relevant facts from any personnel "
                  "security questionnaire"),
              mit=("AG ¶ 17(c)", "The offense is so minor or infrequent", "PARTIAL")),
    "M": dict(name="Use of Information Technology", severity="B", provider="UAM audit logs",
              evidence="Unauthorized USB device connected to a standalone lab system",
              dq=("AG ¶ 40(c)", "Use of any information technology system to gain unauthorized "
                  "access"),
              mit=("AG ¶ 41(a)", "So much time has elapsed / unusual circumstances", "PARTIAL")),
    "H": dict(name="Drug Involvement and Substance Misuse", severity="B",
              provider="SF-86 self-report",
              evidence="Self-reported marijuana use x4, most recent 2024, prior to sponsorship",
              dq=("AG ¶ 25(a)", "Any substance misuse"),
              mit=("AG ¶ 26(a)", "Behavior happened so long ago / unlikely to recur", "PARTIAL")),
    "K": dict(name="Handling Protected Information", severity="B",
              provider="Security incident reports",
              evidence="One security infraction: classified document left unsecured (2025)",
              dq=("AG ¶ 34(g)", "Any failure to comply with rules for the protection of "
                  "classified information"),
              mit=("AG ¶ 35(a)", "So much time has elapsed / infrequent", "PARTIAL")),
    "F": dict(name="Financial Considerations", severity="B", provider="TransUnion",
              evidence="Two delinquent accounts totaling $9,800",
              dq=("AG ¶ 19(a)", "Inability to satisfy debts"),
              mit=("AG ¶ 20(b)", "Conditions largely beyond the person's control", "PARTIAL")),
}


def _guideline_card(code: str, precedent_fn) -> dict:
    t = GUIDELINE_TEMPLATES[code]
    return dict(
        code=code, name=t["name"], severity=t["severity"],
        aiReasoning=f"Single developed issue under Guideline {code}: {t['evidence']}. "
                    f"{t['dq'][0]} applies; mitigation {t['mit'][0]} assessed as "
                    f"{t['mit'][2].lower()}.",
        evidence=[dict(provider=t["provider"], type="Record check",
                       description=t["evidence"], date="2026-05-15")],
        disqualifiers=[dict(code=t["dq"][0], description=t["dq"][1], evidence=t["evidence"])],
        mitigators=[dict(code=t["mit"][0], description=t["mit"][1],
                         applicability=t["mit"][2],
                         reasoning="Assessed from record evidence; subject response pending.")],
        precedents=precedent_fn(code),
    )


def _roster_alert(idx: int, subj: dict, code: str) -> dict:
    category = "FINANCIAL" if code == "F" else "SUITABILITY"
    provider = {"F": "TransUnion", "K": "DISS / prior adjudications"}.get(code, "LexisNexis")
    return dict(
        id=f"ALERT-{300 + idx}", subjectId=subj["id"], subjectName=subj["name"],
        category=category, severity="MODERATE", priorityScore=55 + idx, state="NEW",
        receivedDate="2026-06-18",
        provider=provider,
        description=GUIDELINE_TEMPLATES[code]["evidence"] + ".",
        identityMatch=dict(confidence=0.93, identifiers=[
            dict(field="Name", subjectValue=subj["name"],
                 recordValue=subj["name"].upper(), match=True),
            dict(field="DOB", subjectValue=subj["dob"], recordValue=subj["dob"], match=True)]),
        threshold=dict(rule="Category threshold met", met=True,
                       detail="Meets CV investigative-standard threshold."),
        priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
    )


def _whole_person(clean: bool, code, alert_id, doc_ref) -> list[dict]:
    """Nine canonical factors; single-issue rosters attach their alert/doc evidence."""
    issue = None if clean else GUIDELINE_TEMPLATES[code]["evidence"]
    rows = []
    for i, factor in enumerate(docs.WHOLE_PERSON_FACTORS):
        if clean:
            rows.append(dict(
                factor=factor, evidence=[],
                assessment=("No adverse information across all checked sources."
                            if i == 0 else
                            "Not applicable — no adverse information developed.")))
            continue
        evidence = []
        if i == 0:
            if alert_id:
                evidence.append(dict(type="ALERT", ref=alert_id, label="CV alert"))
            if doc_ref:
                evidence.append(dict(type="DOCUMENT", ref=doc_ref[0], label=doc_ref[1]))
        rows.append(dict(
            factor=factor, evidence=evidence,
            assessment=(f"Single developed issue: {issue}." if i == 0 else
                        "Single-issue case; no additional adverse factors developed.")))
    return rows


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
    moved = f"20{16 + n % 7}-0{1 + n % 9}"
    prior_from = f"20{9 + n % 6}-0{1 + (n + 4) % 9}"
    hired = f"20{14 + n % 8}-0{1 + (n + 2) % 9}"
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
                account_masked="(2 accounts)", account_type="Installment/revolving",
                balance="$9,800", past_due="$9,800", days_past_due="90+",
                date_reported="2026-06-18",
                payment_status="Delinquent — reported via CV credit monitoring",
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

        cases.append(dict(
            subject=subj,
            aiSummary=("No adverse information developed; routine processing."
                       if clean else
                       f"One developed issue under Guideline {codes[0]} "
                       f"({GUIDELINE_TEMPLATES[codes[0]]['name']}); otherwise clear."),
            timeline=[dict(date="2026-05-01", actor="K. Rivas", role="FSO",
                           event="Case initiated in NBIS eApp", note=None)],
            wholePerson=_whole_person(clean, codes[0] if codes else None,
                                      alerts[0]["id"] if alerts else None, doc_ref),
            guidelines=[_guideline_card(c, precedent_fn) for c in codes],
            investigation=dict(
                recordChecks=[
                    dict(item="Automated record checks", status="COMPLETE",
                         provider="FBI CJIS / NCIC + Rap Back",
                         requestedDate="2026-05-02", completedDate="2026-05-15",
                         scope="NCIC criminal history, tri-bureau credit, DMV",
                         resultSummary=("No adverse information." if clean else
                                        GUIDELINE_TEMPLATES[codes[0]]["evidence"] + "."),
                         documentUrl=(doc_ref[0] if doc_ref else None)),
                    dict(item="Tier-required fieldwork",
                         status="COMPLETE" if stage != "INVESTIGATION" else "PENDING",
                         provider="DCSA field operations",
                         requestedDate="2026-05-02",
                         completedDate=("2026-06-01"
                                        if stage != "INVESTIGATION" else None),
                         scope="Tier-scoped interviews and local records",
                         resultSummary=("Fieldwork complete."
                                        if stage != "INVESTIGATION"
                                        else "Fieldwork in progress."),
                         documentUrl=None),
                ],
                sf86Sections=[dict(
                    section="Section 22", title="Police record",
                    subjectReport="No police record", matchedResult="NCIC: no record",
                    discrepancy=False, providers=["FBI CJIS/NCIC"], guideline=None)],
                interviews=[], roiEntries=[]),
            adjudication=dict(
                recommendation=dict(
                    action="GRANT" if clean else "LOI", aiSuggested=True,
                    rationale="No issues developed." if clean
                              else "Obtain subject response on the developed issue."),
                sorDraft=None, decisions=[]),
            alerts=alerts,
            documents=[dict(title="SF-86", type="SF-86",
                            description="Questionnaire on file", url=None)],
            sourceDocuments=source_documents,
        ))
    return cases
