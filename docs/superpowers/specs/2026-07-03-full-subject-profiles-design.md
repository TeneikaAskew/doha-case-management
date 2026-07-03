# Full Subject Profiles — Design

**Date:** 2026-07-03
**Status:** Approved (brainstorm with Teneika)

## Goal

Every subject on the Subjects home "Needs Attention" list must have a FULL data
profile — every case tab populated with realistic, internally consistent,
hand-authored content and viewable source documents. Every other subject keeps
a lighter but still detailed profile proportional to their case (clean, no
alerts, lower volume).

The Needs Attention set today: SUBJ-001 Okafor (already full — the yardstick),
SUBJ-002 Bell, SUBJ-009 Nakamura, SUBJ-013 Boateng, SUBJ-015 Marsh.

## Decisions (from brainstorm)

1. **Hand-author the 4 under-filled attention subjects** (not template-driven).
   Each case tells its own story: Bell's DUI reads nothing like Nakamura's
   drug history, Boateng's security infraction, or Marsh's delinquent debt.
2. **Documents are paper facsimiles** — typed JSON rendered by the
   DocumentPaper viewer. No real PDF files, no new infrastructure.
3. **Generator bump for the other roster subjects** — raise the procedural
   floor rather than hand-touch each one.
4. **Reproducibility is non-negotiable** — all content lives in
   `portal/data_gen/` Python; `python portal/data_gen/generate_demo_data.py`
   deterministically rebuilds all JSON. No randomness, pydantic-validated.

## Architecture

- **New module `portal/data_gen/attention_cases.py`** exporting
  `build_attention_cases(precedent_fn) -> list[dict]` with hand-authored deep
  cases for SUBJ-009, SUBJ-013, SUBJ-015, following the `hero_cases.py`
  pattern exactly (subject profile → typed source documents → alerts → case
  dict). Their three rows are removed from `roster.py`'s ROSTER list; subject
  tier/stage/status/risk stay identical so KPIs and the attention list are
  unchanged.
- **`generate_demo_data.py`** composes `hero + attention + roster` (order
  preserved by subject id).
- **SUBJ-002 Bell is deepened in place** in `hero_cases.py` (`_hero2`).
- **`roster.py`** gains the floor bump for the remaining 9 subjects.
- **Schema:** one new document type literal, `DRUG_TEST` (Nakamura's
  drug-screen result); a `drug_test()` builder in `documents.py`; label +
  letterhead issuer entries in `DocumentViewer.jsx` (`DOC_TYPE_LABELS`,
  `PAPER_ISSUER`).

## Content bar for a "full" profile

Okafor (SUBJ-001) is the yardstick. Each of Bell, Nakamura, Boateng, Marsh
gets:

| Element | Target |
|---|---|
| Interviews | 2–4, `conflict`/`highlight` set where testimony contradicts records |
| ROI entries | 5–7 dated coverage entries, reused verbatim as the sections of a generated ROI facsimile document |
| Record checks | 6–8 across categories, each with scope, dates, result summary, and document link where one exists |
| SF-86 review sections | 3–4, at least one flagged discrepancy where the story supports it |
| Documents tab | 4–6 viewable facsimiles, all with URLs (no "Not available in demo") |
| Whole-person | Bespoke 9-factor assessments (2–3 sentences each), varied aiRatings, bespoke `wholePersonSummary` (BLUF) |
| Timeline | 7–9 events consistent with dates used elsewhere in the case |
| Alerts | Enriched with identityMatch, threshold, history entries, and attached documents |
| Adjudication | Bespoke recommendation rationale; SOR or LOI draft where the stage warrants |

### Per-subject story spines

- **SUBJ-002 Bell (J/G — DUI, CONTINUOUS_VETTING).** Add: initial-T3 (2022)
  subject interview, post-arrest subject interview (candid, consistent — no
  conflict), FSO statement interview; DMV driving-record check + abstract
  document; court docket monitoring + docket printout document; SF-86
  Sections 22 (police) and 24 (alcohol) review rows; ROI entries extended to
  5+ and an ROI facsimile document; timeline through the pending August 2026
  hearing. Recommendation stays LOI pending disposition (no SOR draft).
- **SUBJ-009 Nakamura (H — prior drug use, ADJUDICATION, no open alerts).**
  Self-reported marijuana use ×4, most recent 2024 pre-sponsorship. SF-86
  Section 23 excerpt document; negative 2026 drug-screen result (DRUG_TEST
  facsimile); subject interview (consistent with self-report — no conflict)
  and reference interview; record checks incl. education/employment; whole
  person leans favorable-with-time; recommendation GRANT with rationale
  citing AG ¶ 26(a); no alert (needs attention via NEEDS_REVIEW status).
- **SUBJ-013 Boateng (K — security infraction, CONTINUOUS_VETTING, TS).**
  2025 unsecured-document infraction. DISS prior-adjudication record and UAM
  audit extract documents alongside the existing incident report; FSO
  interview (conflict: subject recalled securing the document; log shows
  otherwise) + subject statement; SF-86 Section 25 (investigations record)
  row; LOI draft; alert enriched with history.
- **SUBJ-015 Marsh (F — delinquent debt, CONTINUOUS_VETTING).** Two
  delinquent accounts $9,800. Second credit extract + civil-judgment search
  document; subject interview (conflict: claims accounts current; bureau
  shows 90+ days); SF-86 Section 20A row with discrepancy; ROI + facsimile;
  whole-person mirrors a lighter Okafor pattern; LOI recommendation.

## Floor bump for the 9 remaining roster subjects

Every roster subject past INITIATION gets:

- A subject-interview record check (SUBJECT_INTERVIEW category) with a
  one-line result summary; clean cases read "routine, no issues developed."
- A tri-bureau credit summary document (clean facsimile) linked from the
  financial record check and the Documents tab.
- Timeline extended to 5–7 events (initiation, checks complete, interview,
  stage transitions).
- 2–3 SF-86 review sections (Sections 22, 20A, +18 residence for T5s), no
  discrepancies for clean cases.

INITIATION-stage subjects (SUBJ-004, SUBJ-005) keep a minimal profile —
case just opened; that thinness is realistic.

## Testing

Extend `portal/data_gen/tests/test_generator.py`:

- **Depth invariants** for the 5 attention subjects: ≥2 interviews, ≥5 ROI
  entries, ≥6 record checks, ≥3 SF-86 sections, ≥4 documents, and a bespoke
  wholePersonSummary (not the generic roster wording).
- **Global invariants:** every document entry has a URL; every documentUrl
  referenced by record checks/alerts/evidence resolves to a generated file;
  all history dates full ISO (`YYYY-MM-DD`); existing invariants (900-series
  SSNs, nine canonical factors) keep passing.
- JS suite untouched (fixtures independent); full `vitest` run as final gate.

## Out of scope

- Real PDF generation or print-to-PDF.
- New UI components (existing tabs/viewers render everything).
- Changing which subjects appear in Needs Attention.
