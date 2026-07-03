# Subject-Centric Home & Whole-Person Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Subject-population home page at `/`, provider-attributed record checks with drill-down, realistic typed source documents per alert/check, and an interactive 9-factor whole-person worksheet.

**Architecture:** Data-first per the spec (`docs/superpowers/specs/2026-07-03-subject-centric-whole-person-design.md`): extend the pydantic schemas and Python generators in `portal/data_gen/` so all new detail is generated static JSON under `portal/public/data/`; then layer React UI (typed DocumentViewer, SourceChip, record-check drill-down, worksheet, SubjectsHome) on top. No backend; demo interactions persist via `DemoContext` → localStorage.

**Tech Stack:** React 18 + Vite + react-router (HashRouter), plain CSS variables, vitest + @testing-library/react, Playwright e2e, Python 3 + pydantic + pytest for data generation.

## Global Constraints

- Determinism: generators use fixed `TODAY = "2026-07-02"` (from `hero_cases.py`); no randomness, no real dates.
- All identities/data fictional; SSNs masked `***-**-NNNN`.
- Provider attribution: record-check and generated-document `provider` strings that have a linked document MUST exactly match a `providers.json` name; UI alias map handles legacy alert strings (`FBI Rap Back`, `CBP I-94`, `FBI CJIS/NCIC`).
- Dynamic colors only via CSS custom properties; semantic StatusBadge variants only; sentence case copy.
- Plain JS (no TypeScript); 2-space indent; existing lint style (multi-line JSX attribute wrapping as in neighboring files).
- Run vitest from `portal/`: `npx vitest run <file>`; pytest from `portal/data_gen`: `python -m pytest tests -q`; regenerate data: `python generate_demo_data.py` (from `portal/data_gen`).
- Deviations from spec (agreed rationale, keep): (1) document `fields` is an ordered `[{label, value}]` list (render-ready) instead of a dict; (2) two extra docTypes `TRAVEL_RECORD` (CBP I-94 alert) and `INCIDENT_REPORT` (security-infraction alert) so every alert has a story-consistent document; (3) Bell's police-report retrieval is COMPLETE with the report attached (user explicitly wants to open the police report), so the record check, alert documents, and aiSummary text reflect "retrieved"; (4) the Documents tab list itself shows no SourceChip (case `documents` entries carry no provider field) — provenance appears in the opened viewer's header stamp.

**Commit first:** the working tree has an uncommitted provider-card CSS fix in `portal/src/pages/pages.css`. Before Task 1: `git add portal/src/pages/pages.css && git commit -m "fix(portal): consistent provider card sizing"`.

---

### Task 1: Data layer — schemas, typed documents, record checks, 9-factor worksheet

**Files:**
- Modify: `portal/data_gen/schemas.py`
- Create: `portal/data_gen/documents.py`
- Modify: `portal/data_gen/hero_cases.py`
- Modify: `portal/data_gen/roster.py`
- Modify: `portal/data_gen/generate_demo_data.py`
- Modify: `portal/data_gen/tests/test_generator.py`
- Regenerate: `portal/public/data/**` (run generator at end)

**Interfaces:**
- Consumes: existing `schemas.CaseDetail`, `build_hero_cases(precedent_fn)`, `build_roster_cases(precedent_fn)`, `gen.main(out_dir)`.
- Produces (later tasks rely on these exact JSON shapes):
  - `investigation.recordChecks: [{item, status, provider, requestedDate, completedDate|null, scope, resultSummary, documentUrl|null}]` (replaces `investigation.coverage`)
  - alert `documents: [{title, url}]` (replaces alert `documentUrl`)
  - `wholePerson`: exactly 9 factors `{factor, assessment, evidence: [{type: "ALERT"|"RECORD_CHECK"|"DOCUMENT", ref, label}]}` with canonical factor titles from `documents.WHOLE_PERSON_FACTORS`
  - document files at `documents/<SUBJ-ID>/<slug>.json` validating `GeneratedDocument`: `{docType, title, provider, receivedDate, subjectId, fields: [{label, value}], sections: [{heading, body}], transactions: [{date, type, amount}]}`
  - `documents.py` exports: `WHOLE_PERSON_FACTORS`, `doc_url(subject_id, slug)`, builders `police_report`, `credit_extract`, `sar`, `rapback`, `sf86_excerpt`, `travel_record`, `incident_report` — each returns `(url, dict)`.

- [ ] **Step 1: Write failing schema/generator tests**

In `portal/data_gen/tests/test_generator.py`, DELETE `test_every_document_and_alert_points_to_source_document` and ADD:

```python
def _load_case(out_dir, subj_id):
    return schemas.CaseDetail.model_validate(
        json.loads((out_dir / "cases" / f"{subj_id}.json").read_text(encoding="utf-8")))


def _provider_names(out_dir):
    providers = schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8")))
    return {p.name for p in providers.providers}


def test_typed_documents_exist_and_validate(out):
    out_dir, _ = out
    doc_files = sorted((out_dir / "documents").glob("SUBJ-*/*.json"))
    assert doc_files, "expected per-subject generated documents"
    for f in doc_files:
        doc = schemas.GeneratedDocument.model_validate(
            json.loads(f.read_text(encoding="utf-8")))
        assert doc.subjectId == f.parent.name
        assert doc.fields


def test_every_alert_document_and_record_check_resolves(out):
    out_dir, _ = out
    names = _provider_names(out_dir)
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        for a in case.alerts:
            assert a.documents, f"{a.id} has no source documents"
            for d in a.documents:
                assert (out_dir / d.url).is_file(), f"missing {d.url}"
        for rc in case.investigation.recordChecks:
            if rc.documentUrl:
                assert (out_dir / rc.documentUrl).is_file(), f"missing {rc.documentUrl}"
                assert rc.provider in names, f"non-canonical provider {rc.provider}"
            if rc.status == "COMPLETE":
                assert rc.completedDate


def test_whole_person_has_nine_canonical_factors(out):
    out_dir, _ = out
    import documents as docsmod
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        assert [w.factor for w in case.wholePerson] == docsmod.WHOLE_PERSON_FACTORS
        for w in case.wholePerson:
            for ev in w.evidence:
                if ev.type == "DOCUMENT":
                    assert (out_dir / ev.ref).is_file()
                if ev.type == "ALERT":
                    assert ev.ref in {a.id for a in case.alerts}


def test_hero2_police_report_wiring(out):
    out_dir, _ = out
    case = _load_case(out_dir, "SUBJ-002")
    pr = next(rc for rc in case.investigation.recordChecks
              if "Police report" in rc.item)
    assert pr.status == "COMPLETE" and pr.documentUrl
    doc = schemas.GeneratedDocument.model_validate(
        json.loads((out_dir / pr.documentUrl).read_text(encoding="utf-8")))
    assert doc.docType == "POLICE_REPORT"
    alert = next(a for a in case.alerts if a.id == "ALERT-201")
    assert {d.url for d in alert.documents} >= {pr.documentUrl}
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `portal/data_gen`): `python -m pytest tests/test_generator.py -q`
Expected: FAIL — `AttributeError: module 'schemas' has no attribute 'GeneratedDocument'` (and/or validation errors for `recordChecks`).

- [ ] **Step 3: Extend `schemas.py`**

Add after the `CoverageStatus` line:

```python
DocType = Literal["POLICE_REPORT", "CREDIT_REPORT", "SAR", "RAPBACK_NOTIFICATION",
                  "SF86_EXCERPT", "TRAVEL_RECORD", "INCIDENT_REPORT"]
EvidenceType = Literal["ALERT", "RECORD_CHECK", "DOCUMENT"]
```

Replace `WholePersonFactor` and `CoverageItem` with:

```python
class WholePersonEvidence(BaseModel):
    type: EvidenceType
    ref: str      # ALERT: alert id; RECORD_CHECK: recordCheck item; DOCUMENT: document url
    label: str


class WholePersonFactor(BaseModel):
    factor: str
    assessment: str
    evidence: list[WholePersonEvidence] = []


class RecordCheck(BaseModel):
    item: str
    status: CoverageStatus
    provider: str
    requestedDate: str
    completedDate: Optional[str] = None
    scope: str
    resultSummary: str
    documentUrl: Optional[str] = None
```

In `Investigation`, replace `coverage: list[CoverageItem]` with `recordChecks: list[RecordCheck]`.

In `CVAlert`, replace `documentUrl: Optional[str] = None` with `documents: list["AlertDocument"] = []`, and add above `CVAlert`:

```python
class AlertDocument(BaseModel):
    title: str
    url: str
```

Add after `SourceDocument`:

```python
class DocField(BaseModel):
    label: str
    value: str


class DocSection(BaseModel):
    heading: str
    body: str


class DocTransaction(BaseModel):
    date: str
    type: str
    amount: str


class GeneratedDocument(BaseModel):
    docType: DocType
    title: str
    provider: str
    receivedDate: str
    subjectId: str
    fields: list[DocField]
    sections: list[DocSection] = []
    transactions: list[DocTransaction] = []
```

- [ ] **Step 4: Create `portal/data_gen/documents.py`**

```python
"""Typed source-document builders. Deterministic; all identities fictional."""

WHOLE_PERSON_FACTORS = [
    "Nature, extent, and seriousness of the conduct",
    "Circumstances surrounding the conduct",
    "Frequency and recency of the conduct",
    "Individual's age and maturity at the time of the conduct",
    "Extent to which participation is voluntary",
    "Presence or absence of rehabilitation and other permanent behavioral changes",
    "Motivation for the conduct",
    "Potential for pressure, coercion, exploitation, or duress",
    "Likelihood of continuation or recurrence",
]


def doc_url(subject_id: str, slug: str) -> str:
    return f"documents/{subject_id}/{slug}.json"


def _doc(subject_id, slug, doc_type, title, provider, received, fields,
         sections=None, transactions=None):
    return doc_url(subject_id, slug), dict(
        docType=doc_type, title=title, provider=provider, receivedDate=received,
        subjectId=subject_id,
        fields=[dict(label=k, value=v) for k, v in fields],
        sections=[dict(heading=h, body=b) for h, b in (sections or [])],
        transactions=[dict(date=d, type=t, amount=a) for d, t, a in (transactions or [])],
    )


def police_report(subject_id, slug, *, agency, report_number, incident_date,
                  location, charges, officer, booking_number, disposition,
                  narrative, received):
    return _doc(
        subject_id, slug, "POLICE_REPORT",
        f"Arrest report {report_number} — {agency}", "State & local courts", received,
        [("Agency", agency), ("Report number", report_number),
         ("Incident date", incident_date), ("Location", location),
         ("Charges", "; ".join(charges)), ("Arresting officer", officer),
         ("Booking number", booking_number), ("Disposition", disposition)],
        sections=[("Officer narrative", narrative)])


def credit_extract(subject_id, slug, *, bureau, account_name, account_masked,
                   account_type, balance, past_due, days_past_due, date_reported,
                   payment_status, history, received):
    return _doc(
        subject_id, slug, "CREDIT_REPORT",
        f"Credit-file extract — {account_name}", bureau, received,
        [("Bureau", bureau), ("Account", account_name),
         ("Account number", account_masked), ("Account type", account_type),
         ("Balance", balance), ("Past due", past_due),
         ("Days past due", days_past_due), ("Date reported", date_reported),
         ("Payment status", payment_status)],
        sections=[("Account history summary", history)])


def sar(subject_id, slug, *, institution, sar_number, filing_date, period,
        total_amount, narrative, transactions, received):
    return _doc(
        subject_id, slug, "SAR",
        f"Suspicious Activity Report {sar_number}", "FinCEN / Treasury", received,
        [("Filing institution", institution), ("SAR number", sar_number),
         ("Filing date", filing_date), ("Activity period", period),
         ("Total amount", total_amount),
         ("Transaction count", str(len(transactions)))],
        sections=[("Narrative", narrative)], transactions=transactions)


def rapback(subject_id, slug, *, notification_id, trigger_event, arrest_date,
            agency, ori, charges, received):
    return _doc(
        subject_id, slug, "RAPBACK_NOTIFICATION",
        f"Rap Back notification {notification_id}", "FBI CJIS / NCIC + Rap Back",
        received,
        [("Notification ID", notification_id), ("Trigger event", trigger_event),
         ("Arrest date", arrest_date), ("Agency", agency), ("ORI", ori),
         ("Fingerprint match", "Positive (enrolled)"),
         ("Charges", "; ".join(charges))],
        sections=[("Notification detail",
                   "Subscription notification generated by the FBI Next Generation "
                   "Identification (NGI) Rap Back service for an enrolled individual. "
                   "Positive fingerprint identification; no manual review required.")])


def sf86_excerpt(subject_id, slug, *, form_version, submitted, section, question,
                 response, received):
    return _doc(
        subject_id, slug, "SF86_EXCERPT",
        f"SF-86 excerpt — {section}", "DISS / prior adjudications", received,
        [("Form version", form_version), ("Submitted", submitted),
         ("Section", section), ("Question", question)],
        sections=[("Subject response", response)])


def travel_record(subject_id, slug, *, traveler, document_number, carrier,
                  departure, arrival, destination, returned, received):
    return _doc(
        subject_id, slug, "TRAVEL_RECORD",
        f"I-94 border crossing record — {destination}", "CBP I-94 Foreign Travel",
        received,
        [("Traveler", traveler), ("Travel document", document_number),
         ("Carrier", carrier), ("Departure", departure), ("Arrival abroad", arrival),
         ("Destination", destination), ("Return to U.S.", returned)],
        sections=[("Record detail",
                   "Arrival/departure record pair matched by travel-document number. "
                   "No corresponding foreign-travel report on file with the FSO "
                   "(SEAD-3 reporting requirement).")])


def incident_report(subject_id, slug, *, incident_id, date, facility, category,
                    summary, received):
    return _doc(
        subject_id, slug, "INCIDENT_REPORT",
        f"Security incident report {incident_id}", "DISS / prior adjudications",
        received,
        [("Incident ID", incident_id), ("Date", date), ("Facility", facility),
         ("Category", category)],
        sections=[("Incident summary", summary)])
```

- [ ] **Step 5: Rewrite `hero_cases.py` data for the new schema**

Each hero case dict gains a `sourceDocuments` key: `dict(url → document dict)` built with `documents.py` builders. At the top of `hero_cases.py` add `import documents as docs`.

**Hero 1 (Okafor)** — add near the top of `_hero1`, BEFORE the `alerts = [` list (the alert dicts reference these urls):

```python
    cu_url, cu_doc = docs.credit_extract(
        "SUBJ-001", "credit-extract-20260620", bureau="TransUnion",
        account_name="Meridian Auto Finance", account_masked="****3308",
        account_type="Auto loan", balance="$12,400", past_due="$12,400",
        days_past_due="120+", date_reported="2026-06-20",
        payment_status="Charged off / collection",
        history="Opened 2022-08; current through 2024-03; delinquency began during "
                "2024 employment gap and account charged off 2026-05. Placed with "
                "Harborline Recovery LLC 2026-06.",
        received="2026-06-20")
    trv_url, trv_doc = docs.travel_record(
        "SUBJ-001", "travel-record-20260502", traveler="OKAFOR, DANIEL R",
        document_number="5310xxxx", carrier="Lufthansa LH 568",
        departure="2026-04-11 (IAD)", arrival="2026-04-12 (LOS)",
        destination="Nigeria", returned="2026-04-25 (IAD)",
        received="2026-05-02")
    sar_url, sar_doc = docs.sar(
        "SUBJ-001", "sar-20260415", institution="First Commonwealth Bank",
        sar_number="SAR-2026-0415-88231", filing_date="2026-04-15",
        period="2026-01-05 to 2026-03-30", total_amount="$27,500",
        narrative="Nine outbound wire remittances of $2,500-$3,500 to two beneficiary "
                  "accounts in Lagos, Nigeria, inconsistent with stated account "
                  "purpose and salary deposits. Pattern is consistent with structured "
                  "family remittances under financial stress; no sanctioned parties "
                  "identified.",
        transactions=[("2026-01-05", "Wire (outbound)", "$3,000"),
                      ("2026-01-26", "Wire (outbound)", "$2,500"),
                      ("2026-02-09", "Wire (outbound)", "$3,500"),
                      ("2026-02-23", "Wire (outbound)", "$3,000"),
                      ("2026-03-02", "Wire (outbound)", "$3,000"),
                      ("2026-03-09", "Wire (outbound)", "$2,500"),
                      ("2026-03-16", "Wire (outbound)", "$3,500"),
                      ("2026-03-23", "Wire (outbound)", "$3,000"),
                      ("2026-03-30", "Wire (outbound)", "$3,500")],
        received="2026-04-16")
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-001", "sf86-section20a", form_version="SF-86 (Nov 2016)",
        submitted="2025-09-08", section="Section 20A — Financial record",
        question="In the last seven (7) years, have you been over 120 days "
                 "delinquent on any debt?",
        response="Yes. Two accounts, approximately $9,000 total, following a 2024 "
                 "layoff. Repayment intended on re-employment.",
        received="2025-09-08")
```

In hero-1 `return dict(...)`, add `sourceDocuments={cu_url: cu_doc, trv_url: trv_doc, sar_url: sar_doc, sf_url: sf_doc},`.

Wire hero-1 alerts (inline in each alert dict, after `priorAdjudication`): `ALERT-101` gains `documents=[dict(title="TransUnion credit-file extract", url=cu_url)]`; `ALERT-102` gains `documents=[dict(title="CBP I-94 travel record", url=trv_url)]`. (Remove nothing else — `documentUrl` no longer exists anywhere.)

Replace hero-1 `investigation.coverage` with:

```python
            recordChecks=[
                dict(item="Subject interview (ESI)", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-11-19",
                     scope="Enhanced subject interview covering financial, foreign "
                           "contact, and employment issues",
                     resultSummary="Subject acknowledged two delinquent accounts; "
                                   "understated total debt.",
                     documentUrl=None),
                dict(item="Employment coverage (10 yrs)", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-12-04",
                     scope="Employer records and supervisor interviews, 2015-2025",
                     resultSummary="Employment verified; 2024 layoff confirmed.",
                     documentUrl=None),
                dict(item="Neighborhood/reference interviews", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-12-04",
                     scope="Two references, one neighbor (Manassas, VA)",
                     resultSummary="No derogatory information developed.",
                     documentUrl=None),
                dict(item="Financial record checks", status="COMPLETE",
                     provider="TransUnion", requestedDate="2026-03-10",
                     completedDate="2026-03-15",
                     scope="Tri-bureau credit re-check plus civil judgment search",
                     resultSummary="$47,300 delinquent across five accounts; unpaid "
                                   "$3,100 judgment (2025).",
                     documentUrl=cu_url),
                dict(item="FinCEN financial-intelligence check", status="COMPLETE",
                     provider="FinCEN / Treasury", requestedDate="2026-04-10",
                     completedDate="2026-04-16",
                     scope="SAR registry query on subject identifiers",
                     resultSummary="One SAR: structured remittances to Nigeria, "
                                   "Jan-Mar 2026.",
                     documentUrl=sar_url),
                dict(item="Foreign travel records check", status="COMPLETE",
                     provider="CBP I-94 Foreign Travel", requestedDate="2026-05-01",
                     completedDate="2026-05-02",
                     scope="I-94 crossing history, 2021-2026",
                     resultSummary="Unreported Nigeria travel 2026-04-11 to "
                                   "2026-04-25.",
                     documentUrl=trv_url),
                dict(item="Foreign contact expansion leads", status="PENDING",
                     provider="DCSA field operations", requestedDate="2026-02-01",
                     completedDate=None,
                     scope="Expanded lead on sibling's state-owned-enterprise "
                           "employment",
                     resultSummary="Lead open with overseas partner agency.",
                     documentUrl=None),
            ],
```

Replace hero-1 `wholePerson` with the canonical nine (titles from `docs.WHOLE_PERSON_FACTORS`, same order), keeping the existing assessments' substance and adding evidence:

```python
        wholePerson=[
            dict(factor=docs.WHOLE_PERSON_FACTORS[0],
                 assessment="Sustained delinquency plus incomplete disclosure; serious.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-101",
                          label="New collection account alert"),
                     dict(type="DOCUMENT", ref=cu_url,
                          label="TransUnion credit-file extract")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[1],
                 assessment="Six-month unemployment in 2024 contributed to initial "
                            "arrears.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Employment coverage (10 yrs)",
                                label="Employment coverage")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[2],
                 assessment="Ongoing; newest alert June 2026.",
                 evidence=[dict(type="ALERT", ref="ALERT-101",
                                label="New collection account alert")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[3],
                 assessment="Adult throughout (36-38).", evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[4],
                 assessment="Debt partly circumstantial; non-disclosure voluntary.",
                 evidence=[dict(type="DOCUMENT", ref=sf_url,
                                label="SF-86 Section 20A response")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[5],
                 assessment="No payment plan or counseling evidenced to date.",
                 evidence=[dict(type="RECORD_CHECK", ref="Financial record checks",
                                label="Financial record checks")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[6],
                 assessment="No evidence of divided loyalty; financial strain.",
                 evidence=[dict(type="DOCUMENT", ref=sar_url,
                                label="FinCEN SAR (remittances)")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[7],
                 assessment="Elevated: debt plus close foreign family ties and "
                            "unreported travel.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-102",
                          label="Unreported foreign travel alert"),
                     dict(type="DOCUMENT", ref=trv_url, label="I-94 travel record")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[8],
                 assessment="High absent documented repayment behavior.",
                 evidence=[dict(type="RECORD_CHECK", ref="Financial record checks",
                                label="Financial record checks")]),
        ],
```

Update hero-1 `documents` (tab list) to:

```python
        documents=[
            dict(title="Report of Investigation (ROI)", type="ROI",
                 description="T5 ROI transmitted 2026-01-27", url=None),
            dict(title="SF-86 excerpt — Section 20A", type="SF-86",
                 description="Financial-record response, submitted 2025-09-08",
                 url=sf_url),
            dict(title="TransUnion credit-file extract", type="Provider record",
                 description="Charged-off auto loan, reported 2026-06-20", url=cu_url),
            dict(title="FinCEN SAR", type="Provider record",
                 description="Structured remittances Jan-Mar 2026", url=sar_url),
            dict(title="CBP I-94 travel record", type="Provider record",
                 description="Nigeria travel April 2026 (unreported)", url=trv_url),
        ],
```

**Hero 2 (Bell)** — near the top of `_hero2`, BEFORE the `alerts = [` list:

```python
    rb_url, rb_doc = docs.rapback(
        "SUBJ-002", "rapback-20260623", notification_id="NGI-RB-2026-174403",
        trigger_event="Criminal retain — arrest fingerprint submission",
        arrest_date="2026-06-21", agency="Chesapeake Police Department, VA",
        ori="VA0930100", charges=["DUI — 1st offense (VA 18.2-266)",
                                  "BAC 0.15%+ enhancement"],
        received="2026-06-23")
    pr_url, pr_doc = docs.police_report(
        "SUBJ-002", "police-report-26-044812", agency="Chesapeake Police Department",
        report_number="26-044812", incident_date="2026-06-21",
        location="I-64 W near Greenbrier Pkwy, Chesapeake, VA",
        charges=["DUI — 1st offense (VA 18.2-266)", "BAC 0.15%+ enhancement"],
        officer="Ofc. T. Ramirez #4471", booking_number="CB-26-08822",
        disposition="Released on summons; arraignment 2026-07-14",
        narrative="Vehicle observed varying speed 45-70 mph and crossing lane "
                  "markings at 2314 hours. Traffic stop initiated. Driver identified "
                  "as BELL, MARCUS T by VA operator's license. Odor of alcoholic "
                  "beverage, bloodshot eyes; subject cooperative. SFSTs indicated "
                  "impairment. Breath test at station: 0.18% BAC. Subject booked, "
                  "printed, and released on summons to a sober third party.",
        received="2026-06-30")
    cr_url, cr_doc = docs.credit_extract(
        "SUBJ-002", "credit-extract-20251012", bureau="TransUnion",
        account_name="Harbor Home Retail Card", account_masked="****5527",
        account_type="Revolving retail", balance="$800", past_due="$800",
        days_past_due="30", date_reported="2025-10-12",
        payment_status="30 days past due (subsequently paid 2025-11)",
        history="Opened 2021-02; first delinquency 2025-09 after billing-address "
                "change; brought current 2025-11-03 and closed by consumer.",
        received="2025-10-12")
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-002", "sf86-section22", form_version="SF-86 (Nov 2016)",
        submitted="2023-01-15", section="Section 22 — Police record",
        question="In the last seven (7) years, have you been arrested by any police "
                 "officer, sheriff, marshal, or any other type of law enforcement "
                 "official?",
        response="No.",
        received="2023-01-15")
```

Hero-2 `return dict(...)` gains
`sourceDocuments={rb_url: rb_doc, pr_url: pr_doc, cr_url: cr_doc, sf_url: sf_doc},`.

Wire hero-2 alerts: `ALERT-201` gains
`documents=[dict(title="Rap Back notification", url=rb_url), dict(title="Chesapeake PD arrest report", url=pr_url)]`;
`ALERT-202` gains `documents=[dict(title="TransUnion credit-file extract", url=cr_url)]`.

Update hero-2 `aiSummary` (police report now retrieved):

```python
        aiSummary=("CV-enrolled Secret holder with a fingerprint-verified DUI arrest "
                   "on 2026-06-21 (Guideline J/G). Police report retrieved 2026-06-30: "
                   "single incident, BAC 0.18%, disposition pending arraignment "
                   "2026-07-14; prior record clean. Recommend LOI and command "
                   "notification rather than immediate eligibility action."),
```

Replace hero-2 `investigation.coverage` with:

```python
            recordChecks=[
                dict(item="T3 automated record checks (2023)", status="COMPLETE",
                     provider="FBI CJIS / NCIC + Rap Back", requestedDate="2023-02-01",
                     completedDate="2023-03-20",
                     scope="NCIC criminal history, tri-bureau credit, DMV — T3 "
                           "initial investigation",
                     resultSummary="All checks clear at adjudication (2023).",
                     documentUrl=None),
                dict(item="Police report retrieval (2026 arrest)", status="COMPLETE",
                     provider="State & local courts", requestedDate="2026-06-24",
                     completedDate="2026-06-30",
                     scope="Chesapeake PD incident/arrest report 26-044812 for "
                           "2026-06-21 DUI arrest",
                     resultSummary="Report received: BAC 0.18%, first offense, "
                                   "arraignment 2026-07-14.",
                     documentUrl=pr_url),
                dict(item="Court disposition monitoring", status="PENDING",
                     provider="State & local courts", requestedDate="2026-06-30",
                     completedDate=None,
                     scope="Chesapeake General District Court docket watch",
                     resultSummary="Arraignment scheduled 2026-07-14; disposition "
                                   "pending.",
                     documentUrl=None),
            ],
```

Add a timeline entry after the 2026-06-23 event:

```python
            dict(date="2026-06-30", actor="S. Whitfield", role="Investigator",
                 event="Police report retrieved", note="Chesapeake PD report 26-044812"),
```

Replace hero-2 `wholePerson` with nine canonical factors:

```python
        wholePerson=[
            dict(factor=docs.WHOLE_PERSON_FACTORS[0],
                 assessment="Single DUI arrest with elevated BAC (0.18%); serious "
                            "but isolated.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-201", label="Rap Back DUI alert"),
                     dict(type="DOCUMENT", ref=pr_url,
                          label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[1],
                 assessment="Off-duty, single-vehicle stop; no accident or injury.",
                 evidence=[dict(type="DOCUMENT", ref=pr_url,
                                label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[2],
                 assessment="First incident; very recent (2026-06-21).",
                 evidence=[dict(type="DOCUMENT", ref=rb_url,
                                label="Rap Back notification")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[3],
                 assessment="Age 33 at incident; fully accountable adult.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[4],
                 assessment="Conduct voluntary.", evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[5],
                 assessment="Unknown — disposition pending; no treatment enrollment "
                            "evidenced yet.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Court disposition monitoring",
                                label="Court disposition monitoring")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[6],
                 assessment="No indication of underlying pattern; single-night "
                            "lapse per report.",
                 evidence=[dict(type="DOCUMENT", ref=pr_url,
                                label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[7],
                 assessment="Low; incident already self-reported to FSO.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[8],
                 assessment="Indeterminate pending court outcome and any treatment.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Court disposition monitoring",
                                label="Court disposition monitoring")]),
        ],
```

Update hero-2 `documents` to:

```python
        documents=[
            dict(title="Rap Back notification", type="Provider record",
                 description="FBI arrest notification 2026-06-23", url=rb_url),
            dict(title="Chesapeake PD arrest report", type="Provider record",
                 description="Report 26-044812, retrieved 2026-06-30", url=pr_url),
            dict(title="TransUnion credit-file extract", type="Provider record",
                 description="Resolved 2025 retail delinquency", url=cr_url),
            dict(title="SF-86 excerpt — Section 22", type="SF-86",
                 description="Police-record response, submitted 2023-01-15", url=sf_url),
        ],
```

**Hero 3 (Shah)** — before `return dict(...)`:

```python
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-003", "sf86-section20a", form_version="SF-86 (Nov 2016)",
        submitted="2026-06-10", section="Section 20A — Financial record",
        question="In the last seven (7) years, have you been over 120 days "
                 "delinquent on any debt?",
        response="No.",
        received="2026-06-10")
    cr_url, cr_doc = docs.credit_extract(
        "SUBJ-003", "credit-extract-20260614", bureau="Equifax",
        account_name="Summary — all open accounts", account_masked="(8 accounts)",
        account_type="Tri-bureau summary", balance="$14,900", past_due="$0",
        days_past_due="0", date_reported="2026-06-14",
        payment_status="All accounts current; utilization 12%",
        history="Eight open accounts, oldest 2014. No delinquencies, collections, "
                "judgments, or bankruptcies on file at any bureau.",
        received="2026-06-14")
```

Hero-3 gains `sourceDocuments={sf_url: sf_doc, cr_url: cr_doc},`; `investigation.coverage` becomes:

```python
            recordChecks=[
                dict(item="Fingerprint / FBI criminal history", status="COMPLETE",
                     provider="FBI CJIS / NCIC + Rap Back", requestedDate="2026-06-11",
                     completedDate="2026-06-14",
                     scope="NGI fingerprint submission and NCIC query",
                     resultSummary="No record.", documentUrl=None),
                dict(item="Credit check", status="COMPLETE", provider="Equifax",
                     requestedDate="2026-06-11", completedDate="2026-06-14",
                     scope="Tri-bureau pull (Equifax, Experian, TransUnion)",
                     resultSummary="All accounts current; utilization 12%.",
                     documentUrl=cr_url),
                dict(item="Education verification", status="COMPLETE",
                     provider="LexisNexis", requestedDate="2026-06-11",
                     completedDate="2026-06-20",
                     scope="Degree verification, University of Maryland (2018)",
                     resultSummary="B.S. Finance verified.", documentUrl=None),
                dict(item="Employment verification", status="PENDING",
                     provider="LexisNexis", requestedDate="2026-06-11",
                     completedDate=None,
                     scope="Current employer verification (2019-present)",
                     resultSummary="Response pending from employer of record.",
                     documentUrl=None),
                dict(item="Subject interview", status="NOT_REQUIRED",
                     provider="DCSA field operations", requestedDate="2026-06-10",
                     completedDate=None,
                     scope="Not triggered — no issues developed",
                     resultSummary="Not required for clean T3.", documentUrl=None),
            ],
```

Hero-3 `wholePerson` becomes nine canonical factors, each with
`assessment="No adverse information across all checked sources."` for factor 1 and
`assessment="Not applicable — no adverse information developed."` for factors 2-9,
first factor evidence `[dict(type="DOCUMENT", ref=cr_url, label="Equifax tri-bureau summary")]`, others `evidence=[]`.
Hero-3 `documents` becomes:

```python
        documents=[dict(title="SF-86 excerpt — Section 20A", type="SF-86",
                        description="T3 questionnaire excerpt", url=sf_url),
                   dict(title="Equifax tri-bureau summary", type="Provider record",
                        description="Clean credit summary 2026-06-14", url=cr_url)],
```

- [ ] **Step 6: Update `roster.py`**

Add `import documents as docs` at top. In `_roster_alert`, change provider selection to:

```python
    provider = {"F": "TransUnion", "K": "DISS / prior adjudications"}.get(code, "LexisNexis")
```

and use `provider=provider,`. Add alert documents inside `build_roster_cases` (see below).

Replace the `wholePerson=` line in the case dict with a call to a new helper (add above `build_roster_cases`):

```python
def _whole_person(clean: bool, code: str | None, alert_id: str | None,
                  doc_ref: tuple | None) -> list[dict]:
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
```

In `build_roster_cases`, after building `subj` and before `cases.append`, create per-subject documents for alert-bearing subjects:

```python
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
```

(Note: `alerts = [_roster_alert(...)]` is built before this block; move that line above it.)

Replace roster `investigation=dict(coverage=[...]` with:

```python
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
```

and `wholePerson=_whole_person(clean, codes[0] if codes else None, alerts[0]["id"] if alerts else None, doc_ref),` and add `sourceDocuments=source_documents,` to the case dict. Roster `documents` list: keep the SF-86 entry with `url=None`.

- [ ] **Step 7: Update `generate_demo_data.py`**

Replace the doha-stamping block:

```python
    # One real DOHA record, reused for every case document and CV alert source.
    df_full = corpus.load_full_corpus()
    doc = corpus.get_source_document(df_full)
    source_document = schemas.SourceDocument.model_validate(doc)
    DOC_URL = "documents/doha-record.json"
    for c in cases:
        for d in c["documents"]:
            d.update(url=DOC_URL)
        for a in c["alerts"]:
            a.update(documentUrl=DOC_URL)
```

with:

```python
    # One real DOHA record kept for reference; typed per-subject documents
    # are authored in hero_cases/roster and written below.
    df_full = corpus.load_full_corpus()
    doc = corpus.get_source_document(df_full)
    source_document = schemas.SourceDocument.model_validate(doc)

    source_documents = {}
    for c in cases:
        source_documents.update(c.pop("sourceDocuments", {}))
```

After the `dump(source_document...)` line, add:

```python
    for url, d in source_documents.items():
        gd = schemas.GeneratedDocument.model_validate(d)
        path = out_dir / url
        path.parent.mkdir(parents=True, exist_ok=True)
        dump(gd.model_dump(), path)
```

- [ ] **Step 8: Run data_gen tests**

Run (from `portal/data_gen`): `python -m pytest tests -q`
Expected: all pass (including pre-existing corpus/schema tests).

- [ ] **Step 9: Regenerate portal data**

Run (from `portal/data_gen`): `python generate_demo_data.py`
Expected: `Wrote {'subjects': 15, 'cases': 15, 'alerts': N} to ...\portal\public\data`.
Verify: `ls portal/public/data/documents/SUBJ-002/` shows 4 JSON files.

- [ ] **Step 10: Commit**

```bash
git add portal/data_gen portal/public/data
git commit -m "feat(data): typed source documents, provider-attributed record checks, 9-factor whole-person data"
```

---

### Task 2: SourceChip + typed DocumentViewer

**Files:**
- Create: `portal/src/components/SourceChip.jsx`
- Modify: `portal/src/components/DocumentViewer.jsx`
- Modify: `portal/src/components/components.css` (append styles)
- Modify: `portal/src/__tests__/documentViewer.test.jsx`
- Create: `portal/src/__tests__/sourceChip.test.jsx`

**Interfaces:**
- Consumes: `GeneratedDocument` JSON (Task 1), `getProviders()` from `data/api.js`, `KVGrid`, `StatusBadge`, `useData`.
- Produces: `<SourceChip provider="TransUnion" />` (renders provider pill; link to `/providers` when resolvable, `title` = provider category); `<DocumentViewer url="documents/SUBJ-002/police-report-26-044812.json" />` dispatches: `doc.docType` present → typed layout; absent → existing DOHA layout (unchanged).

- [ ] **Step 1: Write failing tests**

`portal/src/__tests__/sourceChip.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve([
    { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)' },
    { id: 'fbi-cjis', name: 'FBI CJIS / NCIC + Rap Back', category: 'Criminal history' },
  ]),
}));

import SourceChip from '../components/SourceChip.jsx';

describe('SourceChip', () => {
  it('links a known provider to the providers page with its category as title', async () => {
    render(<MemoryRouter><SourceChip provider="TransUnion" /></MemoryRouter>);
    const link = await screen.findByRole('link', { name: /TransUnion/ });
    expect(link).toHaveAttribute('href', '#/providers');
    expect(link).toHaveAttribute('title', 'Credit bureau (CV provider)');
  });

  it('resolves aliases like FBI Rap Back to the canonical provider', async () => {
    render(<MemoryRouter><SourceChip provider="FBI Rap Back" /></MemoryRouter>);
    const link = await screen.findByRole('link', { name: /FBI Rap Back/ });
    expect(link).toHaveAttribute('title', 'Criminal history');
  });

  it('renders unknown sources as a plain chip', async () => {
    render(<MemoryRouter><SourceChip provider="DCSA field operations" /></MemoryRouter>);
    expect(await screen.findByText('DCSA field operations')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
```

(Note: HashRouter is not used in tests; `MemoryRouter` renders `<Link to="/providers">` as `href="/providers"` — assert with `expect(link.getAttribute('href')).toContain('/providers')` instead if the exact `#/providers` assertion fails.)

Extend `documentViewer.test.jsx` — mock returns a doc keyed by url:

```jsx
const POLICE_FIXTURE = {
  docType: 'POLICE_REPORT',
  title: 'Arrest report 26-044812 — Chesapeake Police Department',
  provider: 'State & local courts',
  receivedDate: '2026-06-30',
  subjectId: 'SUBJ-002',
  fields: [
    { label: 'Agency', value: 'Chesapeake Police Department' },
    { label: 'Charges', value: 'DUI — 1st offense (VA 18.2-266)' },
  ],
  sections: [{ heading: 'Officer narrative', body: 'Vehicle observed varying speed.' }],
  transactions: [],
};

const SAR_FIXTURE = {
  docType: 'SAR',
  title: 'Suspicious Activity Report SAR-2026-0415-88231',
  provider: 'FinCEN / Treasury',
  receivedDate: '2026-04-16',
  subjectId: 'SUBJ-001',
  fields: [{ label: 'Filing institution', value: 'First Commonwealth Bank' }],
  sections: [{ heading: 'Narrative', body: 'Nine outbound wire remittances.' }],
  transactions: [{ date: '2026-01-05', type: 'Wire (outbound)', amount: '$3,000' }],
};
```

Change the mock to:

```jsx
vi.mock('../data/api.js', () => ({
  fetchJson: (url) => Promise.resolve({
    'documents/doha-record.json': DOC_FIXTURE,
    'documents/SUBJ-002/police-report.json': POLICE_FIXTURE,
    'documents/SUBJ-001/sar.json': SAR_FIXTURE,
  }[url]),
  getProviders: () => Promise.resolve([
    { id: 'courts', name: 'State & local courts', category: 'Dockets and dispositions' },
    { id: 'fincen', name: 'FinCEN / Treasury', category: 'Financial intelligence' },
  ]),
}));
```

Wrap all `render(...)` calls in `<MemoryRouter>…</MemoryRouter>` (SourceChip uses Link). Keep the existing DOHA test unchanged otherwise, and add:

```jsx
  it('renders a typed police report with provider stamp, fields, and narrative', async () => {
    render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-002/police-report.json" />
    </MemoryRouter>);
    expect(await screen.findByText(/Arrest report 26-044812/)).toBeInTheDocument();
    expect(screen.getByText('Chesapeake Police Department')).toBeInTheDocument();
    expect(screen.getByText('Officer narrative')).toBeInTheDocument();
    expect(screen.getByText(/Received via State & local courts · 2026-06-30/))
      .toBeInTheDocument();
  });

  it('renders SAR transactions as a table', async () => {
    render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-001/sar.json" />
    </MemoryRouter>);
    expect(await screen.findByText(/SAR-2026-0415-88231/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Wire (outbound)')).toBeInTheDocument();
    expect(screen.getByText('$3,000')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `portal/`): `npx vitest run src/__tests__/sourceChip.test.jsx src/__tests__/documentViewer.test.jsx`
Expected: FAIL — SourceChip module not found; typed-doc assertions fail.

- [ ] **Step 3: Implement `SourceChip.jsx`**

```jsx
import { Link } from 'react-router-dom';
import { FiDatabase } from 'react-icons/fi';
import { getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import './components.css';

// Legacy display strings used in alert data → canonical providers.json names.
const ALIASES = {
  'FBI Rap Back': 'FBI CJIS / NCIC + Rap Back',
  'FBI CJIS/NCIC': 'FBI CJIS / NCIC + Rap Back',
  'CBP I-94': 'CBP I-94 Foreign Travel',
};

export default function SourceChip({ provider }) {
  const { data: providers } = useData(getProviders);
  const canonical = ALIASES[provider] || provider;
  const info = providers?.find((p) => p.name === canonical);

  const body = (
    <>
      <FiDatabase aria-hidden="true" />
      <span>{provider}</span>
    </>
  );
  if (!info) return <span className="source-chip">{body}</span>;
  return (
    <Link className="source-chip source-chip-link" to="/providers" title={info.category}>
      {body}
    </Link>
  );
}
```

- [ ] **Step 4: Implement typed DocumentViewer**

Replace `DocumentViewer.jsx` content with (existing DOHA markup preserved verbatim inside `DohaDocumentView`):

```jsx
import { useData } from '../data/useData.js';
import { fetchJson } from '../data/api.js';
import StatusBadge from './StatusBadge.jsx';
import KVGrid from './KVGrid.jsx';
import SourceChip from './SourceChip.jsx';
import { Loading, ErrorAlert } from './States.jsx';
import './components.css';

const OUTCOME_VARIANT = { GRANTED: 'success', DENIED: 'error' };

const DOC_TYPE_LABELS = {
  POLICE_REPORT: 'Police report',
  CREDIT_REPORT: 'Credit-file extract',
  SAR: 'Suspicious Activity Report',
  RAPBACK_NOTIFICATION: 'Rap Back notification',
  SF86_EXCERPT: 'SF-86 excerpt',
  TRAVEL_RECORD: 'Travel record',
  INCIDENT_REPORT: 'Security incident report',
};

const listingUrl = (u) => {
  const i = u?.toLowerCase().indexOf('/fileid/');
  return i > 0 ? u.slice(0, i) : null;
};

function DohaDocumentView({ doc }) {
  return (
    <div className="document-viewer">
      <div className="document-viewer-head">
        <div>
          <h4>{doc.title}</h4>
          <p className="muted">
            {doc.caseNumber} · {doc.date}
            {doc.judge && ` · ${doc.judge}`}
          </p>
        </div>
        <StatusBadge variant={OUTCOME_VARIANT[doc.outcome] || 'neutral'}>{doc.outcome}</StatusBadge>
      </div>
      <pre className="document-viewer-body">{doc.fullText}</pre>
      {doc.sourceUrl && (
        <p className="muted document-viewer-source">
          Source: <a href={doc.sourceUrl} target="_blank" rel="noreferrer">{doc.sourceUrl}</a>
          {listingUrl(doc.sourceUrl) && (
            <>
              {' · '}
              <a href={listingUrl(doc.sourceUrl)} target="_blank" rel="noreferrer">Year index</a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function GeneratedDocumentView({ doc }) {
  return (
    <div className="document-viewer">
      <div className="document-viewer-head">
        <div>
          <h4>{doc.title}</h4>
          <p className="muted">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</p>
        </div>
        <SourceChip provider={doc.provider} />
      </div>
      <p className="muted document-received">
        Received via {doc.provider} · {doc.receivedDate}
      </p>
      <KVGrid items={doc.fields.map((f) => ({ label: f.label, value: f.value }))} />
      {doc.transactions.length > 0 && (
        <table className="inline-table">
          <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
          <tbody>
            {doc.transactions.map((t) => (
              <tr key={`${t.date}-${t.amount}`}>
                <td>{t.date}</td><td>{t.type}</td><td>{t.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {doc.sections.map((s) => (
        <div key={s.heading} className="document-section">
          <h5>{s.heading}</h5>
          <p>{s.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function DocumentViewer({ url }) {
  const { data: doc, loading, error } = useData(() => fetchJson(url), [url]);
  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;
  return doc.docType
    ? <GeneratedDocumentView doc={doc} />
    : <DohaDocumentView doc={doc} />;
}
```

- [ ] **Step 5: Append styles to `components.css`**

```css
.source-chip { display: inline-flex; align-items: center; gap: var(--space-1);
  padding: var(--space-1) var(--space-2); border-radius: var(--radius-pill);
  font-size: var(--font-size-xs); font-weight: 600; background: var(--bg-sidebar);
  color: var(--text-secondary); border: 1px solid var(--border-medium); }
.source-chip-link:hover { color: var(--dcsa-ocean); border-color: var(--dcsa-ocean); }
.document-received { margin: var(--space-2) 0 var(--space-3); }
.document-section { margin-top: var(--space-4); }
.document-section h5 { font-size: var(--font-size-sm); text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--text-secondary); margin-bottom: var(--space-1); }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/sourceChip.test.jsx src/__tests__/documentViewer.test.jsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/src/components portal/src/__tests__
git commit -m "feat(portal): SourceChip and typed document viewer with DOHA fallback"
```

---

### Task 3: Record-check drill-down (Investigation tab)

**Files:**
- Modify: `portal/src/pages/case/InvestigationTab.jsx`
- Modify: `portal/src/pages/case/case.css` (append)
- Modify: `portal/src/__tests__/fixtures.js`
- Modify: `portal/src/__tests__/investigationTab.test.jsx`

**Interfaces:**
- Consumes: `caseData.investigation.recordChecks` (Task 1 shape), `SourceChip`, `DocumentViewer`, `KVGrid`, `StatusBadge`.
- Produces: "Record checks" card replacing "Coverage checklist"; each row expands to provider chip + scope/result KV + optional inline document.

- [ ] **Step 1: Update fixtures**

In `fixtures.js`, inside `CASE_001.investigation`, replace `coverage: [...]` with:

```js
    recordChecks: [
      { item: 'Subject interview (ESI)', status: 'COMPLETE',
        provider: 'DCSA field operations', requestedDate: '2025-10-02',
        completedDate: '2025-11-19',
        scope: 'Enhanced subject interview covering financial issues',
        resultSummary: 'Subject understated total debt.', documentUrl: null },
      { item: 'Financial record checks', status: 'COMPLETE',
        provider: 'TransUnion', requestedDate: '2026-03-10',
        completedDate: '2026-03-15',
        scope: 'Tri-bureau credit re-check plus civil judgment search',
        resultSummary: '$47,300 delinquent across five accounts.',
        documentUrl: 'documents/SUBJ-001/credit-extract-20260620.json' },
      { item: 'Foreign contact expansion leads', status: 'PENDING',
        provider: 'DCSA field operations', requestedDate: '2026-02-01',
        completedDate: null, scope: 'Expanded lead on sibling employment',
        resultSummary: 'Lead open.', documentUrl: null },
    ],
```

Also in `ALERTS[0]`, replace `documentUrl: 'documents/doha-record.json'` with
`documents: [{ title: 'TransUnion credit-file extract', url: 'documents/SUBJ-001/credit-extract-20260620.json' }]`,
and in `CASE_001.wholePerson` replace the single factor with (used by Task 5 too):

```js
  wholePerson: [
    { factor: 'Nature, extent, and seriousness of the conduct',
      assessment: 'Sustained delinquency; serious.',
      evidence: [
        { type: 'ALERT', ref: 'ALERT-101', label: 'New collection account alert' },
        { type: 'DOCUMENT', ref: 'documents/SUBJ-001/credit-extract-20260620.json',
          label: 'TransUnion credit-file extract' },
      ] },
    { factor: 'Frequency and recency of the conduct',
      assessment: 'Ongoing; newest alert June 2026.',
      evidence: [{ type: 'RECORD_CHECK', ref: 'Financial record checks',
        label: 'Financial record checks' }] },
  ],
```

- [ ] **Step 2: Write failing tests**

In `investigationTab.test.jsx`, replace the coverage test and add drill-down tests. Add mocks at top (before component import):

```jsx
import { MemoryRouter } from 'react-router-dom';

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve({
    docType: 'CREDIT_REPORT',
    title: 'Credit-file extract — Meridian Auto Finance',
    provider: 'TransUnion', receivedDate: '2026-06-20', subjectId: 'SUBJ-001',
    fields: [{ label: 'Balance', value: '$12,400' }], sections: [], transactions: [],
  }),
  getProviders: () => Promise.resolve([
    { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)' },
  ]),
}));
```

(add `vi` to the vitest import) and wrap `renderTab`'s tree in `<MemoryRouter>`. New/changed tests:

```jsx
  it('renders record checks with status pills', () => {
    renderTab();
    expect(screen.getByText('Record checks')).toBeInTheDocument();
    expect(screen.getByText('Subject interview (ESI)')).toBeInTheDocument();
    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
  });

  it('expands a record check to show provider, scope, and result', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /financial record checks/i }));
    expect(screen.getByText('Tri-bureau credit re-check plus civil judgment search'))
      .toBeInTheDocument();
    expect(screen.getByText('$47,300 delinquent across five accounts.'))
      .toBeInTheDocument();
    expect(screen.getByText('TransUnion')).toBeInTheDocument();
  });

  it('opens the linked source document from an expanded record check', async () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /financial record checks/i }));
    fireEvent.click(screen.getByRole('button', { name: /view document/i }));
    expect(await screen.findByText(/Credit-file extract — Meridian Auto Finance/))
      .toBeInTheDocument();
  });

  it('checks without a document show no view button when expanded', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /subject interview/i }));
    expect(screen.queryByRole('button', { name: /view document/i }))
      .not.toBeInTheDocument();
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/investigationTab.test.jsx`
Expected: FAIL — "Record checks" not found (component still renders "Coverage checklist").

- [ ] **Step 4: Implement record-check rows in `InvestigationTab.jsx`**

Replace the coverage card and its constants. New imports at top:

```jsx
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import SourceChip from '../../components/SourceChip.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import KVGrid from '../../components/KVGrid.jsx';
```

Replace `COVERAGE_VARIANT`/`COVERAGE_LABEL` usage with the same maps renamed
`CHECK_VARIANT`/`CHECK_LABEL` (same values), and replace the checklist card with:

```jsx
function RecordCheckRow({ check }) {
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  return (
    <li className="record-check">
      <button type="button" className="record-check-header" onClick={() => setOpen(!open)}
        aria-expanded={open}>
        <span className="record-check-item">{check.item}</span>
        <StatusBadge variant={CHECK_VARIANT[check.status]}>
          {CHECK_LABEL[check.status]}
        </StatusBadge>
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && (
        <div className="record-check-body">
          <SourceChip provider={check.provider} />
          <KVGrid items={[
            { label: 'Requested', value: check.requestedDate },
            { label: 'Completed', value: check.completedDate || 'Pending' },
            { label: 'What was checked', value: check.scope },
            { label: 'Result', value: check.resultSummary },
          ]} />
          {check.documentUrl && (
            <>
              <button type="button" className="btn btn-ghost"
                onClick={() => setDocOpen(!docOpen)}>
                <FiFileText aria-hidden="true" /> View document
              </button>
              {docOpen && <DocumentViewer url={check.documentUrl} />}
            </>
          )}
        </div>
      )}
    </li>
  );
}
```

and in the main return:

```jsx
      <div className="card">
        <h3>Record checks</h3>
        <ul className="record-check-list">
          {inv.recordChecks.map((c) => <RecordCheckRow key={c.item} check={c} />)}
        </ul>
      </div>
```

- [ ] **Step 5: Append styles to `case.css`**

```css
.record-check-list { list-style: none; }
.record-check { border-bottom: 1px solid var(--border-light); }
.record-check:last-child { border-bottom: none; }
.record-check-header { display: flex; align-items: center; gap: var(--space-3);
  width: 100%; padding: var(--space-3) 0; background: none; border: none;
  cursor: pointer; font: inherit; text-align: left; }
.record-check-item { flex: 1; font-weight: 600; }
.record-check-body { padding: 0 0 var(--space-4); display: flex;
  flex-direction: column; gap: var(--space-3); align-items: flex-start; }
```

- [ ] **Step 6: Run tests, then full vitest**

Run: `npx vitest run src/__tests__/investigationTab.test.jsx`
Expected: PASS. Then `npx vitest run` — fix any test still referencing `coverage`
(`caseDetail.test.jsx` renders CaseDetail with `CASE_001`; it should pass with the
updated fixture).

- [ ] **Step 7: Commit**

```bash
git add portal/src
git commit -m "feat(portal): record-check drill-down with provider provenance and source documents"
```

---

### Task 4: Per-alert source documents (CV tab)

**Files:**
- Modify: `portal/src/pages/case/CVTab.jsx`
- Modify: `portal/src/__tests__/cvTab.test.jsx`

**Interfaces:**
- Consumes: alert `documents: [{title, url}]` (Task 1), `SourceChip`, `DocumentViewer`.
- Produces: one toggle button per source document in each alert body; alert header line uses `SourceChip` for the provider.

- [ ] **Step 1: Read `cvTab.test.jsx`, add mocks and failing tests**

Add to the existing api mock (or create it if the file mocks differently): `fetchJson` returning a minimal typed doc and `getProviders` as in Task 3. Add tests:

```jsx
  it('renders one source-document button per alert document and opens it', async () => {
    renderTab(); // existing helper; ensure CASE_001 fixture alerts are used
    fireEvent.click(screen.getByRole('button',
      { name: /financial — new collection account reported/i })); // expand alert
    const docButton = screen.getByRole('button',
      { name: /TransUnion credit-file extract/i });
    fireEvent.click(docButton);
    expect(await screen.findByText(/Credit-file extract — Meridian Auto Finance/))
      .toBeInTheDocument();
  });
```

(Adapt the expand step to the file's existing pattern — CollapsibleSection titles render as buttons.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/cvTab.test.jsx`
Expected: FAIL — no button named for the document title.

- [ ] **Step 3: Implement in `CVTab.jsx`**

Add import `import SourceChip from '../../components/SourceChip.jsx';`.
In `AlertBody`, replace the provider line:

```jsx
      <p className="muted">
        <SourceChip provider={a.provider} /> · Severity: {a.severity} · AI priority {a.priorityScore}
        {' '}<AIBadge />
      </p>
```

Replace the single `a.documentUrl` block with a per-document toggle. Change `AlertBody`'s
`const [docOpen, setDocOpen] = useState(false);` to `const [openDoc, setOpenDoc] = useState(null);`
and render:

```jsx
      {(a.documents || []).map((d) => (
        <div key={d.url}>
          <button type="button" className="btn btn-ghost"
            onClick={() => setOpenDoc(openDoc === d.url ? null : d.url)}>
            <FiFileText aria-hidden="true" /> {d.title}
          </button>
          {openDoc === d.url && <DocumentViewer url={d.url} />}
        </div>
      ))}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/cvTab.test.jsx`
Expected: PASS (fix any existing test that asserted the old "Source document" button label).

- [ ] **Step 5: Commit**

```bash
git add portal/src
git commit -m "feat(portal): per-alert typed source documents and provider chips in CV tab"
```

---

### Task 5: Interactive whole-person worksheet

**Files:**
- Modify: `portal/src/state/DemoContext.jsx`
- Create: `portal/src/pages/case/WholePersonWorksheet.jsx`
- Modify: `portal/src/pages/case/OverviewTab.jsx`
- Modify: `portal/src/pages/case/case.css` (append)
- Create: `portal/src/__tests__/wholePersonWorksheet.test.jsx`
- Modify: `portal/src/__tests__/state.test.jsx` (add rating persistence test)

**Interfaces:**
- Consumes: `caseData.wholePerson` 9-factor shape (Task 1), `usePersona`, `useDemo`, `DocumentViewer`, `useSearchParams`.
- Produces: `DemoContext` adds `worksheetRatings` bucket and
  `setWorksheetRating(caseId, factorIndex, rating, note)`; `EMPTY` becomes
  `{ alertStates: {}, decisions: {}, roiEntries: {}, worksheetRatings: {} }`.
  `<WholePersonWorksheet caseData={caseData} />` renders the worksheet card.
  Rating ids: `'FAVORABLE' | 'NEUTRAL' | 'CONCERN'`.

- [ ] **Step 1: Write failing DemoContext test**

In `state.test.jsx` add (following the file's existing render-hook pattern):

```jsx
  it('persists worksheet ratings per case and factor', () => {
    const { result } = renderDemoHook(); // reuse the file's existing helper/pattern
    act(() => result.current.setWorksheetRating('SUBJ-001', 2, 'CONCERN', 'Recent.'));
    expect(result.current.demo.worksheetRatings['SUBJ-001'][2])
      .toEqual({ rating: 'CONCERN', note: 'Recent.' });
    expect(JSON.parse(localStorage.getItem('demo.state')).worksheetRatings['SUBJ-001'][2].rating)
      .toBe('CONCERN');
    act(() => result.current.reset());
    expect(result.current.demo.worksheetRatings).toEqual({});
  });
```

- [ ] **Step 2: Run to verify it fails, then extend DemoContext**

Run: `npx vitest run src/__tests__/state.test.jsx` — FAIL (`setWorksheetRating` undefined).

In `DemoContext.jsx`: change `EMPTY` to
`{ alertStates: {}, decisions: {}, roiEntries: {}, worksheetRatings: {} }` and add to `value`:

```jsx
  const setWorksheetRating = (caseId, factorIndex, rating, note) =>
    persist({
      ...demo,
      worksheetRatings: {
        ...demo.worksheetRatings,
        [caseId]: { ...(demo.worksheetRatings[caseId] || {}), [factorIndex]: { rating, note } },
      },
    });
```

Re-run: PASS.

- [ ] **Step 3: Write failing worksheet component tests**

`portal/src/__tests__/wholePersonWorksheet.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve({
    docType: 'CREDIT_REPORT', title: 'Credit-file extract — Meridian Auto Finance',
    provider: 'TransUnion', receivedDate: '2026-06-20', subjectId: 'SUBJ-001',
    fields: [{ label: 'Balance', value: '$12,400' }], sections: [], transactions: [],
  }),
  getProviders: () => Promise.resolve([]),
}));

import WholePersonWorksheet from '../pages/case/WholePersonWorksheet.jsx';

function renderSheet(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><WholePersonWorksheet caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('WholePersonWorksheet', () => {
  it('renders each factor as an expandable row with its assessment', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    expect(screen.getByText('Sustained delinquency; serious.')).toBeInTheDocument();
  });

  it('shows evidence chips linking alerts and record checks', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    expect(screen.getByText('New collection account alert')).toBeInTheDocument();
  });

  it('opens document evidence inline', async () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    fireEvent.click(screen.getByRole('button',
      { name: /TransUnion credit-file extract/i }));
    expect(await screen.findByText(/Meridian Auto Finance/)).toBeInTheDocument();
  });

  it('adjudicator can rate a factor and the tally updates', () => {
    renderSheet('adjudicator');
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Concern' }));
    expect(screen.getByText('1 concern')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('demo.state'))
      .worksheetRatings['SUBJ-001'][0].rating).toBe('CONCERN');
  });

  it('non-adjudicator personas see no rating controls', () => {
    renderSheet('investigator');
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    expect(screen.queryByRole('button', { name: 'Concern' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run to verify failure, then implement `WholePersonWorksheet.jsx`**

Run: `npx vitest run src/__tests__/wholePersonWorksheet.test.jsx` — FAIL (module missing).

```jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';

const RATINGS = [
  { id: 'FAVORABLE', label: 'Favorable', variant: 'success' },
  { id: 'NEUTRAL', label: 'Neutral', variant: 'neutral' },
  { id: 'CONCERN', label: 'Concern', variant: 'error' },
];

function EvidenceChips({ evidence, onOpenDoc }) {
  const [, setParams] = useSearchParams();
  const jump = (ev) => {
    if (ev.type === 'ALERT') setParams({ tab: 'continuous-vetting', alert: ev.ref });
    if (ev.type === 'RECORD_CHECK') setParams({ tab: 'investigation' });
  };
  if (!evidence.length) return null;
  return (
    <div className="worksheet-evidence">
      {evidence.map((ev) => (
        <button key={`${ev.type}-${ev.ref}`} type="button" className="evidence-chip"
          onClick={() => (ev.type === 'DOCUMENT' ? onOpenDoc(ev.ref) : jump(ev))}>
          {ev.type === 'DOCUMENT' && <FiFileText aria-hidden="true" />}
          {ev.label}
        </button>
      ))}
    </div>
  );
}

function FactorRow({ factor, index, caseId, canRate }) {
  const { demo, setWorksheetRating } = useDemo();
  const [open, setOpen] = useState(false);
  const [docUrl, setDocUrl] = useState(null);
  const saved = demo.worksheetRatings[caseId]?.[index];
  const [note, setNote] = useState(saved?.note || '');

  return (
    <li className="worksheet-factor">
      <button type="button" className="record-check-header" aria-expanded={open}
        onClick={() => setOpen(!open)}>
        <span className="record-check-item">{factor.factor}</span>
        {saved && (
          <StatusBadge variant={RATINGS.find((r) => r.id === saved.rating).variant}>
            {RATINGS.find((r) => r.id === saved.rating).label}
          </StatusBadge>
        )}
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && (
        <div className="record-check-body">
          <p>{factor.assessment} <AIBadge /></p>
          <EvidenceChips evidence={factor.evidence || []}
            onOpenDoc={(url) => setDocUrl(docUrl === url ? null : url)} />
          {docUrl && <DocumentViewer url={docUrl} />}
          {canRate && (
            <div className="worksheet-rating">
              <div className="worksheet-rating-buttons" role="group"
                aria-label={`Assessment for ${factor.factor}`}>
                {RATINGS.map((r) => (
                  <button key={r.id} type="button"
                    className={`btn ${saved?.rating === r.id ? 'btn-secondary' : 'btn-ghost'}`}
                    onClick={() => setWorksheetRating(caseId, index, r.id, note)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <label className="form-group">
                <span>Adjudicator note</span>
                <textarea aria-label={`Note for ${factor.factor}`} rows={2} value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={() => saved && setWorksheetRating(caseId, index, saved.rating, note)} />
              </label>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function WholePersonWorksheet({ caseData }) {
  const { persona } = usePersona();
  const { demo } = useDemo();
  const caseId = caseData.subject.id;
  const ratings = Object.values(demo.worksheetRatings[caseId] || {});
  const tally = (id) => ratings.filter((r) => r.rating === id).length;

  return (
    <div className="card">
      <div className="worksheet-head">
        <h3>Whole-person worksheet <AIBadge /></h3>
        {ratings.length > 0 && (
          <div className="worksheet-tally">
            <StatusBadge variant="success">{tally('FAVORABLE')} favorable</StatusBadge>
            <StatusBadge variant="neutral">{tally('NEUTRAL')} neutral</StatusBadge>
            <StatusBadge variant="error">{tally('CONCERN')} concern</StatusBadge>
          </div>
        )}
      </div>
      <ul className="record-check-list">
        {caseData.wholePerson.map((f, i) => (
          <FactorRow key={f.factor} factor={f} index={i} caseId={caseId}
            canRate={persona.id === 'adjudicator'} />
        ))}
      </ul>
    </div>
  );
}
```

In `OverviewTab.jsx`: add `import WholePersonWorksheet from './WholePersonWorksheet.jsx';`
and replace the whole-person card:

```jsx
      <WholePersonWorksheet caseData={caseData} />
```

(remove the old `<div className="card"><h3>Whole-person snapshot</h3>…` block).

Append to `case.css`:

```css
.worksheet-head { display: flex; justify-content: space-between; align-items: center;
  gap: var(--space-3); flex-wrap: wrap; }
.worksheet-tally { display: flex; gap: var(--space-2); }
.worksheet-evidence { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.evidence-chip { display: inline-flex; align-items: center; gap: var(--space-1);
  padding: var(--space-1) var(--space-2); border-radius: var(--radius-pill);
  font-size: var(--font-size-xs); font-weight: 600; cursor: pointer;
  background: var(--bg-card); color: var(--dcsa-ocean);
  border: 1px solid var(--dcsa-ocean); }
.evidence-chip:hover { background: var(--dcsa-ocean); color: var(--text-inverse); }
.worksheet-rating { display: flex; flex-direction: column; gap: var(--space-2);
  width: 100%; }
.worksheet-rating-buttons { display: flex; gap: var(--space-2); }
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/__tests__/wholePersonWorksheet.test.jsx src/__tests__/overviewTab.test.jsx`
Expected: worksheet PASS; fix `overviewTab.test.jsx` if it asserted "Whole-person snapshot" (change to "Whole-person worksheet", wrap render in `MemoryRouter`, and add the api mock keys if missing).

- [ ] **Step 6: Commit**

```bash
git add portal/src
git commit -m "feat(portal): interactive 9-factor whole-person worksheet with evidence links and adjudicator ratings"
```

---

### Task 6: Subjects home page + routing

**Files:**
- Create: `portal/src/pages/SubjectsHome.jsx`
- Modify: `portal/src/App.jsx` (routes)
- Modify: `portal/src/layouts/AppShell.jsx` (nav)
- Modify: `portal/src/pages/CaseQueue.jsx` (read `?stage=` param)
- Modify: `portal/src/pages/pages.css` (append)
- Create: `portal/src/__tests__/subjectsHome.test.jsx`
- Modify: `portal/src/__tests__/shell.test.jsx`

**Interfaces:**
- Consumes: `getSubjects()`, `getAlerts()`, `useDemo` (`demo.alertStates`), `riskBand`, `KPICard`, `DataTable`, `StatusBadge`, `GuidelineChip`.
- Produces: `/` renders SubjectsHome; Dashboard moves to `/dashboard`; nav order Subjects, Dashboard, Case queue, CV alerts, Data providers, Analytics. Pipeline segments navigate to `/cases?stage=<STAGE>`; CaseQueue initializes its stage filter from that param.

- [ ] **Step 1: Write failing tests**

`portal/src/__tests__/subjectsHome.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
}));

import SubjectsHome from '../pages/SubjectsHome.jsx';

function renderHome() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><SubjectsHome /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('SubjectsHome', () => {
  it('shows subject-population KPIs', async () => {
    renderHome();
    expect(await screen.findByText('Total subjects')).toBeInTheDocument();
    const total = screen.getByText('Total subjects').closest('.kpi-card');
    expect(total).toHaveTextContent('3');
    const cv = screen.getByText('CV-enrolled').closest('.kpi-card');
    expect(cv).toHaveTextContent('2');
    const backlog = screen.getByText('Initial vetting backlog').closest('.kpi-card');
    expect(backlog).toHaveTextContent('1'); // SUBJ-003 in INVESTIGATION
    const withAlerts = screen.getByText('With open alerts').closest('.kpi-card');
    expect(withAlerts).toHaveTextContent('1'); // ALERT-101 (SUBJ-001) is NEW
  });

  it('open-alert KPI respects demo alert dispositions', async () => {
    localStorage.setItem('demo.state', JSON.stringify({
      alertStates: { 'ALERT-101': 'CLOSED' }, decisions: {}, roiEntries: {},
      worksheetRatings: {},
    }));
    renderHome();
    expect(await screen.findByText('With open alerts')).toBeInTheDocument();
    expect(screen.getByText('With open alerts').closest('.kpi-card'))
      .toHaveTextContent('0');
  });

  it('ranks needs-attention subjects by status, alerts, then risk', async () => {
    renderHome();
    const cards = await screen.findAllByTestId('attention-card');
    expect(cards[0]).toHaveTextContent('Daniel R. Okafor'); // ACTION_REQUIRED
    expect(cards[1]).toHaveTextContent('Marcus T. Bell');   // NEEDS_REVIEW
  });

  it('directory search filters subjects', async () => {
    renderHome();
    await screen.findByText('Total subjects');
    fireEvent.change(screen.getByLabelText('Search subjects in directory'),
      { target: { value: 'shah' } });
    const table = screen.getByRole('table');
    expect(within(table).queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
    expect(within(table).getByText('Priya N. Shah')).toBeInTheDocument();
  });

  it('renders the vetting pipeline with stage counts', async () => {
    renderHome();
    expect(await screen.findByText('Vetting pipeline')).toBeInTheDocument();
    const seg = screen.getByRole('link', { name: '1 Adjudication' });
    expect(seg.getAttribute('href')).toContain('/cases?stage=ADJUDICATION');
  });
});
```

In `shell.test.jsx`, change the nav-labels test list to
`['Subjects', 'Dashboard', 'Case queue', 'CV alerts', 'Data providers', 'Analytics']`.
Do NOT assert a page heading there — shell tests use the real (unmocked) api, so
route pages stay in their Loading state; nav links are the contract.

- [ ] **Step 2: Run to verify failures**

Run: `npx vitest run src/__tests__/subjectsHome.test.jsx src/__tests__/shell.test.jsx`
Expected: FAIL — SubjectsHome missing; nav lacks Subjects.

- [ ] **Step 3: Implement `SubjectsHome.jsx`**

```jsx
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSubjects, getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, riskBand,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

const STAGES = ['INITIATION', 'INVESTIGATION', 'ADJUDICATION', 'CONTINUOUS_VETTING'];
const STATUS_RANK = { ACTION_REQUIRED: 0, NEEDS_REVIEW: 1, CLEAR: 2 };
const BANDS = [
  { id: 'low', label: 'Low (<40)', color: 'var(--risk-low)' },
  { id: 'moderate', label: 'Moderate (40-74)', color: 'var(--risk-moderate)' },
  { id: 'high', label: 'High (75+)', color: 'var(--risk-high)' },
];

export default function SubjectsHome() {
  const navigate = useNavigate();
  const { demo } = useDemo();
  const subjectsQ = useData(getSubjects);
  const alertsQ = useData(getAlerts);
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [cvOnly, setCvOnly] = useState(false);
  const [alertsOnly, setAlertsOnly] = useState(false);

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data) return null;
    const openBySubject = {};
    for (const a of alertsQ.data) {
      const state = demo.alertStates[a.id] || a.state;
      if (!['ADJUDICATED', 'CLOSED'].includes(state)) {
        openBySubject[a.subjectId] = (openBySubject[a.subjectId] || 0) + 1;
      }
    }
    const subjects = subjectsQ.data.map((s) => ({
      ...s, effectiveOpenAlerts: openBySubject[s.id] || 0,
    }));
    const attention = subjects
      .filter((s) => s.status !== 'CLEAR' || s.effectiveOpenAlerts > 0)
      .sort((a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status]
        || b.effectiveOpenAlerts - a.effectiveOpenAlerts
        || b.riskScore - a.riskScore)
      .slice(0, 5);
    return { subjects, attention };
  }, [subjectsQ.data, alertsQ.data, demo.alertStates]);

  if (subjectsQ.loading || alertsQ.loading) return <Loading />;
  const error = subjectsQ.error || alertsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const { subjects, attention } = model;
  const stageCount = (st) => subjects.filter((s) => s.stage === st).length;
  const bandCount = (b) => subjects.filter((s) => riskBand(s.riskScore) === b).length;

  const directory = subjects
    .filter((s) => `${s.name} ${s.position}`.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => stageFilter === 'ALL' || s.stage === stageFilter)
    .filter((s) => !cvOnly || s.cvEnrolled)
    .filter((s) => !alertsOnly || s.effectiveOpenAlerts > 0);

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'AI risk', sortable: true },
    { key: 'cvEnrolled', label: 'CV',
      render: (s) => (s.cvEnrolled ? <StatusBadge variant="success">Enrolled</StatusBadge>
        : <span className="muted">—</span>) },
    { key: 'effectiveOpenAlerts', label: 'Open alerts', sortable: true },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Whole-person view of the vetted population <AIBadge /></p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total subjects" value={subjects.length}
          accent="var(--dcsa-navy)" />
        <KPICard label="CV-enrolled"
          value={subjects.filter((s) => s.cvEnrolled).length}
          accent="var(--dcsa-ocean)" />
        <KPICard label="Initial vetting backlog"
          value={subjects.filter((s) => ['INITIATION', 'INVESTIGATION'].includes(s.stage)).length}
          accent="var(--dcsa-gold)" />
        <KPICard label="Awaiting adjudication" value={stageCount('ADJUDICATION')}
          accent="var(--status-warning)" />
        <KPICard label="With open alerts"
          value={subjects.filter((s) => s.effectiveOpenAlerts > 0).length}
          accent="var(--status-alert)" />
      </div>

      <div className="card">
        <h3>Vetting pipeline</h3>
        <div className="pipeline-strip">
          {STAGES.map((st) => (
            <Link key={st} className="pipeline-segment" to={`/cases?stage=${st}`}>
              <span className="pipeline-count">{stageCount(st)}</span>
              <span className="pipeline-label">{STAGE_LABELS[st]}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>AI risk distribution</h3>
        <div className="risk-bar" role="img"
          aria-label={BANDS.map((b) => `${b.label}: ${bandCount(b.id)}`).join(', ')}>
          {BANDS.map((b) => bandCount(b.id) > 0 && (
            <div key={b.id} className="risk-bar-segment"
              style={{ flex: bandCount(b.id), '--band-color': b.color }}>
              {bandCount(b.id)}
            </div>
          ))}
        </div>
        <div className="risk-bar-legend">
          {BANDS.map((b) => (
            <span key={b.id} className="risk-bar-key" style={{ '--band-color': b.color }}>
              {b.label}: {bandCount(b.id)}
            </span>
          ))}
        </div>
      </div>

      <h2 className="dashboard-queue-title">Needs attention</h2>
      <div className="attention-grid">
        {attention.map((s) => (
          <button key={s.id} type="button" className="card card-interactive attention-card"
            data-testid="attention-card" onClick={() => navigate(`/cases/${s.id}`)}>
            <div className="attention-head">
              <div>
                <strong>{s.name}</strong>
                <div className="muted">{s.position}</div>
              </div>
              <div className={`risk-dial risk-${riskBand(s.riskScore)} risk-dial-sm`}>
                <span className="risk-dial-value">{s.riskScore}</span>
                <span className="risk-dial-label">AI risk</span>
              </div>
            </div>
            <div className="subject-pills">
              <StatusBadge variant="info">{STAGE_LABELS[s.stage]}</StatusBadge>
              <StatusBadge variant={STATUS_VARIANTS[s.status]}>
                {STATUS_LABELS[s.status]}
              </StatusBadge>
              {s.effectiveOpenAlerts > 0 && (
                <StatusBadge variant="error">
                  {s.effectiveOpenAlerts} open alert{s.effectiveOpenAlerts > 1 ? 's' : ''}
                </StatusBadge>
              )}
              {s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
            </div>
          </button>
        ))}
      </div>

      <h2 className="dashboard-queue-title">Subject directory</h2>
      <div className="card directory-filters">
        <label className="form-group directory-search">
          <span>Search</span>
          <input type="search" aria-label="Search subjects in directory" value={q}
            onChange={(e) => setQ(e.target.value)} placeholder="Name or position…" />
        </label>
        <label className="form-group">
          <span>Stage</span>
          <select aria-label="Directory stage filter" value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}>
            <option value="ALL">All stages</option>
            {STAGES.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
          </select>
        </label>
        <label className="directory-check">
          <input type="checkbox" checked={cvOnly}
            onChange={(e) => setCvOnly(e.target.checked)} /> CV-enrolled
        </label>
        <label className="directory-check">
          <input type="checkbox" checked={alertsOnly}
            onChange={(e) => setAlertsOnly(e.target.checked)} /> Has open alerts
        </label>
      </div>
      <DataTable columns={columns} rows={directory} rowKey="id"
        onRowClick={(s) => navigate(`/cases/${s.id}`)} />
    </div>
  );
}
```

- [ ] **Step 4: Routing + nav + CaseQueue param**

`App.jsx`: add `import SubjectsHome from './pages/SubjectsHome.jsx';`, change routes:

```jsx
              <Route path="/" element={<SubjectsHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
```

`AppShell.jsx`: add `FiUsers` to the react-icons import and change `NAV_ITEMS`:

```jsx
const NAV_ITEMS = [
  { to: '/', end: true, label: 'Subjects', Icon: FiUsers },
  { to: '/dashboard', label: 'Dashboard', Icon: FiHome },
  { to: '/cases', label: 'Case queue', Icon: FiUser },
  { to: '/alerts', label: 'CV alerts', Icon: FiActivity },
  { to: '/providers', label: 'Data providers', Icon: FiDatabase },
  { to: '/analytics', label: 'Analytics', Icon: FiBarChart2 },
];
```

`CaseQueue.jsx` line 29: initialize stage from the URL:

```jsx
  const [stage, setStage] = useState(
    params.get('stage') || (q ? 'ALL' : PERSONA_STAGE[persona.id]));
```

Append to `pages.css`:

```css
/* Subjects home */
.pipeline-strip { display: flex; gap: var(--space-2); }
.pipeline-segment { flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: var(--space-1); padding: var(--space-3); border-radius: var(--radius-sm);
  background: var(--bg-sidebar); border: 1px solid var(--border-light);
  color: var(--text-primary); }
.pipeline-segment:hover { border-color: var(--dcsa-ocean); color: var(--dcsa-ocean); }
.pipeline-count { font-size: var(--font-size-xl); font-weight: 700; }
.pipeline-label { font-size: var(--font-size-xs); text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--text-secondary); }
.risk-bar { display: flex; height: 36px; border-radius: var(--radius-sm);
  overflow: hidden; margin-bottom: var(--space-3); }
.risk-bar-segment { display: flex; align-items: center; justify-content: center;
  background: var(--band-color); color: var(--text-inverse); font-weight: 700; }
.risk-bar-legend { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.risk-bar-key { font-size: var(--font-size-sm); color: var(--text-secondary); }
.risk-bar-key::before { content: ''; display: inline-block; width: 10px; height: 10px;
  border-radius: 2px; background: var(--band-color); margin-right: var(--space-1); }
.attention-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4); margin-bottom: var(--space-5); align-items: stretch; }
.attention-grid > .card { margin-top: 0; }
.attention-card { display: flex; flex-direction: column; gap: var(--space-3);
  text-align: left; cursor: pointer; font: inherit; }
.attention-head { display: flex; justify-content: space-between; gap: var(--space-3);
  align-items: flex-start; }
.risk-dial-sm { width: 56px; height: 56px; }
.risk-dial-sm .risk-dial-value { font-size: var(--font-size-lg); }
.directory-filters { display: flex; gap: var(--space-4); align-items: flex-end;
  flex-wrap: wrap; margin-bottom: var(--space-4); }
.directory-search { min-width: 240px; }
.directory-check { display: inline-flex; align-items: center; gap: var(--space-2);
  font-size: var(--font-size-sm); color: var(--text-secondary); padding-bottom: 10px; }
```

(Check `case.css` for the `.risk-dial` base size; if `risk-dial-sm` conflicts, adjust to override its width/height/font sizes.)

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/__tests__/subjectsHome.test.jsx src/__tests__/shell.test.jsx src/__tests__/caseQueue.test.jsx src/__tests__/dashboard.test.jsx`
Expected: PASS (dashboard tests render the component directly and are unaffected by the route move).

- [ ] **Step 6: Commit**

```bash
git add portal/src
git commit -m "feat(portal): subject-centric Subjects home page as default route"
```

---

### Task 7: Full verification, e2e, docs

**Files:**
- Modify: `portal/e2e/smoke.spec.js`
- Modify: `README.md` (portal section — only if it names Dashboard as the landing page)

**Interfaces:**
- Consumes: everything above, regenerated `portal/public/data`.

- [ ] **Step 1: Update the Playwright smoke test**

Replace the first block of `smoke.spec.js`:

```js
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible();
  await expect(page.getByText('Total subjects')).toBeVisible();

  await page.goto('/#/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  for (const persona of ['Investigator', 'Analyst', 'Adjudicator']) {
    await page.getByLabel('Persona').selectOption({ label: persona });
    await expect(page.locator('.kpi-grid .kpi-card').first()).toBeVisible();
  }
```

and add before the alerts-page block (drill-down proof):

```js
  await page.goto('/#/cases/SUBJ-002?tab=investigation');
  await page.getByRole('button', { name: /police report retrieval/i }).click();
  await page.getByRole('button', { name: /view document/i }).click();
  await expect(page.getByText(/Arrest report 26-044812/)).toBeVisible();
```

- [ ] **Step 2: Run everything**

```bash
cd portal && npx vitest run              # all unit tests green
cd data_gen && python -m pytest tests -q # all data tests green
cd .. && npm run build                   # production build succeeds
npx playwright test                      # smoke green (starts dev server per config)
```

Expected: all PASS. Fix regressions before proceeding.

- [ ] **Step 3: Manual verify (verify skill)**

Launch `npm run dev`, screenshot: `/#/` (Subjects home), `/#/cases/SUBJ-002?tab=investigation` expanded police-report check with document open, `/#/cases/SUBJ-002?tab=continuous-vetting` DUI alert with two document buttons, `/#/cases/SUBJ-001` worksheet expanded with rating clicked. Confirm against spec.

- [ ] **Step 4: Update README if needed and commit**

```bash
git add portal README.md
git commit -m "test(portal): smoke coverage for subjects home and record-check drill-down"
```
