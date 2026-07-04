# Personnel Vetting Portal - Product Overview

A subject-centric case management demo for DoD personnel security vetting. It
covers the full Trusted Workforce 2.0 lifecycle - initiation, tiered
investigation, SEAD-4 adjudication, and continuous vetting - with AI-assisted
triage woven throughout and human decision authority preserved at every step.

## Who It Serves

- **Stakeholder audiences** (DCSA-adjacent leadership, program owners) who need
  to see what a modern vetting platform could look like end to end.
- **Practitioners** - investigators, security analysts, and adjudicators - whose
  daily workflows the three personas model directly.
- **Design and engineering teams** using it as a reference implementation of
  the DCSA/MAPS design language over a realistic federal workflow.

## The Story It Tells

1. **One person, one file.** The portal leads with the subject, not the queue.
   The Subjects home page shows the whole population; every case page is a
   whole-person file: identity, history, record checks, guideline analysis,
   alerts, documents, and decisions in one place.
2. **Every claim is traceable.** Each record check names its data provider,
   every alert carries the analyst's 3-step validation (identity match,
   threshold, prior adjudication), every document opens as a paper facsimile
   beside its extracted data, and every section cites the real governing
   authority (SEAD 3/4/6/7, FIS, FCRA, Privacy Act).
3. **AI assists, people decide.** Risk scores triage the queue, guideline
   assessments cite AG paragraphs, precedents surface from the real DOHA
   corpus, and a case-scoped assistant answers questions from the file alone.
   Every AI surface carries the same badge: "AI-assisted - human decision
   authority."
4. **Real corpus, fictional people.** Analytics and precedent links draw on
   33,610 real, public DOHA decisions. All 15 subjects are deterministic
   fabrications: 900-series SSNs, 555 phones, example-domain emails.

## Personas

| Persona | Home focus | Exclusive actions |
|---|---|---|
| Investigator | Investigation workload, coverage, discrepancies | Add Report of Investigation entries |
| Analyst | CV alert inbox, identity resolution | Disposition alerts through the validation workflow |
| Adjudicator | Decision queue, fast-track candidates | Rate whole-person factors; record decisions (Grant, LOI, SOR, Deny) |

Switching personas retunes dashboards, default case tabs, and available
actions. One hero case can be walked through all three lenses.

## AI Position

AI in this product prioritizes work; it never decides. Concretely: subject
risk scores (0-100) and alert priority scores, per-guideline reasoning with
disqualifier and mitigator citations, DOHA precedent retrieval, an AI-drafted
Statement of Reasons, decision summaries of real DOHA PDFs, and the
Ask-the-Case assistant (local retrieval, optionally grounded Gemini). All
pre-computed content is labeled; the optional live paths degrade gracefully
when no key is configured.

## Demo Boundaries

- Static site; all interaction state lives in browser localStorage and resets
  with one click.
- Sign-in is simulated SSO: a DoD-style consent banner and an access password
  checked against a SHA-256 allowlist. No real PKI, users, or audit trail.
- No live record checks. Provider feeds, SARs, Rap Back notices, and credit
  pulls are generated fixtures that illustrate the shape of the real flows.
- Educational use only; no DoD, DCSA, or DOHA endorsement implied.

## Where Things Live

- App: `portal/` (React 18 + Vite, HashRouter, plain CSS design tokens)
- Data generator: `portal/data_gen/` (Python, pydantic, deterministic)
- Generated data: `portal/public/data/` (committed)
- Capability reference: `portal/CAPABILITIES.md`
- Design authority: `inspiration/design-specs.md` (MAPS) + DCSA style guide
