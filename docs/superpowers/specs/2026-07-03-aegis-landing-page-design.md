# Aegis Landing Page - Design Spec

**Date**: 2026-07-03
**Status**: Approved (brainstorming complete)
**Builds on**: `2026-07-02-vetting-case-management-design.md`,
`2026-07-03-subject-centric-whole-person-design.md`, `portal/PRODUCT.md`,
`portal/CAPABILITIES.md`
**Inspiration**: `inspiration/` (Checkr marketing site assets) and
`inspiration/design-specs.md` (MAPS design system, the styling authority)

## Purpose

A product-marketing landing page that sits in front of the SSO sign-in page.
It pitches the platform the way Checkr's landing pitches Checkr: bold hero
with a stylized product visual, stats band, capability sections, AI story,
and a closing call to action, with the demo disclaimer worked in tastefully.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Voice | Product marketing (Checkr-style SaaS landing) |
| Brand | Invented name: **Aegis - Personnel Vetting, End to End** |
| Visuals | Hand-built CSS mockups reusing app tokens; no screenshots, no binary assets |
| Structure | Full scroll: sticky nav + 8 sections + footer |

## Flow and Gating

- Signed-out visitors see the Landing page at every route (the `Gate` in
  `App.jsx` renders it where it renders `SignIn` today).
- The pre-auth area has two views managed by local state in `Gate`:
  `landing` (default) and `signin`. Every Sign In CTA switches to `signin`;
  a "Back" link on the SSO card returns to `landing`.
- No router changes pre-auth. Post-sign-in behavior is unchanged (deep links
  resolve normally). Signed-in users never see the landing.

## Page Structure

1. **Sticky nav**: Aegis wordmark + DCSA seal; anchor links Platform,
   How It Works, AI, Data Sources; gold Sign In button. Solid navy
   background (no scroll-dependent effects).
2. **Hero** (navy gradient block, split layout):
   - Eyebrow: "Trusted Workforce 2.0 Demo"
   - H1: "One Person. One File. Every Fact Sourced."
   - Subhead: one sentence on end-to-end vetting: initiation through
     continuous vetting, with AI-assisted triage and human decisions.
   - Primary CTA "Sign in to explore" (switches to SSO view); ghost CTA
     "See how it works" (anchor to section 4).
   - Right: layered CSS product vignette: a mini subject card (name, risk
     dial, guideline chips, status pill) overlapping a mini alert card
     showing the 3-step validation checklist. Gentle float animation;
     disabled under `prefers-reduced-motion`; the vignette is `aria-hidden`
     (decorative).
3. **Stats band** (4 stats, light background):
   33,610 real DOHA decisions; 13 SEAD-4 guidelines; 12 data providers;
   9 whole-person factors. Numbers rendered from constants in the component
   with a comment pointing at analytics.json as the source of truth.
4. **How It Works** (id="how-it-works"): the four lifecycle stages as a
   connected stepper: Initiation, Investigation, Adjudication, Continuous
   Vetting; one sentence each, mirroring the Help page stage notes.
5. **Capability grid** (id="platform"): six cards with Feather icons:
   - Whole-Person File (identity, history, timeline, worksheet)
   - Record Checks with Source Documents (paper facsimile + extracted data)
   - SEAD-4 Guideline Analysis (disqualifiers, mitigators, real precedents)
   - Alert Validation (3-step: identity, threshold, prior adjudication)
   - Provider Provenance (source chips, coverage matrix)
   - Analytics on Real Decisions (DOHA corpus)
   Copy distilled from `portal/CAPABILITIES.md`.
6. **AI section** (id="ai"): heading "AI Assists. People Decide." Left:
   bullets (risk triage, precedent retrieval, SOR drafting, case-grounded
   Q&A). Right: mini Ask-the-Case chat mockup with a question, a two-line
   answer, and citation chips; carries the AIBadge treatment.
7. **Data sources** (id="data"): pill strip naming the 12 providers from
   `providers.json`; one line about the provider-to-guideline coverage
   matrix. Below it, **Personas**: three cards (Investigator, Analyst,
   Adjudicator) listing each role's exclusive actions.
8. **Final CTA band**: navy block, "Walk a Case End to End." + Sign In
   button.
9. **Footer**: educational-use disclaimer; "All identities fictional;
   precedents and analytics come from public DOHA decisions"; a short row of
   authority links from `references.js` (SEAD 4, SEAD 6, DOHA, DCSA);
   no copyright claim.

## Implementation Shape

- New files: `portal/src/pages/Landing.jsx`, `portal/src/pages/landing.css`
  (imported by Landing only), `portal/src/__tests__/landing.test.jsx`.
- Modified: `portal/src/App.jsx` (Gate renders Landing/SignIn by view state),
  `portal/src/pages/SignIn.jsx` (adds the Back-to-landing link),
  `portal/e2e/smoke.spec.js` (landing step first), `portal/e2e/responsive.spec.js`
  (landing added to the signed-out sweep).
- The vignette and chat mockup are simplified, landing-local markup that
  mimics real components. They do not import live components or fetch data:
  the landing must render with zero network calls.
- Styling: design tokens only, no hardcoded hex; Feather icons; buttons and
  cards reuse existing base classes where they fit, landing-prefixed classes
  (`.landing-*`) otherwise.
- Copy rules (CLAUDE.md): Title Case headers, sentence-case body, hyphens
  never em dashes, no AI-idiom filler, demo honesty in eyebrow + footer.
- Accessibility: semantic landmarks (`nav`, `main`, `footer`), anchor targets
  with headings, decorative vignettes `aria-hidden`, AA contrast on the navy
  hero (white text), 44px touch targets, keyboard-reachable CTAs.
- Responsive: hero stacks below 900px (vignette under copy), capability grid
  1200px 3-col to 768px 1-col, stats band wraps 2x2, no horizontal overflow
  at 375/480/768/1280/1720.

## Testing

- `landing.test.jsx`: renders H1, stats, capability cards; Sign In click
  reveals the SSO card (About This Demo text); Back link returns to landing;
  signed-in session bypasses the landing entirely.
- `smoke.spec.js`: starts at the landing (H1 visible), clicks Sign In, then
  the existing consent/password flow continues unchanged.
- `responsive.spec.js`: signed-out landing checked at all 5 breakpoints for
  horizontal overflow.
- Copy-style test already sweeps `src/` for em dashes; landing copy complies.

## Out of Scope

- No multi-page marketing site, no real logos for providers (text pills
  only), no screenshots, no analytics/tracking, no email capture.
- SSO page content unchanged apart from the Back link.
