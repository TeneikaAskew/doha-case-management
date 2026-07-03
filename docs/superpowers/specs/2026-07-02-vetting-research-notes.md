# Personnel Vetting Research Notes

**Date**: 2026-07-02
**Companion to**: `2026-07-02-vetting-case-management-design.md`
**Method**: Web research against official DCSA/ODNI/CDSE sources (some primary PDFs
returned HTTP 403 to automated fetches; content corroborated via CDSE student-guide
PDFs, mirrored copies, and reputable secondary sources).

## 1. Lifecycle stages of a clearance case

The overall framework is **Trusted Workforce 2.0 (TW 2.0)**, which organizes vetting
into five scenarios: **Initial Vetting, Continuous Vetting, Upgrade, Transfer of
Trust (reciprocity), and Re-establishment of Trust**
([TW Policy Index](https://assets.performance.gov/files/Trusted_Workforce_Policy_Index.pdf),
[CDSE Vetting Scenarios guide](https://www.cdse.edu/Portals/124/Documents/student-guides/shorts/PSS0110-guide.pdf)).
Within a single case:

### Stage 1 — Initiation
- **Trigger**: Position designation (risk + sensitivity) determines the investigation tier
  ([DCSA Position Designation chart](https://www.dcsa.mil/Portals/91/Documents/pv/GovHRSec/Position_Designation_Investigation_Type_Chart_Sept_2017.pdf)).
- **Applicant/subject** completes the questionnaire — **SF-86** for T3/T5, SF-85/SF-85P
  for non-sensitive/public-trust tiers — in **NBIS eApp** (replaced e-QIP in late 2023)
  ([DCSA NBIS eApp](https://www.dcsa.mil/Systems-Applications/National-Background-Investigation-Services-NBIS/NBIS-eApp-Agency/)).
- **Security officer / FSO** initiates the case in NBIS, reviews for completeness,
  collects fingerprints (FBI check), releases to DCSA. Typical initiation ~18 days
  ([case types & forms](https://www.dcsa.mil/Personnel-Vetting/Background-Investigations-for-Security-HR-Professionals/Start-a-Background-Investigation/Case-Types-Forms/)).

### Stage 2 — Investigation (Tiers T1–T5)
- **T1**: low-risk/HSPD-12 (SF-85). **T2**: moderate-risk public trust (SF-85P).
  **T3**: Secret/Confidential (SF-86). **T4**: high-risk public trust (SF-85P).
  **T5**: Top Secret/SCI/SAP (SF-86)
  ([tier overview](https://www.nationalsecuritylawfirm.com/tiered-background-investigations-tiers-1-5-what-the-level-actually-signals-to-adjudicators/)).
  T3R/T5R reinvestigations are being retired as CV enrollment replaces them.
- **Background investigators** (DCSA + contract) run automated record checks plus, for
  higher tiers, fieldwork: subject interview, neighbor/employer/reference interviews,
  record pulls from police, courts, schools, financial and medical institutions.
  Output: **Report of Investigation (ROI)**. Investigation phase for a clean T3 ≈ 73 days.

### Stage 3 — Adjudication
- **Adjudicator** (for DoD, DCSA **Adjudication and Vetting Services (AVS)**) evaluates
  the ROI against the **13 SEAD-4 guidelines** using the **whole-person concept**.
  Outcomes: favorable grant; grant with **exception** (waiver / condition / deviation);
  or unfavorable action via **Letter of Interrogatory (LOI)** → **Statement of Reasons
  (SOR)** → denial/revocation, with due-process appeal (DoD contractors: DOHA hearings)
  ([SEAD-4](https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-4-Adjudicative-Guidelines-U.pdf),
  [adjudicator day-in-the-life](https://www.clearancejobsblog.com/a-typical-day-for-a-background-investigation-adjudicator/)).

### Stage 4 — Continuous Vetting (CV)
- Under **SEAD-6**, enrolled clearance holders are checked continuously via automated
  record checks instead of 5/10-year reinvestigations. Alerts route to CV analysts and
  adjudicators; subjects carry **SEAD-3** self-reporting obligations (foreign travel,
  foreign contacts, arrests, financial problems), reported by the FSO as incidents in DISS
  ([DCSA CV](https://www.dcsa.mil/Personnel-Vetting/Continuous-Vetting/),
  [DCSA CV one-sheet](https://www.dcsa.mil/Portals/91/Documents/IS/NBIS/NBIS_CV_One_Sheet_040622.pdf)).

**Systems of record**: NBIS (case processing), DISS (DoD eligibility/access), NISS
(facility clearances), Mirador (CV checks, folding into NBIS)
([NBIS roadmap](https://news.clearancejobs.com/2025/01/09/transforming-personnel-vetting-what-dcsas-new-nbis-roadmap-means-for-you/)).

## 2. Roles and their screen needs

### Background investigator
- **Tasks**: subject and source interviews; courthouse/police/employer record retrievals;
  writing ROIs to federal investigative standards; resolving discrepancies between SF-86
  claims and records.
- **Data viewed**: SF-86 responses, prior investigations, criminal/court/credit/education/
  employment records, interview notes.
- **Decisions**: coverage complete? discrepancy requiring expanded leads? issue-resolution
  interview needed?
- **Screen needs**: queue with geographic lead assignments and due dates; SF-86
  item-by-item view with flags where records contradict self-report; interview
  scheduling; structured ROI entry per coverage item; tier coverage checklist.

### Security / personnel security analyst (incl. CV analyst)
- **Tasks**: pre-screen forms, run automated checks (fingerprint/FBI, credit,
  prior-investigation lookups), maintain security files, triage CV alerts. DCSA CV
  analysts run a **3-step alert evaluation**: (1) confirm identity match, (2) confirm
  the data meets investigative-standard thresholds, (3) confirm it wasn't previously
  adjudicated ([ClearedJobs CV explainer](https://blog.clearedjobs.net/everything-you-need-to-know-about-continuous-vetting/)).
- **Decisions**: valid alert vs. false positive/mismatched identity; forward to
  adjudication vs. close; request more info.
- **Screen needs**: alert inbox by category/severity; identity-resolution panel (subject
  identifiers vs. record identifiers); dedup view against prior adjudicated info;
  threshold-rule visibility; disposition buttons with audit trail.

### Adjudicator
- **Tasks**: reviews 30–50 cases/day — initials, CV alerts, incident reports; maps issues
  to SEAD-4 guidelines; weighs disqualifying vs. mitigating conditions; drafts LOIs/SORs
  grounded in ROI facts.
- **Decisions**: grant / grant-with-exception / deny / revoke; whether mitigation
  eliminates doubt ("any doubt is resolved in favor of national security" — SEAD-4).
- **Screen needs**: case summary auto-organized by guideline (A–M issue tags);
  per-guideline disqualifying/mitigating conditions with evidence citations;
  whole-person factor worksheet; conduct timeline (recency/frequency matter);
  precedent/DOHA lookup; SOR/LOI drafting with fact citations; decision + rationale
  capture for audit.

### Facility Security Officer (FSO) — not a demo persona, but modeled in data
- Initiates cases in eApp/NBIS; tracks eligibility in DISS; submits incident reports;
  manages SEAD-3 self-reports; briefings and inspection readiness.

## 3. The 13 SEAD-4 guidelines (A–M) and relevant evidence

Source: [SEAD-4 (ODNI)](https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-4-Adjudicative-Guidelines-U.pdf);
corroborated by the [DSS 2017 Guidelines Job Aid](https://www.nationalinsiderthreatsig.org/itrmresources/DSS%202017%20National%20Security%20Adjudicative%20Guidelines%20Job%20Aid.pdf).

| Ltr | Guideline | Relevant data/evidence categories |
|---|---|---|
| A | Allegiance to the United States | Terrorism/extremism watchlists, membership/association records, statements, social media (SEAD-5) |
| B | Foreign Influence | Foreign contacts/family (SF-86 §18/19), foreign travel (CBP I-94), foreign financial interests, CI reporting |
| C | Foreign Preference | Foreign passports/citizenship, foreign voting/benefits, foreign military service |
| D | Sexual Behavior | Criminal records (sex offenses), subject interview admissions, public-record conduct |
| E | Personal Conduct | SF-86 vs. record discrepancies (falsification), employment misconduct, polygraph admissions |
| F | Financial Considerations | Credit bureau reports (Equifax/Experian/TransUnion), bankruptcies, tax liens/IRS, delinquent debts, garnishments, unexplained affluence, gambling |
| G | Alcohol Consumption | DUI/DWI arrests, treatment/medical records, employer incident reports |
| H | Drug Involvement and Substance Misuse | Drug arrests, drug tests, self-reported use (SF-86 §23), treatment records |
| I | Psychological Conditions | Mental-health treatment records (with consent), qualified-evaluator opinions |
| J | Criminal Conduct | FBI CJIS/NCIC criminal history (fingerprint-based), state/local police, court dockets, probation |
| K | Handling Protected Information | Security-violation/incident reports, spillage records, classified-handling audits |
| L | Outside Activities | Outside-employment disclosures, foreign business ties, service to foreign persons/governments |
| M | Use of Information Technology | IT/user-activity-monitoring audit logs, unauthorized-access incidents |

**Whole-person concept** (SEAD-4 §2), nine factors: nature/extent/seriousness of
conduct; circumstances; frequency and recency; age and maturity at the time;
voluntariness; presence/absence of rehabilitation and behavioral changes; motivation;
potential for pressure, coercion, exploitation, or duress; likelihood of continuation
or recurrence. **Exceptions**: waiver, condition, deviation. The **Bond Amendment**
bars certain grants (e.g., unlawful drug addicts) for SAP/SCI/RD. UI implication:
adjudication screens structure evidence per guideline *and* per whole-person factor;
mitigation is evaluated for whether it actually eliminates risk, not auto-credited.

## 4. Continuous vetting: alert categories and flow

DCSA CV performs automated record checks at subscription, time-based, and event-driven
frequencies against threshold rules.

**Alert categories** (per DCSA/Mirador): **criminal activity** (arrests, warrants,
charges, convictions — e.g., misdemeanors within past 5 years meet threshold),
**financial activity** (delinquent debt over thresholds, bankruptcies, liens,
FinCEN suspicious transactions), **credit changes**, **terrorism/violent-extremism
indicators**, **foreign travel** (DHS records), **eligibility issues** (status changes
across agencies), **suitability/public-record issues**
([Mirador article](https://www.clearancejobsblog.com/what-is-dcsas-mirador-it-system-and-what-does-it-check-in-continuous-vetting/)).

**Alert flow**: provider hit → threshold engine generates alert → CV analyst 3-step
validation (identity match, meets investigative standard, not previously adjudicated)
→ valid alerts pushed to the agency holding eligibility → adjudicator review; outcomes:
no action, request info via command/FSO, targeted investigation lead, LOI/SOR, or
access suspension. FSO incident reports (SEAD-3) enter the same stream via DISS.
UI implication: alert lifecycle states New → Identity-Confirmed → Validated → Referred
→ Adjudicated/Closed, with links to eligibility record and prior alert history.

## 5. Data providers / record sources → guidelines informed

| Provider / source | Used in | Guidelines informed |
|---|---|---|
| FBI CJIS/NCIC fingerprint & criminal history; Rap Back | Investigation + CV | J, D, G, H |
| Credit bureaus (Equifax, Experian, TransUnion — TransUnion named as a CV provider) | Investigation + CV | F |
| LexisNexis / Thomson Reuters public records | CV (Mirador) + investigation | F, J, E; identity resolution |
| FinCEN / Treasury | CV | F, possibly B |
| State/local courts and police | Investigator fieldwork | J, D, G, H, F |
| DMV records | Investigation | G (DUI), J |
| DHS/CBP foreign travel (I-94, border crossing) | CV + investigation | B, C, E |
| Terrorism/CT watchlists (TSDB etc.) | CV | A, B |
| IRS/tax records | Investigation (with release) | F |
| Employment, education, military records | Investigation | E, K, M |
| Medical/mental-health records (with consent) | Investigation | I, G, H |
| Social media / PAEI — authorized by [SEAD-5](https://www.odni.gov/files/NCSC/documents/Regulations/SEAD_5.pdf) (public only) | Investigation, expanding into CV | A, D, E, J |
| Prior investigation/adjudication indices (CVS/SII, DISS) | All stages | Reciprocity, E |
| Subject self-report (SF-86, SEAD-3 reports) | All stages | All; discrepancies feed E |

## 6. Where AI/data science is used or plausible

- **Alert triage & risk scoring (active)**: DCSA strategic plan includes AI pilots to
  automate risk triage and improve alert accuracy
  ([ClearanceJobs, June 2026](https://news.clearancejobs.com/2026/06/23/dcsas-new-strategic-plan-puts-delivery-deadlines-on-security-clearance-modernization/)).
- **Entity resolution (essential)**: CV validation step 1 is identity confirmation —
  probabilistic record linkage; UI shows match confidence with contributing identifiers.
- **Dedup against prior adjudications**: CV validation step 3; ML-assisted "previously
  evaluated" detection across ROIs, incidents, past alerts.
- **Clean-case fast-tracking**: classifying no-issue cases for expedited/auto-favorable
  adjudication (eAdjudication of clean cases already exists).
- **Precedent matching**: retrieval over DOHA decisions and prior SORs by
  guideline/fact pattern for consistent adjudication and SOR drafting.
- **Anomaly detection in CV**: unexplained affluence, financial-change velocity,
  travel-pattern anomalies.
- **NLP over ROIs/social media**: issue extraction, mapping narrative text to A–M codes.
- **Constraint**: adjudicative decisions require human accountability and due process
  (SOR must cite facts) — AI belongs in triage/summarization/evidence organization,
  with the UI preserving human decision authority and full audit trails.

## Primary policy anchors

- [SEAD-4 Adjudicative Guidelines](https://www.dni.gov/files/NCSC/documents/Regulations/SEAD-4-Adjudicative-Guidelines-U.pdf)
- [SEAD-5 (social media / PAEI)](https://www.odni.gov/files/NCSC/documents/Regulations/SEAD_5.pdf)
- [Trusted Workforce Policy Index](https://assets.performance.gov/files/Trusted_Workforce_Policy_Index.pdf)
- [DCSA Continuous Vetting](https://www.dcsa.mil/Personnel-Vetting/Continuous-Vetting/)
