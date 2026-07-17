# Documentation Index

A map of the research, design, and planning docs behind the Personnel Vetting
portal (`portal/`) and the SEAD-4 / DOHA data and analysis work that underpins it.

> Note: these docs live on the `vetting-portal` branch (the portal app is not on
> `main`). Paths below are relative to this file (`docs/`).

## Start here

| Doc | What it is |
| --- | --- |
| [whitepaper/aegis-vetting-at-mission-speed.md](whitepaper/aegis-vetting-at-mission-speed.md) | **White paper**: the research-backed, screenshot-led case for the vetting experience layer, written for agency stakeholders. A self-contained HTML edition sits beside it for sharing and print-to-PDF. |
| [portal/PRODUCT.md](../portal/PRODUCT.md) | Plain-language product overview: who the portal serves, the story it tells, the Trusted Workforce 2.0 lifecycle it covers. |
| [portal/CAPABILITIES.md](../portal/CAPABILITIES.md) | Factual, file-referenced inventory of what the app does today (access, personas, tabs, data model). |
| [README.md](../README.md) | Repo-level README for the SEAD-4 Adjudicative Guidelines Analyzer (the original LLM project this grew from). |
| [CLAUDE.md](../CLAUDE.md) | Working conventions for the codebase (writing style, data rules, commands). |

## Research (domain and data)

The evidence base the app was built on.

| Doc | What it covers |
| --- | --- |
| [specs/2026-07-02-vetting-research-notes.md](superpowers/specs/2026-07-02-vetting-research-notes.md) | **Core domain research.** Web research against official DCSA/ODNI/CDSE sources on the Trusted Workforce 2.0 lifecycle, investigation tiers, SEAD-4 adjudication, and continuous vetting, with citations to primary sources. |
| [DOHA_SCRAPING_GUIDE.md](../DOHA_SCRAPING_GUIDE.md) | How the ~36,700-case DOHA decision corpus was scraped (Playwright, bypassing Akamai bot protection), for both hearing and appeal decisions. |
| [INVESTIGATION_SUMMARY.md](../INVESTIGATION_SUMMARY.md) | Q&A summary of the scraping investigation: coverage, where data is stored, and how completeness was verified. |
| [COURSE_PLAN.md](../COURSE_PLAN.md) | Comprehensive plan for building a legal case-analysis system from the DOHA corpus. |
| [CODEBASE_EVALUATION.md](../CODEBASE_EVALUATION.md) | Evaluation report on the existing codebase. |

## Design specs (what and why)

Approved design specs, one per feature area. Dated in the filename.

| Doc | Feature |
| --- | --- |
| [specs/2026-07-02-vetting-case-management-design.md](superpowers/specs/2026-07-02-vetting-case-management-design.md) | **Master design spec** for the case-management platform (approved, post-brainstorm). |
| [specs/2026-07-03-subject-centric-whole-person-design.md](superpowers/specs/2026-07-03-subject-centric-whole-person-design.md) | Subject-centric home and the whole-person adjudication view. |
| [specs/2026-07-03-full-subject-profiles-design.md](superpowers/specs/2026-07-03-full-subject-profiles-design.md) | Full subject profiles (the biographic and history data behind each case). |
| [specs/2026-07-03-aegis-landing-page-design.md](superpowers/specs/2026-07-03-aegis-landing-page-design.md) | Aegis marketing / landing page. |
| [specs/2026-07-04-provider-drill-down-design.md](superpowers/specs/2026-07-04-provider-drill-down-design.md) | Data-provider drill-down pages. |
| [specs/2026-07-04-provider-health-triage-design.md](superpowers/specs/2026-07-04-provider-health-triage-design.md) | Provider page: health-first default plus triage mode. |
| [<../case management.md>](<../case management.md>) | Whole-person view feature writeup: architecture, data model, risk scoring, SEAD guideline integration. |

## Implementation plans (how)

Detailed, step-by-step build plans that turned the specs into code.

| Doc | Scope |
| --- | --- |
| [plans/2026-07-02-vetting-portal.md](superpowers/plans/2026-07-02-vetting-portal.md) | The full portal build plan (the largest doc). |
| [plans/2026-07-03-subject-centric-whole-person.md](superpowers/plans/2026-07-03-subject-centric-whole-person.md) | Subject-centric home and whole-person depth. |
| [plans/2026-07-03-aegis-landing.md](superpowers/plans/2026-07-03-aegis-landing.md) | Aegis landing page. |
| [plans/2026-07-04-provider-drill-down.md](superpowers/plans/2026-07-04-provider-drill-down.md) | Provider drill-down. |

## Design system and visual references

| Doc | What it is |
| --- | --- |
| [<../DCSA Design System Reference.md>](<../DCSA Design System Reference.md>) | DCSA design tokens (colors, type, spacing) documented from code. **Marked as needing verification** against the official DCSA Ecosystem Style Guide PDF. |
| [inspiration/design-specs.md](../inspiration/design-specs.md) | Data-portal design-system documentation drawn from the inspiration assets. |
| [backups/landing-navy-hero/README.md](backups/landing-navy-hero/README.md) | Notes on the archived navy-hero landing variant. |
| [portal/public/img/landing/SOURCES.md](../portal/public/img/landing/SOURCES.md) | Attribution for landing-page photography. |

## SEAD-4 LLM analysis engine

The adjudicative-guideline analysis work (the original project; supplies the RAG
precedent index and guideline reasoning the portal reuses).

| Doc | What it covers |
| --- | --- |
| [sead4_llm/LLM_ANALYSIS.md](../sead4_llm/LLM_ANALYSIS.md) | The SEAD-4 LLM analyzer package overview. |
| [sead4_llm/.../NATIVE_ANALYSIS_GUIDE.md](../sead4_llm/sead4_llm/documentation/NATIVE_ANALYSIS_GUIDE.md) | Native (non-LLM) analysis and comparison guide. |
| [sead4_llm/.../ENHANCED_ANALYZER.md](../sead4_llm/sead4_llm/documentation/ENHANCED_ANALYZER.md) | Enhanced native analyzer (N-grams, TF-IDF, embeddings). |
| [sead4_llm/.../ENHANCED_RESULTS.md](../sead4_llm/sead4_llm/documentation/ENHANCED_RESULTS.md) | Enhanced analyzer results summary. |
| [sead4_llm/.../COMPARISON_MODES.md](../sead4_llm/sead4_llm/documentation/COMPARISON_MODES.md) | The four analysis modes and how they compare. |
| [sead4_llm/.../CONFIDENCE_CALCULATIONS.md](../sead4_llm/sead4_llm/documentation/CONFIDENCE_CALCULATIONS.md) | How confidence scores are computed. |
| [sead4_llm/.../DEMO_UI.md](../sead4_llm/sead4_llm/documentation/DEMO_UI.md) / [QUICKSTART_DEMO.md](../sead4_llm/sead4_llm/documentation/QUICKSTART_DEMO.md) | Streamlit demo UI and quick start. |
| [sead4_llm/.../DEPLOYMENT.md](../sead4_llm/sead4_llm/documentation/DEPLOYMENT.md) / [TROUBLESHOOTING_LLM.md](../sead4_llm/sead4_llm/documentation/TROUBLESHOOTING_LLM.md) | Deployment and LLM troubleshooting. |
| [sead4_llm/analysis_results/FIXES_SUMMARY.md](../sead4_llm/analysis_results/FIXES_SUMMARY.md) | Summary of fixes and improvements to the analyzers. |

## Data generation

| Doc | What it is |
| --- | --- |
| [portal/data_gen/README.md](../portal/data_gen/README.md) | How the deterministic portal demo data is generated (the pipeline behind `portal/public/data/`). |

## Project meta

| Doc | What it is |
| --- | --- |
| [.claude/instructions.md](../.claude/instructions.md) | Project instructions for the SEAD-4 analyzer work. |
| [.claude/agents/](../.claude/agents/) | Subagent definitions: code-reviewer, commit-helper, documentation-writer, test-validator. |
