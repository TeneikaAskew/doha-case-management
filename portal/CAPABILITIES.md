# Personnel Vetting Portal - Capability Reference

Companion to `PRODUCT.md`. Factual inventory of what the app does today, with
source file references.

## Access and Session

- Sign-in page (`src/pages/SignIn.jsx`): DCSA-branded card, DoD-consent-style
  "About This Demo" banner, SSO-styled access-password form, and a reference
  table of governing authorities (SEADs 1-9, EO 12968/10865, 32 CFR 147,
  FCRA, Privacy Act, SF-85/85P/86, NBIS, Rap Back, CDSE).
- Gate (`src/accessControl.js`): password hashed client-side (crypto.subtle)
  and checked against a SHA-256 allowlist from `VITE_ACCESS_PASSWORD_HASHES`
  (build-time) with baked-in fallbacks. Plaintext lives only in gitignored
  `portal/.env`.
- Session (`src/state/SessionContext.jsx`): boolean in
  `localStorage['demo.session']`; header Sign Out clears it.

## Navigation Shell

`src/layouts/AppShell.jsx`: navy header with DCSA seal, global subject search
(navigates to `/cases?q=`), persona switcher, Reset Demo, Sign Out; collapsible
icon-rail sidebar (persisted). Routes (HashRouter, `src/App.jsx`):

| Route | Page |
|---|---|
| `/` | Subjects home |
| `/dashboard` | Persona dashboard |
| `/cases` | Case queue |
| `/cases/:id` | Case detail (7 tabs) |
| `/alerts` | Alerts from Data Providers |
| `/providers`, `/providers/:id` | Provider registry and detail |
| `/analytics` | Analytics (5 tabs) |
| `/help` | Help, legends, FAQ |

## Pages

- **Subjects** (`SubjectsHome.jsx`): population KPIs (Total Subjects, CV
  Subjects, Initial Vetting Backlog, Awaiting Adjudication, Open Alerts);
  clickable vetting pipeline strip; AI risk distribution bar; Needs Attention
  top-5 cards with compact risk dials; searchable, filterable subject
  directory.
- **Dashboard** (`Dashboard.jsx`): persona-specific KPI band plus a work-queue
  table; respects demo-state alert overrides.
- **Case Queue** (`CaseQueue.jsx`): all subjects; stage and guideline filters
  (persona presets, `?stage=` and `?q=` deep links); AI risk with fast-track
  flag; sortable columns.
- **Alerts from Data Providers** (`CVAlerts.jsx`): global inbox; KPI tiles that
  act as toggle filters (Open, New, High Severity, Referred); category filter;
  rows deep-link into the owning case's Continuous Vetting tab.
- **Data Providers** (`DataProviders.jsx`, `ProviderDetail.jsx`): 12-source
  registry (status, category, usage, record counts) with a provider-to-
  guideline coverage matrix; per-provider detail with alert KPIs, alert table,
  and delivered record checks linking back into cases.
- **Analytics** (`Analytics.jsx`): five tabs (Overview, Initial Vetting,
  Adjudication, Continuous Vetting, DOHA Corpus) with a shared filter panel;
  Corpus tab charts the real DOHA aggregates with Recharts.
- **Help** (`Help.jsx`): app guide, AI risk-score explainer, full badge and
  color legends, all 13 SEAD-4 guidelines, FAQ accordion.

## Case File (Seven Tabs)

Header: identity strip (name, position, DOB, SSN, eligibility, tier), status
and stage pills, guideline chips, AI risk dial linking to the scoring
explainer. Tabs (`src/pages/case/`):

1. **Overview**: AI executive summary; CV alert summary cards by category;
   complete subject profile (demographics, contact, address and employment
   history tables); whole-person worksheet; case timeline (strip + expandable
   detail).
2. **Guidelines**: one section per flagged SEAD-4 guideline: AI assessment,
   evidence table, disqualifying and mitigating conditions (AG paragraph
   citations, applicability), and real DOHA precedents linking to official
   PDFs.
3. **Investigation**: record checks grouped by category with drill-down
   (provider chip, scope, dates, result, source document); SF-86 self-report
   vs matched-record comparison with discrepancy flags; interview ledger with
   conflict chips; ROI entries (investigator can add).
4. **Adjudication**: AI recommendation; guideline weighing table; whole-person
   worksheet; AI-drafted Statement of Reasons; decision history with
   adjudicator decision form.
5. **Continuous Vetting**: per-alert 3-step validation (identity match
   confidence with identifier table, threshold rule, prior-adjudication check
   citing SEAD 7); workflow phase stepper; analyst dispositions; inline source
   documents.
6. **Documents**: every case document with inline viewer.
7. **Ask the Case**: case-scoped assistant (see AI section).

**Whole-person worksheet** (`WholePersonWorksheet.jsx`): the nine SEAD-4
2(d) factors, each with an AI draft assessment, evidence chips that jump to
the alert, record check, or document, and adjudicator-only
Favorable/Neutral/Concern ratings with notes, tallied and persisted.

## Documents

`DocumentViewer.jsx` renders two families:

- **Generated documents** (8 docTypes: police report, credit-file extract,
  SAR, Rap Back notification, SF-86 excerpt, travel record, security incident
  report, ROI): split view with a letterhead paper facsimile (issuer resolved
  per type: agency, FinCEN, FBI CJIS, OPM, CBP, DCSA) beside extracted data
  and provenance.
- **Real DOHA decisions**: embedded PDF with extracted-text fallback, cited
  guidelines, ruling extract, AI summary, and links to the official PDF and
  its year index. `case-links.json` maps every cited case number to its real
  DOHA listing and PDF URL.

## Provenance and Authority

- `SourceChip.jsx`: provider pill on every record check, alert, and document,
  resolving aliases to the canonical registry and linking to `/providers`.
- `references.js` + `SectionRef.jsx`: about 30 real authority links (SEADs,
  executive orders, CFR, FCRA, OPM forms, DCSA, NBIS, CDSE) cited at the foot
  of nearly every card.

## AI Capabilities

All AI surfaces carry the AIBadge: "AI-assisted - human decision authority."

- Subject risk scores (0-100; bands low <40, moderate 40-74, high 75+) and
  alert priority scores (pre-computed).
- Per-guideline reasoning, adjudication recommendation, and SOR draft
  (pre-computed narrative content).
- DOHA precedent retrieval per guideline from the real corpus.
- **Ask the Case** (`AskCaseTab.jsx`, `caseAssistant.js`, `caseAgent.js`):
  deterministic local retrieval over the case file (tokenized passages,
  synonym expansion, typo tolerance) with citations; optional Gemini 2.5
  Flash grounding when `VITE_GEMINI_API_KEY` is configured (strictly limited
  to retrieved passages, streaming, graceful fallback to local answers).
- DOHA decision summaries (Gemini when configured, local extract otherwise),
  cached per case number.

## Data Layer

- Generator (`portal/data_gen/`): deterministic (fixed reference date
  2026-07-02, no randomness), pydantic-validated (~45 models). 3 hand-authored
  hero cases + 12 roster subjects + procedural CV feed; typed document
  builders; provider registry as single source of truth.
- Real corpus (`corpus.py`): 33,610 parsed DOHA decisions (27,973 hearings,
  5,637 appeals) from parquet; supplies precedents, one real decision per
  case, case links, and analytics aggregates; full offline fallbacks.
- Outputs (`portal/public/data/`, committed): subjects, 15 case files, alerts,
  providers, provider activity, analytics, case links, and a documents tree
  (generated fixtures per subject plus real DOHA decision extracts).
- Fictional-data rules (tested): 900-series SSNs, 555-01xx phones,
  example-domain emails, fully populated profiles.
- Frontend access (`src/data/api.js`): cached fetch of static JSON.

## Design System

- Tokens (`src/design-system/variables.css`): DCSA navy #002D5B, gold #D4AF37
  (with AA-safe dark variant), MAPS teal accent #009BB5 (with dark variant),
  USWDS-aligned status colors, HRH deep red, 4px spacing scale, Inter
  typography, monospace stack for facsimiles.
- Color semantics: severity ramp A-D = teal, gold, orange, deep red (all AA);
  risk bands aliased to status colors (low=info blue, moderate=warning orange,
  high=alert red); alert workflow states always neutral gray.
- Feather icons on every nav item and section header; collapsible sidebar;
  responsive with zero horizontal overflow verified at 5 breakpoints.
- Accessibility: WCAG AA contrast on badges and text-on-tint, aria roles on
  tabs, groups, charts, and icon buttons; 44px touch targets.

## Quality and Operations

- Unit/component: 28 vitest files, 153 tests (plus 2 skipped live tests),
  including a copy-style test enforcing the no-em-dash rule.
- Data: 38 pytest tests (schemas, corpus, generator, fictional-safety rules).
- E2E (Playwright): full smoke walk (sign-in through sign-out across every
  page) and a responsive sweep (13 routes x 5 viewports, no horizontal
  overflow).
- CI (`.github/workflows/ci.yml`): portal (Node 22: test + build) and
  portal-datagen (pytest) jobs beside the repo's Python jobs, gated by
  ci-success.
- Deploy (`.github/workflows/deploy-pages.yml`): GitHub Pages from
  `vetting-portal` or `main`; runs tests plus a required Gemini live
  integration check before building with the API key secret.
- Env keys (names only): `DEMO_ACCESS_PASSWORD`, `DEMO_ACCESS_PASSWORD_2`,
  `VITE_ACCESS_PASSWORD_HASHES`, `VITE_GEMINI_API_KEY`.
