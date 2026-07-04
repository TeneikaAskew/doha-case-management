# Data Provider Drill-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clickable data providers: `/providers/:id` shows a KPI band, a filterable table of every alert that arrived through that provider, and the record checks/documents it delivered; the generator adds ~22 alerts so each CV provider holds 3-6.

**Architecture:** Data-first per the spec (`docs/superpowers/specs/2026-07-04-provider-drill-down-design.md`). A new `data_gen/cv_feed.py` appends deterministic alerts (with documents, phase history, and timeline events) to the already-built cases, so `hero_cases.py`/`roster.py` stay untouched; the generator stamps canonical `providerId` on every alert, recomputes `openAlerts`, and emits `provider-activity.json`. The UI adds one route + page built entirely from existing primitives (KPICard, DataTable, StatusBadge, SourceChip, EmptyState, SectionRef).

**Tech Stack:** Python 3 + pydantic + pytest (data_gen); React 18 + react-router HashRouter + vitest (portal); Playwright e2e.

## Global Constraints

- Determinism: fixed `TODAY = "2026-07-02"`; no randomness; regeneration byte-stable (existing `test_deterministic`).
- No em/en dashes anywhere; hyphens only. Headers/KPI labels Title Case; body sentence case.
- Alert data standards enforced by existing tests and MUST hold for new alerts: `history` starts at NEW on `receivedDate`, ends at current state, ascending dates, every phase has an actor; case timeline gets `"<Category> alert received"` (+ `"... adjudicated"` when state is ADJUDICATED) with matching dates and source-free titles (no provider words - see `PROVIDER_WORDS` in `tests/test_generator.py`); every alert has ≥1 document.
- Provider identity: canonical ids from `providers.json` (`fbi-cjis`, `equifax`, `experian`, `transunion`, `lexisnexis`, `fincen`, `cbp-i94`, `courts`, `dmv`, `irs`, `sead5`, `diss`). UI never string-matches names.
- Commands: pytest from `portal/data_gen` (`python -m pytest tests -q`), vitest from `portal` (`npx vitest run`), regenerate from `portal/data_gen` (`python generate_demo_data.py`). Beware: a stray `node_modules` exists at repo root - ALWAYS `cd` into `portal/` before `npx vitest`.
- Concurrent-edit caution: the user edits these files live. Re-read any file that errors "modified since read" and reconcile; never revert their changes.

---

### Task 1: Schemas + provider alias map (data_gen)

**Files:**
- Modify: `portal/data_gen/schemas.py`
- Modify: `portal/data_gen/documents.py` (add `PROVIDER_IDS` map)
- Test: `portal/data_gen/tests/test_generator.py` (extend)

**Interfaces:**
- Produces: `CVAlert.providerId: str` (required); pydantic models
  `ProviderCheckRef {caseId, subjectName, item, category, status, completedDate|null, documentUrl|null}`,
  `ProviderDocRef {caseId, subjectName, title, url, receivedDate}`,
  `ProviderActivity {alertIds: [str], recordChecks: [ProviderCheckRef], documents: [ProviderDocRef]}`,
  `ProviderActivityFile {providers: dict[str, ProviderActivity]}`;
  `documents.PROVIDER_IDS: dict[str, str]` mapping every display string used in
  data (canonical names AND aliases) to canonical ids.

- [ ] **Step 1: Write failing tests** - append to `tests/test_generator.py`:

```python
def test_every_alert_has_canonical_provider_id(out):
    out_dir, _ = out
    ids = {p.id for p in schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8"))).providers}
    alerts = schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8"))).alerts
    for a in alerts:
        assert a.providerId in ids, f"{a.id}: bad providerId {a.providerId}"


def test_cv_providers_have_rich_alert_coverage(out):
    """Every CV-capable provider holds >= 3 alerts; investigation-only ones 0."""
    out_dir, _ = out
    providers = schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8"))).providers
    alerts = schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8"))).alerts
    by_provider = {}
    for a in alerts:
        by_provider[a.providerId] = by_provider.get(a.providerId, 0) + 1
    for p in providers:
        if "CV" in p.usedIn:
            assert by_provider.get(p.id, 0) >= 3, f"{p.id}: {by_provider.get(p.id, 0)} alerts"
        else:
            assert by_provider.get(p.id, 0) == 0, f"{p.id} is INV-only but has alerts"


def test_open_alerts_is_computed(out):
    out_dir, _ = out
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        open_n = sum(1 for a in case.alerts
                     if a.state not in ("ADJUDICATED", "CLOSED"))
        assert case.subject.openAlerts == open_n, f"{case.subject.id}"


def test_provider_activity_file(out):
    out_dir, _ = out
    data = json.loads((out_dir / "provider-activity.json").read_text(encoding="utf-8"))
    parsed = schemas.ProviderActivityFile.model_validate(data)
    ids = {p.id for p in schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8"))).providers}
    alerts = {a.id for a in schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8"))).alerts}
    assert set(parsed.providers) == ids  # every provider present, even if empty
    for pid, act in parsed.providers.items():
        for aid in act.alertIds:
            assert aid in alerts, f"{pid}: unknown alert {aid}"
        for rc in act.recordChecks:
            assert (out_dir / "cases" / f"{rc.caseId}.json").is_file()
            if rc.documentUrl:
                assert (out_dir / rc.documentUrl).is_file()
        for d in act.documents:
            assert (out_dir / d.url).is_file()
    # investigation-only providers still deliver record checks somewhere
    assert parsed.providers["transunion"].recordChecks
```

- [ ] **Step 2: Run to verify failure**

Run (from `portal/data_gen`): `python -m pytest tests/test_generator.py -q`
Expected: FAIL - `ProviderActivityFile` missing / `providerId` validation errors.

- [ ] **Step 3: Extend `schemas.py`**

In `CVAlert`, add after `provider: str`:

```python
    providerId: str  # canonical providers.json id; UI joins on this, never on names
```

Add after `ProvidersFile`:

```python
class ProviderCheckRef(BaseModel):
    caseId: str
    subjectName: str
    item: str
    category: RecordCheckCategory
    status: CoverageStatus
    completedDate: Optional[str] = None
    documentUrl: Optional[str] = None


class ProviderDocRef(BaseModel):
    caseId: str
    subjectName: str
    title: str
    url: str
    receivedDate: str


class ProviderActivity(BaseModel):
    alertIds: list[str] = []
    recordChecks: list[ProviderCheckRef] = []
    documents: list[ProviderDocRef] = []


class ProviderActivityFile(BaseModel):
    providers: dict[str, ProviderActivity]
```

- [ ] **Step 4: Add the alias map to `documents.py`** (single source of truth,
mirrors the UI `SourceChip` ALIASES):

```python
# Display string (as used in alert/check/document data) -> providers.json id.
PROVIDER_IDS = {
    "FBI CJIS / NCIC + Rap Back": "fbi-cjis",
    "FBI Rap Back": "fbi-cjis",
    "FBI CJIS/NCIC": "fbi-cjis",
    "Equifax": "equifax",
    "Experian": "experian",
    "TransUnion": "transunion",
    "LexisNexis": "lexisnexis",
    "FinCEN / Treasury": "fincen",
    "CBP I-94 Foreign Travel": "cbp-i94",
    "CBP I-94": "cbp-i94",
    "State & local courts": "courts",
    "DMV records": "dmv",
    "IRS / tax records": "irs",
    "SEAD-5 Social media (PAEI)": "sead5",
    "DISS / prior adjudications": "diss",
}
```

(Non-provider sources like "DCSA field operations" are intentionally absent;
lookups use `PROVIDER_IDS.get(name)` and skip None.)

- [ ] **Step 5: Commit**

```bash
git add portal/data_gen/schemas.py portal/data_gen/documents.py portal/data_gen/tests/test_generator.py
git commit -m "feat(data): providerId on alerts, provider-activity schemas, canonical alias map"
```

(Tests still red until Tasks 2-3 - fine; commit is schema-only groundwork.
If you prefer green-only commits, fold this into Task 3's commit.)

---

### Task 2: `cv_feed.py` - procedural alert feed (~22 new alerts)

**Files:**
- Create: `portal/data_gen/cv_feed.py`
- Test: `portal/data_gen/tests/test_generator.py` (existing standards tests cover
  the new alerts; distribution test from Task 1 goes green here)

**Interfaces:**
- Consumes: built case dicts (before validation) - each with `subject`, `alerts`,
  `timeline`, `sourceDocuments`; `documents.py` builders and `PROVIDER_IDS`.
- Produces: `cv_feed.extend_cases(cases: list[dict]) -> None` - mutates cases in
  place: appends alerts (with `providerId`, `documents`, `history`), registers
  their source documents in `case["sourceDocuments"]`, appends timeline events,
  keeps `timeline` sorted by date. The generator (Task 3) calls it once.

Design notes the implementer needs:
- Alert ids: `ALERT-5xx`, numbered sequentially in a fixed order so output is
  deterministic.
- Target distribution AFTER existing alerts (existing: transunion 3, fbi-cjis 1,
  cbp-i94 1, diss 1): add fbi-cjis +2, equifax +3, transunion +2, lexisnexis +3,
  fincen +3, cbp-i94 +2, diss +2 = 17 new minimum; add 5 more spread
  (equifax +1, fincen +1, lexisnexis +1, fbi-cjis +1, transunion +1) = 22 new.
  Final: fbi-cjis 4, equifax 4, transunion 6, lexisnexis 4, fincen 4, cbp-i94 3,
  diss 3 (all >= 3).
- Hosts: only CV-enrolled subjects - SUBJ-001, SUBJ-002, SUBJ-012, SUBJ-013,
  SUBJ-014, SUBJ-015 - round-robin so each gets 3-4 new alerts.
- States: pattern cycle `["ADJUDICATED", "ADJUDICATED", "CLOSED", "ADJUDICATED",
  "NEW", "ADJUDICATED", "VALIDATED"]` (~60/20/20). ADJUDICATED walks
  NEW → IDENTITY_CONFIRMED → VALIDATED → REFERRED → ADJUDICATED (5 phases);
  CLOSED walks NEW → CLOSED ("false positive - identifiers do not resolve");
  VALIDATED walks NEW → IDENTITY_CONFIRMED → VALIDATED. Phase dates: receivedDate,
  +3, +8, +14, +21 days. Actors: "System" for NEW, "R. Chen (Analyst)" for
  analyst phases, "L. Ortiz (Adjudicator)" for ADJUDICATED.
- Received dates: deterministic ladder spread over 2025-08 .. 2026-06 (e.g.
  `date(2025, 8, 4) + timedelta(days=13 * i)` clamped before TODAY), so tables
  sort interestingly and most adjudicated alerts predate the open ones.
- Per-provider templates (category, severity, priorityScore base, description,
  threshold rule, document builder):
  - `equifax` - CREDIT, "New tradeline dispute filed" / "Credit utilization
    exceeded 90% on revolving accounts" / "Address change reported by furnisher" -
    `docs.credit_extract(bureau="Equifax", ...)`.
  - `transunion` - FINANCIAL, "30-day delinquency reported" / "Collection
    account update" - `docs.credit_extract(bureau="TransUnion", ...)`.
  - `fbi-cjis` - CRIMINAL, "Fingerprint-verified arrest notification" /
    "Disposition update on prior arrest record" - `docs.rapback(...)`.
  - `lexisnexis` - SUITABILITY, "Civil judgment filed" / "Eviction record" /
    "Professional license lapse" - `docs.incident_report(...)` with
    provider override? NO - incident_report is DISS-branded; use a
    `docs.credit_extract`-style civil record via `docs.incident_report` is
    wrong. Add ONE new builder `docs.public_record(...)` (docType
    "INCIDENT_REPORT" reused is wrong too) - simplest correct choice: add
    `"PUBLIC_RECORD"` to `DocType` and a `public_record` builder
    (fields: Record type, Court/Source, Filed, Amount/Status; section
    "Record detail"), provider "LexisNexis".
  - `fincen` - FINANCIAL, "SAR filed - structured cash deposits" / "Currency
    transaction report cluster" - `docs.sar(...)` with small 3-row
    transaction sets.
  - `cbp-i94` - FOREIGN_TRAVEL, "Unreported foreign travel" -
    `docs.travel_record(...)` (destinations: "Mexico", "United Arab Emirates").
  - `diss` - ELIGIBILITY, "Incident report filed in DISS" / "Eligibility
    review flag" - `docs.incident_report(...)`.
- Every description must avoid provider words (timeline test) - the timeline
  event note reuses the description, and `PROVIDER_WORDS` are checked against
  the event TITLE only; still keep descriptions provider-free for safety.
- identityMatch: reuse `roster._identity_identifiers` is roster-coupled
  (needs full profile); instead build from the case subject dict the same way -
  import it: `from roster import _identity_identifiers` (subjects here always
  have full profiles). confidence 0.94 + (i % 5) * 0.01.
- Timeline: append `{date, actor: "System", role: "CV", event:
  "<Category> alert received", note: description.rstrip('.')}` and, when
  ADJUDICATED, `{date: <last phase date>, actor: "R. Chen", role: "Analyst",
  event: "<Category> alert adjudicated", note: "No action - resolved"}`;
  labels from `roster.ALERT_EVENT_LABELS`. After appending, re-sort the whole
  case timeline by date (stable), since existing tests require ascending dates.

- [ ] **Step 1: Add `PUBLIC_RECORD` docType + builder to schemas/documents**

`schemas.py` `DocType` literal gains `"PUBLIC_RECORD"`. `documents.py` gains:

```python
def public_record(subject_id, slug, *, record_type, source, filed, status,
                  detail, received):
    return _doc(
        subject_id, slug, "PUBLIC_RECORD",
        record_type,
        f"{record_type}, {source}",
        "LexisNexis", received,
        [("Record type", record_type), ("Court / source", source),
         ("Filed", filed), ("Status", status)],
        sections=[("Record detail", detail)])
```

And `DocumentViewer.jsx` `DOC_TYPE_LABELS` gains `PUBLIC_RECORD: 'Public record'`
(one-line UI change, include in Task 4 commit if preferred).

- [ ] **Step 2: Write `cv_feed.py`** (complete file):

```python
"""Procedural CV alert feed: fills every CV provider's inbox deterministically.

Appended AFTER hero/roster cases are built so authored cases stay readable.
Every alert meets the data standards the tests enforce: providerId, source
document, phase history, timeline events.
"""
from datetime import date, timedelta

import documents as docs
from roster import ALERT_EVENT_LABELS, _identity_identifiers

# (providerId, display provider, category, severity, description,
#  threshold rule, doc kind)
FEED = [
    ("equifax", "Equifax", "CREDIT", "LOW",
     "Credit utilization exceeded 90% on revolving accounts",
     "Utilization > 90% on any revolving account", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "HIGH",
     "SAR filed - structured cash deposits under reporting threshold",
     "Any SAR naming the subject", "sar"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "MODERATE",
     "Civil judgment filed - unpaid homeowners association assessment",
     "Civil judgment > $1,000", "public"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "MODERATE",
     "Disposition update - prior charge dismissed",
     "Any disposition change while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "LOW",
     "30-day delinquency reported on retail account",
     "Delinquent debt > $500", "credit"),
    ("cbp-i94", "CBP I-94", "FOREIGN_TRAVEL", "MODERATE",
     "Unreported foreign travel - 5-day trip",
     "Unreported foreign travel (SEAD-3)", "travel"),
    ("diss", "DISS / prior adjudications", "ELIGIBILITY", "LOW",
     "Incident report filed - badge left unattended in common area",
     "Any incident report while CV-enrolled", "incident"),
    ("equifax", "Equifax", "CREDIT", "MODERATE",
     "New tradeline dispute filed by subject",
     "Any disputed tradeline", "credit"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "LOW",
     "Professional license lapse - engineering certification expired",
     "Any professional license action", "public"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "MODERATE",
     "Currency transaction report cluster - three CTRs in 60 days",
     "3+ CTRs in 90 days", "sar"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "HIGH",
     "Fingerprint-verified arrest notification - trespass",
     "Any arrest while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "MODERATE",
     "Collection account update - balance sold to new servicer",
     "Delinquent debt > $500", "credit"),
    ("cbp-i94", "CBP I-94", "FOREIGN_TRAVEL", "LOW",
     "Border crossing pair matched - reported vacation travel",
     "Unreported foreign travel (SEAD-3)", "travel"),
    ("diss", "DISS / prior adjudications", "ELIGIBILITY", "MODERATE",
     "Eligibility review flag - incident pattern review requested",
     "Two or more incidents in 24 months", "incident"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "MODERATE",
     "Eviction record - unlawful detainer filing",
     "Any eviction filing", "public"),
    ("equifax", "Equifax", "CREDIT", "LOW",
     "Address change reported by furnisher",
     "Identity-relevant record change", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "HIGH",
     "SAR filed - wire activity inconsistent with stated income",
     "Any SAR naming the subject", "sar"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "LOW",
     "Record expungement notification",
     "Any disposition change while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "LOW",
     "Delinquency cured - account returned to current",
     "Delinquent debt > $500", "credit"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "LOW",
     "Public record refresh - no new adverse items",
     "Scheduled public-records sweep", "public"),
    ("equifax", "Equifax", "CREDIT", "MODERATE",
     "New account opened - hard inquiry cluster",
     "3+ hard inquiries in 30 days", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "MODERATE",
     "CTR filed - single cash transaction over $10,000",
     "Any CTR naming the subject", "sar"),
]

HOSTS = ["SUBJ-012", "SUBJ-013", "SUBJ-014", "SUBJ-015", "SUBJ-001", "SUBJ-002"]
STATE_CYCLE = ["ADJUDICATED", "ADJUDICATED", "CLOSED", "ADJUDICATED",
               "NEW", "ADJUDICATED", "VALIDATED"]
SEVERITY_SCORE = {"HIGH": 74, "MODERATE": 52, "LOW": 28}
PHASE_ACTORS = {
    "NEW": "System",
    "IDENTITY_CONFIRMED": "R. Chen (Analyst)",
    "VALIDATED": "R. Chen (Analyst)",
    "REFERRED": "R. Chen (Analyst)",
    "ADJUDICATED": "L. Ortiz (Adjudicator)",
    "CLOSED": "R. Chen (Analyst)",
}
WALKS = {
    "ADJUDICATED": ["NEW", "IDENTITY_CONFIRMED", "VALIDATED", "REFERRED",
                    "ADJUDICATED"],
    "CLOSED": ["NEW", "CLOSED"],
    "VALIDATED": ["NEW", "IDENTITY_CONFIRMED", "VALIDATED"],
    "NEW": ["NEW"],
}
PHASE_OFFSETS = [0, 3, 8, 14, 21]


def _document(kind, subject_id, slug, received, description):
    if kind == "credit":
        bureau = "Equifax" if "equifax" in slug else "TransUnion"
        return docs.credit_extract(
            subject_id, slug, bureau=bureau,
            account_name="CV monitoring extract",
            account_number="(monitored file)", account_type="Consumer file",
            balance="-", past_due="-", days_past_due="-",
            date_reported=received,
            payment_status=description,
            history=f"{description}. Reported through scheduled CV credit "
                    "monitoring; full tradeline detail retained in bureau file.",
            received=received)
    if kind == "sar":
        return docs.sar(
            subject_id, slug, institution="First Commonwealth Bank",
            sar_number=f"SAR-{received.replace('-', '')}-{slug[-4:].upper()}",
            filing_date=received, period=received, total_amount="$18,400",
            narrative=description + ". Referred through FinCEN CV feed for "
                      "personnel-security review.",
            transactions=[(received, "Cash deposit", "$6,200"),
                          (received, "Cash deposit", "$6,100"),
                          (received, "Cash deposit", "$6,100")],
            received=received)
    if kind == "rapback":
        return docs.rapback(
            subject_id, slug, notification_id=f"NGI-RB-{slug[-6:].upper()}",
            trigger_event=description, arrest_date=received,
            agency="Fairfax County Police Department, VA", ori="VA0290000",
            charges=[description], received=received)
    if kind == "travel":
        return docs.travel_record(
            subject_id, slug, traveler="(subject of record)",
            document_number="5?????? (on file)", carrier="United UA 1204",
            departure=f"{received} (IAD)", arrival=f"{received} (MEX)",
            destination="Mexico", returned=received, received=received)
    if kind == "public":
        return docs.public_record(
            subject_id, slug, record_type=description.split(" - ")[0],
            source="Fairfax County Circuit Court", filed=received,
            status="Recorded", detail=description + ".", received=received)
    # incident
    return docs.incident_report(
        subject_id, slug, incident_id=f"SIR-{received.replace('-', '')}",
        date=received, facility="Contractor facility, Chantilly VA",
        category="Security incident",
        summary=description + ". Entered in DISS by the facility security "
                "officer; no compromise determined.",
        received=received)


def extend_cases(cases: list[dict]) -> None:
    by_id = {c["subject"]["id"]: c for c in cases}
    base = date(2025, 8, 4)
    for i, (pid, provider, category, severity, description, rule, kind) in enumerate(FEED):
        case = by_id[HOSTS[i % len(HOSTS)]]
        subj = case["subject"]
        received_d = base + timedelta(days=13 * i)
        received = received_d.isoformat()
        state = STATE_CYCLE[i % len(STATE_CYCLE)]
        alert_id = f"ALERT-{500 + i}"
        slug = f"cv-feed-{alert_id.lower()}"
        url, doc = _document(kind, subj["id"], slug, received, description)
        case.setdefault("sourceDocuments", {})[url] = doc

        history = []
        walk = WALKS[state]
        for j, phase in enumerate(walk):
            d = (received_d + timedelta(days=PHASE_OFFSETS[j])).isoformat()
            note = "Alert received via CV feed" if phase == "NEW" else None
            if phase == "CLOSED":
                note = "False positive - identifiers do not resolve to subject"
            if phase == "ADJUDICATED":
                note = "No action - resolved on review"
            history.append(dict(state=phase, date=d,
                                actor=PHASE_ACTORS[phase], note=note))

        case["alerts"].append(dict(
            id=alert_id, subjectId=subj["id"], subjectName=subj["name"],
            category=category, severity=severity,
            priorityScore=SEVERITY_SCORE[severity] + (i % 7),
            state=state, receivedDate=received,
            provider=provider, providerId=pid, description=description + ".",
            identityMatch=dict(
                confidence=round(0.94 + (i % 5) * 0.01, 2),
                identifiers=_identity_identifiers(i, subj)),
            threshold=dict(rule=rule, met=True,
                           detail="Meets CV investigative-standard threshold."),
            priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
            documents=[dict(title=doc["title"], url=url)],
            history=history,
        ))

        label = ALERT_EVENT_LABELS[category]
        case["timeline"].append(dict(
            date=received, actor="System", role="CV",
            event=f"{label} alert received", note=description))
        if state == "ADJUDICATED":
            case["timeline"].append(dict(
                date=history[-1]["date"], actor="R. Chen", role="Analyst",
                event=f"{label} alert adjudicated",
                note="No action - resolved on review"))
        case["timeline"].sort(key=lambda e: e["date"])
```

- [ ] **Step 3: Wire into the generator + providerId for existing alerts**

In `generate_demo_data.py`, after `cases = build_hero_cases(...) + build_roster_cases(...)`:

```python
    import cv_feed
    cv_feed.extend_cases(cases)

    # Canonical provider ids + computed open-alert counts.
    from documents import PROVIDER_IDS
    for c in cases:
        for a in c["alerts"]:
            a.setdefault("providerId", PROVIDER_IDS[a["provider"]])
        c["subject"]["openAlerts"] = sum(
            1 for a in c["alerts"] if a["state"] not in ("ADJUDICATED", "CLOSED"))
```

- [ ] **Step 4: Emit `provider-activity.json`** - in `generate_demo_data.py`,
after `validated_cases` is built (uses `PROVIDER_IDS` import from Step 3):

```python
    activity = {pid: schemas.ProviderActivity() for pid, _, *_ in PROVIDERS}
    for c in validated_cases:
        for a in c.alerts:
            activity[a.providerId].alertIds.append(a.id)
        for rc in c.investigation.recordChecks:
            pid = PROVIDER_IDS.get(rc.provider)
            if pid:
                activity[pid].recordChecks.append(schemas.ProviderCheckRef(
                    caseId=c.subject.id, subjectName=c.subject.name,
                    item=rc.item, category=rc.category, status=rc.status,
                    completedDate=rc.completedDate, documentUrl=rc.documentUrl))
    for url, d in source_documents.items():
        gd = schemas.GeneratedDocument.model_validate(d)
        pid = PROVIDER_IDS.get(gd.provider)
        if pid:
            activity[pid].documents.append(schemas.ProviderDocRef(
                caseId=gd.subjectId, subjectName=by_subject_name[gd.subjectId],
                title=gd.title, url=url, receivedDate=gd.receivedDate))
    dump(schemas.ProviderActivityFile(providers=activity).model_dump(),
         out_dir / "provider-activity.json")
```

with `by_subject_name = {c.subject.id: c.subject.name for c in validated_cases}`
defined just above. NOTE: the `dump(...)` of each `GeneratedDocument` already
runs earlier; keep this loop separate and place it after `validated_cases`.

- [ ] **Step 5: Run tests, fix, regenerate**

Run: `python -m pytest tests -q` - all pass (existing timeline/history/document
standards now also cover the 22 feed alerts; expect iteration here - phase dates,
sorted timelines, and `test_counts` (update its expected alert floor if it pins
a number)).
Then: `python generate_demo_data.py` and spot-check
`portal/public/data/provider-activity.json`.

- [ ] **Step 6: Commit**

```bash
git add portal/data_gen portal/public/data
git commit -m "feat(data): rich CV alert feed per provider, provider-activity index, computed openAlerts"
```

---

### Task 3: Provider detail page + route

**Files:**
- Modify: `portal/src/data/api.js` (one line)
- Create: `portal/src/pages/ProviderDetail.jsx`
- Modify: `portal/src/App.jsx` (route)
- Modify: `portal/src/pages/pages.css` (append)
- Create: `portal/src/__tests__/providerDetail.test.jsx`

**Interfaces:**
- Consumes: `getProviders()`, `getAlerts()` (alerts now carry `providerId`),
  new `getProviderActivity()`; `demo.alertStates`; existing components.
- Produces: route `/providers/:id`; `getProviderActivity = () =>
  fetchJson('provider-activity.json').then((d) => d.providers)`.

- [ ] **Step 1: api.js** - add:

```js
export const getProviderActivity = () =>
  fetchJson('provider-activity.json').then((d) => d.providers);
```

- [ ] **Step 2: Write failing tests** - `providerDetail.test.jsx`:

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';

const PROVIDERS = [
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'], status: 'HEALTHY',
    recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z' },
  { id: 'dmv', name: 'DMV records', category: 'Driver records',
    usedIn: ['INVESTIGATION'], guidelines: ['G', 'J'], status: 'HEALTHY',
    recordCount: 61208443, lastSync: '2026-07-02T06:00:00Z' },
];
const ALERTS = [
  { id: 'ALERT-1', subjectId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'HIGH', priorityScore: 82, state: 'NEW', receivedDate: '2026-06-20',
    description: 'New collection account.' },
  { id: 'ALERT-2', subjectId: 'SUBJ-002', subjectName: 'Marcus T. Bell',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'LOW', priorityScore: 22, state: 'ADJUDICATED',
    receivedDate: '2025-10-12', description: 'Resolved delinquency.' },
];
const ACTIVITY = {
  transunion: {
    alertIds: ['ALERT-1', 'ALERT-2'],
    recordChecks: [{ caseId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
      item: 'Credit check', category: 'FINANCIAL', status: 'COMPLETE',
      completedDate: '2026-03-15',
      documentUrl: 'documents/SUBJ-001/credit-extract.json' }],
    documents: [],
  },
  dmv: { alertIds: [], recordChecks: [{ caseId: 'SUBJ-003',
    subjectName: 'Priya N. Shah', item: 'Driver record check',
    category: 'CRIMINAL', status: 'COMPLETE', completedDate: '2026-06-14',
    documentUrl: null }], documents: [] },
};

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve(PROVIDERS),
  getAlerts: () => Promise.resolve(ALERTS),
  getProviderActivity: () => Promise.resolve(ACTIVITY),
}));

import ProviderDetail from '../pages/ProviderDetail.jsx';

function renderPage(id = 'transunion') {
  localStorage.setItem('demo.persona', 'analyst');
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[`/providers/${id}`]}>
        <Routes><Route path="/providers/:id" element={<ProviderDetail />} /></Routes>
      </MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('ProviderDetail', () => {
  it('shows the provider header with health and reach', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'TransUnion' })).toBeInTheDocument();
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(screen.getByText('23,910,287')).toBeInTheDocument();
  });

  it('computes alert KPIs and filters via KPI click', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Alerts Received').closest('.kpi-card')).toHaveTextContent('2');
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('1');
    fireEvent.click(screen.getByText('Open Alerts').closest('.kpi-card'));
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(within(table).queryByText('Marcus T. Bell')).not.toBeInTheDocument();
  });

  it('open KPI respects demo alert dispositions', async () => {
    localStorage.setItem('demo.state', JSON.stringify({
      alertStates: { 'ALERT-1': 'CLOSED' }, decisions: {}, roiEntries: {},
      worksheetRatings: {}, askThreads: {},
    }));
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('0');
  });

  it('lists record checks delivered with a case link', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Record Checks Delivered')).toBeInTheDocument();
    expect(screen.getByText('Credit check')).toBeInTheDocument();
  });

  it('investigation-only provider shows the neutral alerts note and no KPI band', async () => {
    renderPage('dmv');
    await screen.findByRole('heading', { name: 'DMV records' });
    expect(screen.getByText(/feeds investigations, not continuous vetting/i))
      .toBeInTheDocument();
    expect(screen.queryByText('Alerts Received')).not.toBeInTheDocument();
    expect(screen.getByText('Driver record check')).toBeInTheDocument();
  });

  it('unknown provider id shows an error', async () => {
    renderPage('nope');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run (from `portal/`): `npx vitest run src/__tests__/providerDetail.test.jsx`
Expected: FAIL - module missing.

- [ ] **Step 4: Implement `ProviderDetail.jsx`**

```jsx
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiCheckSquare, FiDatabase } from 'react-icons/fi';
import { getAlerts, getProviderActivity, getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_STATE_VARIANTS,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import KVGrid from '../components/KVGrid.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const CHECK_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };
const OPEN = (s) => !['ADJUDICATED', 'CLOSED'].includes(s);

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { demo } = useDemo();
  const providersQ = useData(getProviders);
  const alertsQ = useData(getAlerts);
  const activityQ = useData(getProviderActivity);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [category, setCategory] = useState('ALL');

  const loading = providersQ.loading || alertsQ.loading || activityQ.loading;
  const error = providersQ.error || alertsQ.error || activityQ.error;

  const model = useMemo(() => {
    if (loading || error) return null;
    const provider = providersQ.data.find((p) => p.id === id);
    if (!provider) return { missing: true };
    const alerts = alertsQ.data
      .filter((a) => a.providerId === id)
      .map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }))
      .sort((a, b) => (a.receivedDate < b.receivedDate ? 1 : -1));
    const activity = activityQ.data[id] || { recordChecks: [], documents: [] };
    return { provider, alerts, activity };
  }, [loading, error, providersQ.data, alertsQ.data, activityQ.data, id,
    demo.alertStates]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;
  if (model.missing) {
    return <div className="page"><ErrorAlert message={`Provider not found: ${id}`} /></div>;
  }

  const { provider: p, alerts, activity } = model;
  const isCv = p.usedIn.includes('CV');
  const open = alerts.filter((a) => OPEN(a.state));
  const toggleKpi = (key) => setKpiFilter((prev) => (prev === key ? null : key));

  const visible = alerts
    .filter((a) => category === 'ALL' || a.category === category)
    .filter((a) => {
      switch (kpiFilter) {
        case 'OPEN': return OPEN(a.state);
        case 'HIGH': return OPEN(a.state) && a.severity === 'HIGH';
        case 'DONE': return !OPEN(a.state);
        default: return true;
      }
    });

  const alertColumns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (a) => <strong>{a.subjectName}</strong> },
    { key: 'category', label: 'Category', sortable: true,
      render: (a) => ALERT_CATEGORY_LABELS[a.category] },
    { key: 'severity', label: 'Severity',
      render: (a) => <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</StatusBadge> },
    { key: 'priorityScore', label: 'AI Priority', sortable: true },
    { key: 'state', label: 'State',
      render: (a) => <StatusBadge variant={ALERT_STATE_VARIANTS[a.state]}>{ALERT_STATE_LABELS[a.state]}</StatusBadge> },
    { key: 'receivedDate', label: 'Received', sortable: true },
  ];

  const checkColumns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (c) => <strong>{c.subjectName}</strong> },
    { key: 'item', label: 'Check' },
    { key: 'status', label: 'Status',
      render: (c) => <StatusBadge variant={CHECK_VARIANT[c.status]}>{c.status}</StatusBadge> },
    { key: 'completedDate', label: 'Completed', sortable: true,
      render: (c) => c.completedDate || 'Pending' },
    { key: 'caseId', label: 'Case',
      render: (c) => (
        <Link to={`/cases/${c.caseId}?tab=investigation`}
          onClick={(e) => e.stopPropagation()}>
          View in case
        </Link>
      ) },
  ];

  return (
    <div className="page">
      <Link className="provider-back" to="/providers">
        <FiArrowLeft aria-hidden="true" /> Data Providers
      </Link>
      <div className="page-header">
        <div>
          <h1>{p.name}</h1>
          <p>{p.category}</p>
        </div>
        <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
      </div>

      <div className="card">
        <KVGrid items={[
          { label: 'Records', value: p.recordCount.toLocaleString('en-US') },
          { label: 'Last sync', value: p.lastSync.slice(0, 10) },
          { label: 'Used in',
            value: p.usedIn.map((u) => (
              <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>)) },
          { label: 'Guidelines covered',
            value: p.guidelines.map((g) => <GuidelineChip key={g} code={g} />) },
        ]} />
      </div>

      {isCv ? (
        <>
          <div className="kpi-grid">
            <KPICard label="Alerts Received" value={alerts.length}
              accent="var(--dcsa-navy)"
              onClick={() => toggleKpi(null)} active={kpiFilter === null} />
            <KPICard label="Open Alerts" value={open.length}
              accent="var(--status-alert)"
              onClick={() => toggleKpi('OPEN')} active={kpiFilter === 'OPEN'} />
            <KPICard label="High Severity"
              value={open.filter((a) => a.severity === 'HIGH').length}
              accent="var(--risk-high)"
              onClick={() => toggleKpi('HIGH')} active={kpiFilter === 'HIGH'} />
            <KPICard label="Adjudicated / Closed"
              value={alerts.length - open.length}
              accent="var(--status-clear)"
              onClick={() => toggleKpi('DONE')} active={kpiFilter === 'DONE'} />
          </div>
          <div className="card">
            <div className="provider-alerts-head">
              <h3><FiActivity className="section-icon" aria-hidden="true" />
                Alerts from This Source</h3>
              <label className="form-group">
                <span>Category</span>
                <select aria-label="Category" value={category}
                  onChange={(e) => setCategory(e.target.value)}>
                  <option value="ALL">All categories</option>
                  {Object.entries(ALERT_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>))}
                </select>
              </label>
            </div>
            {visible.length === 0
              ? <EmptyState title="No alerts"
                  message="No alerts match the current filter." />
              : <DataTable columns={alertColumns} rows={visible} rowKey="id"
                  onRowClick={(a) =>
                    navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`)} />}
          </div>
        </>
      ) : (
        <div className="card">
          <h3><FiActivity className="section-icon" aria-hidden="true" />
            Alerts from This Source</h3>
          <p className="muted">
            This source feeds investigations, not continuous vetting - it
            delivers record checks during background investigations and does
            not generate CV alerts.
          </p>
        </div>
      )}

      <div className="card">
        <h3><FiCheckSquare className="section-icon" aria-hidden="true" />
          Record Checks Delivered
          {activity.documents.length > 0 && (
            <span className="muted provider-doc-count">
              <FiDatabase aria-hidden="true" /> {activity.documents.length} documents delivered
            </span>
          )}
        </h3>
        {activity.recordChecks.length === 0
          ? <p className="muted">No record checks delivered in the demo data.</p>
          : <DataTable columns={checkColumns} rows={activity.recordChecks}
              rowKey="item"
              onRowClick={(c) => navigate(`/cases/${c.caseId}?tab=investigation`)} />}
      </div>

      <SectionRef>
        Continuous vetting under <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>;
        record checks per the{' '}
        <RefLink href={REFS.FIS}>Federal Investigative Standards</RefLink>.
      </SectionRef>
    </div>
  );
}
```

NOTE: `rowKey="item"` collides if one provider delivered the same check item
for two cases - use a composite: change `DataTable` call to
`rows={activity.recordChecks.map((c) => ({ ...c, key: `${c.caseId}-${c.item}` }))}`
with `rowKey="key"`.

- [ ] **Step 5: Route** - in `App.jsx`, next to the providers route:

```jsx
              <Route path="/providers/:id" element={<ProviderDetail />} />
```

(plus `import ProviderDetail from './pages/ProviderDetail.jsx';`)

- [ ] **Step 6: CSS** - append to `pages.css`:

```css
/* Provider detail */
.provider-back { display: inline-flex; align-items: center; gap: var(--space-2);
  font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--space-3); }
.provider-alerts-head { display: flex; justify-content: space-between;
  align-items: flex-end; gap: var(--space-4); flex-wrap: wrap;
  margin-bottom: var(--space-3); }
.provider-doc-count { display: inline-flex; align-items: center; gap: var(--space-1);
  margin-left: var(--space-3); font-size: var(--font-size-sm); font-weight: 400; }
```

- [ ] **Step 7: Run tests to verify pass, then commit**

Run: `npx vitest run src/__tests__/providerDetail.test.jsx`
Expected: PASS.

```bash
git add portal/src
git commit -m "feat(portal): provider detail page - alert KPIs, filterable feed, record checks delivered"
```

---

### Task 4: Grid cards click through + activity line

**Files:**
- Modify: `portal/src/pages/DataProviders.jsx`
- Modify: `portal/src/pages/pages.css` (append)
- Modify: `portal/src/components/DocumentViewer.jsx` (DOC_TYPE_LABELS +
  `PUBLIC_RECORD: 'Public record'` and PAPER_ISSUER `PUBLIC_RECORD: (d) => d.provider`)
- Modify: `portal/src/__tests__/dataProviders.test.jsx`

**Interfaces:**
- Consumes: `getAlerts()`, `getProviderActivity()` for the per-card counts.

- [ ] **Step 1: Extend the dataProviders test** (mock gains alerts/activity;
follow the file's existing render pattern, adding MemoryRouter if absent):

```jsx
  it('cards link to the provider detail page and show activity counts', async () => {
    renderPage();
    const card = (await screen.findByRole('heading', { name: 'TransUnion' }))
      .closest('.provider-card');
    expect(card).toHaveTextContent(/2 alerts/);
    expect(card).toHaveTextContent(/1 record check/);
    fireEvent.click(card);
    // renderPage wraps in MemoryRouter with a /providers/:id probe route
    expect(await screen.findByTestId('provider-detail-probe')).toHaveTextContent('transunion');
  });
```

with the harness route:

```jsx
import { useParams } from 'react-router-dom';
function Probe() {
  const { id } = useParams();
  return <div data-testid="provider-detail-probe">{id}</div>;
}
// in render: <Routes>
//   <Route path="/providers" element={<DataProviders />} />
//   <Route path="/providers/:id" element={<Probe />} />
// </Routes> with initialEntries={['/providers']}
```

- [ ] **Step 2: Run to verify failure**, then implement in `DataProviders.jsx`:

- add `useNavigate`, `getAlerts`, `getProviderActivity` imports and queries;
- compute `const counts = (id) => ({ alerts: (alertsQ.data || []).filter((a) => a.providerId === id).length, checks: activityQ.data?.[id]?.recordChecks.length || 0 });`
- card becomes a button:

```jsx
          <button key={p.id} type="button" className="card provider-card card-interactive"
            onClick={() => navigate(`/providers/${p.id}`)}>
            ...existing card body...
            <p className="muted provider-activity-line">
              {counts(p.id).alerts} alerts · {counts(p.id).checks} record checks
            </p>
          </button>
```

- CSS: `.provider-card { text-align: left; font: inherit; cursor: pointer; }`
  (button reset) appended to pages.css; keep existing provider-card rules.

- [ ] **Step 3: Full vitest + commit**

Run: `npx vitest run` - all green (fix any dataProviders snapshot fallout).

```bash
git add portal/src
git commit -m "feat(portal): provider cards click through to detail with activity counts"
```

---

### Task 5: Smoke test + full verification

**Files:**
- Modify: `portal/e2e/smoke.spec.js`

- [ ] **Step 1: Add to the smoke journey** (after the providers-page block;
mind the sign-in gate helper the spec file already uses):

```js
  await page.goto('/#/providers');
  await page.getByRole('button', { name: /TransUnion/ }).click();
  await expect(page.getByText('Alerts Received')).toBeVisible();
  await page.getByRole('cell', { name: /Marcus T. Bell/ }).first().click();
  await expect(page).toHaveURL(/continuous-vetting/);
```

- [ ] **Step 2: Full verification**

```bash
cd portal/data_gen && python -m pytest tests -q     # all pass
cd .. && npx vitest run                              # all pass
npm run build                                        # succeeds
npx playwright test                                  # smoke green
```

- [ ] **Step 3: Verify in the running app** (verify skill): dev server;
click Equifax (CV, new alerts), DMV (INV-only note + checks), TransUnion
(KPIs; toggle Open Alerts; row click lands on case CV tab with alert open).

- [ ] **Step 4: Commit (push only when the user says to deploy)**

```bash
git add portal
git commit -m "test(portal): smoke coverage for provider drill-down"
```
