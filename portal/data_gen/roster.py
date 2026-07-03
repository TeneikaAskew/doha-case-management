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


def build_roster_cases(precedent_fn) -> list[dict]:
    cases = []
    for row in ROSTER:
        (n, name, position, tier, stage, status, elig, risk, codes, days, cv, n_alerts) = row
        subj = dict(
            id=f"SUBJ-{n:03d}", name=name, position=position, tier=tier, stage=stage,
            status=status, eligibility=elig, riskScore=risk,
            fastTrack=(risk < 15 and stage in ("INITIATION", "INVESTIGATION")),
            flaggedGuidelines=codes, daysInStage=days, cvEnrolled=cv, openAlerts=n_alerts,
            ssnMasked=f"***-**-{1000 + n * 37}", dob=f"19{80 + (n % 15)}-0{1 + n % 9}-1{n % 9}",
            address=f"{100 + n} Demo Street, Arlington, VA 2220{n % 10}",
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
