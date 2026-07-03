# Personnel Vetting Case Management Platform — Design Spec

**Date**: 2026-07-02
**Status**: Approved (brainstorming complete)
**Working name**: `portal/` (React app at repo root)

## Purpose

A Checkr-inspired, DCSA-branded **stakeholder demo** of a modern personnel-vetting
case management platform. It shows how investigators, analysts, and adjudicators
would work a security-clearance case across the full Trusted Workforce 2.0
lifecycle — initiation, tiered investigation, SEAD-4 adjudication, and continuous
vetting — with AI/data-science assistance woven throughout. It reuses this repo's
real assets: the ~36,700-case DOHA corpus, the SEAD-4 LLM analyzers, and the RAG
precedent index.

**Non-goals**: production adjudication tool; real subject data; live backend;
authentication; the existing Streamlit demo is untouched.

## Platform decisions (locked)

| Decision | Choice |
|---|---|
| Platform | New React 18 + Vite SPA in `portal/`, react-router, Recharts, plain CSS with variables (no Tailwind/CSS-in-JS) |
| Purpose | Stakeholder demo, optimized for storytelling and polish |
| Data | Synthetic subjects + real DOHA precedents + pre-computed LLM analyses; static JSON; no backend |
| Roles | Single app with a persona switcher (Investigator / Analyst / Adjudicator) |
| AI | Woven throughout, all pre-computed, labeled "AI-assisted — human decision authority" |
| Design tokens | Strict official DCSA palette + USWDS semantics; Source Sans Pro |
| Hosting | Static build, deployable to GitHub Pages |

## Design system

Single source of truth: `portal/src/design-system/variables.css`.

### Colors (official DCSA Ecosystem Style Guide)

```css
--dcsa-navy: #002D5B;        /* Primary Blue: header, nav, primary buttons */
--dcsa-ocean: #0099D8;       /* Ocean Blue: links, interactive elements (replaces unofficial teal #009BB5) */
--dcsa-sky: #00A6DC;         /* Sky Blue: light accents */
--dcsa-ice: #91D0E4;         /* Ice Blue: light backgrounds, subtle highlights */
--dcsa-gold: #D4AF37;        /* Legendary Gold: active nav states, highlights */
--dcsa-charcoal: #5B5B5A;    /* Charcoal: secondary text */
```

USWDS semantic status scales as in the DCSA Design System Reference:
success `#2E7D32`/`#E8F5E9`, error `#C62828`/`#FFEBEE`, warning `#E65100`/`#FFF3E0`,
info `#1565C0`/`#E3F2FD`; risk scale (high `#C62828`, moderate `#E65100`, low `#F57F17`).

### Typography, spacing, components

- **Source Sans Pro** (official USWDS stack: `'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif`), weights 400/600/700, self-hosted woff2.
- 4px spacing scale (`--space-1: 4px` … `--space-12: 48px`), radii (4/8/12px), card and dropdown shadows, 56px header, 220px sidebar — all per DCSA Design System Reference.
- Reused component patterns from the reference: KPI cards with colored left-accent bar, pill status badges (semantic variants only), sortable data tables with mobile card fallback, collapsible sections, KV grids, circular severity badges (A–D), probability bars with threshold markers, cascade steppers.
- Dynamic coloring via CSS custom properties (`--badge-color` pattern), never hardcoded hex in components.
- Accessibility: WCAG 2.1 AA contrast, color never sole indicator, 44px touch targets, visible focus states, sentence case.

## Information architecture

### Global shell

- **Header** (navy): DCSA-style branding + app title, global subject search, **persona switcher** (Checkr account-switcher pattern) with Investigator / Analyst / Adjudicator.
- **Sidebar**: Dashboard, Case Queue, CV Alerts, Data Providers, Analytics. Active item gets gold left-border + gold-light background.

### Pages

**1. Dashboard** (persona-aware)
- KPI card row + primary work queue for the active persona:
  - *Investigator*: assigned leads by locale, due dates, open discrepancies, coverage completion.
  - *Analyst*: CV alert inbox summary by category/severity, identity-resolution backlog, false-positive rate.
  - *Adjudicator*: cases ready for decision, aging distribution, clean-case fast-track candidates, decisions this week.

**2. Case Queue** (Checkr candidate-list pattern)
- Columns: subject, tier (T1–T5), lifecycle stage (Initiation → Investigation → Adjudication → Continuous Vetting), status pill (Clear / Needs Review / Action Required), AI triage risk score, flagged guideline chips (A–M), days in stage.
- Filters: stage, guideline, tier, risk band, persona-relevant defaults.

**3. Case Detail** (the hub)
- Subject header: name, masked SSN, position + tier, eligibility pill, CV-enrolled badge, AI risk score dial.
- Tabs:
  - **Overview** — case timeline (every stage event, investigator concern, analyst note), whole-person snapshot, flagged guidelines summary, AI executive summary.
  - **Guidelines** — one card per relevant SEAD-4 guideline (A–M): evidence items grouped by data provider; disqualifying conditions with AG ¶ citations; mitigating conditions with applicability (FULL/PARTIAL/NONE); severity (circular A–D badge); AI reasoning; real DOHA precedent matches with case numbers and outcomes.
  - **Investigation** — SF-86 section-by-section using the Checkr "candidate input vs. matched result" pattern: subject self-report beside record-check result with discrepancy flags (discrepancies feed Guideline E); tier coverage checklist; interview notes; ROI entries.
  - **Adjudication** — decision workspace: guideline-by-guideline disqualifier/mitigator weighing; the nine whole-person factors worksheet (nature/seriousness, circumstances, frequency/recency, age/maturity, voluntariness, rehabilitation, motivation, pressure/coercion potential, likelihood of recurrence); recommendation panel (Grant / Grant with exception / LOI / SOR / Deny); AI-assisted SOR/LOI draft citing facts; decision + rationale capture; audit trail.
  - **Continuous Vetting** — subject alert history timeline; alert detail runs the CV analyst 3-step validation: (1) identity match confidence with contributing identifiers, (2) investigative-standard threshold check, (3) prior-adjudication dedup; disposition actions (validate / false positive / refer to adjudication).
  - **Documents** — ROI, SF-86, precedent decision PDFs (viewer or download links).

**4. CV Alerts** (global inbox)
- All alerts across subjects, grouped by category: Criminal, Financial, Credit, Foreign Travel, Terrorism, Eligibility, Suitability.
- Severity, AI priority score, lifecycle state machine: New → Identity-Confirmed → Validated → Referred → Adjudicated/Closed.
- Row click opens the alert inside its subject's Case Detail CV tab.

**5. Data Providers**
- Registry cards: FBI CJIS/NCIC + Rap Back, Equifax, Experian, TransUnion, LexisNexis, FinCEN/Treasury, CBP I-94 foreign travel, state/local courts, DMV, IRS, SEAD-5 social media, DISS/prior adjudication indices.
- Per provider: sync status, record counts, last-check timestamp.
- **Provider → guideline coverage matrix** (which of A–M each provider informs).

**6. Analytics**
- Real DOHA corpus aggregates: outcomes by guideline, year, case type (from the parquet dataset).
- Demo pipeline metrics: timeliness by stage vs. targets, alert volume by category, AI triage distribution.

### Personas (switcher behavior)

Same routes, three lenses. Switching persona changes:
- Dashboard content and queue default filters
- Which Case Detail tab opens first (Investigator → Investigation; Analyst → Continuous Vetting; Adjudicator → Adjudication)
- Enabled actions: investigators log ROI entries/resolve leads; analysts disposition alerts; adjudicators record decisions
- A demo can walk one hero case through the full lifecycle by switching personas.

## Domain model (grounded in research)

### SEAD-4 guidelines → evidence → providers

| Ltr | Guideline | Primary evidence sources |
|---|---|---|
| A | Allegiance to the U.S. | Watchlists, associations, SEAD-5 social media |
| B | Foreign Influence | SF-86 §18/19 foreign contacts, CBP I-94, foreign financial interests |
| C | Foreign Preference | Foreign passports/citizenship, foreign benefits/military service |
| D | Sexual Behavior | Criminal records, subject interview |
| E | Personal Conduct | SF-86 vs. record discrepancies, employment misconduct |
| F | Financial Considerations | Credit bureaus, bankruptcies, liens, IRS, FinCEN |
| G | Alcohol Consumption | DUI records (DMV/courts), treatment records |
| H | Drug Involvement | Drug arrests, tests, SF-86 §23 self-report |
| I | Psychological Conditions | Medical/mental-health records (consent) |
| J | Criminal Conduct | FBI CJIS/NCIC fingerprint history, courts, police |
| K | Handling Protected Information | Security incident reports, spillage records |
| L | Outside Activities | Outside employment disclosures, foreign business ties |
| M | Use of IT | User-activity monitoring, unauthorized-access incidents |

### Key lifecycle facts encoded in the demo

- Tiers: T1 (SF-85), T2/T4 (SF-85P), T3/T5 (SF-86); initiation via NBIS eApp; ROI produced by investigation; adjudication outcomes Grant / Grant-with-exception (waiver, condition, deviation) / LOI → SOR → Deny-Revoke with DOHA appeal path; CV under SEAD-6 replaces periodic reinvestigation; SEAD-3 self-reports enter via FSO incident reports.
- CV alert categories and the analyst 3-step validation are modeled exactly as DCSA describes (identity match → threshold → prior-adjudication dedup).

## AI features (all pre-computed into static data)

1. **Queue triage risk score** (0–100) per case + clean-case fast-track flag.
2. **Per-guideline AI assessment**: relevance, severity, disqualifiers/mitigators with AG ¶ citations, reasoning — generated by the repo's existing SEAD-4 analyzers, cached as JSON.
3. **DOHA precedent matching**: real retrieval output from the existing RAG index (case number, outcome, relevance snippet).
4. **CV alert prioritization** + identity-match confidence with contributing identifiers (record-linkage story).
5. **AI-drafted SOR/LOI language** citing evidence items.
6. Every AI element carries an "AI-assisted — human decision authority" label; the UI preserves human decision capture and audit trails (matches real-world due-process constraint).

## Data layer

### Generator

`portal/data_gen/generate_demo_data.py` (Python, imports existing `sead4_llm` analyzers/RAG):

- **~15 synthetic subjects** with varied tiers, stages, persona-relevant workloads; identities are clearly fictional.
- **3 of those subjects are hero cases** with full depth: (1) financial + foreign influence (F+B), (2) criminal + alcohol (J+G), (3) clean fast-track. Full SF-86 sections, provider results, discrepancies, interview notes, CV alerts, precomputed AI analyses, precedents.
- Real DOHA precedents selected from `doha_parsed_cases/all_cases.parquet` via the RAG index; real corpus aggregates for Analytics.
- **Pydantic schemas** (`portal/data_gen/schemas.py`) define every JSON contract; the generator validates before writing to `portal/public/data/*.json`.
- Generation is a dev-time step; its outputs are committed so the app builds without API keys.

### Output files (approximate)

```
portal/public/data/
  subjects.json          # roster + queue fields
  cases/<case_id>.json   # full case detail (SF-86, evidence, AI, precedents, alerts)
  alerts.json            # global CV alert inbox
  providers.json         # provider registry + coverage matrix
  analytics.json         # DOHA corpus aggregates + pipeline metrics
```

### Client state

Demo actions (alert dispositions, adjudication decisions, ROI entries) mutate client state persisted to localStorage. A "Reset demo" control clears it.

## Project structure

```
portal/
  index.html, vite.config.js, package.json
  public/data/                  # generated JSON (committed)
  data_gen/                     # Python generator + pydantic schemas
  src/
    design-system/variables.css
    components/                 # shared: KPICard, StatusBadge, DataTable, Timeline,
                                #   GuidelineChip, SeverityBadge, CollapsibleSection, KVGrid,
                                #   PersonaSwitcher, AIBadge, MatchConfidenceBar
    layouts/AppShell.jsx        # header + sidebar + outlet
    pages/                      # Dashboard, CaseQueue, CaseDetail (+tabs/), CVAlerts,
                                #   DataProviders, Analytics
    state/                      # persona context, demo-state store (localStorage)
    data/                       # fetch + schema-shaped accessors
```

Component boundaries follow the design-system reference consolidation guidance:
shared primitives live in `components/`, page-specific composites under their page.

## Error handling

- Every data view has loading, empty, and error states (styled per USWDS alert patterns).
- Data accessors validate JSON shape at load; malformed data renders an error alert, never a blank screen.
- Unknown routes → styled 404 within the shell.

## Testing

- **Vitest**: data-shaping utils, persona/state logic, schema-contract checks against the committed JSON.
- **Playwright smoke test**: loads each page, switches personas, opens a hero case and every tab.
- **Python**: generator validated by its own Pydantic schemas; a pytest asserts regeneration produces schema-valid output.
- CI: extend the existing GitHub Actions workflow with a `portal` job (npm ci, build, vitest; Playwright optional).

## Open items deferred to planning

- Exact synthetic subject roster and hero-case narratives (drafted during implementation planning).
- Whether Analytics reads a pre-aggregated JSON only (default) or also ships a small filtered slice of the corpus for interactive filtering.
- GitHub Pages deployment workflow (add after the app builds).

## Research sources

SEAD-4 (ODNI), SEAD-5, SEAD-6/SEAD-3 (via DCSA CV program pages), Trusted Workforce
Policy Index, DCSA CV one-sheet and Mirador documentation, CDSE personnel-vetting
student guides, DCSA NBIS/eApp pages, DOHA public decisions corpus (this repo).
Full research summary with URLs: `2026-07-02-vetting-research-notes.md` (same directory).
