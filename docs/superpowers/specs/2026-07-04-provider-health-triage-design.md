# Provider Page: Health-First Default + Triage Mode - Design Spec

**Date**: 2026-07-04
**Status**: Approved (mockups in the design-alternatives artifact; user picked the
composite: Option B health signals as the default page, Option A as a toggled
Triage mode).
**Builds on**: `2026-07-04-provider-drill-down-design.md`.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Default KPI band | Becomes source health: Status + uptime, Last Sync + cadence, Records + quarterly growth, Match Error Rate. The alert-count KPIs move to Triage mode. |
| Charts | Below health KPIs: Alert Volume by Month (bars from this provider's alerts, severity-colored, legend + tooltips) and Guideline Yield (horizontal bars, alerts per covered guideline, single ocean hue). Hidden when the provider has no alerts. |
| Triage toggle | In the page header beside the provider name; session-sticky via localStorage (`demo.providerTriage`); shown only for CV providers. |
| Triage KPI band | Six across on wide screens (explicit grid, no orphan wrap): Open Alerts, High Severity Open, Oldest Open (days), Median Time To Adjudicate, Alerts Received, Adjudicated / Closed. Computed from alerts + phase histories, demo-state aware. |
| Triage queue | Open alerts first, oldest first, each with "open N days" and inline disposition buttons (legal ALERT_TRANSITIONS, Analyst persona only - others read-only). Adjudicated/closed rows demoted, muted, with actor + date from the phase history. Rows still deep-link to the case CV tab. |
| Triage record checks | Collapse to a CollapsibleSection titled with counts ("Record Checks Delivered - N checks, M documents"), closed by default. |
| Provider stats card | Removed. Records/last-sync live in the health KPIs; used-in pills move to the header meta line; guidelines covered are carried by the yield chart (and header chips). |

## Data (generator)

`ProviderInfo` gains four deterministic health fields, authored per provider in
`generate_demo_data.py` `PROVIDERS`:

- `uptimePct: float` - e.g. 99.97; the DEGRADED provider (courts) gets 97.1.
- `syncCadence: str` - e.g. "Nightly 06:00Z"; courts "Weekly Mon 06:00Z".
- `recordsGrowthQtr: str` - e.g. "+1.1% this quarter".
- `matchErrorRate: float` - identifier-mismatch percent, e.g. 0.8.

Everything else computes client-side:
- Volume by month: bucket this provider's alerts by `receivedDate` month.
- Guideline yield: map alert category -> guideline via new
  `domain.ALERT_CATEGORY_GUIDELINE` (CRIMINAL J, FINANCIAL F, CREDIT F,
  FOREIGN_TRAVEL B, TERRORISM A, ELIGIBILITY E, SUITABILITY E), counted over
  the provider's covered guidelines (zero rows kept).
- Oldest Open: max over open alerts of days since `receivedDate`
  (TODAY = 2026-07-02, the app's fixed demo date).
- Median Time To Adjudicate: median of (ADJUDICATED phase date - receivedDate)
  over adjudicated alerts; "-" when none.

## UI structure (`pages/ProviderDetail.jsx` + new `pages/provider/`)

- Header: back link; name + category; used-in pills; health badge; Triage
  toggle (CV providers only).
- Default (Triage off): health KPI band (4 KPICards) -> charts row (volume +
  yield, when alerts exist) -> Alerts from This Source table (unchanged) ->
  Record Checks Delivered table (unchanged) -> SectionRef.
- Triage on: six-KPI grid (`kpi-grid-six`: 6 cols wide, 3 at <=1280px, 2 at
  <=760px) -> Work Queue (open-first) -> collapsed record checks -> SectionRef.
- INV-only providers: no toggle; health KPIs + neutral alerts note + record
  checks (charts hidden - no alerts).
- New components: `pages/provider/HealthKpis.jsx`, `ProviderCharts.jsx`
  (volume + yield, follows the dataviz rules: thin marks, 2px gaps, legend for
  the 3 severity series, title-attr tooltips, text in text tokens),
  `TriageQueue.jsx` (queue + triage KPIs).

## Testing

- data_gen: health fields present and in range for all 12 providers.
- vitest `providerDetail.test.jsx`: default shows health KPIs and no alert
  KPIs; charts render buckets/yield from fixture alerts; toggle appears only
  for CV providers, flips view, persists to localStorage; triage KPI math
  (incl. demo alertStates overrides); queue order open-oldest-first;
  disposition buttons analyst-only and legal-transition-only; INV-only page
  unchanged.
- Smoke: flip Triage on the TransUnion page, expect Work Queue and Open Alerts
  KPI.
