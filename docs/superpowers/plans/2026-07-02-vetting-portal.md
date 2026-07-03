# Personnel Vetting Case Management Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Checkr-inspired, DCSA-branded static React demo of a personnel-vetting case management platform (investigator/analyst/adjudicator personas, SEAD-4 guideline views, investigation history, adjudication workspace, continuous vetting, data providers), fed by a Python generator that produces schema-validated JSON from synthetic subjects + the real DOHA corpus.

**Architecture:** Two halves. (1) `portal/data_gen/` — Python (pydantic v2 + pandas) generates static JSON into `portal/public/data/`, pulling real precedents and analytics from `doha_parsed_cases/all_cases_*.parquet` with curated fallbacks. (2) `portal/src/` — React 18 + Vite SPA, react-router (HashRouter, so static hosting needs no rewrites), plain CSS with official DCSA tokens, Recharts for charts. Demo actions persist to localStorage only.

**Tech Stack:** React 18, Vite 5, react-router-dom 6, Recharts 2, @fontsource/source-sans-pro, Vitest + @testing-library/react + jsdom; Python 3.11+ (repo uses 3.12), pydantic 2, pandas, pytest.

**Spec:** `docs/superpowers/specs/2026-07-02-vetting-case-management-design.md` (+ research notes beside it).

## Global Constraints

- Official DCSA palette ONLY: navy `#002D5B`, ocean `#0099D8`, sky `#00A6DC`, ice `#91D0E4`, gold `#D4AF37`, charcoal `#5B5B5A`; USWDS status colors: success `#2E7D32`/bg `#E8F5E9`, error `#C62828`/bg `#FFEBEE`, warning `#E65100`/bg `#FFF3E0`, info `#1565C0`/bg `#E3F2FD`; risk low `#F57F17`. NO teal `#009BB5`. Never hardcode hex in components — always `var(--…)` or the CSS custom-property badge pattern.
- Typography: Source Sans Pro via `@fontsource/source-sans-pro` (weights 400, 600, 700). Sentence case for UI copy.
- 4px spacing scale; radii 4/8/12px; 56px header; 220px sidebar (per DCSA Design System Reference.md — the authoritative style source; its Recharts theming section governs chart styling).
- Every AI-derived UI element must render the `AIBadge` component (label: "AI-assisted"; tooltip: "AI-assisted — human decision authority").
- All synthetic identities clearly fictional. SSNs always masked (`***-**-1234` form).
- No backend, no API keys, no network calls at runtime except fetching `public/data/*.json`.
- Generated JSON under `portal/public/data/` is committed. The generator must be deterministic (fixed seed, no wall-clock dates — use fixed reference date `2026-07-02`).
- The existing Streamlit app and Python package are untouched.
- Commit after every task (steps include the commands).
- JS: functional components only, no TypeScript, no Tailwind/CSS-in-JS. Python: type hints, pydantic v2 API (`model_validate`, `model_dump`).

## File Structure (what gets built where)

```
portal/
  package.json  vite.config.js  index.html  .gitignore
  public/data/                    # generated JSON (committed): subjects.json,
                                  #   cases/<ID>.json, alerts.json, providers.json, analytics.json
  data_gen/
    schemas.py                    # pydantic contracts for every JSON file
    corpus.py                     # parquet loading, precedent lookup, corpus analytics
    hero_cases.py                 # 3 deep hand-authored cases
    roster.py                     # 12 lighter procedural subjects
    generate_demo_data.py         # main entry: build -> validate -> write
    tests/ conftest.py  test_schemas.py  test_corpus.py  test_generator.py
  src/
    main.jsx  App.jsx
    domain.js                     # guideline names, personas, enums, risk bands, alert state machine
    design-system/variables.css  design-system/base.css
    data/api.js  data/useData.js
    state/PersonaContext.jsx  state/DemoContext.jsx
    components/ *.jsx  components.css      # shared primitives
    layouts/AppShell.jsx  layouts/shell.css
    pages/ Dashboard.jsx CaseQueue.jsx CVAlerts.jsx DataProviders.jsx Analytics.jsx NotFound.jsx pages.css
    pages/case/ CaseDetail.jsx OverviewTab.jsx GuidelinesTab.jsx InvestigationTab.jsx
                AdjudicationTab.jsx CVTab.jsx DocumentsTab.jsx case.css
  src/__tests__/                  # vitest specs, one file per task area
```

Task order: 1–3 (Python data) are independent of 4–17 (React) except that Task 8+ need Task 3's committed JSON. Tasks 8–9 and 10–14 and 15–17 are parallelizable groups after Task 7.

---

### Task 1: Data contracts (pydantic schemas)

**Files:**
- Create: `portal/data_gen/schemas.py`
- Create: `portal/data_gen/tests/conftest.py`
- Test: `portal/data_gen/tests/test_schemas.py`

**Interfaces:**
- Consumes: nothing.
- Produces: every model below, imported by Tasks 2–3 as `import schemas` (tests add `portal/data_gen` to `sys.path` via conftest). Key models: `SubjectSummary`, `SubjectProfile`, `CaseDetail`, `CVAlert`, `ProviderInfo`, `Analytics`, `SubjectsFile`, `AlertsFile`, `ProvidersFile`. Field names are camelCase — they serialize 1:1 into the JSON the React app reads.

- [ ] **Step 1: Write the failing test**

`portal/data_gen/tests/conftest.py`:

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
```

`portal/data_gen/tests/test_schemas.py`:

```python
import pytest
from pydantic import ValidationError

import schemas


def make_subject(**overrides):
    base = dict(
        id="SUBJ-001", name="Test Person", position="Systems Engineer",
        tier="T5", stage="ADJUDICATION", status="NEEDS_REVIEW",
        eligibility="INTERIM", riskScore=72, fastTrack=False,
        flaggedGuidelines=["F", "B"], daysInStage=41, cvEnrolled=True, openAlerts=1,
    )
    base.update(overrides)
    return base


def test_subject_summary_valid():
    s = schemas.SubjectSummary.model_validate(make_subject())
    assert s.riskScore == 72 and s.flaggedGuidelines == ["F", "B"]


def test_subject_rejects_bad_values():
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(riskScore=140))
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(tier="T9"))
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(flaggedGuidelines=["Z"]))


def test_cv_alert_valid():
    alert = schemas.CVAlert.model_validate(dict(
        id="ALERT-001", subjectId="SUBJ-001", subjectName="Test Person",
        category="FINANCIAL", severity="MODERATE", priorityScore=64, state="NEW",
        receivedDate="2026-06-20", provider="TransUnion",
        description="New delinquent account reported, $12,400 past due.",
        identityMatch=dict(confidence=0.94, identifiers=[
            dict(field="Name", subjectValue="Test Person", recordValue="Test Person", match=True),
            dict(field="DOB", subjectValue="1988-03-14", recordValue="1988-03-14", match=True),
        ]),
        threshold=dict(rule="Delinquent debt > $5,000", met=True,
                       detail="Reported past-due balance $12,400 exceeds threshold."),
        priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
    ))
    assert alert.identityMatch.confidence == pytest.approx(0.94)


def test_case_detail_requires_nested_blocks():
    with pytest.raises(ValidationError):
        schemas.CaseDetail.model_validate({"subject": make_subject()})


def test_analytics_roundtrip():
    a = schemas.Analytics.model_validate(dict(
        corpus=dict(totalCases=36700, byOutcome={"GRANTED": 12000, "DENIED": 16000},
                    byYear=[dict(year=2020, granted=1500, denied=2100)],
                    byGuideline=[dict(code="F", name="Financial Considerations",
                                      cases=15000, deniedPct=61.5)],
                    byCaseType={"hearing": 28650, "appeal": 8050}),
        pipeline=dict(timeliness=[dict(stage="Investigation", avgDays=73, targetDays=90)],
                      alertVolume=[dict(category="FINANCIAL", count=42)],
                      triageDistribution=[dict(band="high", count=3)]),
    ))
    assert a.corpus.totalCases == 36700
```

- [ ] **Step 2: Run test to verify it fails**

Run (from repo root): `python -m pytest portal/data_gen/tests/test_schemas.py -v`
Expected: FAIL / ERROR with `ModuleNotFoundError: No module named 'schemas'`

- [ ] **Step 3: Write the schemas**

`portal/data_gen/schemas.py`:

```python
"""Pydantic contracts for portal/public/data/*.json. camelCase fields serialize 1:1."""
from typing import Literal, Optional
from pydantic import BaseModel, Field

Tier = Literal["T1", "T2", "T3", "T4", "T5"]
Stage = Literal["INITIATION", "INVESTIGATION", "ADJUDICATION", "CONTINUOUS_VETTING"]
Status = Literal["CLEAR", "NEEDS_REVIEW", "ACTION_REQUIRED"]
Eligibility = Literal["NONE", "INTERIM", "SECRET", "TOP_SECRET"]
GuidelineCode = Literal["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]
Severity = Literal["A", "B", "C", "D"]  # D most severe, per EVC badge pattern
AlertCategory = Literal["CRIMINAL", "FINANCIAL", "CREDIT", "FOREIGN_TRAVEL",
                        "TERRORISM", "ELIGIBILITY", "SUITABILITY"]
AlertSeverity = Literal["HIGH", "MODERATE", "LOW"]
AlertState = Literal["NEW", "IDENTITY_CONFIRMED", "VALIDATED", "REFERRED",
                     "ADJUDICATED", "CLOSED"]
Applicability = Literal["FULL", "PARTIAL", "NONE"]
CoverageStatus = Literal["COMPLETE", "PENDING", "NOT_REQUIRED"]
AdjAction = Literal["GRANT", "GRANT_WITH_EXCEPTION", "LOI", "SOR", "DENY"]


class SubjectSummary(BaseModel):
    id: str
    name: str
    position: str
    tier: Tier
    stage: Stage
    status: Status
    eligibility: Eligibility
    riskScore: int = Field(ge=0, le=100)
    fastTrack: bool
    flaggedGuidelines: list[GuidelineCode]
    daysInStage: int = Field(ge=0)
    cvEnrolled: bool
    openAlerts: int = Field(ge=0)


class SubjectProfile(SubjectSummary):
    ssnMasked: str
    dob: str
    address: str


class EvidenceItem(BaseModel):
    provider: str
    type: str
    description: str
    date: str


class Disqualifier(BaseModel):
    code: str          # e.g. "AG ¶ 19(a)"
    description: str
    evidence: str


class Mitigator(BaseModel):
    code: str
    description: str
    applicability: Applicability
    reasoning: str


class Precedent(BaseModel):
    caseNumber: str
    outcome: str
    year: Optional[int] = None
    relevance: str


class GuidelineAssessment(BaseModel):
    code: GuidelineCode
    name: str
    severity: Severity
    aiReasoning: str
    evidence: list[EvidenceItem]
    disqualifiers: list[Disqualifier]
    mitigators: list[Mitigator]
    precedents: list[Precedent]


class TimelineEvent(BaseModel):
    date: str
    actor: str
    role: str
    event: str
    note: Optional[str] = None


class WholePersonFactor(BaseModel):
    factor: str
    assessment: str


class CoverageItem(BaseModel):
    item: str
    status: CoverageStatus


class SF86Section(BaseModel):
    section: str       # e.g. "Section 20A"
    title: str
    subjectReport: str
    matchedResult: str
    discrepancy: bool
    providers: list[str]
    guideline: Optional[GuidelineCode] = None


class Interview(BaseModel):
    date: str
    type: str
    interviewer: str
    summary: str


class RoiEntry(BaseModel):
    date: str
    investigator: str
    item: str
    text: str


class Investigation(BaseModel):
    coverage: list[CoverageItem]
    sf86Sections: list[SF86Section]
    interviews: list[Interview]
    roiEntries: list[RoiEntry]


class Recommendation(BaseModel):
    action: AdjAction
    aiSuggested: bool
    rationale: str


class Decision(BaseModel):
    date: str
    adjudicator: str
    action: AdjAction
    rationale: str


class Adjudication(BaseModel):
    recommendation: Recommendation
    sorDraft: Optional[str] = None
    decisions: list[Decision]


class IdentityIdentifier(BaseModel):
    field: str
    subjectValue: str
    recordValue: str
    match: bool


class IdentityMatch(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    identifiers: list[IdentityIdentifier]


class Threshold(BaseModel):
    rule: str
    met: bool
    detail: str


class PriorAdjudication(BaseModel):
    previouslyAdjudicated: bool
    reference: Optional[str] = None


class CVAlert(BaseModel):
    id: str
    subjectId: str
    subjectName: str
    category: AlertCategory
    severity: AlertSeverity
    priorityScore: int = Field(ge=0, le=100)
    state: AlertState
    receivedDate: str
    provider: str
    description: str
    identityMatch: IdentityMatch
    threshold: Threshold
    priorAdjudication: PriorAdjudication


class Document(BaseModel):
    title: str
    type: str
    description: str
    url: Optional[str] = None


class CaseDetail(BaseModel):
    subject: SubjectProfile
    aiSummary: str
    timeline: list[TimelineEvent]
    wholePerson: list[WholePersonFactor]
    guidelines: list[GuidelineAssessment]
    investigation: Investigation
    adjudication: Adjudication
    alerts: list[CVAlert]
    documents: list[Document]


class ProviderInfo(BaseModel):
    id: str
    name: str
    category: str
    usedIn: list[Literal["INVESTIGATION", "CV"]]
    guidelines: list[GuidelineCode]
    status: Literal["HEALTHY", "DEGRADED", "OFFLINE"]
    recordCount: int = Field(ge=0)
    lastSync: str


class YearStat(BaseModel):
    year: int
    granted: int
    denied: int


class GuidelineStat(BaseModel):
    code: GuidelineCode
    name: str
    cases: int
    deniedPct: float


class CorpusStats(BaseModel):
    totalCases: int
    byOutcome: dict[str, int]
    byYear: list[YearStat]
    byGuideline: list[GuidelineStat]
    byCaseType: dict[str, int]


class TimelinessStat(BaseModel):
    stage: str
    avgDays: int
    targetDays: int


class AlertVolume(BaseModel):
    category: AlertCategory
    count: int


class TriageBand(BaseModel):
    band: Literal["low", "moderate", "high"]
    count: int


class PipelineStats(BaseModel):
    timeliness: list[TimelinessStat]
    alertVolume: list[AlertVolume]
    triageDistribution: list[TriageBand]


class Analytics(BaseModel):
    corpus: CorpusStats
    pipeline: PipelineStats


class SubjectsFile(BaseModel):
    subjects: list[SubjectSummary]


class AlertsFile(BaseModel):
    alerts: list[CVAlert]


class ProvidersFile(BaseModel):
    providers: list[ProviderInfo]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest portal/data_gen/tests/test_schemas.py -v`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add portal/data_gen/schemas.py portal/data_gen/tests/
git commit -m "feat(portal): add pydantic data contracts for demo JSON"
```

---

### Task 2: Corpus access — real DOHA precedents + analytics

**Files:**
- Create: `portal/data_gen/corpus.py`
- Test: `portal/data_gen/tests/test_corpus.py`

**Interfaces:**
- Consumes: `doha_parsed_cases/all_cases_1.parquet` and `all_cases_2.parquet` (columns used: `case_number: str`, `date: str` like "August 2, 2007", `outcome: str`, `guidelines: list[str]`, `case_type: str` in {"hearing","appeal"}). Files may be absent (CI without LFS) — everything must degrade to fallbacks.
- Produces:
  - `load_corpus() -> pandas.DataFrame | None`
  - `extract_year(date_str: str) -> int | None`
  - `find_precedents(df, code: str, limit: int = 3) -> list[dict]` — dicts shaped like `schemas.Precedent` (keys: caseNumber, outcome, year, relevance); falls back to `FALLBACK_PRECEDENTS[code]` when `df is None` or no hits.
  - `corpus_analytics(df) -> dict` — dict shaped like `schemas.CorpusStats`; fallback `FALLBACK_CORPUS_STATS` when `df is None`.

- [ ] **Step 1: Write the failing test**

`portal/data_gen/tests/test_corpus.py`:

```python
import pandas as pd
import pytest

import corpus
import schemas


@pytest.fixture
def tiny_df():
    return pd.DataFrame([
        dict(case_number="20-01001", date="March 5, 2021", outcome="DENIED",
             guidelines=["F", "B"], case_type="hearing"),
        dict(case_number="19-02002", date="July 12, 2019", outcome="GRANTED",
             guidelines=["F"], case_type="hearing"),
        dict(case_number="21-03003", date="unknown", outcome="DENIED",
             guidelines=["J"], case_type="appeal"),
        dict(case_number="18-04004", date="May 1, 2018", outcome="REMANDED",
             guidelines=["F"], case_type="appeal"),
    ])


def test_extract_year():
    assert corpus.extract_year("March 5, 2021") == 2021
    assert corpus.extract_year("garbage") is None


def test_find_precedents_filters_and_validates(tiny_df):
    hits = corpus.find_precedents(tiny_df, "F", limit=3)
    assert 1 <= len(hits) <= 3
    assert all(h["outcome"] in ("GRANTED", "DENIED") for h in hits)
    for h in hits:
        schemas.Precedent.model_validate(h)


def test_find_precedents_fallback_without_corpus():
    hits = corpus.find_precedents(None, "F")
    assert hits and all("sample" in h["relevance"].lower() for h in hits)
    for h in hits:
        schemas.Precedent.model_validate(h)


def test_corpus_analytics_shape(tiny_df):
    stats = corpus.corpus_analytics(tiny_df)
    validated = schemas.CorpusStats.model_validate(stats)
    assert validated.totalCases == 4
    assert validated.byCaseType == {"hearing": 2, "appeal": 2}
    f_stat = next(g for g in validated.byGuideline if g.code == "F")
    assert f_stat.cases == 3


def test_corpus_analytics_fallback():
    stats = corpus.corpus_analytics(None)
    schemas.CorpusStats.model_validate(stats)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest portal/data_gen/tests/test_corpus.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'corpus'`

- [ ] **Step 3: Implement corpus.py**

```python
"""Read the real DOHA corpus (parquet) for precedents and analytics, with fallbacks."""
import re
from collections import Counter
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
PARQUET_PATHS = [
    REPO_ROOT / "doha_parsed_cases" / "all_cases_1.parquet",
    REPO_ROOT / "doha_parsed_cases" / "all_cases_2.parquet",
]
COLUMNS = ["case_number", "date", "outcome", "guidelines", "case_type"]

GUIDELINE_NAMES = {
    "A": "Allegiance to the United States", "B": "Foreign Influence",
    "C": "Foreign Preference", "D": "Sexual Behavior", "E": "Personal Conduct",
    "F": "Financial Considerations", "G": "Alcohol Consumption",
    "H": "Drug Involvement and Substance Misuse", "I": "Psychological Conditions",
    "J": "Criminal Conduct", "K": "Handling Protected Information",
    "L": "Outside Activities", "M": "Use of Information Technology",
}

FALLBACK_PRECEDENTS = {
    code: [
        dict(caseNumber=f"ISCR 20-0{i}000", outcome=outcome, year=2020 + i,
             relevance=f"Sample DOHA decision involving Guideline {code} (offline placeholder)")
        for i, outcome in ((1, "DENIED"), (2, "GRANTED"))
    ]
    for code in GUIDELINE_NAMES
}

FALLBACK_CORPUS_STATS = dict(
    totalCases=36700,
    byOutcome={"DENIED": 19800, "GRANTED": 13200, "OTHER": 3700},
    byYear=[dict(year=y, granted=1200 + (y % 5) * 90, denied=1800 + (y % 4) * 110)
            for y in range(2016, 2026)],
    byGuideline=[dict(code=c, name=GUIDELINE_NAMES[c], cases=800, deniedPct=60.0)
                 for c in GUIDELINE_NAMES],
    byCaseType={"hearing": 28650, "appeal": 8050},
)


def load_corpus() -> pd.DataFrame | None:
    frames = [pd.read_parquet(p, columns=COLUMNS) for p in PARQUET_PATHS if p.exists()]
    if not frames:
        return None
    return pd.concat(frames, ignore_index=True)


def extract_year(date_str) -> int | None:
    m = re.search(r"(19|20)\d{2}", str(date_str))
    return int(m.group(0)) if m else None


def _has_guideline(guidelines, code: str) -> bool:
    # Parquet nulls arrive as None or NaN (float); values are lists/ndarrays of strings.
    if guidelines is None or isinstance(guidelines, float):
        return False
    return code in list(guidelines)


def find_precedents(df: pd.DataFrame | None, code: str, limit: int = 3) -> list[dict]:
    if df is None:
        return FALLBACK_PRECEDENTS[code][:limit]
    hits = df[df["guidelines"].apply(_has_guideline, code=code)
              & df["outcome"].isin(["DENIED", "GRANTED"])]
    if hits.empty:
        return FALLBACK_PRECEDENTS[code][:limit]
    # Deterministic mix: newest DENIED first, then newest GRANTED.
    hits = hits.assign(_year=hits["date"].map(extract_year)).sort_values(
        ["_year", "case_number"], ascending=[False, True], na_position="last")
    picks = pd.concat([hits[hits["outcome"] == "DENIED"].head(2),
                       hits[hits["outcome"] == "GRANTED"].head(1)]).head(limit)
    return [
        dict(caseNumber=str(r.case_number), outcome=str(r.outcome),
             year=extract_year(r.date),
             relevance=f"DOHA {r.case_type} decision involving Guideline {code} "
                       f"({GUIDELINE_NAMES[code]})")
        for r in picks.itertuples()
    ]


def corpus_analytics(df: pd.DataFrame | None) -> dict:
    if df is None:
        return FALLBACK_CORPUS_STATS
    outcomes = Counter(df["outcome"].fillna("UNKNOWN"))
    years = df["date"].map(extract_year)
    by_year = []
    for y in sorted({int(v) for v in years.dropna().unique() if 2016 <= v <= 2026}):
        mask = years == y
        by_year.append(dict(year=int(y),
                            granted=int((df.loc[mask, "outcome"] == "GRANTED").sum()),
                            denied=int((df.loc[mask, "outcome"] == "DENIED").sum())))
    by_guideline = []
    for code, name in GUIDELINE_NAMES.items():
        mask = df["guidelines"].apply(_has_guideline, code=code)
        n = int(mask.sum())
        denied = int((df.loc[mask, "outcome"] == "DENIED").sum())
        decided = int(df.loc[mask, "outcome"].isin(["DENIED", "GRANTED"]).sum())
        by_guideline.append(dict(code=code, name=name, cases=n,
                                 deniedPct=round(100.0 * denied / decided, 1) if decided else 0.0))
    return dict(
        totalCases=int(len(df)),
        byOutcome={str(k): int(v) for k, v in outcomes.items()},
        byYear=by_year,
        byGuideline=by_guideline,
        byCaseType={str(k): int(v) for k, v in Counter(df["case_type"].fillna("unknown")).items()},
    )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m pytest portal/data_gen/tests/test_corpus.py -v`
Expected: 5 passed

Also sanity-check against the real corpus (local only):
Run: `python -c "import sys; sys.path.insert(0,'portal/data_gen'); import corpus; df=corpus.load_corpus(); print(len(df) if df is not None else 'no corpus'); print(corpus.find_precedents(df,'F'))"`
Expected: a case count (~36,000+) and 3 real precedent dicts.

- [ ] **Step 5: Commit**

```bash
git add portal/data_gen/corpus.py portal/data_gen/tests/test_corpus.py
git commit -m "feat(portal): corpus access for real DOHA precedents and analytics"
```

---

### Task 3: Hero cases, roster, and the generator

**Files:**
- Create: `portal/data_gen/hero_cases.py`
- Create: `portal/data_gen/roster.py`
- Create: `portal/data_gen/generate_demo_data.py`
- Test: `portal/data_gen/tests/test_generator.py`
- Output (committed): `portal/public/data/subjects.json`, `portal/public/data/cases/*.json`, `portal/public/data/alerts.json`, `portal/public/data/providers.json`, `portal/public/data/analytics.json`

**Interfaces:**
- Consumes: `schemas` (Task 1), `corpus.load_corpus/find_precedents/corpus_analytics` (Task 2).
- Produces: the five JSON artifacts the React app reads. `generate_demo_data.main(out_dir: Path) -> dict` returns `{"subjects": int, "cases": int, "alerts": int}` counts. `hero_cases.build_hero_cases(precedent_fn) -> list[dict]` (3 CaseDetail dicts; `precedent_fn(code) -> list[dict]`). `roster.build_roster_cases(precedent_fn) -> list[dict]` (12 CaseDetail dicts). Fixed reference date: `TODAY = "2026-07-02"`.

**Content requirements (from spec):**
- Hero 1 `SUBJ-001` Daniel Okafor — T5, ADJUDICATION, Guidelines F + B, riskScore ~78, status ACTION_REQUIRED: delinquent debt + foreign contacts, discrepancy on SF-86 §20A, SOR draft present, 2 CV alerts (FINANCIAL new, FOREIGN_TRAVEL validated).
- Hero 2 `SUBJ-002` Marcus Bell — T3, CONTINUOUS_VETTING, Guidelines J + G, riskScore ~64, NEEDS_REVIEW: post-grant DUI arrest alert (CRIMINAL, NEW, identity match 0.97) + older adjudicated alert; shows the 3-step validation story.
- Hero 3 `SUBJ-003` Priya Shah — T3, INVESTIGATION, no flagged guidelines, riskScore ~8, CLEAR, fastTrack=True: clean case, all coverage complete, zero discrepancies, AI recommends GRANT.
- 12 roster subjects `SUBJ-004..015`: varied tiers/stages/statuses; at least one per stage; 2-4 with single-guideline flags (E, H, K, M) built from a template; each still validates as a full `CaseDetail` (light: 1-2 SF-86 sections, 0-1 guideline card, empty interviews for clean ones).
- Providers registry: 12 entries — FBI CJIS/NCIC + Rap Back, Equifax, Experian, TransUnion, LexisNexis, FinCEN/Treasury, CBP I-94, State & local courts, DMV, IRS, SEAD-5 Social media, DISS/prior adjudications — with `guidelines` per the spec's provider→guideline matrix, deterministic `recordCount`/`lastSync`, one DEGRADED for realism.
- Global `alerts.json` = union of all subjects' alerts. Pipeline stats: timeliness (Initiation 18/25, Investigation 73/90, Adjudication 32/30, CV triage 4/7 days), alertVolume = counts by category from the generated alerts, triageDistribution = counts of subjects by risk band (low <40, moderate 40-74, high >=75).

- [ ] **Step 1: Write the failing test**

`portal/data_gen/tests/test_generator.py`:

```python
import json
from pathlib import Path

import pytest

import schemas
import generate_demo_data as gen


@pytest.fixture(scope="module")
def out(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("data")
    counts = gen.main(out_dir)
    return out_dir, counts


def test_counts(out):
    _, counts = out
    assert counts == {"subjects": 15, "cases": 15, "alerts": counts["alerts"]}
    assert counts["alerts"] >= 4


def test_subjects_file_validates(out):
    out_dir, _ = out
    data = json.loads((out_dir / "subjects.json").read_text(encoding="utf-8"))
    parsed = schemas.SubjectsFile.model_validate(data)
    assert len(parsed.subjects) == 15
    stages = {s.stage for s in parsed.subjects}
    assert stages == {"INITIATION", "INVESTIGATION", "ADJUDICATION", "CONTINUOUS_VETTING"}
    assert any(s.fastTrack for s in parsed.subjects)


def test_every_case_file_validates(out):
    out_dir, _ = out
    case_files = sorted((out_dir / "cases").glob("*.json"))
    assert len(case_files) == 15
    for f in case_files:
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        assert case.subject.ssnMasked.startswith("***-**-")


def test_hero1_depth(out):
    out_dir, _ = out
    case = schemas.CaseDetail.model_validate(
        json.loads((out_dir / "cases" / "SUBJ-001.json").read_text(encoding="utf-8")))
    codes = {g.code for g in case.guidelines}
    assert {"F", "B"} <= codes
    assert case.adjudication.sorDraft
    assert any(s.discrepancy for s in case.investigation.sf86Sections)
    assert all(g.precedents for g in case.guidelines)
    assert len(case.alerts) == 2


def test_alerts_and_providers_and_analytics_validate(out):
    out_dir, _ = out
    schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8")))
    providers = schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8")))
    assert len(providers.providers) == 12
    schemas.Analytics.model_validate(
        json.loads((out_dir / "analytics.json").read_text(encoding="utf-8")))


def test_deterministic(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    gen.main(a)
    gen.main(b)
    assert (a / "subjects.json").read_text(encoding="utf-8") == \
           (b / "subjects.json").read_text(encoding="utf-8")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest portal/data_gen/tests/test_generator.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'generate_demo_data'`

- [ ] **Step 3: Write hero_cases.py**

The three heroes are explicit dicts. Hero 1 in full; Heroes 2 and 3 follow the same shape (complete code below, lighter content). `TODAY = "2026-07-02"`.

```python
"""Hand-authored deep demo cases. All identities fictional."""

TODAY = "2026-07-02"


def _subject(profile: dict) -> dict:
    base = dict(fastTrack=False, cvEnrolled=True, openAlerts=0)
    base.update(profile)
    return base


def build_hero_cases(precedent_fn) -> list[dict]:
    return [_hero1(precedent_fn), _hero2(precedent_fn), _hero3(precedent_fn)]


def _hero1(precedent_fn) -> dict:
    subject = _subject(dict(
        id="SUBJ-001", name="Daniel R. Okafor", position="Senior Systems Engineer",
        tier="T5", stage="ADJUDICATION", status="ACTION_REQUIRED",
        eligibility="INTERIM", riskScore=78, flaggedGuidelines=["F", "B"],
        daysInStage=41, openAlerts=2,
        ssnMasked="***-**-4821", dob="1988-03-14",
        address="1427 Birch Hollow Ct, Manassas, VA 20109",
    ))
    alerts = [
        dict(id="ALERT-101", subjectId="SUBJ-001", subjectName=subject["name"],
             category="FINANCIAL", severity="HIGH", priorityScore=82, state="NEW",
             receivedDate="2026-06-20", provider="TransUnion",
             description="New collection account reported: $12,400 past due (auto loan).",
             identityMatch=dict(confidence=0.96, identifiers=[
                 dict(field="Name", subjectValue="Daniel R. Okafor",
                      recordValue="Daniel Okafor", match=True),
                 dict(field="DOB", subjectValue="1988-03-14",
                      recordValue="1988-03-14", match=True),
                 dict(field="SSN (last 4)", subjectValue="4821",
                      recordValue="4821", match=True)]),
             threshold=dict(rule="Delinquent debt > $5,000", met=True,
                            detail="Past-due balance $12,400 exceeds CV threshold."),
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None)),
        dict(id="ALERT-102", subjectId="SUBJ-001", subjectName=subject["name"],
             category="FOREIGN_TRAVEL", severity="MODERATE", priorityScore=61,
             state="VALIDATED", receivedDate="2026-05-02", provider="CBP I-94",
             description="Unreported travel to Nigeria, 2026-04-11 to 2026-04-25.",
             identityMatch=dict(confidence=0.99, identifiers=[
                 dict(field="Passport", subjectValue="5310xxxx",
                      recordValue="5310xxxx", match=True),
                 dict(field="Name", subjectValue="Daniel R. Okafor",
                      recordValue="OKAFOR, DANIEL R", match=True)]),
             threshold=dict(rule="Unreported foreign travel (SEAD-3)", met=True,
                            detail="No corresponding FSO travel report on file."),
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None)),
    ]
    return dict(
        subject=subject,
        aiSummary=("Significant unresolved financial concerns (Guideline F): $47,300 in "
                   "delinquent debt across five accounts, with a new collection alert in June "
                   "2026. Foreign influence concerns (Guideline B): three family members "
                   "resident in Nigeria, one employed by a state-owned enterprise, plus "
                   "unreported April 2026 travel. SF-86 understated the delinquency, raising "
                   "candor questions. Mitigation is partial at best; whole-person factors do "
                   "not yet resolve the doubt."),
        timeline=[
            dict(date="2025-09-08", actor="K. Rivas", role="FSO",
                 event="Case initiated in NBIS eApp", note="T5 initial, interim granted"),
            dict(date="2025-11-19", actor="S. Whitfield", role="Investigator",
                 event="Subject interview completed",
                 note="Subject acknowledged two delinquent accounts, attributed to 2024 job gap"),
            dict(date="2026-01-27", actor="S. Whitfield", role="Investigator",
                 event="ROI transmitted", note="Financial and foreign-contact issues flagged"),
            dict(date="2026-03-15", actor="R. Chen", role="Analyst",
                 event="Credit re-check run", note="Delinquency total revised upward"),
            dict(date="2026-05-06", actor="R. Chen", role="Analyst",
                 event="CV alert validated: unreported foreign travel",
                 note="Referred to adjudication"),
            dict(date="2026-06-20", actor="System", role="CV",
                 event="New financial CV alert received", note=None),
        ],
        wholePerson=[
            dict(factor="Nature, extent, and seriousness of the conduct",
                 assessment="Sustained delinquency plus incomplete disclosure; serious."),
            dict(factor="Circumstances surrounding the conduct",
                 assessment="Six-month unemployment in 2024 contributed to initial arrears."),
            dict(factor="Frequency and recency", assessment="Ongoing; newest alert June 2026."),
            dict(factor="Age and maturity at the time", assessment="Adult throughout (36-38)."),
            dict(factor="Voluntariness of participation",
                 assessment="Debt partly circumstantial; non-disclosure voluntary."),
            dict(factor="Rehabilitation and behavioral changes",
                 assessment="No payment plan or counseling evidenced to date."),
            dict(factor="Motivation", assessment="No evidence of divided loyalty; financial strain."),
            dict(factor="Potential for pressure, coercion, or duress",
                 assessment="Elevated: debt plus close foreign family ties."),
            dict(factor="Likelihood of continuation or recurrence",
                 assessment="High absent documented repayment behavior."),
        ],
        guidelines=[
            dict(code="F", name="Financial Considerations", severity="C",
                 aiReasoning=("Disqualifying conditions AG ¶ 19(a) and 19(c) are established by "
                              "the credit record. Mitigator ¶ 20(b) applies only partially: the "
                              "2024 job loss was beyond his control, but there is no evidence he "
                              "acted responsibly under the circumstances since re-employment."),
                 evidence=[
                     dict(provider="TransUnion", type="Credit report",
                          description="$47,300 delinquent across 5 accounts; 2 charge-offs",
                          date="2026-03-15"),
                     dict(provider="Equifax", type="Credit report",
                          description="Auto loan 120+ days past due, $12,400", date="2026-06-20"),
                     dict(provider="State & local courts", type="Civil judgment",
                          description="Small-claims judgment $3,100 (2025), unpaid",
                          date="2025-08-02")],
                 disqualifiers=[
                     dict(code="AG ¶ 19(a)", description="Inability to satisfy debts",
                          evidence="$47,300 delinquent across five accounts"),
                     dict(code="AG ¶ 19(c)", description="A history of not meeting financial obligations",
                          evidence="Charge-offs 2024-2026 and unpaid 2025 judgment")],
                 mitigators=[
                     dict(code="AG ¶ 20(b)",
                          description="Conditions largely beyond the person's control",
                          applicability="PARTIAL",
                          reasoning="Job loss was involuntary, but no responsible action "
                                    "(payment plan, counseling) is documented since."),
                     dict(code="AG ¶ 20(d)",
                          description="Good-faith effort to repay overdue creditors",
                          applicability="NONE",
                          reasoning="No repayment evidence in file.")],
                 precedents=precedent_fn("F")),
            dict(code="B", name="Foreign Influence", severity="B",
                 aiReasoning=("AG ¶ 7(a) contacts are established: mother and two siblings in "
                              "Nigeria, one sibling employed by a state-owned oil company. "
                              "Unreported April 2026 travel weighs against ¶ 8(a) mitigation. "
                              "Combined with financial pressure, heightens coercion risk."),
                 evidence=[
                     dict(provider="SF-86 self-report", type="Foreign contacts",
                          description="Mother and two siblings, Nigerian citizens/residents",
                          date="2025-09-08"),
                     dict(provider="CBP I-94", type="Travel record",
                          description="Nigeria travel 2026-04-11 to 2026-04-25, unreported",
                          date="2026-05-02")],
                 disqualifiers=[
                     dict(code="AG ¶ 7(a)",
                          description="Contact with a foreign family member who could create "
                                      "a risk of foreign exploitation or pressure",
                          evidence="Sibling employed by state-owned enterprise")],
                 mitigators=[
                     dict(code="AG ¶ 8(a)",
                          description="Nature of relationships makes exploitation unlikely",
                          applicability="PARTIAL",
                          reasoning="Contacts are familial and disclosed, but the unreported "
                                    "travel undercuts confidence in ongoing candor.")],
                 precedents=precedent_fn("B")),
        ],
        investigation=dict(
            coverage=[
                dict(item="Subject interview (ESI)", status="COMPLETE"),
                dict(item="Employment coverage (10 yrs)", status="COMPLETE"),
                dict(item="Neighborhood/reference interviews", status="COMPLETE"),
                dict(item="Financial record checks", status="COMPLETE"),
                dict(item="Foreign contact expansion leads", status="PENDING"),
            ],
            sf86Sections=[
                dict(section="Section 20A", title="Financial record — delinquencies",
                     subjectReport="Two delinquent accounts totaling about $9,000",
                     matchedResult="Five delinquent accounts totaling $47,300 (TransUnion/Equifax)",
                     discrepancy=True, providers=["TransUnion", "Equifax"], guideline="F"),
                dict(section="Section 19", title="Foreign contacts",
                     subjectReport="Mother and two siblings resident in Nigeria",
                     matchedResult="Consistent with record checks; one sibling employed by "
                                   "state-owned enterprise (not disclosed)",
                     discrepancy=True, providers=["LexisNexis", "SEAD-5 social media"],
                     guideline="B"),
                dict(section="Section 18", title="Foreign travel",
                     subjectReport="No foreign travel in last 12 months (2025 form)",
                     matchedResult="CBP I-94 shows Nigeria travel April 2026 (post-submission, "
                                   "unreported under SEAD-3)",
                     discrepancy=True, providers=["CBP I-94"], guideline="B"),
                dict(section="Section 13A", title="Employment activities",
                     subjectReport="Employed at Meridian Defense Systems since 2019; "
                                   "6-month gap in 2024",
                     matchedResult="Employment verified; gap consistent with layoff records",
                     discrepancy=False, providers=["Employment records"], guideline=None),
            ],
            interviews=[
                dict(date="2025-11-19", type="Enhanced Subject Interview",
                     interviewer="S. Whitfield",
                     summary="Subject candid about job loss; understated debt total. Described "
                             "family in Nigeria as 'not close', which conflicts with monthly "
                             "remittance records."),
                dict(date="2025-12-04", type="Reference interview", interviewer="S. Whitfield",
                     summary="Coworker describes subject as reliable; unaware of financial stress."),
            ],
            roiEntries=[
                dict(date="2026-01-27", investigator="S. Whitfield", item="Financial",
                     text="Credit bureau data and court records establish sustained "
                          "delinquency exceeding subject's account."),
                dict(date="2026-01-27", investigator="S. Whitfield", item="Foreign contacts",
                     text="Expanded lead recommended on sibling's SOE employment."),
            ],
        ),
        adjudication=dict(
            recommendation=dict(
                action="SOR", aiSuggested=True,
                rationale="Unmitigated F and B concerns with candor issues; propose SOR "
                          "unless subject provides documented repayment plan and travel report."),
            sorDraft=("STATEMENT OF REASONS (DRAFT) — Guideline F: You are indebted on five "
                      "delinquent accounts totaling approximately $47,300, including a $12,400 "
                      "charged-off auto loan (2026) and an unpaid $3,100 civil judgment (2025). "
                      "Guideline B: Your mother and two siblings are citizens and residents of "
                      "Nigeria; one sibling is employed by a state-owned enterprise. You "
                      "traveled to Nigeria from on or about April 11 to April 25, 2026, and "
                      "failed to report this travel as required. Guideline E cross-reference: "
                      "your SF-86 understated your delinquent debt."),
            decisions=[],
        ),
        alerts=alerts,
        documents=[
            dict(title="Report of Investigation (ROI)", type="ROI",
                 description="T5 ROI transmitted 2026-01-27", url=None),
            dict(title="SF-86 (2025-09-08)", type="SF-86",
                 description="Questionnaire for National Security Positions", url=None),
            dict(title="Credit reports (Mar/Jun 2026)", type="Provider record",
                 description="TransUnion and Equifax pulls", url=None),
        ],
    )


def _hero2(precedent_fn) -> dict:
    subject = _subject(dict(
        id="SUBJ-002", name="Marcus T. Bell", position="Logistics Coordinator",
        tier="T3", stage="CONTINUOUS_VETTING", status="NEEDS_REVIEW",
        eligibility="SECRET", riskScore=64, flaggedGuidelines=["J", "G"],
        daysInStage=9, openAlerts=1,
        ssnMasked="***-**-7733", dob="1992-11-02",
        address="88 Quarry Ridge Rd, Chesapeake, VA 23320",
    ))
    alerts = [
        dict(id="ALERT-201", subjectId="SUBJ-002", subjectName=subject["name"],
             category="CRIMINAL", severity="HIGH", priorityScore=76, state="NEW",
             receivedDate="2026-06-23", provider="FBI Rap Back",
             description="Arrest: DUI, Chesapeake PD, 2026-06-21. Disposition pending.",
             identityMatch=dict(confidence=0.97, identifiers=[
                 dict(field="Fingerprint", subjectValue="Enrolled (Rap Back)",
                      recordValue="Match", match=True),
                 dict(field="Name", subjectValue="Marcus T. Bell",
                      recordValue="BELL, MARCUS T", match=True),
                 dict(field="DOB", subjectValue="1992-11-02",
                      recordValue="1992-11-02", match=True)]),
             threshold=dict(rule="Any arrest while CV-enrolled", met=True,
                            detail="Fingerprint-verified arrest notification."),
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None)),
        dict(id="ALERT-202", subjectId="SUBJ-002", subjectName=subject["name"],
             category="FINANCIAL", severity="LOW", priorityScore=22, state="ADJUDICATED",
             receivedDate="2025-10-12", provider="TransUnion",
             description="30-day delinquency, $800 retail account (resolved).",
             identityMatch=dict(confidence=0.95, identifiers=[
                 dict(field="Name", subjectValue="Marcus T. Bell",
                      recordValue="Marcus Bell", match=True),
                 dict(field="SSN (last 4)", subjectValue="7733",
                      recordValue="7733", match=True)]),
             threshold=dict(rule="Delinquent debt > $500", met=True,
                            detail="Met threshold; resolved by payment 2025-11."),
             priorAdjudication=dict(previouslyAdjudicated=True,
                                    reference="CV disposition 2025-11-20: no action")),
    ]
    return dict(
        subject=subject,
        aiSummary=("CV-enrolled Secret holder with a fingerprint-verified DUI arrest on "
                    "2026-06-21 (Guideline J/G). Single incident, disposition pending; prior "
                    "record clean. Analyst validation pending; recommend request for police "
                    "report and command notification rather than immediate suspension."),
        timeline=[
            dict(date="2023-04-10", actor="Adjudicator L. Ortiz", role="Adjudicator",
                 event="Favorable adjudication — Secret granted", note="Clean T3"),
            dict(date="2023-05-01", actor="System", role="CV", event="Enrolled in CV", note=None),
            dict(date="2025-11-20", actor="R. Chen", role="Analyst",
                 event="Financial alert adjudicated: no action", note="Resolved delinquency"),
            dict(date="2026-06-23", actor="System", role="CV",
                 event="Rap Back criminal alert received", note="DUI arrest 2026-06-21"),
        ],
        wholePerson=[
            dict(factor="Nature, extent, and seriousness of the conduct",
                 assessment="Single DUI arrest; serious but isolated."),
            dict(factor="Frequency and recency", assessment="First incident; very recent."),
            dict(factor="Rehabilitation and behavioral changes",
                 assessment="Unknown — disposition pending."),
            dict(factor="Likelihood of continuation or recurrence",
                 assessment="Indeterminate pending court outcome and any treatment."),
        ],
        guidelines=[
            dict(code="J", name="Criminal Conduct", severity="B",
                 aiReasoning="AG ¶ 31(b) applies on arrest evidence; adjudication should await "
                             "disposition. Isolated incident weighs toward ¶ 32(a) over time.",
                 evidence=[dict(provider="FBI Rap Back", type="Arrest record",
                                description="DUI arrest, Chesapeake PD, 2026-06-21",
                                date="2026-06-23")],
                 disqualifiers=[dict(code="AG ¶ 31(b)",
                                     description="Evidence of criminal conduct regardless of "
                                                 "whether the person was formally charged",
                                     evidence="Fingerprint-verified arrest record")],
                 mitigators=[dict(code="AG ¶ 32(a)",
                                  description="So much time has elapsed / unlikely to recur",
                                  applicability="NONE",
                                  reasoning="Arrest occurred within the last two weeks.")],
                 precedents=precedent_fn("J")),
            dict(code="G", name="Alcohol Consumption", severity="B",
                 aiReasoning="Single alcohol-related incident (AG ¶ 22(a)). No evidence yet of "
                             "a pattern or diagnosis; evaluation report would inform ¶ 23(b).",
                 evidence=[dict(provider="FBI Rap Back", type="Arrest record",
                                description="Alcohol-related driving arrest", date="2026-06-23")],
                 disqualifiers=[dict(code="AG ¶ 22(a)",
                                     description="Alcohol-related incident away from work",
                                     evidence="DUI arrest 2026-06-21")],
                 mitigators=[dict(code="AG ¶ 23(a)",
                                  description="So much time has passed / no pattern",
                                  applicability="NONE",
                                  reasoning="Incident is current.")],
                 precedents=precedent_fn("G")),
        ],
        investigation=dict(
            coverage=[dict(item="T3 automated record checks (2023)", status="COMPLETE"),
                      dict(item="Police report retrieval (2026 arrest)", status="PENDING")],
            sf86Sections=[
                dict(section="Section 22", title="Police record",
                     subjectReport="No arrests reported (2023 SF-86)",
                     matchedResult="Accurate at submission; post-grant arrest via Rap Back 2026",
                     discrepancy=False, providers=["FBI Rap Back"], guideline="J"),
            ],
            interviews=[],
            roiEntries=[],
        ),
        adjudication=dict(
            recommendation=dict(action="LOI", aiSuggested=True,
                                rationale="Obtain police report and disposition; issue LOI for "
                                          "subject's account before any eligibility action."),
            sorDraft=None,
            decisions=[dict(date="2023-04-10", adjudicator="L. Ortiz", action="GRANT",
                            rationale="Clean T3 investigation; no issues.")],
        ),
        alerts=alerts,
        documents=[dict(title="Rap Back notification", type="Provider record",
                        description="FBI arrest notification 2026-06-23", url=None),
                   dict(title="SF-86 (2023-01-15)", type="SF-86",
                        description="Original T3 questionnaire", url=None)],
    )


def _hero3(precedent_fn) -> dict:
    subject = _subject(dict(
        id="SUBJ-003", name="Priya N. Shah", position="Financial Analyst",
        tier="T3", stage="INVESTIGATION", status="CLEAR",
        eligibility="NONE", riskScore=8, flaggedGuidelines=[],
        daysInStage=22, fastTrack=True, cvEnrolled=False,
        ssnMasked="***-**-2210", dob="1996-07-30",
        address="510 Alder Grove Ln, Columbia, MD 21044",
    ))
    return dict(
        subject=subject,
        aiSummary=("Clean T3 case: all automated checks returned clear, no discrepancies "
                   "between SF-86 and record sources, full coverage complete except one "
                   "employment verification in progress. AI triage classifies this case as a "
                   "fast-track candidate for favorable eAdjudication."),
        timeline=[
            dict(date="2026-06-10", actor="K. Rivas", role="FSO",
                 event="Case initiated in NBIS eApp", note="T3 initial"),
            dict(date="2026-06-14", actor="System", role="System",
                 event="Fingerprint check returned: no record", note=None),
            dict(date="2026-06-28", actor="System", role="System",
                 event="AI triage: fast-track candidate", note="Risk score 8/100"),
        ],
        wholePerson=[dict(factor="Overall record",
                          assessment="No adverse information across all checked sources.")],
        guidelines=[],
        investigation=dict(
            coverage=[dict(item="Fingerprint / FBI criminal history", status="COMPLETE"),
                      dict(item="Credit check", status="COMPLETE"),
                      dict(item="Education verification", status="COMPLETE"),
                      dict(item="Employment verification", status="PENDING"),
                      dict(item="Subject interview", status="NOT_REQUIRED")],
            sf86Sections=[
                dict(section="Section 22", title="Police record",
                     subjectReport="No police record", matchedResult="NCIC: no record",
                     discrepancy=False, providers=["FBI CJIS/NCIC"], guideline=None),
                dict(section="Section 20A", title="Financial record",
                     subjectReport="No delinquencies",
                     matchedResult="All bureaus current; utilization 12%",
                     discrepancy=False, providers=["Equifax", "Experian", "TransUnion"],
                     guideline=None),
                dict(section="Section 12", title="Education",
                     subjectReport="B.S. Finance, University of Maryland, 2018",
                     matchedResult="Degree verified via clearinghouse",
                     discrepancy=False, providers=["Education records"], guideline=None),
            ],
            interviews=[],
            roiEntries=[],
        ),
        adjudication=dict(
            recommendation=dict(action="GRANT", aiSuggested=True,
                                rationale="No issues developed; eligible for favorable "
                                          "eAdjudication on coverage completion."),
            sorDraft=None, decisions=[],
        ),
        alerts=[],
        documents=[dict(title="SF-86 (2026-06-10)", type="SF-86",
                        description="T3 questionnaire", url=None)],
    )
```

- [ ] **Step 4: Write roster.py**

12 lighter subjects from a table + a template case builder. Complete code:

```python
"""Procedural roster of 12 lighter subjects around the 3 hero cases."""
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
    return dict(
        id=f"ALERT-{300 + idx}", subjectId=subj["id"], subjectName=subj["name"],
        category=category, severity="MODERATE", priorityScore=55 + idx, state="NEW",
        receivedDate="2026-06-18",
        provider="TransUnion" if code == "F" else "LexisNexis",
        description=GUIDELINE_TEMPLATES[code]["evidence"] + ".",
        identityMatch=dict(confidence=0.93, identifiers=[
            dict(field="Name", subjectValue=subj["name"],
                 recordValue=subj["name"].upper(), match=True),
            dict(field="DOB", subjectValue=subj["dob"], recordValue=subj["dob"], match=True)]),
        threshold=dict(rule="Category threshold met", met=True,
                       detail="Meets CV investigative-standard threshold."),
        priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
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
            ssnMasked=f"***-**-{1000 + n * 37}", dob=f"19{80 + (n % 15)}-0{1 + n % 9}-1{n % 9}",
            address=f"{100 + n} Demo Street, Arlington, VA 2220{n % 10}",
        )
        alerts = [_roster_alert(n, subj, codes[0])] if n_alerts else []
        clean = not codes
        cases.append(dict(
            subject=subj,
            aiSummary=("No adverse information developed; routine processing."
                       if clean else
                       f"One developed issue under Guideline {codes[0]} "
                       f"({GUIDELINE_TEMPLATES[codes[0]]['name']}); otherwise clear."),
            timeline=[dict(date="2026-05-01", actor="K. Rivas", role="FSO",
                           event="Case initiated in NBIS eApp", note=None)],
            wholePerson=[dict(factor="Overall record",
                              assessment="Routine" if clean else "Single-issue case")],
            guidelines=[_guideline_card(c, precedent_fn) for c in codes],
            investigation=dict(
                coverage=[dict(item="Automated record checks", status="COMPLETE"),
                          dict(item="Tier-required fieldwork",
                               status="COMPLETE" if stage != "INVESTIGATION" else "PENDING")],
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
        ))
    return cases
```

- [ ] **Step 5: Write generate_demo_data.py**

```python
"""Build all portal demo JSON. Deterministic; run from anywhere.

Usage: python portal/data_gen/generate_demo_data.py [--out portal/public/data]
"""
import argparse
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import corpus
import schemas
from hero_cases import build_hero_cases, TODAY
from roster import build_roster_cases

DEFAULT_OUT = Path(__file__).resolve().parents[1] / "public" / "data"

PROVIDERS = [
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "Criminal history", ["INVESTIGATION", "CV"],
     ["J", "D", "G", "H"], "HEALTHY", 84210556),
    ("equifax", "Equifax", "Credit bureau", ["INVESTIGATION", "CV"], ["F"], "HEALTHY", 22483901),
    ("experian", "Experian", "Credit bureau", ["INVESTIGATION"], ["F"], "HEALTHY", 21077344),
    ("transunion", "TransUnion", "Credit bureau (CV provider)", ["INVESTIGATION", "CV"],
     ["F"], "HEALTHY", 23910287),
    ("lexisnexis", "LexisNexis", "Public records", ["INVESTIGATION", "CV"],
     ["F", "J", "E"], "HEALTHY", 156733208),
    ("fincen", "FinCEN / Treasury", "Financial intelligence", ["CV"], ["F", "B"],
     "HEALTHY", 3402118),
    ("cbp-i94", "CBP I-94 Foreign Travel", "Border crossing records", ["INVESTIGATION", "CV"],
     ["B", "C", "E"], "HEALTHY", 48120022),
    ("courts", "State & local courts", "Dockets and dispositions", ["INVESTIGATION"],
     ["J", "D", "G", "H", "F"], "DEGRADED", 9822411),
    ("dmv", "DMV records", "Driver records", ["INVESTIGATION"], ["G", "J"], "HEALTHY", 61208443),
    ("irs", "IRS / tax records", "Tax compliance", ["INVESTIGATION"], ["F"], "HEALTHY", 1120733),
    ("sead5", "SEAD-5 Social media (PAEI)", "Publicly available electronic information",
     ["INVESTIGATION"], ["A", "D", "E", "J"], "HEALTHY", 448210),
    ("diss", "DISS / prior adjudications", "Eligibility and adjudication history",
     ["INVESTIGATION", "CV"], ["E"], "HEALTHY", 4211809),
]

TIMELINESS = [("Initiation", 18, 25), ("Investigation", 73, 90),
              ("Adjudication", 32, 30), ("CV alert triage", 4, 7)]


def risk_band(score: int) -> str:
    return "high" if score >= 75 else "moderate" if score >= 40 else "low"


def main(out_dir: Path = DEFAULT_OUT) -> dict:
    out_dir = Path(out_dir)
    (out_dir / "cases").mkdir(parents=True, exist_ok=True)

    df = corpus.load_corpus()
    _precedent_cache = {}

    def precedents(code):
        if code not in _precedent_cache:
            _precedent_cache[code] = corpus.find_precedents(df, code)
        return _precedent_cache[code]

    cases = build_hero_cases(precedents) + build_roster_cases(precedents)

    validated_cases = [schemas.CaseDetail.model_validate(c) for c in cases]
    subjects = [schemas.SubjectSummary.model_validate(c["subject"]) for c in cases]
    all_alerts = [a for c in validated_cases for a in c.alerts]

    def dump(model, path: Path):
        path.write_text(json.dumps(model, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8")

    dump(schemas.SubjectsFile(subjects=subjects).model_dump(), out_dir / "subjects.json")
    for c in validated_cases:
        dump(c.model_dump(), out_dir / "cases" / f"{c.subject.id}.json")
    dump(schemas.AlertsFile(alerts=all_alerts).model_dump(), out_dir / "alerts.json")

    providers = [schemas.ProviderInfo(
        id=pid, name=name, category=cat, usedIn=used, guidelines=gls,
        status=status, recordCount=count, lastSync=f"{TODAY}T06:00:00Z")
        for pid, name, cat, used, gls, status, count in PROVIDERS]
    dump(schemas.ProvidersFile(providers=providers).model_dump(), out_dir / "providers.json")

    analytics = schemas.Analytics(
        corpus=schemas.CorpusStats.model_validate(corpus.corpus_analytics(df)),
        pipeline=schemas.PipelineStats(
            timeliness=[schemas.TimelinessStat(stage=s, avgDays=a, targetDays=t)
                        for s, a, t in TIMELINESS],
            alertVolume=[schemas.AlertVolume(category=k, count=v) for k, v in
                         sorted(Counter(a.category for a in all_alerts).items())],
            triageDistribution=[schemas.TriageBand(band=b, count=n) for b, n in
                                sorted(Counter(risk_band(s.riskScore)
                                               for s in subjects).items())],
        ))
    dump(analytics.model_dump(), out_dir / "analytics.json")

    return {"subjects": len(subjects), "cases": len(validated_cases),
            "alerts": len(all_alerts)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    counts = main(args.out)
    print(f"Wrote {counts} to {args.out}")
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m pytest portal/data_gen/tests/ -v`
Expected: all tests pass (schemas + corpus + generator).

- [ ] **Step 7: Generate and commit the real data**

```bash
python portal/data_gen/generate_demo_data.py
git add portal/data_gen/ portal/public/data/
git commit -m "feat(portal): demo data generator with hero cases, roster, real DOHA precedents"
```

Verify `portal/public/data/subjects.json` exists, contains 15 subjects, and hero case precedents cite real DOHA case numbers (not "sample … placeholder") since the parquet corpus is present locally.

---

### Task 4: Vite scaffold, DCSA design tokens, domain constants

**Files:**
- Create: `portal/package.json`, `portal/vite.config.js`, `portal/index.html`, `portal/.gitignore`
- Create: `portal/src/main.jsx`, `portal/src/App.jsx` (placeholder shell, replaced in Task 7)
- Create: `portal/src/design-system/variables.css`, `portal/src/design-system/base.css`
- Create: `portal/src/domain.js`
- Test: `portal/src/__tests__/domain.test.js`, `portal/src/__tests__/setup.js`

**Interfaces:**
- Consumes: nothing.
- Produces: npm scripts `dev/build/test`; CSS tokens used by every later task; `domain.js` exports used everywhere:
  `GUIDELINES: {A:'Allegiance to the United States', …}`, `PERSONAS: [{id,label,defaultCaseTab}]`, `STAGE_LABELS`, `STATUS_LABELS`, `STATUS_VARIANTS`, `ELIGIBILITY_LABELS`, `ALERT_CATEGORY_LABELS`, `ALERT_STATE_LABELS`, `ALERT_TRANSITIONS`, `ALERT_ACTION_LABELS`, `ADJ_ACTION_LABELS`, `riskBand(score) -> 'low'|'moderate'|'high'`.

- [ ] **Step 1: Scaffold files**

`portal/package.json`:

```json
{
  "name": "vetting-portal",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@fontsource/source-sans-pro": "^5.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^24.0.0",
    "vitest": "^2.0.0"
  }
}
```

`portal/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
});
```

`portal/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Personnel Vetting — Case Management Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`portal/.gitignore`:

```
node_modules
dist
```

`portal/src/__tests__/setup.js`:

```js
import '@testing-library/jest-dom';
```

`portal/src/design-system/variables.css` (official DCSA tokens only):

```css
:root {
  /* Brand — official DCSA Ecosystem Style Guide */
  --dcsa-navy: #002D5B;
  --dcsa-navy-light: #0A3A6B;
  --dcsa-ocean: #0099D8;
  --dcsa-ocean-dark: #007AB0;
  --dcsa-sky: #00A6DC;
  --dcsa-ice: #91D0E4;
  --dcsa-gold: #D4AF37;
  --dcsa-gold-light: #F5E6B8;
  --dcsa-charcoal: #5B5B5A;

  /* Status (USWDS-aligned) */
  --status-clear: #2E7D32;   --status-clear-bg: #E8F5E9;
  --status-alert: #C62828;   --status-alert-bg: #FFEBEE;
  --status-warning: #E65100; --status-warning-bg: #FFF3E0;
  --status-info: #1565C0;    --status-info-bg: #E3F2FD;
  --risk-high: #C62828;      --risk-high-bg: #FFEBEE;
  --risk-moderate: #E65100;  --risk-moderate-bg: #FFF3E0;
  --risk-low: #F57F17;       --risk-low-bg: #FFF8E1;

  /* Neutrals */
  --text-primary: #1A2B3C;
  --text-secondary: #5A6B7C;
  --text-muted: #8899AA;
  --text-inverse: #FFFFFF;
  --border-light: #E4E7ED;
  --border-medium: #CBD2DB;
  --bg-page: #F6F8FA;
  --bg-card: #FFFFFF;
  --bg-sidebar: #FAFBFC;
  --bg-table-header: #F8F9FB;
  --bg-header: #002D5B;

  /* Typography */
  --font-family-primary: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-size-xs: 11px; --font-size-sm: 13px; --font-size-base: 14px;
  --font-size-lg: 16px; --font-size-xl: 20px; --font-size-2xl: 24px;
  --font-size-3xl: 28px;

  /* Spacing (4px scale) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;

  /* Radii / shadows / layout */
  --radius-sm: 4px; --radius-md: 8px; --radius-pill: 12px;
  --shadow-card: 0 2px 8px rgba(0, 21, 48, 0.06);
  --shadow-dropdown: 0 4px 12px rgba(0, 21, 48, 0.08);
  --sidebar-width: 220px; --header-height: 56px;
}
```

`portal/src/design-system/base.css`:

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-page);
  line-height: 1.5;
}

a { color: var(--dcsa-ocean); text-decoration: none; }
a:hover { color: var(--dcsa-ocean-dark); }

h1 { font-size: var(--font-size-2xl); font-weight: 700; }
h2 { font-size: var(--font-size-xl); font-weight: 600; }
h3 { font-size: var(--font-size-lg); font-weight: 600; }

.page { padding: var(--space-6); max-width: 1280px; margin: 0 auto; }
.page-header { display: flex; align-items: baseline; justify-content: space-between;
  gap: var(--space-4); margin-bottom: var(--space-5); flex-wrap: wrap; }
.page-header p { color: var(--text-secondary); }

.card { background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); box-shadow: var(--shadow-card);
  padding: var(--space-5); }
.card + .card { margin-top: var(--space-4); }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: var(--space-4); margin-bottom: var(--space-5); }

.btn { display: inline-flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm);
  font-size: var(--font-size-base); font-weight: 600; font-family: inherit;
  cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: var(--dcsa-navy); color: var(--text-inverse); }
.btn-primary:hover:not(:disabled) { background: var(--dcsa-navy-light); }
.btn-secondary { background: var(--dcsa-ocean); color: var(--text-inverse); }
.btn-secondary:hover:not(:disabled) { background: var(--dcsa-ocean-dark); }
.btn-ghost { background: transparent; color: var(--text-secondary);
  border: 1px solid var(--border-light); }
.btn-ghost:hover:not(:disabled) { background: var(--bg-sidebar); color: var(--text-primary); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: var(--font-size-xs); font-weight: 600;
  color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
.form-group input, .form-group select, .form-group textarea {
  padding: 10px var(--space-3); border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm); font-size: var(--font-size-base);
  font-family: inherit; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: var(--dcsa-ocean);
  box-shadow: 0 0 0 3px rgba(0, 153, 216, 0.12); }

.muted { color: var(--text-secondary); font-size: var(--font-size-sm); }
```

`portal/src/main.jsx`:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/source-sans-pro/400.css';
import '@fontsource/source-sans-pro/600.css';
import '@fontsource/source-sans-pro/700.css';
import './design-system/variables.css';
import './design-system/base.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`portal/src/App.jsx` (placeholder until Task 7):

```jsx
export default function App() {
  return <div className="page"><h1>Personnel Vetting — Case Management Demo</h1></div>;
}
```

- [ ] **Step 2: Write the failing domain test**

`portal/src/__tests__/domain.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  GUIDELINES, PERSONAS, ALERT_TRANSITIONS, riskBand, STATUS_VARIANTS,
} from '../domain.js';

describe('domain', () => {
  it('defines all 13 guidelines', () => {
    expect(Object.keys(GUIDELINES)).toEqual(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']);
    expect(GUIDELINES.F).toBe('Financial Considerations');
  });

  it('defines three personas with default case tabs', () => {
    expect(PERSONAS.map((p) => p.id)).toEqual(['investigator', 'analyst', 'adjudicator']);
    expect(PERSONAS.find((p) => p.id === 'adjudicator').defaultCaseTab).toBe('adjudication');
  });

  it('risk bands', () => {
    expect(riskBand(8)).toBe('low');
    expect(riskBand(40)).toBe('moderate');
    expect(riskBand(75)).toBe('high');
  });

  it('alert state machine only allows legal transitions', () => {
    expect(ALERT_TRANSITIONS.NEW).toEqual(['IDENTITY_CONFIRMED', 'CLOSED']);
    expect(ALERT_TRANSITIONS.VALIDATED).toEqual(['REFERRED', 'CLOSED']);
    expect(ALERT_TRANSITIONS.CLOSED).toEqual([]);
  });

  it('maps statuses to badge variants', () => {
    expect(STATUS_VARIANTS.CLEAR).toBe('success');
    expect(STATUS_VARIANTS.ACTION_REQUIRED).toBe('error');
  });
});
```

- [ ] **Step 3: Install and run test to verify it fails**

Run: `cd portal && npm install && npm test`
Expected: FAIL — cannot resolve `../domain.js`

- [ ] **Step 4: Write domain.js**

```js
export const GUIDELINES = {
  A: 'Allegiance to the United States',
  B: 'Foreign Influence',
  C: 'Foreign Preference',
  D: 'Sexual Behavior',
  E: 'Personal Conduct',
  F: 'Financial Considerations',
  G: 'Alcohol Consumption',
  H: 'Drug Involvement and Substance Misuse',
  I: 'Psychological Conditions',
  J: 'Criminal Conduct',
  K: 'Handling Protected Information',
  L: 'Outside Activities',
  M: 'Use of Information Technology',
};

export const PERSONAS = [
  { id: 'investigator', label: 'Investigator', defaultCaseTab: 'investigation' },
  { id: 'analyst', label: 'Analyst', defaultCaseTab: 'continuous-vetting' },
  { id: 'adjudicator', label: 'Adjudicator', defaultCaseTab: 'adjudication' },
];

export const STAGE_LABELS = {
  INITIATION: 'Initiation',
  INVESTIGATION: 'Investigation',
  ADJUDICATION: 'Adjudication',
  CONTINUOUS_VETTING: 'Continuous vetting',
};

export const STATUS_LABELS = {
  CLEAR: 'Clear',
  NEEDS_REVIEW: 'Needs review',
  ACTION_REQUIRED: 'Action required',
};

export const STATUS_VARIANTS = {
  CLEAR: 'success',
  NEEDS_REVIEW: 'warning',
  ACTION_REQUIRED: 'error',
};

export const ELIGIBILITY_LABELS = {
  NONE: 'None',
  INTERIM: 'Interim',
  SECRET: 'Secret',
  TOP_SECRET: 'Top Secret',
};

export const ALERT_CATEGORY_LABELS = {
  CRIMINAL: 'Criminal',
  FINANCIAL: 'Financial',
  CREDIT: 'Credit',
  FOREIGN_TRAVEL: 'Foreign travel',
  TERRORISM: 'Terrorism',
  ELIGIBILITY: 'Eligibility',
  SUITABILITY: 'Suitability',
};

export const ALERT_STATE_LABELS = {
  NEW: 'New',
  IDENTITY_CONFIRMED: 'Identity confirmed',
  VALIDATED: 'Validated',
  REFERRED: 'Referred',
  ADJUDICATED: 'Adjudicated',
  CLOSED: 'Closed',
};

export const ALERT_TRANSITIONS = {
  NEW: ['IDENTITY_CONFIRMED', 'CLOSED'],
  IDENTITY_CONFIRMED: ['VALIDATED', 'CLOSED'],
  VALIDATED: ['REFERRED', 'CLOSED'],
  REFERRED: ['ADJUDICATED'],
  ADJUDICATED: [],
  CLOSED: [],
};

export const ALERT_ACTION_LABELS = {
  IDENTITY_CONFIRMED: 'Confirm identity',
  VALIDATED: 'Validate threshold',
  REFERRED: 'Refer to adjudication',
  ADJUDICATED: 'Mark adjudicated',
  CLOSED: 'Close (false positive)',
};

export const ADJ_ACTION_LABELS = {
  GRANT: 'Grant',
  GRANT_WITH_EXCEPTION: 'Grant with exception',
  LOI: 'Letter of Interrogatory',
  SOR: 'Statement of Reasons',
  DENY: 'Deny / revoke',
};

export function riskBand(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}
```

- [ ] **Step 5: Run tests and build to verify**

Run: `cd portal && npm test && npm run build`
Expected: tests pass; `vite build` succeeds.

- [ ] **Step 6: Commit**

```bash
git add portal/package.json portal/package-lock.json portal/vite.config.js portal/index.html portal/.gitignore portal/src
git commit -m "feat(portal): Vite scaffold with official DCSA design tokens and domain model"
```

---

### Task 5: Shared UI primitives

**Files:**
- Create: `portal/src/components/StatusBadge.jsx`, `KPICard.jsx`, `GuidelineChip.jsx`, `SeverityBadge.jsx`, `AIBadge.jsx`, `ConfidenceBar.jsx`, `CollapsibleSection.jsx`, `KVGrid.jsx`, `DataTable.jsx`, `States.jsx`
- Create: `portal/src/components/components.css`
- Test: `portal/src/__tests__/components.test.jsx`

**Interfaces:**
- Consumes: `domain.js` (`GUIDELINES`).
- Produces (exact props):
  - `StatusBadge({ variant = 'info', children })` — variant in success|warning|error|info|neutral
  - `KPICard({ label, value, subtitle, accent })` — accent is a CSS color string (use `var(--…)` values)
  - `GuidelineChip({ code })` — letter chip, `title` = guideline name
  - `SeverityBadge({ level })` — circular badge, level 'A'|'B'|'C'|'D' (D most severe)
  - `AIBadge()` — "AI-assisted" pill, `title="AI-assisted — human decision authority"`
  - `ConfidenceBar({ value })` — 0..1, shows percentage
  - `CollapsibleSection({ title, meta = null, defaultOpen = false, children })`
  - `KVGrid({ items })` — items: `[{ label, value }]`
  - `DataTable({ columns, rows, rowKey, onRowClick })` — columns: `[{ key, label, sortable, render }]`; `render(row)` optional; sorting toggles asc/desc on header click
  - `States.jsx` exports `Loading()`, `ErrorAlert({ message })`, `EmptyState({ title, message })`

- [ ] **Step 1: Write the failing tests**

`portal/src/__tests__/components.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';
import KPICard from '../components/KPICard.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import AIBadge from '../components/AIBadge.jsx';
import ConfidenceBar from '../components/ConfidenceBar.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import KVGrid from '../components/KVGrid.jsx';
import DataTable from '../components/DataTable.jsx';
import { EmptyState } from '../components/States.jsx';

describe('primitives', () => {
  it('StatusBadge applies variant class', () => {
    render(<StatusBadge variant="success">Clear</StatusBadge>);
    expect(screen.getByText('Clear').className).toContain('success');
  });

  it('KPICard renders label, value, subtitle', () => {
    render(<KPICard label="Open cases" value={12} subtitle="3 overdue" accent="var(--dcsa-gold)" />);
    expect(screen.getByText('Open cases')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 overdue')).toBeInTheDocument();
  });

  it('GuidelineChip shows letter with full name tooltip', () => {
    render(<GuidelineChip code="F" />);
    expect(screen.getByText('F')).toHaveAttribute('title', 'Financial Considerations');
  });

  it('SeverityBadge renders level letter', () => {
    render(<SeverityBadge level="C" />);
    expect(screen.getByText('C').className).toContain('level-c');
  });

  it('AIBadge carries the human-authority tooltip', () => {
    render(<AIBadge />);
    expect(screen.getByText('AI-assisted'))
      .toHaveAttribute('title', 'AI-assisted — human decision authority');
  });

  it('ConfidenceBar shows percent', () => {
    render(<ConfidenceBar value={0.96} />);
    expect(screen.getByText('96%')).toBeInTheDocument();
  });

  it('CollapsibleSection toggles content', () => {
    render(<CollapsibleSection title="Details"><p>Body text</p></CollapsibleSection>);
    expect(screen.queryByText('Body text')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('KVGrid renders pairs', () => {
    render(<KVGrid items={[{ label: 'Tier', value: 'T5' }]} />);
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
  });

  it('DataTable sorts on header click and handles row clicks', () => {
    const onRowClick = vi.fn();
    const rows = [{ id: 'b', n: 2 }, { id: 'a', n: 1 }];
    render(<DataTable
      columns={[{ key: 'id', label: 'ID', sortable: true }, { key: 'n', label: 'N' }]}
      rows={rows} rowKey="id" onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('ID'));
    const cells = screen.getAllByRole('row').slice(1).map((r) => r.cells[0].textContent);
    expect(cells).toEqual(['a', 'b']);
    fireEvent.click(screen.getAllByRole('row')[1]);
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('EmptyState renders title and message', () => {
    render(<EmptyState title="No alerts" message="Nothing needs review." />);
    expect(screen.getByText('No alerts')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd portal && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the components**

`portal/src/components/StatusBadge.jsx`:

```jsx
import './components.css';

export default function StatusBadge({ variant = 'info', children }) {
  return <span className={`status-badge ${variant}`}>{children}</span>;
}
```

`portal/src/components/KPICard.jsx`:

```jsx
import './components.css';

export default function KPICard({ label, value, subtitle, accent = 'var(--dcsa-ocean)' }) {
  return (
    <div className="kpi-card" style={{ '--kpi-accent': accent }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
```

`portal/src/components/GuidelineChip.jsx`:

```jsx
import { GUIDELINES } from '../domain.js';
import './components.css';

export default function GuidelineChip({ code }) {
  return <span className="guideline-chip" title={GUIDELINES[code]}>{code}</span>;
}
```

`portal/src/components/SeverityBadge.jsx`:

```jsx
import './components.css';

export default function SeverityBadge({ level }) {
  return (
    <span className={`severity-badge level-${level.toLowerCase()}`}
      title={`Severity ${level}`}>{level}</span>
  );
}
```

`portal/src/components/AIBadge.jsx`:

```jsx
import './components.css';

export default function AIBadge() {
  return (
    <span className="ai-badge" title="AI-assisted — human decision authority">
      AI-assisted
    </span>
  );
}
```

`portal/src/components/ConfidenceBar.jsx`:

```jsx
import './components.css';

export default function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  return (
    <span className="confidence-bar-wrap">
      <span className="confidence-bar">
        <span className="confidence-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="confidence-pct">{pct}%</span>
    </span>
  );
}
```

`portal/src/components/CollapsibleSection.jsx`:

```jsx
import { useState } from 'react';
import './components.css';

export default function CollapsibleSection({ title, meta = null, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible card">
      <button type="button" className="collapsible-header" onClick={() => setOpen(!open)}>
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-meta">{meta}</span>
        <span className="collapsible-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
```

`portal/src/components/KVGrid.jsx`:

```jsx
import './components.css';

export default function KVGrid({ items }) {
  return (
    <dl className="kv-grid">
      {items.map(({ label, value }) => (
        <div key={label} className="kv-item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

`portal/src/components/DataTable.jsx`:

```jsx
import { useMemo, useState } from 'react';
import './components.css';

export default function DataTable({ columns, rows, rowKey, onRowClick }) {
  const [sort, setSort] = useState(null); // { key, dir: 1 | -1 }

  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * sort.dir;
    });
  }, [rows, sort]);

  const toggleSort = (key) =>
    setSort((s) => (s?.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.sortable ? 'sortable' : ''}
                onClick={c.sortable ? () => toggleSort(c.key) : undefined}>
                {c.label}
                {sort?.key === c.key && <span> {sort.dir === 1 ? '▲' : '▼'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row[rowKey]} className={onRowClick ? 'clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`portal/src/components/States.jsx`:

```jsx
import './components.css';

export function Loading() {
  return <div className="state-block muted" role="status">Loading…</div>;
}

export function ErrorAlert({ message }) {
  return (
    <div className="state-block error-alert" role="alert">
      <strong>Something went wrong.</strong> {message}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="state-block empty-state">
      <h3>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
```

`portal/src/components/components.css`:

```css
.status-badge { display: inline-block; padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.3px; border: 1px solid; }
.status-badge.success { background: var(--status-clear-bg); color: var(--status-clear);
  border-color: var(--status-clear); }
.status-badge.error { background: var(--status-alert-bg); color: var(--status-alert);
  border-color: var(--status-alert); }
.status-badge.warning { background: var(--status-warning-bg); color: var(--status-warning);
  border-color: var(--status-warning); }
.status-badge.info { background: var(--status-info-bg); color: var(--status-info);
  border-color: var(--status-info); }
.status-badge.neutral { background: var(--bg-sidebar); color: var(--text-secondary);
  border-color: var(--border-medium); }

.kpi-card { background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); padding: var(--space-4) var(--space-5);
  border-left: 4px solid var(--kpi-accent); box-shadow: var(--shadow-card); }
.kpi-label { font-size: var(--font-size-sm); color: var(--text-secondary);
  margin-bottom: var(--space-1); }
.kpi-value { font-size: var(--font-size-3xl); font-weight: 700; color: var(--text-primary); }
.kpi-subtitle { font-size: var(--font-size-xs); color: var(--text-muted); }

.guideline-chip { display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%; background: var(--status-info-bg);
  color: var(--status-info); border: 1px solid var(--status-info);
  font-size: var(--font-size-xs); font-weight: 700; margin-right: var(--space-1);
  cursor: default; }

.severity-badge { display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%; border: 2px solid;
  font-size: var(--font-size-lg); font-weight: 700; }
.severity-badge.level-d { border-color: var(--risk-high); color: var(--risk-high);
  background: var(--risk-high-bg); }
.severity-badge.level-c { border-color: var(--risk-moderate); color: var(--risk-moderate);
  background: var(--risk-moderate-bg); }
.severity-badge.level-b { border-color: var(--risk-low); color: var(--risk-low);
  background: var(--risk-low-bg); }
.severity-badge.level-a { border-color: var(--dcsa-gold); color: var(--dcsa-gold);
  background: var(--dcsa-gold-light); }

.ai-badge { display: inline-flex; align-items: center; gap: var(--space-1);
  padding: 2px var(--space-2); border-radius: var(--radius-pill);
  background: var(--dcsa-ice); color: var(--dcsa-navy);
  font-size: var(--font-size-xs); font-weight: 600; cursor: help; }
.ai-badge::before { content: '✦'; }

.confidence-bar-wrap { display: inline-flex; align-items: center; gap: var(--space-2);
  min-width: 140px; }
.confidence-bar { flex: 1; height: 10px; background: var(--border-light);
  border-radius: var(--radius-sm); overflow: hidden; }
.confidence-fill { display: block; height: 100%; background: var(--dcsa-ocean); }
.confidence-pct { font-size: var(--font-size-sm); font-weight: 600; }

.collapsible { padding: 0; }
.collapsible-header { display: flex; align-items: center; gap: var(--space-3);
  width: 100%; padding: var(--space-4) var(--space-5); background: none; border: none;
  cursor: pointer; font-family: inherit; font-size: var(--font-size-lg);
  font-weight: 600; color: var(--text-primary); text-align: left; }
.collapsible-title { flex: 1; }
.collapsible-meta { display: inline-flex; align-items: center; gap: var(--space-2); }
.collapsible-body { padding: 0 var(--space-5) var(--space-5); }

.kv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4); }
.kv-item dt { font-size: var(--font-size-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
.kv-item dd { font-size: var(--font-size-base); margin-top: 2px; }

.data-table-wrap { overflow-x: auto; background: var(--bg-card);
  border: 1px solid var(--border-light); border-radius: var(--radius-md);
  box-shadow: var(--shadow-card); }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.data-table thead { background: var(--bg-table-header); }
.data-table th { padding: var(--space-3) var(--space-4); text-align: left;
  font-size: var(--font-size-xs); font-weight: 600; color: var(--text-primary);
  text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light); white-space: nowrap; }
.data-table th.sortable { cursor: pointer; user-select: none; }
.data-table th.sortable:hover { background: rgba(0, 153, 216, 0.08); }
.data-table td { padding: 14px var(--space-4); border-bottom: 1px solid var(--border-light); }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr.clickable { cursor: pointer; }
.data-table tbody tr.clickable:hover { background: rgba(0, 153, 216, 0.04); }

.state-block { padding: var(--space-8); text-align: center; }
.error-alert { background: var(--status-alert-bg); color: var(--status-alert);
  border: 1px solid var(--status-alert); border-radius: var(--radius-md);
  text-align: left; padding: var(--space-4); }
.empty-state h3 { margin-bottom: var(--space-2); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: all component tests pass (plus domain tests still green).

- [ ] **Step 5: Commit**

```bash
git add portal/src/components portal/src/__tests__/components.test.jsx
git commit -m "feat(portal): shared DCSA-styled UI primitives"
```

---

### Task 6: Data access + persona/demo state

**Files:**
- Create: `portal/src/data/api.js`, `portal/src/data/useData.js`
- Create: `portal/src/state/PersonaContext.jsx`, `portal/src/state/DemoContext.jsx`
- Test: `portal/src/__tests__/state.test.jsx`

**Interfaces:**
- Consumes: `domain.js` (`PERSONAS`, `ALERT_TRANSITIONS`).
- Produces:
  - `api.js`: `fetchJson(path)`, `getSubjects()`, `getCase(id)`, `getAlerts()`, `getProviders()`, `getAnalytics()` — all fetch `${import.meta.env.BASE_URL}data/…`, throw `Error` with a readable message on failure; module-level Map cache.
  - `useData(loader, deps = [])` → `{ data, loading, error }`.
  - `PersonaProvider` / `usePersona()` → `{ persona, setPersona }` — persona is an object from `PERSONAS`; persisted to localStorage key `demo.persona` (stores the id). Default persona: `adjudicator`.
  - `DemoProvider` / `useDemo()` → `{ demo, dispositionAlert(alertId, nextState, currentState), recordDecision(caseId, decision), addRoiEntry(caseId, entry), reset() }` where `demo = { alertStates: {}, decisions: {}, roiEntries: {} }`, persisted to localStorage key `demo.state`. `dispositionAlert` throws if `nextState` is not in `ALERT_TRANSITIONS[currentState]` (using any demo override of `currentState` first).

- [ ] **Step 1: Write the failing tests**

`portal/src/__tests__/state.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { PersonaProvider, usePersona } from '../state/PersonaContext.jsx';
import { DemoProvider, useDemo } from '../state/DemoContext.jsx';

beforeEach(() => localStorage.clear());

describe('PersonaContext', () => {
  it('defaults to adjudicator and persists changes', () => {
    const wrapper = ({ children }) => <PersonaProvider>{children}</PersonaProvider>;
    const { result } = renderHook(() => usePersona(), { wrapper });
    expect(result.current.persona.id).toBe('adjudicator');
    act(() => result.current.setPersona('analyst'));
    expect(result.current.persona.id).toBe('analyst');
    expect(localStorage.getItem('demo.persona')).toBe('analyst');
  });
});

describe('DemoContext', () => {
  const wrapper = ({ children }) => <DemoProvider>{children}</DemoProvider>;

  it('dispositions alerts through legal transitions only', () => {
    const { result } = renderHook(() => useDemo(), { wrapper });
    act(() => result.current.dispositionAlert('ALERT-1', 'IDENTITY_CONFIRMED', 'NEW'));
    expect(result.current.demo.alertStates['ALERT-1']).toBe('IDENTITY_CONFIRMED');
    expect(() =>
      act(() => result.current.dispositionAlert('ALERT-1', 'ADJUDICATED', 'IDENTITY_CONFIRMED'))
    ).toThrow();
  });

  it('records decisions and roi entries per case, and resets', () => {
    const { result } = renderHook(() => useDemo(), { wrapper });
    act(() => result.current.recordDecision('SUBJ-001',
      { date: '2026-07-02', adjudicator: 'Demo user', action: 'SOR', rationale: 'Test' }));
    act(() => result.current.addRoiEntry('SUBJ-001',
      { date: '2026-07-02', investigator: 'Demo user', item: 'Financial', text: 'Note' }));
    expect(result.current.demo.decisions['SUBJ-001']).toHaveLength(1);
    expect(result.current.demo.roiEntries['SUBJ-001']).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('demo.state')).decisions['SUBJ-001']).toHaveLength(1);
    act(() => result.current.reset());
    expect(result.current.demo.decisions).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd portal && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`portal/src/data/api.js`:

```js
const cache = new Map();

export async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);
  const url = `${import.meta.env.BASE_URL}data/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${path} (HTTP ${res.status})`);
  const data = await res.json();
  cache.set(path, data);
  return data;
}

export const getSubjects = () => fetchJson('subjects.json').then((d) => d.subjects);
export const getCase = (id) => fetchJson(`cases/${id}.json`);
export const getAlerts = () => fetchJson('alerts.json').then((d) => d.alerts);
export const getProviders = () => fetchJson('providers.json').then((d) => d.providers);
export const getAnalytics = () => fetchJson('analytics.json');
```

`portal/src/data/useData.js`:

```js
import { useEffect, useState } from 'react';

export function useData(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState({ data: null, loading: true, error: null });
    loader()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err.message }));
    return () => { alive = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
```

`portal/src/state/PersonaContext.jsx`:

```jsx
import { createContext, useContext, useState } from 'react';
import { PERSONAS } from '../domain.js';

const PersonaContext = createContext(null);

export function PersonaProvider({ children }) {
  const [personaId, setPersonaId] = useState(
    () => localStorage.getItem('demo.persona') || 'adjudicator');
  const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[2];
  const setPersona = (id) => {
    localStorage.setItem('demo.persona', id);
    setPersonaId(id);
  };
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona requires PersonaProvider');
  return ctx;
}
```

`portal/src/state/DemoContext.jsx`:

```jsx
import { createContext, useContext, useState } from 'react';
import { ALERT_TRANSITIONS } from '../domain.js';

const EMPTY = { alertStates: {}, decisions: {}, roiEntries: {} };
const DemoContext = createContext(null);

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem('demo.state') || '{}') };
  } catch {
    return EMPTY;
  }
}

export function DemoProvider({ children }) {
  const [demo, setDemo] = useState(load);

  const persist = (next) => {
    localStorage.setItem('demo.state', JSON.stringify(next));
    setDemo(next);
  };

  const dispositionAlert = (alertId, nextState, currentState) => {
    const effective = demo.alertStates[alertId] || currentState;
    if (!ALERT_TRANSITIONS[effective]?.includes(nextState)) {
      throw new Error(`Illegal alert transition ${effective} -> ${nextState}`);
    }
    persist({ ...demo, alertStates: { ...demo.alertStates, [alertId]: nextState } });
  };

  const appendTo = (bucket, caseId, entry) =>
    persist({
      ...demo,
      [bucket]: { ...demo[bucket], [caseId]: [...(demo[bucket][caseId] || []), entry] },
    });

  const value = {
    demo,
    dispositionAlert,
    recordDecision: (caseId, d) => appendTo('decisions', caseId, d),
    addRoiEntry: (caseId, e) => appendTo('roiEntries', caseId, e),
    reset: () => persist(EMPTY),
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo requires DemoProvider');
  return ctx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: state tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/data portal/src/state portal/src/__tests__/state.test.jsx
git commit -m "feat(portal): data access layer, persona state, demo state store"
```

---

### Task 7: App shell, routing, persona switcher

**Files:**
- Create: `portal/src/layouts/AppShell.jsx`, `portal/src/layouts/shell.css`
- Create: `portal/src/pages/NotFound.jsx`, `portal/src/pages/pages.css`
- Create stub pages: `portal/src/pages/Dashboard.jsx`, `CaseQueue.jsx`, `CVAlerts.jsx`, `DataProviders.jsx`, `Analytics.jsx`, `portal/src/pages/case/CaseDetail.jsx`
- Modify: `portal/src/App.jsx` (replace placeholder)
- Test: `portal/src/__tests__/shell.test.jsx`

**Interfaces:**
- Consumes: `PersonaProvider/usePersona`, `DemoProvider/useDemo` (Task 6), `PERSONAS` (Task 4).
- Produces: `App` with `HashRouter`, routes `/`, `/cases`, `/cases/:id`, `/alerts`, `/providers`, `/analytics`, `*`. Sidebar NavLinks labeled exactly: Dashboard, Case queue, CV alerts, Data providers, Analytics. Header: brand, search form (`role="search"`, navigates to `/cases?q=<term>`), persona `<select aria-label="Persona">`, "Reset demo" button. Stub pages export default components; Tasks 8-17 REPLACE stub file contents without touching App.jsx.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/shell.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('AppShell', () => {
  it('renders header, sidebar links, and dashboard route', () => {
    render(<App />);
    expect(screen.getByText('Personnel Vetting')).toBeInTheDocument();
    for (const label of ['Dashboard', 'Case queue', 'CV alerts', 'Data providers', 'Analytics']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('switches persona via the header select', () => {
    render(<App />);
    const select = screen.getByLabelText('Persona');
    fireEvent.change(select, { target: { value: 'investigator' } });
    expect(select.value).toBe('investigator');
    expect(localStorage.getItem('demo.persona')).toBe('investigator');
  });

  it('unknown route shows NotFound', () => {
    window.location.hash = '#/nope';
    render(<App />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL (App is still the Task 4 placeholder).

- [ ] **Step 3: Implement shell + routes**

Each stub page (`Dashboard.jsx`, `CaseQueue.jsx`, `CVAlerts.jsx`, `DataProviders.jsx`, `Analytics.jsx`, `case/CaseDetail.jsx`) — adjust the component name and h1 text per file:

```jsx
export default function Dashboard() {
  return <div className="page"><h1>Dashboard</h1></div>;
}
```

`portal/src/pages/NotFound.jsx`:

```jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">
        The page you requested does not exist. <Link to="/">Back to dashboard</Link>
      </p>
    </div>
  );
}
```

`portal/src/layouts/AppShell.jsx`:

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePersona } from '../state/PersonaContext.jsx';
import { useDemo } from '../state/DemoContext.jsx';
import { PERSONAS } from '../domain.js';
import './shell.css';

export default function AppShell() {
  const { persona, setPersona } = usePersona();
  const { reset } = useDemo();
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q')?.trim();
    navigate(q ? `/cases?q=${encodeURIComponent(q)}` : '/cases');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-seal" aria-hidden="true">DCSA</span>
          <div>
            <div className="app-header-title">Personnel Vetting</div>
            <div className="app-header-subtitle">Case management demo</div>
          </div>
        </div>
        <form className="app-header-search" onSubmit={onSearch} role="search">
          <input name="q" type="search" placeholder="Search subjects…"
            aria-label="Search subjects" />
        </form>
        <div className="app-header-actions">
          <label className="persona-switch">
            <span>Viewing as</span>
            <select aria-label="Persona" value={persona.id}
              onChange={(e) => setPersona(e.target.value)}>
              {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost header-reset" onClick={reset}>
            Reset demo
          </button>
        </div>
      </header>
      <nav className="app-sidebar">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/cases">Case queue</NavLink>
        <NavLink to="/alerts">CV alerts</NavLink>
        <NavLink to="/providers">Data providers</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
```

`portal/src/layouts/shell.css`:

```css
.app-header { position: fixed; top: 0; left: 0; right: 0; height: var(--header-height);
  background: var(--bg-header); display: flex; align-items: center;
  justify-content: space-between; gap: var(--space-4); padding: 0 var(--space-6);
  z-index: 100; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
.app-header-brand { display: flex; align-items: center; gap: var(--space-3);
  color: var(--text-inverse); }
.app-header-seal { display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--dcsa-gold);
  color: var(--dcsa-gold); font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
.app-header-title { font-size: var(--font-size-lg); font-weight: 700; line-height: 1.2; }
.app-header-subtitle { font-size: var(--font-size-xs); color: var(--dcsa-ice); }
.app-header-search { flex: 1; max-width: 420px; }
.app-header-search input { width: 100%; padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm); border: 1px solid var(--dcsa-navy-light);
  background: rgba(255, 255, 255, 0.12); color: var(--text-inverse);
  font-family: inherit; font-size: var(--font-size-base); }
.app-header-search input::placeholder { color: var(--dcsa-ice); }
.app-header-actions { display: flex; align-items: center; gap: var(--space-3); }
.persona-switch { display: flex; align-items: center; gap: var(--space-2);
  color: var(--dcsa-ice); font-size: var(--font-size-sm); }
.persona-switch select { padding: 6px var(--space-2); border-radius: var(--radius-sm);
  border: 1px solid var(--dcsa-gold); background: var(--dcsa-navy);
  color: var(--text-inverse); font-family: inherit; font-weight: 600; }
.header-reset { color: var(--dcsa-ice); border-color: var(--dcsa-navy-light); }

.app-sidebar { position: fixed; top: var(--header-height); left: 0; bottom: 0;
  width: var(--sidebar-width); background: var(--bg-card);
  box-shadow: 2px 0 8px rgba(0, 21, 48, 0.06); padding: var(--space-4) 0;
  overflow-y: auto; z-index: 90; display: flex; flex-direction: column; }
.app-sidebar a { padding: 10px var(--space-5); font-size: var(--font-size-base);
  font-weight: 500; color: var(--text-secondary); border-left: 3px solid transparent;
  transition: all 0.15s; min-height: 44px; display: flex; align-items: center; }
.app-sidebar a:hover { color: var(--dcsa-navy); background: rgba(0, 45, 91, 0.04); }
.app-sidebar a.active { color: var(--dcsa-navy); font-weight: 600;
  background: var(--dcsa-gold-light); border-left-color: var(--dcsa-gold); }

.app-main { margin-left: var(--sidebar-width); margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height)); }

@media (max-width: 900px) {
  .app-sidebar { display: none; }
  .app-main { margin-left: 0; }
  .app-header-search { display: none; }
}
```

`portal/src/App.jsx` (replace entirely):

```jsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from './state/PersonaContext.jsx';
import { DemoProvider } from './state/DemoContext.jsx';
import AppShell from './layouts/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CaseQueue from './pages/CaseQueue.jsx';
import CaseDetail from './pages/case/CaseDetail.jsx';
import CVAlerts from './pages/CVAlerts.jsx';
import DataProviders from './pages/DataProviders.jsx';
import Analytics from './pages/Analytics.jsx';
import NotFound from './pages/NotFound.jsx';
import './pages/pages.css';

export default function App() {
  return (
    <PersonaProvider>
      <DemoProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<CaseQueue />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/alerts" element={<CVAlerts />} />
              <Route path="/providers" element={<DataProviders />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </DemoProvider>
    </PersonaProvider>
  );
}
```

`portal/src/pages/pages.css` — create with a single comment line for now (later tasks append their page styles):

```css
/* Page-level styles. Page tasks append their sections below. */
```

- [ ] **Step 4: Run tests + build**

Run: `cd portal && npm test && npm run build`
Expected: shell tests pass; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add portal/src
git commit -m "feat(portal): app shell with DCSA header, sidebar, persona switcher, routing"
```

---

### Task 8: Case Queue page

**Files:**
- Modify: `portal/src/pages/CaseQueue.jsx` (replace stub)
- Modify: `portal/src/pages/pages.css` (append queue styles)
- Test: `portal/src/__tests__/caseQueue.test.jsx`

**Interfaces:**
- Consumes: `getSubjects` (Task 6), `useData`, primitives (Task 5), domain labels (Task 4), `usePersona`.
- Produces: `/cases` route content. Reads `?q=` search param. Persona default filters: investigator → stage INVESTIGATION preselected; analyst → stage CONTINUOUS_VETTING; adjudicator → stage ADJUDICATION; user can change to "All stages". Row click navigates to `/cases/<id>`.

**Test setup pattern (used by all page tests):** mock the api module with fixtures. Fixtures live in `portal/src/__tests__/fixtures.js` (created here, reused by later tasks).

- [ ] **Step 1: Create fixtures and the failing test**

`portal/src/__tests__/fixtures.js`:

```js
export const SUBJECTS = [
  { id: 'SUBJ-001', name: 'Daniel R. Okafor', position: 'Senior Systems Engineer',
    tier: 'T5', stage: 'ADJUDICATION', status: 'ACTION_REQUIRED', eligibility: 'INTERIM',
    riskScore: 78, fastTrack: false, flaggedGuidelines: ['F', 'B'], daysInStage: 41,
    cvEnrolled: true, openAlerts: 2 },
  { id: 'SUBJ-002', name: 'Marcus T. Bell', position: 'Logistics Coordinator',
    tier: 'T3', stage: 'CONTINUOUS_VETTING', status: 'NEEDS_REVIEW', eligibility: 'SECRET',
    riskScore: 64, fastTrack: false, flaggedGuidelines: ['J', 'G'], daysInStage: 9,
    cvEnrolled: true, openAlerts: 1 },
  { id: 'SUBJ-003', name: 'Priya N. Shah', position: 'Financial Analyst',
    tier: 'T3', stage: 'INVESTIGATION', status: 'CLEAR', eligibility: 'NONE',
    riskScore: 8, fastTrack: true, flaggedGuidelines: [], daysInStage: 22,
    cvEnrolled: false, openAlerts: 0 },
];

export const ALERTS = [
  { id: 'ALERT-101', subjectId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
    category: 'FINANCIAL', severity: 'HIGH', priorityScore: 82, state: 'NEW',
    receivedDate: '2026-06-20', provider: 'TransUnion',
    description: 'New collection account reported.',
    identityMatch: { confidence: 0.96, identifiers: [
      { field: 'Name', subjectValue: 'Daniel R. Okafor', recordValue: 'Daniel Okafor', match: true }] },
    threshold: { rule: 'Delinquent debt > $5,000', met: true, detail: 'Exceeds threshold.' },
    priorAdjudication: { previouslyAdjudicated: false, reference: null } },
];
```

`portal/src/__tests__/caseQueue.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
}));

import CaseQueue from '../pages/CaseQueue.jsx';

function renderQueue(initial = '/cases') {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[initial]}><CaseQueue /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CaseQueue', () => {
  it('defaults to the persona stage filter (adjudicator → Adjudication)', async () => {
    renderQueue();
    expect(await screen.findByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Priya N. Shah')).not.toBeInTheDocument();
  });

  it('shows all subjects when stage filter cleared', async () => {
    renderQueue();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'ALL' } });
    expect(screen.getByText('Priya N. Shah')).toBeInTheDocument();
    expect(screen.getByText('Marcus T. Bell')).toBeInTheDocument();
  });

  it('applies ?q= search filter across all stages', async () => {
    renderQueue('/cases?q=shah');
    expect(await screen.findByText('Priya N. Shah')).toBeInTheDocument();
    expect(screen.queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
  });

  it('renders status pills and guideline chips', async () => {
    renderQueue('/cases?q=okafor');
    await screen.findByText('Daniel R. Okafor');
    expect(screen.getByText('Action required')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub has no table/filters.

- [ ] **Step 3: Implement the page**

`portal/src/pages/CaseQueue.jsx` (replace stub):

```jsx
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubjects } from '../data/api.js';
import { useData } from '../data/useData.js';
import { usePersona } from '../state/PersonaContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, GUIDELINES, riskBand,
} from '../domain.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';

const PERSONA_STAGE = {
  investigator: 'INVESTIGATION',
  analyst: 'CONTINUOUS_VETTING',
  adjudicator: 'ADJUDICATION',
};

const RISK_ACCENT = {
  low: 'var(--risk-low)', moderate: 'var(--risk-moderate)', high: 'var(--risk-high)',
};

export default function CaseQueue() {
  const { persona } = usePersona();
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const [stage, setStage] = useState(q ? 'ALL' : PERSONA_STAGE[persona.id]);
  const [guideline, setGuideline] = useState('ALL');
  const navigate = useNavigate();
  const { data: subjects, loading, error } = useData(getSubjects);

  const rows = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((s) =>
      (stage === 'ALL' || s.stage === stage) &&
      (guideline === 'ALL' || s.flaggedGuidelines.includes(guideline)) &&
      (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)));
  }, [subjects, stage, guideline, q]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'stage', label: 'Stage', sortable: true, render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'AI risk', sortable: true,
      render: (s) => (
        <span className="risk-cell" style={{ '--risk-color': RISK_ACCENT[riskBand(s.riskScore)] }}>
          {s.riskScore}{s.fastTrack && <span className="fast-track" title="AI fast-track candidate"> FT</span>}
        </span>) },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.length
        ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
        : <span className="muted">—</span> },
    { key: 'daysInStage', label: 'Days in stage', sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Case queue</h1>
          <p>{rows.length} case{rows.length === 1 ? '' : 's'}{q && ` matching "${q}"`} <AIBadge /></p>
        </div>
        <div className="queue-filters">
          <label className="form-group">
            <span>Stage</span>
            <select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="ALL">All stages</option>
              {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="form-group">
            <span>Guideline</span>
            <select aria-label="Guideline" value={guideline}
              onChange={(e) => setGuideline(e.target.value)}>
              <option value="ALL">All guidelines</option>
              {Object.entries(GUIDELINES).map(([k, v]) => (
                <option key={k} value={k}>{k} — {v}</option>))}
            </select>
          </label>
        </div>
      </div>
      {rows.length === 0
        ? <EmptyState title="No cases" message="No cases match the current filters." />
        : <DataTable columns={columns} rows={rows} rowKey="id"
            onRowClick={(s) => navigate(`/cases/${s.id}`)} />}
    </div>
  );
}
```

Append to `portal/src/pages/pages.css`:

```css
/* Case queue */
.queue-filters { display: flex; gap: var(--space-3); align-items: flex-end; }
.queue-filters .form-group span { font-size: var(--font-size-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); }
.risk-cell { font-weight: 700; color: var(--risk-color); }
.fast-track { font-size: var(--font-size-xs); color: var(--status-clear);
  font-weight: 700; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: caseQueue tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/CaseQueue.jsx portal/src/pages/pages.css portal/src/__tests__/fixtures.js portal/src/__tests__/caseQueue.test.jsx
git commit -m "feat(portal): Checkr-style case queue with persona-aware filters"
```

---

### Task 9: Persona-aware Dashboard

**Files:**
- Modify: `portal/src/pages/Dashboard.jsx` (replace stub)
- Modify: `portal/src/pages/pages.css` (append)
- Test: `portal/src/__tests__/dashboard.test.jsx`

**Interfaces:**
- Consumes: `getSubjects`, `getAlerts` (Task 6), primitives, `usePersona`, `riskBand`.
- Produces: `/` route content. KPI row + a persona work-queue table linking to cases.
  - Investigator KPIs: "Cases in investigation", "Pending coverage" (cases in INVESTIGATION with status != CLEAR), "Discrepancy flags" (count of subjects with flaggedGuidelines in INVESTIGATION), "Avg days in stage".
  - Analyst KPIs: "Open alerts" (alerts not ADJUDICATED/CLOSED), "New alerts", "High severity", "Subjects CV-enrolled".
  - Adjudicator KPIs: "Ready for decision" (stage ADJUDICATION), "Action required", "Fast-track candidates", "High risk (75+)".

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/dashboard.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider, usePersona } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
}));

import Dashboard from '../pages/Dashboard.jsx';

function renderDash(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><Dashboard /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('Dashboard', () => {
  it('adjudicator sees decision-focused KPIs and adjudication queue', async () => {
    renderDash('adjudicator');
    expect(await screen.findByText('Ready for decision')).toBeInTheDocument();
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Priya N. Shah')).not.toBeInTheDocument();
  });

  it('analyst sees alert-focused KPIs', async () => {
    renderDash('analyst');
    expect(await screen.findByText('Open alerts')).toBeInTheDocument();
    expect(screen.getByText('New alerts')).toBeInTheDocument();
  });

  it('investigator sees investigation queue', async () => {
    renderDash('investigator');
    expect(await screen.findByText('Cases in investigation')).toBeInTheDocument();
    expect(screen.getByText('Priya N. Shah')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/Dashboard.jsx` (replace stub):

```jsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { usePersona } from '../state/PersonaContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, riskBand,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

function buildKpis(personaId, subjects, alerts) {
  const inStage = (st) => subjects.filter((s) => s.stage === st);
  const openAlerts = alerts.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.state));
  switch (personaId) {
    case 'investigator': {
      const inv = inStage('INVESTIGATION');
      const avg = inv.length
        ? Math.round(inv.reduce((n, s) => n + s.daysInStage, 0) / inv.length) : 0;
      return {
        queue: inv,
        title: 'Investigation workload',
        kpis: [
          { label: 'Cases in investigation', value: inv.length, accent: 'var(--dcsa-ocean)' },
          { label: 'Pending coverage', value: inv.filter((s) => s.status !== 'CLEAR').length,
            accent: 'var(--status-warning)' },
          { label: 'Discrepancy flags',
            value: inv.filter((s) => s.flaggedGuidelines.length > 0).length,
            accent: 'var(--status-alert)' },
          { label: 'Avg days in stage', value: avg, accent: 'var(--dcsa-gold)' },
        ],
      };
    }
    case 'analyst':
      return {
        queue: inStage('CONTINUOUS_VETTING'),
        title: 'Continuous vetting workload',
        kpis: [
          { label: 'Open alerts', value: openAlerts.length, accent: 'var(--status-alert)' },
          { label: 'New alerts', value: alerts.filter((a) => a.state === 'NEW').length,
            accent: 'var(--status-warning)' },
          { label: 'High severity',
            value: openAlerts.filter((a) => a.severity === 'HIGH').length,
            accent: 'var(--risk-high)' },
          { label: 'Subjects CV-enrolled', value: subjects.filter((s) => s.cvEnrolled).length,
            accent: 'var(--dcsa-ocean)' },
        ],
      };
    default: {
      const adj = inStage('ADJUDICATION');
      return {
        queue: adj,
        title: 'Adjudication workload',
        kpis: [
          { label: 'Ready for decision', value: adj.length, accent: 'var(--dcsa-navy)' },
          { label: 'Action required',
            value: subjects.filter((s) => s.status === 'ACTION_REQUIRED').length,
            accent: 'var(--status-alert)' },
          { label: 'Fast-track candidates', value: subjects.filter((s) => s.fastTrack).length,
            accent: 'var(--status-clear)' },
          { label: 'High risk (75+)',
            value: subjects.filter((s) => riskBand(s.riskScore) === 'high').length,
            accent: 'var(--risk-high)' },
        ],
      };
    }
  }
}

export default function Dashboard() {
  const { persona } = usePersona();
  const navigate = useNavigate();
  const subjectsQ = useData(getSubjects);
  const alertsQ = useData(getAlerts);

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data) return null;
    return buildKpis(persona.id, subjectsQ.data, alertsQ.data);
  }, [persona.id, subjectsQ.data, alertsQ.data]);

  if (subjectsQ.loading || alertsQ.loading) return <Loading />;
  const error = subjectsQ.error || alertsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'AI risk', sortable: true },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Viewing as {persona.label} <AIBadge /></p>
        </div>
      </div>
      <div className="kpi-grid">
        {model.kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>
      <h2 className="dashboard-queue-title">{model.title}</h2>
      <DataTable columns={columns} rows={model.queue} rowKey="id"
        onRowClick={(s) => navigate(`/cases/${s.id}`)} />
    </div>
  );
}
```

Append to `portal/src/pages/pages.css`:

```css
/* Dashboard */
.dashboard-queue-title { margin-bottom: var(--space-3); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: dashboard tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/Dashboard.jsx portal/src/pages/pages.css portal/src/__tests__/dashboard.test.jsx
git commit -m "feat(portal): persona-aware dashboard with KPI cards and work queues"
```

---

### Task 10: Case Detail shell + Overview and Documents tabs

**Files:**
- Modify: `portal/src/pages/case/CaseDetail.jsx` (replace stub)
- Create: `portal/src/pages/case/OverviewTab.jsx`, `portal/src/pages/case/DocumentsTab.jsx`, `portal/src/pages/case/case.css`
- Create placeholder tab stubs: `portal/src/pages/case/GuidelinesTab.jsx`, `InvestigationTab.jsx`, `AdjudicationTab.jsx`, `CVTab.jsx` — each `export default function XTab({ caseData }) { return <p className="muted">Coming in a later task.</p>; }` (replaced by Tasks 11-14)
- Create fixture: append `CASE_001` to `portal/src/__tests__/fixtures.js`
- Test: `portal/src/__tests__/caseDetail.test.jsx`

**Interfaces:**
- Consumes: `getCase` (Task 6), primitives, `usePersona` (`persona.defaultCaseTab`).
- Produces: `/cases/:id` route. Subject header (name, position, tier, eligibility pill, status pill, CV-enrolled badge, AI risk dial number, masked SSN). Tab bar with slugs: `overview`, `guidelines`, `investigation`, `adjudication`, `continuous-vetting`, `documents`; active tab from `?tab=` param, defaulting to `persona.defaultCaseTab`. Every tab component receives the props `{ caseData }` — Tasks 11-14 keep this contract.
- `OverviewTab({ caseData })`: AI summary card, subject KVGrid, whole-person list, timeline.
- `DocumentsTab({ caseData })`: document cards.

- [ ] **Step 1: Append CASE_001 fixture**

Append to `portal/src/__tests__/fixtures.js`:

```js
export const CASE_001 = {
  subject: { ...SUBJECTS[0], ssnMasked: '***-**-4821', dob: '1988-03-14',
    address: '1427 Birch Hollow Ct, Manassas, VA 20109' },
  aiSummary: 'Significant unresolved financial concerns under Guideline F.',
  timeline: [
    { date: '2026-01-27', actor: 'S. Whitfield', role: 'Investigator',
      event: 'ROI transmitted', note: 'Financial issues flagged' },
  ],
  wholePerson: [
    { factor: 'Frequency and recency', assessment: 'Ongoing; newest alert June 2026.' },
  ],
  guidelines: [
    { code: 'F', name: 'Financial Considerations', severity: 'C',
      aiReasoning: 'AG ¶ 19(a) established by the credit record.',
      evidence: [{ provider: 'TransUnion', type: 'Credit report',
        description: '$47,300 delinquent across 5 accounts', date: '2026-03-15' }],
      disqualifiers: [{ code: 'AG ¶ 19(a)', description: 'Inability to satisfy debts',
        evidence: '$47,300 delinquent' }],
      mitigators: [{ code: 'AG ¶ 20(b)', description: 'Conditions beyond control',
        applicability: 'PARTIAL', reasoning: 'Job loss involuntary; no repayment since.' }],
      precedents: [{ caseNumber: '20-01001', outcome: 'DENIED', year: 2021,
        relevance: 'DOHA hearing decision involving Guideline F' }] },
  ],
  investigation: {
    coverage: [{ item: 'Subject interview (ESI)', status: 'COMPLETE' }],
    sf86Sections: [
      { section: 'Section 20A', title: 'Financial record — delinquencies',
        subjectReport: 'Two delinquent accounts totaling about $9,000',
        matchedResult: 'Five delinquent accounts totaling $47,300',
        discrepancy: true, providers: ['TransUnion', 'Equifax'], guideline: 'F' },
    ],
    interviews: [{ date: '2025-11-19', type: 'Enhanced Subject Interview',
      interviewer: 'S. Whitfield', summary: 'Subject understated debt total.' }],
    roiEntries: [{ date: '2026-01-27', investigator: 'S. Whitfield', item: 'Financial',
      text: 'Credit data establishes sustained delinquency.' }],
  },
  adjudication: {
    recommendation: { action: 'SOR', aiSuggested: true,
      rationale: 'Unmitigated F concerns with candor issues.' },
    sorDraft: 'STATEMENT OF REASONS (DRAFT) — Guideline F: …',
    decisions: [],
  },
  alerts: ALERTS,
  documents: [{ title: 'Report of Investigation (ROI)', type: 'ROI',
    description: 'T5 ROI transmitted 2026-01-27', url: null }],
};
```

- [ ] **Step 2: Write the failing test**

`portal/src/__tests__/caseDetail.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getCase: (id) => id === 'SUBJ-001'
    ? Promise.resolve(CASE_001)
    : Promise.reject(new Error(`Failed to load cases/${id}.json (HTTP 404)`)),
}));

import CaseDetail from '../pages/case/CaseDetail.jsx';

function renderCase(personaId = 'adjudicator', id = 'SUBJ-001') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[`/cases/${id}`]}>
        <Routes><Route path="/cases/:id" element={<CaseDetail />} /></Routes>
      </MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CaseDetail', () => {
  it('renders subject header with pills and risk score', async () => {
    renderCase();
    expect(await screen.findByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.getByText('Action required')).toBeInTheDocument();
    expect(screen.getByText('***-**-4821')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('defaults the active tab to the persona preference (adjudicator)', async () => {
    renderCase('adjudicator');
    await screen.findByText('Daniel R. Okafor');
    expect(screen.getByRole('tab', { name: 'Adjudication' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs and shows overview content', async () => {
    renderCase();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Significant unresolved financial concerns/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    expect(screen.getByText('Report of Investigation (ROI)')).toBeInTheDocument();
  });

  it('shows an error state for unknown case ids', async () => {
    renderCase('adjudicator', 'SUBJ-999');
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 404');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 4: Implement**

`portal/src/pages/case/CaseDetail.jsx` (replace stub):

```jsx
import { useParams, useSearchParams } from 'react-router-dom';
import { getCase } from '../../data/api.js';
import { useData } from '../../data/useData.js';
import { usePersona } from '../../state/PersonaContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, ELIGIBILITY_LABELS, riskBand,
} from '../../domain.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import { Loading, ErrorAlert } from '../../components/States.jsx';
import OverviewTab from './OverviewTab.jsx';
import GuidelinesTab from './GuidelinesTab.jsx';
import InvestigationTab from './InvestigationTab.jsx';
import AdjudicationTab from './AdjudicationTab.jsx';
import CVTab from './CVTab.jsx';
import DocumentsTab from './DocumentsTab.jsx';
import './case.css';

const TABS = [
  { slug: 'overview', label: 'Overview', component: OverviewTab },
  { slug: 'guidelines', label: 'Guidelines', component: GuidelinesTab },
  { slug: 'investigation', label: 'Investigation', component: InvestigationTab },
  { slug: 'adjudication', label: 'Adjudication', component: AdjudicationTab },
  { slug: 'continuous-vetting', label: 'Continuous vetting', component: CVTab },
  { slug: 'documents', label: 'Documents', component: DocumentsTab },
];

export default function CaseDetail() {
  const { id } = useParams();
  const { persona } = usePersona();
  const [params, setParams] = useSearchParams();
  const { data: caseData, loading, error } = useData(() => getCase(id), [id]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const active = params.get('tab') || persona.defaultCaseTab;
  const tab = TABS.find((t) => t.slug === active) || TABS[0];
  const TabBody = tab.component;
  const s = caseData.subject;
  const band = riskBand(s.riskScore);

  return (
    <div className="page">
      <div className="card subject-header">
        <div className="subject-main">
          <h1>{s.name}</h1>
          <p className="muted">{s.position} · {s.tier} · SSN {s.ssnMasked}</p>
          <div className="subject-pills">
            <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge>
            <StatusBadge variant="info">{STAGE_LABELS[s.stage]}</StatusBadge>
            <StatusBadge variant="neutral">
              Eligibility: {ELIGIBILITY_LABELS[s.eligibility]}
            </StatusBadge>
            {s.cvEnrolled && <StatusBadge variant="success">CV enrolled</StatusBadge>}
            {s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
          </div>
        </div>
        <div className={`risk-dial risk-${band}`} title="AI triage risk score (0-100)">
          <span className="risk-dial-value">{s.riskScore}</span>
          <span className="risk-dial-label">AI risk</span>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button key={t.slug} role="tab" aria-selected={t.slug === tab.slug}
            className={`tab-button ${t.slug === tab.slug ? 'active' : ''}`}
            onClick={() => setParams({ tab: t.slug })}>
            {t.label}
          </button>
        ))}
      </div>

      <TabBody caseData={caseData} />
    </div>
  );
}
```

`portal/src/pages/case/OverviewTab.jsx`:

```jsx
import KVGrid from '../../components/KVGrid.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';

export default function OverviewTab({ caseData }) {
  const s = caseData.subject;
  return (
    <div>
      <div className="card ai-summary">
        <h3>Executive summary <AIBadge /></h3>
        <p>{caseData.aiSummary}</p>
      </div>
      <div className="card">
        <h3>Subject</h3>
        <KVGrid items={[
          { label: 'Date of birth', value: s.dob },
          { label: 'Address', value: s.address },
          { label: 'Tier', value: s.tier },
          { label: 'Days in stage', value: s.daysInStage },
          { label: 'Flagged guidelines',
            value: s.flaggedGuidelines.length
              ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
              : 'None' },
        ]} />
      </div>
      <div className="card">
        <h3>Whole-person snapshot</h3>
        <ul className="whole-person-list">
          {caseData.wholePerson.map((w) => (
            <li key={w.factor}><strong>{w.factor}.</strong> {w.assessment}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Case timeline</h3>
        <ol className="timeline">
          {caseData.timeline.map((e, i) => (
            <li key={i}>
              <span className="timeline-date">{e.date}</span>
              <span className="timeline-body">
                <strong>{e.event}</strong>
                <span className="muted"> — {e.actor} ({e.role})</span>
                {e.note && <div className="muted">{e.note}</div>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

`portal/src/pages/case/DocumentsTab.jsx`:

```jsx
import { EmptyState } from '../../components/States.jsx';

export default function DocumentsTab({ caseData }) {
  if (!caseData.documents.length) {
    return <EmptyState title="No documents" message="No documents are on file for this case." />;
  }
  return (
    <div>
      {caseData.documents.map((d) => (
        <div key={d.title} className="card document-card">
          <div>
            <h3>{d.title}</h3>
            <p className="muted">{d.type} · {d.description}</p>
          </div>
          {d.url
            ? <a className="btn btn-secondary" href={d.url}>Open</a>
            : <span className="muted">Not available in demo</span>}
        </div>
      ))}
    </div>
  );
}
```

Tab stubs (`GuidelinesTab.jsx`, `InvestigationTab.jsx`, `AdjudicationTab.jsx`, `CVTab.jsx`) — one line each, e.g.:

```jsx
export default function GuidelinesTab({ caseData }) {
  return <p className="muted">Coming in a later task.</p>;
}
```

`portal/src/pages/case/case.css`:

```css
.subject-header { display: flex; justify-content: space-between; align-items: center;
  gap: var(--space-5); margin-bottom: var(--space-5); }
.subject-pills { display: flex; gap: var(--space-2); flex-wrap: wrap;
  margin-top: var(--space-3); align-items: center; }

.risk-dial { display: flex; flex-direction: column; align-items: center;
  justify-content: center; width: 88px; height: 88px; border-radius: 50%;
  border: 4px solid; flex-shrink: 0; }
.risk-dial-value { font-size: var(--font-size-3xl); font-weight: 700; line-height: 1; }
.risk-dial-label { font-size: var(--font-size-xs); text-transform: uppercase;
  letter-spacing: 0.5px; }
.risk-dial.risk-high { border-color: var(--risk-high); color: var(--risk-high);
  background: var(--risk-high-bg); }
.risk-dial.risk-moderate { border-color: var(--risk-moderate); color: var(--risk-moderate);
  background: var(--risk-moderate-bg); }
.risk-dial.risk-low { border-color: var(--status-clear); color: var(--status-clear);
  background: var(--status-clear-bg); }

.tab-bar { display: flex; gap: var(--space-1); border-bottom: 2px solid var(--border-light);
  margin-bottom: var(--space-5); overflow-x: auto; }
.tab-button { padding: var(--space-3) var(--space-4); background: none; border: none;
  border-bottom: 3px solid transparent; font-family: inherit;
  font-size: var(--font-size-base); font-weight: 600; color: var(--text-secondary);
  cursor: pointer; white-space: nowrap; min-height: 44px; }
.tab-button:hover { color: var(--dcsa-navy); }
.tab-button.active { color: var(--dcsa-navy); border-bottom-color: var(--dcsa-gold); }

.ai-summary h3, .card h3 { margin-bottom: var(--space-3); display: flex;
  align-items: center; gap: var(--space-2); }
.whole-person-list { list-style: none; display: grid; gap: var(--space-2); }
.timeline { list-style: none; display: grid; gap: var(--space-3); }
.timeline li { display: flex; gap: var(--space-4); }
.timeline-date { flex-shrink: 0; width: 92px; font-weight: 600;
  font-size: var(--font-size-sm); color: var(--text-secondary); }
.document-card { display: flex; justify-content: space-between; align-items: center;
  gap: var(--space-4); }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: caseDetail tests pass.

- [ ] **Step 6: Commit**

```bash
git add portal/src/pages/case portal/src/__tests__/fixtures.js portal/src/__tests__/caseDetail.test.jsx
git commit -m "feat(portal): case detail hub with subject header, tabs, overview and documents"
```

---

### Task 11: Guidelines tab (SEAD-4 cards)

**Files:**
- Modify: `portal/src/pages/case/GuidelinesTab.jsx` (replace stub)
- Modify: `portal/src/pages/case/case.css` (append)
- Test: `portal/src/__tests__/guidelinesTab.test.jsx`

**Interfaces:**
- Consumes: `caseData.guidelines` (shape per Task 1 `GuidelineAssessment`), primitives (`CollapsibleSection`, `SeverityBadge`, `StatusBadge`, `AIBadge`, `DataTable`).
- Produces: one `CollapsibleSection` per guideline (defaultOpen when only one; first one open otherwise), containing: AI reasoning block, evidence table (provider/type/description/date), disqualifiers (error-styled list with AG ¶ codes), mitigators (with FULL/PARTIAL/NONE badge), precedents table (case number, outcome pill, year, relevance).

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/guidelinesTab.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuidelinesTab from '../pages/case/GuidelinesTab.jsx';
import { CASE_001 } from './fixtures.js';

describe('GuidelinesTab', () => {
  it('renders a section per guideline with severity badge', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    expect(screen.getByText('F — Financial Considerations')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument(); // severity badge
  });

  it('shows disqualifiers, mitigators, evidence, and precedents when expanded', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    fireEvent.click(screen.getByRole('button', { name: /financial considerations/i }));
    expect(screen.getByText('AG ¶ 19(a)')).toBeInTheDocument();
    expect(screen.getByText('AG ¶ 20(b)')).toBeInTheDocument();
    expect(screen.getByText('PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('$47,300 delinquent across 5 accounts')).toBeInTheDocument();
    expect(screen.getByText('20-01001')).toBeInTheDocument();
    expect(screen.getByText('DENIED')).toBeInTheDocument();
  });

  it('renders empty state when no guidelines flagged', () => {
    render(<GuidelinesTab caseData={{ ...CASE_001, guidelines: [] }} />);
    expect(screen.getByText(/no adjudicative guidelines/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/case/GuidelinesTab.jsx` (replace stub):

```jsx
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import SeverityBadge from '../../components/SeverityBadge.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import { EmptyState } from '../../components/States.jsx';

const APPLICABILITY_VARIANT = { FULL: 'success', PARTIAL: 'warning', NONE: 'error' };
const OUTCOME_VARIANT = { GRANTED: 'success', DENIED: 'error' };

export default function GuidelinesTab({ caseData }) {
  const { guidelines } = caseData;
  if (!guidelines.length) {
    return <EmptyState title="No adjudicative guidelines flagged"
      message="No disqualifying information has been developed against any SEAD-4 guideline." />;
  }
  return (
    <div>
      {guidelines.map((g, i) => (
        <CollapsibleSection key={g.code}
          title={`${g.code} — ${g.name}`}
          meta={<SeverityBadge level={g.severity} />}
          defaultOpen={i === 0}>
          <div className="guideline-ai card-inset">
            <h4>AI assessment <AIBadge /></h4>
            <p>{g.aiReasoning}</p>
          </div>

          <h4>Evidence</h4>
          <table className="inline-table">
            <thead><tr><th>Provider</th><th>Type</th><th>Description</th><th>Date</th></tr></thead>
            <tbody>
              {g.evidence.map((e, j) => (
                <tr key={j}>
                  <td>{e.provider}</td><td>{e.type}</td>
                  <td>{e.description}</td><td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4>Disqualifying conditions</h4>
          <ul className="condition-list">
            {g.disqualifiers.map((d) => (
              <li key={d.code} className="condition disqualifier">
                <strong>{d.code}</strong> — {d.description}
                <div className="muted">Evidence: {d.evidence}</div>
              </li>
            ))}
          </ul>

          <h4>Mitigating conditions</h4>
          <ul className="condition-list">
            {g.mitigators.map((m) => (
              <li key={m.code} className="condition mitigator">
                <strong>{m.code}</strong> — {m.description}{' '}
                <StatusBadge variant={APPLICABILITY_VARIANT[m.applicability]}>
                  {m.applicability}
                </StatusBadge>
                <div className="muted">{m.reasoning}</div>
              </li>
            ))}
          </ul>

          <h4>DOHA precedents <AIBadge /></h4>
          <table className="inline-table">
            <thead><tr><th>Case</th><th>Outcome</th><th>Year</th><th>Relevance</th></tr></thead>
            <tbody>
              {g.precedents.map((p) => (
                <tr key={p.caseNumber}>
                  <td>{p.caseNumber}</td>
                  <td><StatusBadge variant={OUTCOME_VARIANT[p.outcome] || 'neutral'}>
                    {p.outcome}</StatusBadge></td>
                  <td>{p.year ?? '—'}</td>
                  <td>{p.relevance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      ))}
    </div>
  );
}
```

Append to `portal/src/pages/case/case.css`:

```css
/* Guidelines tab */
.card-inset { background: var(--bg-sidebar); border-radius: var(--radius-sm);
  padding: var(--space-4); margin-bottom: var(--space-4); }
.collapsible-body h4 { margin: var(--space-4) 0 var(--space-2); display: flex;
  align-items: center; gap: var(--space-2); }
.inline-table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.inline-table th { text-align: left; font-size: var(--font-size-xs);
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);
  padding: var(--space-2); border-bottom: 1px solid var(--border-light); }
.inline-table td { padding: var(--space-2); border-bottom: 1px solid var(--border-light);
  vertical-align: top; }
.condition-list { list-style: none; display: grid; gap: var(--space-2); }
.condition { padding: var(--space-3); border-radius: var(--radius-sm);
  border-left: 3px solid; }
.condition.disqualifier { background: var(--status-alert-bg);
  border-left-color: var(--status-alert); }
.condition.mitigator { background: var(--status-clear-bg);
  border-left-color: var(--status-clear); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: guidelinesTab tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/case/GuidelinesTab.jsx portal/src/pages/case/case.css portal/src/__tests__/guidelinesTab.test.jsx
git commit -m "feat(portal): SEAD-4 guideline cards with disqualifiers, mitigators, precedents"
```

---

### Task 12: Investigation tab (SF-86 vs matched records)

**Files:**
- Modify: `portal/src/pages/case/InvestigationTab.jsx` (replace stub)
- Modify: `portal/src/pages/case/case.css` (append)
- Test: `portal/src/__tests__/investigationTab.test.jsx`

**Interfaces:**
- Consumes: `caseData.investigation` (Task 1 `Investigation` shape), `usePersona`, `useDemo` (`addRoiEntry`, `demo.roiEntries`), primitives.
- Produces: coverage checklist with status pills; SF-86 sections rendered in the Checkr "candidate input vs matched result" two-column pattern with a "Discrepancy" error pill and guideline chip when flagged; interview cards; ROI entries list (file entries + demo-added entries merged). When persona is `investigator`, an "Add ROI entry" form (item select + textarea) calls `addRoiEntry(caseId, { date: '2026-07-02', investigator: 'Demo investigator', item, text })`.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/investigationTab.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import InvestigationTab from '../pages/case/InvestigationTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab(personaId = 'investigator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <InvestigationTab caseData={CASE_001} />
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('InvestigationTab', () => {
  it('renders self-report vs matched result with discrepancy flag', () => {
    renderTab();
    expect(screen.getByText('Two delinquent accounts totaling about $9,000')).toBeInTheDocument();
    expect(screen.getByText('Five delinquent accounts totaling $47,300')).toBeInTheDocument();
    expect(screen.getByText('Discrepancy')).toBeInTheDocument();
  });

  it('renders coverage checklist with status pills', () => {
    renderTab();
    expect(screen.getByText('Subject interview (ESI)')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('investigator can add an ROI entry; it appears in the list', () => {
    renderTab('investigator');
    fireEvent.change(screen.getByLabelText('Coverage item'), { target: { value: 'Financial' } });
    fireEvent.change(screen.getByLabelText('Entry'), { target: { value: 'New lead resolved.' } });
    fireEvent.click(screen.getByRole('button', { name: /add roi entry/i }));
    expect(screen.getByText('New lead resolved.')).toBeInTheDocument();
  });

  it('non-investigator personas do not see the ROI form', () => {
    renderTab('adjudicator');
    expect(screen.queryByRole('button', { name: /add roi entry/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/case/InvestigationTab.jsx` (replace stub):

```jsx
import { useState } from 'react';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';

const COVERAGE_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const COVERAGE_LABEL = { COMPLETE: 'Complete', PENDING: 'Pending', NOT_REQUIRED: 'Not required' };
const ROI_ITEMS = ['Financial', 'Foreign contacts', 'Employment', 'Criminal', 'General'];

export default function InvestigationTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, addRoiEntry } = useDemo();
  const inv = caseData.investigation;
  const caseId = caseData.subject.id;
  const [item, setItem] = useState(ROI_ITEMS[0]);
  const [text, setText] = useState('');

  const roiEntries = [...inv.roiEntries, ...(demo.roiEntries[caseId] || [])];

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addRoiEntry(caseId, {
      date: '2026-07-02', investigator: 'Demo investigator', item, text: text.trim(),
    });
    setText('');
  };

  return (
    <div>
      <div className="card">
        <h3>Coverage checklist</h3>
        <ul className="coverage-list">
          {inv.coverage.map((c) => (
            <li key={c.item}>
              <span>{c.item}</span>
              <StatusBadge variant={COVERAGE_VARIANT[c.status]}>
                {COVERAGE_LABEL[c.status]}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>SF-86 review — self-report vs record checks</h3>
        {inv.sf86Sections.map((s) => (
          <div key={s.section} className={`sf86-section ${s.discrepancy ? 'flagged' : ''}`}>
            <div className="sf86-heading">
              <strong>{s.section} — {s.title}</strong>
              {s.discrepancy && <StatusBadge variant="error">Discrepancy</StatusBadge>}
              {s.guideline && <GuidelineChip code={s.guideline} />}
            </div>
            <div className="sf86-compare">
              <div>
                <div className="sf86-col-label">Subject self-report</div>
                <p>{s.subjectReport}</p>
              </div>
              <div>
                <div className="sf86-col-label">Matched result</div>
                <p>{s.matchedResult}</p>
                <div className="muted">Sources: {s.providers.join(', ')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inv.interviews.length > 0 && (
        <div className="card">
          <h3>Interviews</h3>
          {inv.interviews.map((iv, i) => (
            <div key={i} className="interview">
              <strong>{iv.type}</strong>
              <span className="muted"> — {iv.date}, {iv.interviewer}</span>
              <p>{iv.summary}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Report of Investigation entries</h3>
        {roiEntries.length === 0 && <p className="muted">No ROI entries yet.</p>}
        <ul className="roi-list">
          {roiEntries.map((r, i) => (
            <li key={i}>
              <span className="muted">{r.date} · {r.investigator} · {r.item}</span>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
        {persona.id === 'investigator' && (
          <form className="roi-form" onSubmit={submit}>
            <label className="form-group">
              <span>Coverage item</span>
              <select aria-label="Coverage item" value={item}
                onChange={(e) => setItem(e.target.value)}>
                {ROI_ITEMS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="form-group roi-entry-field">
              <span>Entry</span>
              <textarea aria-label="Entry" rows={2} value={text}
                onChange={(e) => setText(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary">Add ROI entry</button>
          </form>
        )}
      </div>
    </div>
  );
}
```

Append to `portal/src/pages/case/case.css`:

```css
/* Investigation tab */
.coverage-list { list-style: none; display: grid; gap: var(--space-2); }
.coverage-list li { display: flex; justify-content: space-between; align-items: center;
  padding: var(--space-2) 0; border-bottom: 1px solid var(--border-light); }
.coverage-list li:last-child { border-bottom: none; }

.sf86-section { padding: var(--space-4); border: 1px solid var(--border-light);
  border-radius: var(--radius-sm); margin-bottom: var(--space-3); }
.sf86-section.flagged { border-color: var(--status-alert);
  background: var(--status-alert-bg); }
.sf86-heading { display: flex; align-items: center; gap: var(--space-2);
  margin-bottom: var(--space-3); flex-wrap: wrap; }
.sf86-compare { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
@media (max-width: 768px) { .sf86-compare { grid-template-columns: 1fr; } }
.sf86-col-label { font-size: var(--font-size-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);
  margin-bottom: var(--space-1); }

.interview { margin-bottom: var(--space-3); }
.roi-list { list-style: none; display: grid; gap: var(--space-3);
  margin-bottom: var(--space-4); }
.roi-form { display: flex; gap: var(--space-3); align-items: flex-end; flex-wrap: wrap; }
.roi-entry-field { flex: 1; min-width: 240px; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: investigationTab tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/case/InvestigationTab.jsx portal/src/pages/case/case.css portal/src/__tests__/investigationTab.test.jsx
git commit -m "feat(portal): investigation tab with SF-86 compare, coverage, ROI entries"
```

---

### Task 13: Adjudication tab (decision workspace)

**Files:**
- Modify: `portal/src/pages/case/AdjudicationTab.jsx` (replace stub)
- Modify: `portal/src/pages/case/case.css` (append)
- Test: `portal/src/__tests__/adjudicationTab.test.jsx`

**Interfaces:**
- Consumes: `caseData.adjudication`, `caseData.guidelines`, `caseData.wholePerson`; `usePersona`, `useDemo` (`recordDecision`, `demo.decisions`); `ADJ_ACTION_LABELS`; primitives.
- Produces: (1) AI recommendation panel (action label + rationale + AIBadge); (2) guideline weighing table — code, name, severity badge, disqualifier count, count of FULL mitigators; (3) whole-person worksheet list; (4) SOR draft in a CollapsibleSection when `sorDraft` present (labeled "AI-drafted"); (5) decision history = `adjudication.decisions` + `demo.decisions[caseId]`; (6) when persona is `adjudicator`, a decision form: action `<select aria-label="Decision">` over `ADJ_ACTION_LABELS`, rationale `<textarea aria-label="Rationale">`, submit "Record decision" → `recordDecision(caseId, { date: '2026-07-02', adjudicator: 'Demo adjudicator', action, rationale })`.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/adjudicationTab.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import AdjudicationTab from '../pages/case/AdjudicationTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <AdjudicationTab caseData={CASE_001} />
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('AdjudicationTab', () => {
  it('shows the AI recommendation with action label', () => {
    renderTab();
    expect(screen.getByText('Statement of Reasons')).toBeInTheDocument();
    expect(screen.getByText(/Unmitigated F concerns/)).toBeInTheDocument();
  });

  it('shows the guideline weighing table and whole-person worksheet', () => {
    renderTab();
    expect(screen.getByText('Financial Considerations')).toBeInTheDocument();
    expect(screen.getByText('Frequency and recency')).toBeInTheDocument();
  });

  it('adjudicator records a decision and it appears in history', () => {
    renderTab('adjudicator');
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: 'LOI' } });
    fireEvent.change(screen.getByLabelText('Rationale'),
      { target: { value: 'Request subject response first.' } });
    fireEvent.click(screen.getByRole('button', { name: /record decision/i }));
    expect(screen.getByText('Request subject response first.')).toBeInTheDocument();
  });

  it('non-adjudicator personas do not see the decision form', () => {
    renderTab('analyst');
    expect(screen.queryByRole('button', { name: /record decision/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/case/AdjudicationTab.jsx` (replace stub):

```jsx
import { useState } from 'react';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import { ADJ_ACTION_LABELS } from '../../domain.js';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import SeverityBadge from '../../components/SeverityBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';

export default function AdjudicationTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, recordDecision } = useDemo();
  const adj = caseData.adjudication;
  const caseId = caseData.subject.id;
  const [action, setAction] = useState('GRANT');
  const [rationale, setRationale] = useState('');

  const decisions = [...adj.decisions, ...(demo.decisions[caseId] || [])];

  const submit = (e) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    recordDecision(caseId, {
      date: '2026-07-02', adjudicator: 'Demo adjudicator',
      action, rationale: rationale.trim(),
    });
    setRationale('');
  };

  return (
    <div>
      <div className="card recommendation-panel">
        <h3>Recommendation {adj.recommendation.aiSuggested && <AIBadge />}</h3>
        <p className="recommendation-action">{ADJ_ACTION_LABELS[adj.recommendation.action]}</p>
        <p>{adj.recommendation.rationale}</p>
      </div>

      <div className="card">
        <h3>Guideline weighing</h3>
        <table className="inline-table">
          <thead>
            <tr><th>Guideline</th><th>Severity</th><th>Disqualifiers</th>
              <th>Full mitigation</th></tr>
          </thead>
          <tbody>
            {caseData.guidelines.map((g) => (
              <tr key={g.code}>
                <td><strong>{g.code}</strong> {g.name}</td>
                <td><SeverityBadge level={g.severity} /></td>
                <td>{g.disqualifiers.length}</td>
                <td>{g.mitigators.filter((m) => m.applicability === 'FULL').length}
                  {' '}of {g.mitigators.length}</td>
              </tr>
            ))}
            {caseData.guidelines.length === 0 && (
              <tr><td colSpan={4} className="muted">No guidelines flagged.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Whole-person worksheet</h3>
        <ul className="whole-person-list">
          {caseData.wholePerson.map((w) => (
            <li key={w.factor}><strong>{w.factor}.</strong> {w.assessment}</li>
          ))}
        </ul>
      </div>

      {adj.sorDraft && (
        <CollapsibleSection title="Statement of Reasons — draft" meta={<AIBadge />}>
          <pre className="sor-draft">{adj.sorDraft}</pre>
        </CollapsibleSection>
      )}

      <div className="card">
        <h3>Decision history</h3>
        {decisions.length === 0 && <p className="muted">No decisions recorded.</p>}
        <ul className="decision-list">
          {decisions.map((d, i) => (
            <li key={i}>
              <span className="muted">{d.date} · {d.adjudicator}</span>
              <div><strong>{ADJ_ACTION_LABELS[d.action]}</strong> — {d.rationale}</div>
            </li>
          ))}
        </ul>
        {persona.id === 'adjudicator' && (
          <form className="decision-form" onSubmit={submit}>
            <label className="form-group">
              <span>Decision</span>
              <select aria-label="Decision" value={action}
                onChange={(e) => setAction(e.target.value)}>
                {Object.entries(ADJ_ACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>))}
              </select>
            </label>
            <label className="form-group decision-rationale">
              <span>Rationale</span>
              <textarea aria-label="Rationale" rows={2} value={rationale}
                onChange={(e) => setRationale(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary">Record decision</button>
          </form>
        )}
      </div>
    </div>
  );
}
```

Append to `portal/src/pages/case/case.css`:

```css
/* Adjudication tab */
.recommendation-panel { border-left: 4px solid var(--dcsa-gold); }
.recommendation-action { font-size: var(--font-size-xl); font-weight: 700;
  color: var(--dcsa-navy); margin-bottom: var(--space-2); }
.sor-draft { white-space: pre-wrap; font-family: inherit;
  background: var(--bg-sidebar); padding: var(--space-4);
  border-radius: var(--radius-sm); font-size: var(--font-size-sm); }
.decision-list { list-style: none; display: grid; gap: var(--space-3);
  margin-bottom: var(--space-4); }
.decision-form { display: flex; gap: var(--space-3); align-items: flex-end;
  flex-wrap: wrap; }
.decision-rationale { flex: 1; min-width: 240px; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: adjudicationTab tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/case/AdjudicationTab.jsx portal/src/pages/case/case.css portal/src/__tests__/adjudicationTab.test.jsx
git commit -m "feat(portal): adjudication workspace with weighing, worksheet, SOR draft, decisions"
```

---

### Task 14: Continuous Vetting tab (3-step alert validation)

**Files:**
- Modify: `portal/src/pages/case/CVTab.jsx` (replace stub)
- Modify: `portal/src/pages/case/case.css` (append)
- Test: `portal/src/__tests__/cvTab.test.jsx`

**Interfaces:**
- Consumes: `caseData.alerts` (Task 1 `CVAlert` shape), `usePersona`, `useDemo` (`dispositionAlert`, `demo.alertStates`), `ALERT_CATEGORY_LABELS`, `ALERT_STATE_LABELS`, `ALERT_TRANSITIONS`, `ALERT_ACTION_LABELS`, primitives (`CollapsibleSection`, `ConfidenceBar`, `StatusBadge`, `AIBadge`).
- Produces: one CollapsibleSection per alert (effective state = demo override || file state). Body renders the analyst 3-step validation:
  1. Identity match — `ConfidenceBar` + identifiers table (field, subject value, record value, match pill)
  2. Threshold — rule, met pill, detail
  3. Prior adjudication — previously adjudicated pill + reference
  Disposition buttons (analyst persona only): one per legal transition from the effective state (from `ALERT_TRANSITIONS`), labeled per `ALERT_ACTION_LABELS`, calling `dispositionAlert(alert.id, next, alert.state)`.
- Also reads `?alert=<id>` search param: that alert's section renders `defaultOpen`.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/cvTab.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import CVTab from '../pages/case/CVTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab(personaId = 'analyst', initial = '/cases/SUBJ-001') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[initial]}><CVTab caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CVTab', () => {
  it('lists alerts with category and state', () => {
    renderTab();
    expect(screen.getByText(/Financial — New collection account/)).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('expands to show the 3-step validation', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('Delinquent debt > $5,000')).toBeInTheDocument();
    expect(screen.getByText(/not previously adjudicated/i)).toBeInTheDocument();
  });

  it('analyst dispositions an alert through a legal transition', () => {
    renderTab('analyst');
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm identity' }));
    expect(screen.getByText('Identity confirmed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate threshold' })).toBeInTheDocument();
  });

  it('non-analyst personas see no disposition buttons', () => {
    renderTab('adjudicator');
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    expect(screen.queryByRole('button', { name: 'Confirm identity' })).not.toBeInTheDocument();
  });

  it('shows empty state when subject has no alerts', () => {
    localStorage.setItem('demo.persona', 'analyst');
    render(
      <PersonaProvider><DemoProvider>
        <MemoryRouter><CVTab caseData={{ ...CASE_001, alerts: [] }} /></MemoryRouter>
      </DemoProvider></PersonaProvider>
    );
    expect(screen.getByText(/no cv alerts/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/case/CVTab.jsx` (replace stub):

```jsx
import { useSearchParams } from 'react-router-dom';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_TRANSITIONS, ALERT_ACTION_LABELS,
} from '../../domain.js';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import ConfidenceBar from '../../components/ConfidenceBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import { EmptyState } from '../../components/States.jsx';

const STATE_VARIANT = {
  NEW: 'warning', IDENTITY_CONFIRMED: 'info', VALIDATED: 'info',
  REFERRED: 'warning', ADJUDICATED: 'success', CLOSED: 'neutral',
};

export default function CVTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, dispositionAlert } = useDemo();
  const [params] = useSearchParams();
  const focusId = params.get('alert');

  if (!caseData.alerts.length) {
    return <EmptyState title="No CV alerts"
      message="Continuous vetting has produced no alerts for this subject." />;
  }

  return (
    <div>
      {caseData.alerts.map((a) => {
        const state = demo.alertStates[a.id] || a.state;
        return (
          <CollapsibleSection key={a.id}
            title={`${ALERT_CATEGORY_LABELS[a.category]} — ${a.description}`}
            meta={<>
              <StatusBadge variant={STATE_VARIANT[state]}>
                {ALERT_STATE_LABELS[state]}
              </StatusBadge>
              <span className="muted">{a.receivedDate}</span>
            </>}
            defaultOpen={a.id === focusId}>
            <p className="muted">
              Provider: {a.provider} · Severity: {a.severity} · AI priority {a.priorityScore}
              {' '}<AIBadge />
            </p>

            <div className="cv-steps">
              <div className="cv-step">
                <h4>Step 1 — Identity match</h4>
                <ConfidenceBar value={a.identityMatch.confidence} />
                <table className="inline-table">
                  <thead><tr><th>Identifier</th><th>Subject</th><th>Record</th><th>Match</th></tr></thead>
                  <tbody>
                    {a.identityMatch.identifiers.map((idf) => (
                      <tr key={idf.field}>
                        <td>{idf.field}</td><td>{idf.subjectValue}</td><td>{idf.recordValue}</td>
                        <td><StatusBadge variant={idf.match ? 'success' : 'error'}>
                          {idf.match ? 'Match' : 'No match'}
                        </StatusBadge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="cv-step">
                <h4>Step 2 — Investigative-standard threshold</h4>
                <p><strong>{a.threshold.rule}</strong>{' '}
                  <StatusBadge variant={a.threshold.met ? 'error' : 'success'}>
                    {a.threshold.met ? 'Threshold met' : 'Below threshold'}
                  </StatusBadge></p>
                <p className="muted">{a.threshold.detail}</p>
              </div>

              <div className="cv-step">
                <h4>Step 3 — Prior adjudication check</h4>
                <p>
                  <StatusBadge variant={a.priorAdjudication.previouslyAdjudicated
                    ? 'neutral' : 'info'}>
                    {a.priorAdjudication.previouslyAdjudicated
                      ? 'Previously adjudicated' : 'Not previously adjudicated'}
                  </StatusBadge>
                  {a.priorAdjudication.reference && (
                    <span className="muted"> — {a.priorAdjudication.reference}</span>)}
                </p>
              </div>
            </div>

            {persona.id === 'analyst' && ALERT_TRANSITIONS[state].length > 0 && (
              <div className="cv-actions">
                {ALERT_TRANSITIONS[state].map((next) => (
                  <button key={next} type="button"
                    className={next === 'CLOSED' ? 'btn btn-ghost' : 'btn btn-secondary'}
                    onClick={() => dispositionAlert(a.id, next, a.state)}>
                    {ALERT_ACTION_LABELS[next]}
                  </button>
                ))}
              </div>
            )}
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
```

Append to `portal/src/pages/case/case.css`:

```css
/* Continuous vetting tab */
.cv-steps { display: grid; gap: var(--space-4); margin: var(--space-4) 0; }
.cv-step { padding: var(--space-4); background: var(--bg-sidebar);
  border-radius: var(--radius-sm); }
.cv-step h4 { margin-bottom: var(--space-3); }
.cv-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: cvTab tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/case/CVTab.jsx portal/src/pages/case/case.css portal/src/__tests__/cvTab.test.jsx
git commit -m "feat(portal): continuous vetting tab with 3-step alert validation and dispositions"
```

---

### Task 15: CV Alerts global inbox

**Files:**
- Modify: `portal/src/pages/CVAlerts.jsx` (replace stub)
- Modify: `portal/src/pages/pages.css` (append)
- Test: `portal/src/__tests__/cvAlerts.test.jsx`

**Interfaces:**
- Consumes: `getAlerts` (Task 6), `useDemo` (`demo.alertStates` for effective states), domain labels, primitives.
- Produces: `/alerts` route. KPI row (Open alerts, New, High severity, Referred). Category filter select (All categories + `ALERT_CATEGORY_LABELS`). DataTable columns: subject, category, severity pill, AI priority (sortable), state pill, received date (sortable). Row click navigates to `/cases/<subjectId>?tab=continuous-vetting&alert=<alertId>`.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/cvAlerts.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getAlerts: () => Promise.resolve(ALERTS),
}));

import CVAlerts from '../pages/CVAlerts.jsx';

function renderPage() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><CVAlerts /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CVAlerts', () => {
  it('renders KPI cards and the alert table', async () => {
    renderPage();
    expect(await screen.findByText('Open alerts')).toBeInTheDocument();
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderPage();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'CRIMINAL' } });
    expect(screen.queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
    expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/CVAlerts.jsx` (replace stub):

```jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import { ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS } from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';

const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const STATE_VARIANT = {
  NEW: 'warning', IDENTITY_CONFIRMED: 'info', VALIDATED: 'info',
  REFERRED: 'warning', ADJUDICATED: 'success', CLOSED: 'neutral',
};

export default function CVAlerts() {
  const navigate = useNavigate();
  const { demo } = useDemo();
  const [category, setCategory] = useState('ALL');
  const { data, loading, error } = useData(getAlerts);

  const alerts = useMemo(() => {
    if (!data) return [];
    return data
      .map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }))
      .filter((a) => category === 'ALL' || a.category === category);
  }, [data, demo.alertStates, category]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const all = data.map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }));
  const open = all.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.state));

  const columns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (a) => <strong>{a.subjectName}</strong> },
    { key: 'category', label: 'Category', sortable: true,
      render: (a) => ALERT_CATEGORY_LABELS[a.category] },
    { key: 'severity', label: 'Severity',
      render: (a) => <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</StatusBadge> },
    { key: 'priorityScore', label: 'AI priority', sortable: true },
    { key: 'state', label: 'State',
      render: (a) => <StatusBadge variant={STATE_VARIANT[a.state]}>{ALERT_STATE_LABELS[a.state]}</StatusBadge> },
    { key: 'receivedDate', label: 'Received', sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>CV alerts</h1>
          <p>Continuous vetting alert inbox <AIBadge /></p>
        </div>
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
      <div className="kpi-grid">
        <KPICard label="Open alerts" value={open.length} accent="var(--status-alert)" />
        <KPICard label="New" value={all.filter((a) => a.state === 'NEW').length}
          accent="var(--status-warning)" />
        <KPICard label="High severity"
          value={open.filter((a) => a.severity === 'HIGH').length}
          accent="var(--risk-high)" />
        <KPICard label="Referred"
          value={all.filter((a) => a.state === 'REFERRED').length}
          accent="var(--dcsa-gold)" />
      </div>
      {alerts.length === 0
        ? <EmptyState title="No alerts" message="No alerts match the current filter." />
        : <DataTable columns={columns} rows={alerts} rowKey="id"
            onRowClick={(a) =>
              navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`)} />}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: cvAlerts tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/CVAlerts.jsx portal/src/__tests__/cvAlerts.test.jsx
git commit -m "feat(portal): global CV alert inbox with category filter and deep links"
```

---

### Task 16: Data Providers page

**Files:**
- Modify: `portal/src/pages/DataProviders.jsx` (replace stub)
- Modify: `portal/src/pages/pages.css` (append)
- Test: `portal/src/__tests__/dataProviders.test.jsx`

**Interfaces:**
- Consumes: `getProviders` (Task 6), `GUIDELINES` (Task 4), primitives.
- Produces: `/providers` route. Provider cards grid (name, category, usedIn pills, status pill, record count formatted with `toLocaleString('en-US')`, last sync) + a coverage matrix table (rows = providers, columns = A-M, filled dot `●` when the provider informs that guideline).

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/dataProviders.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const PROVIDERS = [
  { id: 'fbi-cjis', name: 'FBI CJIS / NCIC + Rap Back', category: 'Criminal history',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['J', 'D', 'G', 'H'],
    status: 'HEALTHY', recordCount: 84210556, lastSync: '2026-07-02T06:00:00Z' },
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'],
    status: 'DEGRADED', recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z' },
];

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve(PROVIDERS),
}));

import DataProviders from '../pages/DataProviders.jsx';

describe('DataProviders', () => {
  it('renders provider cards with status and record counts', async () => {
    render(<MemoryRouter><DataProviders /></MemoryRouter>);
    expect(await screen.findByText('FBI CJIS / NCIC + Rap Back')).toBeInTheDocument();
    expect(screen.getByText('84,210,556')).toBeInTheDocument();
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('renders the provider-to-guideline coverage matrix', async () => {
    render(<MemoryRouter><DataProviders /></MemoryRouter>);
    await screen.findByText('FBI CJIS / NCIC + Rap Back');
    const matrix = screen.getByRole('table', { name: /guideline coverage/i });
    expect(matrix).toBeInTheDocument();
    const fbiRow = screen.getAllByRole('row')
      .find((r) => r.textContent.includes('FBI CJIS'));
    expect(fbiRow.textContent).toContain('●');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/DataProviders.jsx` (replace stub):

```jsx
import { getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { GUIDELINES } from '../domain.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };

export default function DataProviders() {
  const { data: providers, loading, error } = useData(getProviders);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const codes = Object.keys(GUIDELINES);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Data providers</h1>
          <p>Record sources feeding investigations and continuous vetting</p>
        </div>
      </div>

      <div className="provider-grid">
        {providers.map((p) => (
          <div key={p.id} className="card provider-card">
            <div className="provider-card-head">
              <h3>{p.name}</h3>
              <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
            </div>
            <p className="muted">{p.category}</p>
            <div className="provider-pills">
              {p.usedIn.map((u) => (
                <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>))}
            </div>
            <p><strong>{p.recordCount.toLocaleString('en-US')}</strong>
              <span className="muted"> records · last sync {p.lastSync.slice(0, 10)}</span></p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 id="coverage-matrix-title">Provider → guideline coverage</h3>
        <div className="matrix-wrap">
          <table className="inline-table coverage-matrix" aria-labelledby="coverage-matrix-title">
            <thead>
              <tr>
                <th>Provider</th>
                {codes.map((c) => <th key={c} title={GUIDELINES[c]}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  {codes.map((c) => (
                    <td key={c} className="matrix-cell">
                      {p.guidelines.includes(c) ? '●' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

Append to `portal/src/pages/pages.css`:

```css
/* Data providers */
.provider-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4); margin-bottom: var(--space-5); }
.provider-card-head { display: flex; justify-content: space-between; align-items: center;
  gap: var(--space-2); }
.provider-pills { display: flex; gap: var(--space-2); margin: var(--space-2) 0; }
.matrix-wrap { overflow-x: auto; }
.coverage-matrix .matrix-cell { text-align: center; color: var(--dcsa-ocean);
  font-size: var(--font-size-lg); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: dataProviders tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/DataProviders.jsx portal/src/pages/pages.css portal/src/__tests__/dataProviders.test.jsx
git commit -m "feat(portal): data provider registry with guideline coverage matrix"
```

---

### Task 17: Analytics page (real DOHA corpus charts)

**Files:**
- Modify: `portal/src/pages/Analytics.jsx` (replace stub)
- Modify: `portal/src/pages/pages.css` (append)
- Test: `portal/src/__tests__/analytics.test.jsx`

**Interfaces:**
- Consumes: `getAnalytics` (Task 6), Recharts, `KPICard`, states.
- Produces: `/analytics` route. KPI row (Total DOHA cases, Granted, Denied, Hearing/Appeal split). Charts (Recharts, themed per the DCSA Design System Reference: bars `var(--dcsa-ocean)`/`var(--dcsa-navy)`, grid `var(--border-light)`, ticks `var(--text-secondary)` 12px):
  1. Bar chart — cases by guideline (corpus.byGuideline, X = code, Y = cases)
  2. Line chart — granted vs denied by year (corpus.byYear)
  3. Bar chart — pipeline timeliness avgDays vs targetDays (pipeline.timeliness)
- Charts render inside `ResponsiveContainer`; in tests jsdom has no layout, so assert on KPI values and chart section headings, not SVG internals.

- [ ] **Step 1: Write the failing test**

`portal/src/__tests__/analytics.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const ANALYTICS = {
  corpus: {
    totalCases: 36700,
    byOutcome: { GRANTED: 13200, DENIED: 19800, OTHER: 3700 },
    byYear: [{ year: 2020, granted: 1500, denied: 2100 }],
    byGuideline: [{ code: 'F', name: 'Financial Considerations', cases: 15000, deniedPct: 61.5 }],
    byCaseType: { hearing: 28650, appeal: 8050 },
  },
  pipeline: {
    timeliness: [{ stage: 'Investigation', avgDays: 73, targetDays: 90 }],
    alertVolume: [{ category: 'FINANCIAL', count: 2 }],
    triageDistribution: [{ band: 'low', count: 9 }],
  },
};

vi.mock('../data/api.js', () => ({
  getAnalytics: () => Promise.resolve(ANALYTICS),
}));

import Analytics from '../pages/Analytics.jsx';

describe('Analytics', () => {
  it('renders corpus KPIs from real DOHA aggregates', async () => {
    render(<MemoryRouter><Analytics /></MemoryRouter>);
    expect(await screen.findByText('36,700')).toBeInTheDocument();
    expect(screen.getByText('19,800')).toBeInTheDocument();
  });

  it('renders the three chart sections', async () => {
    render(<MemoryRouter><Analytics /></MemoryRouter>);
    await screen.findByText('36,700');
    expect(screen.getByText('Cases by guideline')).toBeInTheDocument();
    expect(screen.getByText('Outcomes by year')).toBeInTheDocument();
    expect(screen.getByText('Pipeline timeliness')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — stub content.

- [ ] **Step 3: Implement**

`portal/src/pages/Analytics.jsx` (replace stub):

```jsx
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getAnalytics } from '../data/api.js';
import { useData } from '../data/useData.js';
import KPICard from '../components/KPICard.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

const TICK = { fill: 'var(--text-secondary)', fontSize: 12 };
const TOOLTIP_STYLE = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-dropdown)',
};
const fmt = (n) => n.toLocaleString('en-US');

export default function Analytics() {
  const { data, loading, error } = useData(getAnalytics);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const { corpus, pipeline } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Aggregates from the public DOHA decision corpus and demo pipeline metrics</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total DOHA cases" value={fmt(corpus.totalCases)}
          accent="var(--dcsa-navy)" />
        <KPICard label="Granted" value={fmt(corpus.byOutcome.GRANTED ?? 0)}
          accent="var(--status-clear)" />
        <KPICard label="Denied" value={fmt(corpus.byOutcome.DENIED ?? 0)}
          accent="var(--status-alert)" />
        <KPICard label="Hearings / appeals"
          value={`${fmt(corpus.byCaseType.hearing ?? 0)} / ${fmt(corpus.byCaseType.appeal ?? 0)}`}
          accent="var(--dcsa-gold)" />
      </div>

      <div className="card chart-card">
        <h3>Cases by guideline</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={corpus.byGuideline}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="code" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="cases" name="Cases" fill="var(--dcsa-ocean)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Outcomes by year</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={corpus.byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="year" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line type="monotone" dataKey="granted" name="Granted"
              stroke="var(--status-clear)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="denied" name="Denied"
              stroke="var(--status-alert)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Pipeline timeliness</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pipeline.timeliness}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="stage" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="avgDays" name="Average days" fill="var(--dcsa-ocean)" />
            <Bar dataKey="targetDays" name="Target days" fill="var(--dcsa-navy)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

Append to `portal/src/pages/pages.css`:

```css
/* Analytics */
.chart-card h3 { margin-bottom: var(--space-4); }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd portal && npm test`
Expected: analytics tests pass.

- [ ] **Step 5: Commit**

```bash
git add portal/src/pages/Analytics.jsx portal/src/pages/pages.css portal/src/__tests__/analytics.test.jsx
git commit -m "feat(portal): analytics page with DOHA corpus and pipeline charts"
```

---

### Task 18: Playwright smoke test, CI integration, README

**Files:**
- Create: `portal/playwright.config.js`, `portal/e2e/smoke.spec.js`
- Modify: `portal/package.json` (add `@playwright/test` devDependency + `test:e2e` script)
- Modify: `.github/workflows/ci.yml` (add portal job — read the existing file first and append a job following its existing style)
- Modify: `README.md` (add a "Vetting Case Management Demo" section)
- Test: full local verification suite

**Interfaces:**
- Consumes: everything.
- Produces: CI coverage for the portal; user-facing docs.

- [ ] **Step 1: Add the Playwright smoke test**

Run: `cd portal && npm install --save-dev @playwright/test && npx playwright install chromium`

Add to `portal/package.json` scripts: `"test:e2e": "playwright test"`.

`portal/playwright.config.js`:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
```

`portal/e2e/smoke.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('every page loads and the hero case walks through all tabs', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  for (const persona of ['Investigator', 'Analyst', 'Adjudicator']) {
    await page.getByLabel('Persona').selectOption({ label: persona });
    await expect(page.locator('.kpi-grid .kpi-card').first()).toBeVisible();
  }

  await page.goto('/#/cases?q=okafor');
  await page.getByText('Daniel R. Okafor').click();
  await expect(page.getByText('***-**-4821')).toBeVisible();
  for (const tab of ['Overview', 'Guidelines', 'Investigation', 'Adjudication',
    'Continuous vetting', 'Documents']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }

  await page.goto('/#/alerts');
  await expect(page.getByRole('heading', { name: 'CV alerts' })).toBeVisible();
  await page.goto('/#/providers');
  await expect(page.getByText('FBI CJIS / NCIC + Rap Back')).toBeVisible();
  await page.goto('/#/analytics');
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
});
```

Run: `cd portal && npm run test:e2e`
Expected: 1 passed (requires generated data in `portal/public/data/` from Task 3).

- [ ] **Step 2: Add the portal CI job**

Read `.github/workflows/ci.yml`. Add this job alongside the existing Python job (keep existing jobs untouched):

```yaml
  portal:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: portal
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: portal/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npm run build
  portal-datagen:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install pydantic pandas pyarrow pytest
      - run: python -m pytest portal/data_gen/tests -v
```

Note: `portal-datagen` runs against the corpus fallbacks if the parquet files are unavailable in CI — the tests are written to pass either way. If the repo's requirements.txt already pins pydantic/pandas/pyarrow, install from it instead: `pip install -r requirements.txt pytest`.

- [ ] **Step 3: Add README section**

Append to `README.md` after the "Live Demo" section:

```markdown
## Vetting Case Management Demo (portal/)

A Checkr-inspired, DCSA-branded React demo of a personnel-vetting case management
platform: investigator/analyst/adjudicator personas, SEAD-4 guideline views,
SF-86 vs record-check comparison, adjudication workspace, continuous vetting
alerts with 3-step validation, data provider registry, and analytics from the
real DOHA corpus. All data is synthetic except DOHA precedents and corpus
aggregates. All AI content is pre-computed and labeled "AI-assisted — human
decision authority."

```bash
cd portal
npm install
npm run dev          # http://localhost:5173

# Regenerate demo data (optional; output is committed)
python data_gen/generate_demo_data.py

# Tests
npm test                                   # React (vitest)
python -m pytest data_gen/tests -v        # Data generator (pytest)
```

Design spec: `docs/superpowers/specs/2026-07-02-vetting-case-management-design.md`.
```

- [ ] **Step 4: Full verification**

```bash
cd portal && npm test && npm run build && npm run test:e2e
cd .. && python -m pytest portal/data_gen/tests -v
```

Expected: all green. Then launch `npm run dev` and manually click through: Dashboard (switch all 3 personas), Case queue → SUBJ-001 (all six tabs), disposition ALERT-101 as analyst, record a decision as adjudicator, CV alerts deep link, Data providers matrix, Analytics charts, Reset demo.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml README.md portal/playwright.config.js portal/e2e portal/package.json portal/package-lock.json
git commit -m "ci(portal): Playwright smoke test, CI jobs, README section"
```

---

## Post-plan notes for the executor

- Tasks 1-3 (Python) and 4-7 (React foundation) are strictly ordered within their halves, but the halves are independent — they can run as two parallel tracks. Tasks 8-9 (queue, dashboard), 10-14 (case detail chain: 10 before 11-14; 11-14 mutually independent), 15-17 (alerts, providers, analytics — mutually independent) follow Task 7.
- Page tasks REPLACE stub files created in Task 7/10; they must not edit `App.jsx` or `CaseDetail.jsx` tab wiring.
- `pages.css` and `case.css` are append-only across tasks — when running tasks in parallel worktrees, expect merge conflicts in these two files and resolve by concatenation.
- The dev server needs the generated data: if `portal/public/data/` is missing, run Task 3's generator first.
- All test fixtures live in `portal/src/__tests__/fixtures.js`; Task 8 creates it, Task 10 appends `CASE_001`. Tasks 15-17 that need different shapes define fixtures inline.
