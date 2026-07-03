"""Hand-authored deep demo cases. All identities fictional."""
import documents as docs

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
        ssn="923-04-4821", dob="1988-03-14",
        placeOfBirth="Lagos, Nigeria", citizenship="United States (naturalized 2003)",
        nationality="American",
        gender="Male", race="Black or African American",
        height="6' 1\"", weight="205 lb", eyeColor="Brown", hairColor="Black",
        maritalStatus="Married", phone="(703) 555-0142",
        email="d.okafor88@example.com",
        address="1427 Birch Hollow Ct, Manassas, VA 20109",
        addressHistory=[
            dict(address="1427 Birch Hollow Ct, Manassas, VA 20109",
                 fromDate="2019-08", toDate=None),
            dict(address="7605 Sudley Rd Apt 214, Manassas, VA 20109",
                 fromDate="2014-06", toDate="2019-08"),
            dict(address="2201 Wilson Blvd Apt 903, Arlington, VA 22201",
                 fromDate="2010-05", toDate="2014-06"),
        ],
        employmentHistory=[
            dict(employer="Sentinel Dynamics LLC", title="Senior Systems Engineer",
                 address="14840 Conference Center Dr Suite 300, Chantilly, VA 20151",
                 fromDate="2018-02", toDate=None),
            dict(employer="Praxis Federal Solutions", title="Systems Engineer",
                 address="11951 Freedom Dr Suite 900, Reston, VA 20190",
                 fromDate="2013-01", toDate="2018-02"),
            dict(employer="George Mason University", title="Research Assistant",
                 address="4400 University Dr, Fairfax, VA 22030",
                 fromDate="2010-08", toDate="2012-12"),
        ],
    ))
    cu_url, cu_doc = docs.credit_extract(
        "SUBJ-001", "credit-extract-20260620", bureau="TransUnion",
        account_name="Meridian Auto Finance", account_masked="****3308",
        account_type="Auto loan", balance="$12,400", past_due="$12,400",
        days_past_due="120+", date_reported="2026-06-20",
        payment_status="Charged off / collection",
        history="Opened 2022-08; current through 2024-03; delinquency began during "
                "2024 employment gap and account charged off 2026-05. Placed with "
                "Harborline Recovery LLC 2026-06.",
        received="2026-06-20")
    trv_url, trv_doc = docs.travel_record(
        "SUBJ-001", "travel-record-20260502", traveler="OKAFOR, DANIEL R",
        document_number="5310xxxx", carrier="Lufthansa LH 568",
        departure="2026-04-11 (IAD)", arrival="2026-04-12 (LOS)",
        destination="Nigeria", returned="2026-04-25 (IAD)",
        received="2026-05-02")
    sar_url, sar_doc = docs.sar(
        "SUBJ-001", "sar-20260415", institution="First Commonwealth Bank",
        sar_number="SAR-2026-0415-88231", filing_date="2026-04-15",
        period="2026-01-05 to 2026-03-30", total_amount="$27,500",
        narrative="Nine outbound wire remittances of $2,500-$3,500 to two beneficiary "
                  "accounts in Lagos, Nigeria, inconsistent with stated account "
                  "purpose and salary deposits. Pattern is consistent with structured "
                  "family remittances under financial stress; no sanctioned parties "
                  "identified.",
        transactions=[("2026-01-05", "Wire (outbound)", "$3,000"),
                      ("2026-01-26", "Wire (outbound)", "$2,500"),
                      ("2026-02-09", "Wire (outbound)", "$3,500"),
                      ("2026-02-23", "Wire (outbound)", "$3,000"),
                      ("2026-03-02", "Wire (outbound)", "$3,000"),
                      ("2026-03-09", "Wire (outbound)", "$2,500"),
                      ("2026-03-16", "Wire (outbound)", "$3,500"),
                      ("2026-03-23", "Wire (outbound)", "$3,000"),
                      ("2026-03-30", "Wire (outbound)", "$3,500")],
        received="2026-04-16")
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-001", "sf86-section20a", form_version="SF-86 (Nov 2016)",
        submitted="2025-09-08", section="Section 20A - Financial record",
        question="In the last seven (7) years, have you been over 120 days "
                 "delinquent on any debt?",
        response="Yes. Two accounts, approximately $9,000 total, following a 2024 "
                 "layoff. Repayment intended on re-employment.",
        received="2025-09-08")
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
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
             documents=[dict(title="TransUnion credit-file extract", url=cu_url)]),
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
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
             documents=[dict(title="CBP I-94 travel record", url=trv_url)]),
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
                 event="Case initiated", note="T5 initial via NBIS eApp; interim granted"),
            dict(date="2025-11-19", actor="S. Whitfield", role="Investigator",
                 event="Subject interview completed",
                 note="Subject acknowledged two delinquent accounts, attributed to 2024 job gap"),
            dict(date="2026-01-27", actor="S. Whitfield", role="Investigator",
                 event="ROI transmitted", note="Financial and foreign-contact issues flagged"),
            dict(date="2026-03-15", actor="R. Chen", role="Analyst",
                 event="Credit re-check completed", note="Delinquency total revised upward"),
            dict(date="2026-05-02", actor="System", role="CV",
                 event="Foreign travel alert received",
                 note="Unreported travel to Nigeria, 2026-04-11 to 2026-04-25"),
            dict(date="2026-05-06", actor="R. Chen", role="Analyst",
                 event="Foreign travel alert validated", note="Referred to adjudication"),
            dict(date="2026-06-20", actor="System", role="CV",
                 event="Financial alert received",
                 note="New collection account: $12,400 past due (auto loan)"),
        ],
        wholePersonSummary=(
            "Sustained financial delinquency ($47,300 across five accounts) compounded "
            "by incomplete SF-86 disclosure and unreported foreign travel. Mitigation "
            "is thin: the 2024 job loss explains how the debt began but not the "
            "continued non-payment since re-employment. Duress exposure is elevated — "
            "delinquent debt plus close foreign family ties — and with no documented "
            "repayment behavior, the whole-person picture currently weighs against "
            "restoring eligibility."),
        wholePerson=[
            dict(factor=docs.WHOLE_PERSON_FACTORS[0], aiRating="CONCERN",
                 assessment="Sustained delinquency across five accounts totaling "
                            "$47,300, with two charge-offs and an unpaid 2025 "
                            "judgment. Incomplete disclosure on the SF-86 compounds "
                            "the underlying financial issue; serious.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-101",
                          label="New collection account alert"),
                     dict(type="DOCUMENT", ref=cu_url,
                          label="TransUnion credit-file extract")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[1], aiRating="NEUTRAL",
                 assessment="Six-month unemployment in 2024 contributed to the "
                            "initial arrears. Delinquency has persisted since "
                            "re-employment, which limits how far circumstances "
                            "mitigate.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Employment coverage (10 yrs)",
                                label="Employment coverage")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[2], aiRating="CONCERN",
                 assessment="Ongoing and current — the newest collection alert is "
                            "June 2026. This is a continuing condition, not a "
                            "discrete past event.",
                 evidence=[dict(type="ALERT", ref="ALERT-101",
                                label="New collection account alert")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[3], aiRating="NEUTRAL",
                 assessment="Adult throughout the period at issue (ages 36-38). "
                            "Age and maturity neither mitigate nor aggravate.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[4], aiRating="CONCERN",
                 assessment="The debt is partly circumstantial, but the Section 20A "
                            "non-disclosure was a voluntary choice. Voluntariness "
                            "weighs on the candor issue more than the debt itself.",
                 evidence=[dict(type="DOCUMENT", ref=sf_url,
                                label="SF-86 Section 20A response")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[5], aiRating="CONCERN",
                 assessment="No payment plan, credit counseling, or repayment "
                            "activity evidenced to date. Rehabilitation cannot yet "
                            "be credited.",
                 evidence=[dict(type="RECORD_CHECK", ref="Financial record checks",
                                label="Financial record checks")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[6], aiRating="NEUTRAL",
                 assessment="No evidence of divided loyalty; the remittance pattern "
                            "reads as family financial support under strain. "
                            "Motivation appears economic, not ideological.",
                 evidence=[dict(type="DOCUMENT", ref=sar_url,
                                label="FinCEN SAR (remittances)")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[7], aiRating="CONCERN",
                 assessment="Elevated. Significant delinquent debt combined with "
                            "close foreign family ties and unreported travel "
                            "creates classic leverage conditions.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-102",
                          label="Unreported foreign travel alert"),
                     dict(type="DOCUMENT", ref=trv_url, label="I-94 travel record")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[8], aiRating="CONCERN",
                 assessment="High absent documented repayment behavior. The June "
                            "2026 alert shows the financial pattern is still "
                            "active.",
                 evidence=[dict(type="RECORD_CHECK", ref="Financial record checks",
                                label="Financial record checks")]),
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
            recordChecks=[
                dict(item="Subject interview (ESI)", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-11-19",
                     scope="Enhanced subject interview covering financial, foreign "
                           "contact, and employment issues",
                     resultSummary="Subject acknowledged two delinquent accounts; "
                                   "understated total debt.",
                     documentUrl=None),
                dict(item="Employment coverage (10 yrs)", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-12-04",
                     scope="Employer records and supervisor interviews, 2015-2025",
                     resultSummary="Employment verified; 2024 layoff confirmed.",
                     documentUrl=None),
                dict(item="Neighborhood/reference interviews", status="COMPLETE",
                     provider="DCSA field operations", requestedDate="2025-10-02",
                     completedDate="2025-12-04",
                     scope="Two references, one neighbor (Manassas, VA)",
                     resultSummary="No derogatory information developed.",
                     documentUrl=None),
                dict(item="Financial record checks", status="COMPLETE",
                     provider="TransUnion", requestedDate="2026-03-10",
                     completedDate="2026-03-15",
                     scope="Tri-bureau credit re-check plus civil judgment search",
                     resultSummary="$47,300 delinquent across five accounts; unpaid "
                                   "$3,100 judgment (2025).",
                     documentUrl=cu_url),
                dict(item="FinCEN financial-intelligence check", status="COMPLETE",
                     provider="FinCEN / Treasury", requestedDate="2026-04-10",
                     completedDate="2026-04-16",
                     scope="SAR registry query on subject identifiers",
                     resultSummary="One SAR: structured remittances to Nigeria, "
                                   "Jan-Mar 2026.",
                     documentUrl=sar_url),
                dict(item="Foreign travel records check", status="COMPLETE",
                     provider="CBP I-94 Foreign Travel", requestedDate="2026-05-01",
                     completedDate="2026-05-02",
                     scope="I-94 crossing history, 2021-2026",
                     resultSummary="Unreported Nigeria travel 2026-04-11 to "
                                   "2026-04-25.",
                     documentUrl=trv_url),
                dict(item="Foreign contact expansion leads", status="PENDING",
                     provider="DCSA field operations", requestedDate="2026-02-01",
                     completedDate=None,
                     scope="Expanded lead on sibling's state-owned-enterprise "
                           "employment",
                     resultSummary="Lead open with overseas partner agency.",
                     documentUrl=None),
            ],
            sf86Sections=[
                dict(section="Section 20A", title="Financial record - delinquencies",
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
            sorDraft=("STATEMENT OF REASONS (DRAFT) - Guideline F: You are indebted on five "
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
            dict(title="SF-86 excerpt - Section 20A", type="SF-86",
                 description="Financial-record response, submitted 2025-09-08",
                 url=sf_url),
            dict(title="TransUnion credit-file extract", type="Provider record",
                 description="Charged-off auto loan, reported 2026-06-20", url=cu_url),
            dict(title="FinCEN SAR", type="Provider record",
                 description="Structured remittances Jan-Mar 2026", url=sar_url),
            dict(title="CBP I-94 travel record", type="Provider record",
                 description="Nigeria travel April 2026 (unreported)", url=trv_url),
        ],
        sourceDocuments={cu_url: cu_doc, trv_url: trv_doc, sar_url: sar_doc,
                         sf_url: sf_doc},
    )


def _hero2(precedent_fn) -> dict:
    subject = _subject(dict(
        id="SUBJ-002", name="Marcus T. Bell", position="Logistics Coordinator",
        tier="T3", stage="CONTINUOUS_VETTING", status="NEEDS_REVIEW",
        eligibility="SECRET", riskScore=64, flaggedGuidelines=["J", "G"],
        daysInStage=9, openAlerts=1,
        ssn="917-38-7733", dob="1992-11-02",
        placeOfBirth="Norfolk, Virginia", citizenship="United States (by birth)",
        nationality="American",
        gender="Male", race="White",
        height="5' 10\"", weight="182 lb", eyeColor="Blue", hairColor="Brown",
        maritalStatus="Divorced", phone="(757) 555-0186",
        email="mtbell92@example.com",
        address="88 Quarry Ridge Rd, Chesapeake, VA 23320",
        addressHistory=[
            dict(address="88 Quarry Ridge Rd, Chesapeake, VA 23320",
                 fromDate="2021-03", toDate=None),
            dict(address="414 Kempsville Crossing Ln, Virginia Beach, VA 23464",
                 fromDate="2016-09", toDate="2021-03"),
            dict(address="1108 Colley Ave Apt 2B, Norfolk, VA 23517",
                 fromDate="2012-06", toDate="2016-09"),
        ],
        employmentHistory=[
            dict(employer="Tidewater Defense Logistics", title="Logistics Coordinator",
                 address="1401 Precon Dr Suite 210, Chesapeake, VA 23320",
                 fromDate="2019-04", toDate=None),
            dict(employer="Port of Virginia", title="Warehouse Operations Specialist",
                 address="600 World Trade Center, Norfolk, VA 23510",
                 fromDate="2014-10", toDate="2019-04"),
            dict(employer="U.S. Navy (enlisted)", title="Logistics Specialist (LS2)",
                 address="1530 Gilbert St, Naval Station Norfolk, VA 23511",
                 fromDate="2010-08", toDate="2014-09"),
        ],
    ))
    rb_url, rb_doc = docs.rapback(
        "SUBJ-002", "rapback-20260623", notification_id="NGI-RB-2026-174403",
        trigger_event="Criminal retain - arrest fingerprint submission",
        arrest_date="2026-06-21", agency="Chesapeake Police Department, VA",
        ori="VA0930100", charges=["DUI - 1st offense (VA 18.2-266)",
                                  "BAC 0.15%+ enhancement"],
        received="2026-06-23")
    pr_url, pr_doc = docs.police_report(
        "SUBJ-002", "police-report-26-044812", agency="Chesapeake Police Department",
        report_number="26-044812", incident_date="2026-06-21",
        location="I-64 W near Greenbrier Pkwy, Chesapeake, VA",
        charges=["DUI - 1st offense (VA 18.2-266)", "BAC 0.15%+ enhancement"],
        officer="Ofc. T. Ramirez #4471", booking_number="CB-26-08822",
        disposition="Released on summons; arraignment 2026-07-14",
        narrative="Vehicle observed varying speed 45-70 mph and crossing lane "
                  "markings at 2314 hours. Traffic stop initiated. Driver identified "
                  "as BELL, MARCUS T by VA operator's license. Odor of alcoholic "
                  "beverage, bloodshot eyes; subject cooperative. SFSTs indicated "
                  "impairment. Breath test at station: 0.18% BAC. Subject booked, "
                  "printed, and released on summons to a sober third party.",
        received="2026-06-30")
    cr_url, cr_doc = docs.credit_extract(
        "SUBJ-002", "credit-extract-20251012", bureau="TransUnion",
        account_name="Harbor Home Retail Card", account_masked="****5527",
        account_type="Revolving retail", balance="$800", past_due="$800",
        days_past_due="30", date_reported="2025-10-12",
        payment_status="30 days past due (subsequently paid 2025-11)",
        history="Opened 2021-02; first delinquency 2025-09 after billing-address "
                "change; brought current 2025-11-03 and closed by consumer.",
        received="2025-10-12")
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-002", "sf86-section22", form_version="SF-86 (Nov 2016)",
        submitted="2023-01-15", section="Section 22 - Police record",
        question="In the last seven (7) years, have you been arrested by any police "
                 "officer, sheriff, marshal, or any other type of law enforcement "
                 "official?",
        response="No.",
        received="2023-01-15")
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
             priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
             documents=[dict(title="Rap Back notification", url=rb_url),
                        dict(title="Chesapeake PD arrest report", url=pr_url)]),
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
                                    reference="CV disposition 2025-11-20: no action"),
             documents=[dict(title="TransUnion credit-file extract", url=cr_url)]),
    ]
    return dict(
        subject=subject,
        aiSummary=("CV-enrolled Secret holder with a fingerprint-verified DUI arrest "
                   "on 2026-06-21 (Guideline J/G). Police report retrieved 2026-06-30: "
                   "single incident, BAC 0.18%, disposition pending arraignment "
                   "2026-07-14; prior record clean. Recommend LOI and command "
                   "notification rather than immediate eligibility action."),
        timeline=[
            dict(date="2022-11-14", actor="K. Rivas", role="FSO",
                 event="Case initiated", note="T3 initial via NBIS eApp"),
            dict(date="2023-03-22", actor="D. Foley", role="Investigator",
                 event="ROI transmitted", note="No issues developed"),
            dict(date="2023-04-10", actor="Adjudicator L. Ortiz", role="Adjudicator",
                 event="Favorable adjudication - Secret granted", note="Clean T3"),
            dict(date="2023-05-01", actor="System", role="CV", event="Enrolled in CV", note=None),
            dict(date="2025-10-12", actor="System", role="CV",
                 event="Financial alert received",
                 note="30-day delinquency, $800 retail account"),
            dict(date="2025-11-20", actor="R. Chen", role="Analyst",
                 event="Financial alert adjudicated",
                 note="No action - resolved delinquency"),
            dict(date="2026-06-23", actor="System", role="CV",
                 event="Criminal alert received", note="DUI arrest 2026-06-21"),
            dict(date="2026-06-30", actor="S. Whitfield", role="Investigator",
                 event="Police report retrieved", note="Chesapeake PD report 26-044812"),
        ],
        wholePersonSummary=(
            "Serious but isolated alcohol incident by a subject with an otherwise "
            "clean record who self-reported promptly to his FSO. Rehabilitation and "
            "recurrence cannot be assessed until the court disposition and any "
            "treatment evidence arrive; consider holding final adjudication open "
            "until the disposition is received."),
        wholePerson=[
            dict(factor=docs.WHOLE_PERSON_FACTORS[0], aiRating="CONCERN",
                 assessment="Single DUI arrest with elevated BAC (0.18%), roughly "
                            "twice the legal limit. Serious on its face, but an "
                            "isolated event in an otherwise clean record.",
                 evidence=[
                     dict(type="ALERT", ref="ALERT-201", label="Rap Back DUI alert"),
                     dict(type="DOCUMENT", ref=pr_url,
                          label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[1], aiRating="NEUTRAL",
                 assessment="Off-duty, single-vehicle stop with no accident, "
                            "injury, or property damage. Subject was cooperative "
                            "per the arresting officer's narrative.",
                 evidence=[dict(type="DOCUMENT", ref=pr_url,
                                label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[2], aiRating="CONCERN",
                 assessment="First alcohol-related incident on record; no prior "
                            "arrests. Very recent (2026-06-21), which limits the "
                            "time-based mitigator for now.",
                 evidence=[dict(type="DOCUMENT", ref=rb_url,
                                label="Rap Back notification")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[3], aiRating="NEUTRAL",
                 assessment="Age 33 at the time of the incident; a fully "
                            "accountable adult. Neither mitigating nor "
                            "aggravating.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[4], aiRating="NEUTRAL",
                 assessment="Conduct was voluntary; no indication of coercion or "
                            "third-party involvement.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[5], aiRating="PENDING",
                 assessment="Unknown - court disposition pending and no treatment "
                            "or counseling enrollment evidenced yet. Any "
                            "court-ordered alcohol evaluation will inform this "
                            "factor.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Court disposition monitoring",
                                label="Court disposition monitoring")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[6], aiRating="FAVORABLE",
                 assessment="No indication of an underlying pattern; the report "
                            "reads as a single-night lapse after a social event. "
                            "The resolved 2025 financial alert is unrelated.",
                 evidence=[dict(type="DOCUMENT", ref=pr_url,
                                label="Chesapeake PD arrest report")]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[7], aiRating="FAVORABLE",
                 assessment="Low. Subject self-reported the arrest to his FSO "
                            "within 48 hours, which removes concealment leverage "
                            "and demonstrates candor.",
                 evidence=[]),
            dict(factor=docs.WHOLE_PERSON_FACTORS[8], aiRating="PENDING",
                 assessment="Indeterminate pending the court outcome and any "
                            "treatment conditions. Re-score this factor when the "
                            "disposition arrives.",
                 evidence=[dict(type="RECORD_CHECK",
                                ref="Court disposition monitoring",
                                label="Court disposition monitoring")]),
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
            recordChecks=[
                dict(item="T3 automated record checks (2023)", status="COMPLETE",
                     provider="FBI CJIS / NCIC + Rap Back", requestedDate="2023-02-01",
                     completedDate="2023-03-20",
                     scope="NCIC criminal history, tri-bureau credit, DMV - T3 "
                           "initial investigation",
                     resultSummary="All checks clear at adjudication (2023).",
                     documentUrl=None),
                dict(item="Police report retrieval (2026 arrest)", status="COMPLETE",
                     provider="State & local courts", requestedDate="2026-06-24",
                     completedDate="2026-06-30",
                     scope="Chesapeake PD incident/arrest report 26-044812 for "
                           "2026-06-21 DUI arrest",
                     resultSummary="Report received: BAC 0.18%, first offense, "
                                   "arraignment 2026-07-14.",
                     documentUrl=pr_url),
                dict(item="Court disposition monitoring", status="PENDING",
                     provider="State & local courts", requestedDate="2026-06-30",
                     completedDate=None,
                     scope="Chesapeake General District Court docket watch",
                     resultSummary="Arraignment scheduled 2026-07-14; disposition "
                                   "pending.",
                     documentUrl=None),
            ],
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
        documents=[
            dict(title="Rap Back notification", type="Provider record",
                 description="FBI arrest notification 2026-06-23", url=rb_url),
            dict(title="Chesapeake PD arrest report", type="Provider record",
                 description="Report 26-044812, retrieved 2026-06-30", url=pr_url),
            dict(title="TransUnion credit-file extract", type="Provider record",
                 description="Resolved 2025 retail delinquency", url=cr_url),
            dict(title="SF-86 excerpt - Section 22", type="SF-86",
                 description="Police-record response, submitted 2023-01-15", url=sf_url),
        ],
        sourceDocuments={rb_url: rb_doc, pr_url: pr_doc, cr_url: cr_doc,
                         sf_url: sf_doc},
    )


def _hero3(precedent_fn) -> dict:
    subject = _subject(dict(
        id="SUBJ-003", name="Priya N. Shah", position="Financial Analyst",
        tier="T3", stage="INVESTIGATION", status="CLEAR",
        eligibility="NONE", riskScore=8, flaggedGuidelines=[],
        daysInStage=22, fastTrack=True, cvEnrolled=False,
        ssn="941-62-2210", dob="1996-07-30",
        placeOfBirth="Edison, New Jersey", citizenship="United States (by birth)",
        nationality="American",
        gender="Female", race="Asian",
        height="5' 4\"", weight="128 lb", eyeColor="Brown", hairColor="Black",
        maritalStatus="Never married", phone="(410) 555-0129",
        email="priya.shah96@example.com",
        address="510 Alder Grove Ln, Columbia, MD 21044",
        addressHistory=[
            dict(address="510 Alder Grove Ln, Columbia, MD 21044",
                 fromDate="2022-07", toDate=None),
            dict(address="3901 Falls Rd Apt 316, Baltimore, MD 21211",
                 fromDate="2018-08", toDate="2022-07"),
            dict(address="12 Coventry Ct, Edison, NJ 08820",
                 fromDate="1996-07", toDate="2018-08"),
        ],
        employmentHistory=[
            dict(employer="Chesapeake Analytics Group", title="Financial Analyst",
                 address="10960 Grantchester Way Suite 520, Columbia, MD 21044",
                 fromDate="2022-06", toDate=None),
            dict(employer="T. Rowe Price", title="Junior Financial Analyst",
                 address="100 E Pratt St, Baltimore, MD 21202",
                 fromDate="2018-07", toDate="2022-06"),
        ],
    ))
    sf_url, sf_doc = docs.sf86_excerpt(
        "SUBJ-003", "sf86-section20a", form_version="SF-86 (Nov 2016)",
        submitted="2026-06-10", section="Section 20A - Financial record",
        question="In the last seven (7) years, have you been over 120 days "
                 "delinquent on any debt?",
        response="No.",
        received="2026-06-10")
    cr_url, cr_doc = docs.credit_extract(
        "SUBJ-003", "credit-extract-20260614", bureau="Equifax",
        account_name="Summary - all open accounts", account_masked="(8 accounts)",
        account_type="Tri-bureau summary", balance="$14,900", past_due="$0",
        days_past_due="0", date_reported="2026-06-14",
        payment_status="All accounts current; utilization 12%",
        history="Eight open accounts, oldest 2014. No delinquencies, collections, "
                "judgments, or bankruptcies on file at any bureau.",
        received="2026-06-14")
    return dict(
        subject=subject,
        aiSummary=("Clean T3 case: all automated checks returned clear, no discrepancies "
                   "between SF-86 and record sources, full coverage complete except one "
                   "employment verification in progress. AI triage classifies this case as a "
                   "fast-track candidate for favorable eAdjudication."),
        timeline=[
            dict(date="2026-06-10", actor="K. Rivas", role="FSO",
                 event="Case initiated", note="T3 initial via NBIS eApp"),
            dict(date="2026-06-14", actor="System", role="System",
                 event="Record checks completed",
                 note="Fingerprint, credit, and criminal-history checks - no record"),
            dict(date="2026-06-28", actor="System", role="System",
                 event="AI triage: fast-track candidate", note="Risk score 8/100"),
        ],
        wholePersonSummary=(
            "No adverse information across any checked source; credit, "
            "criminal-history, and education checks all returned clean. Strong "
            "fast-track candidate - the only open item is a routine employment "
            "verification."),
        wholePerson=[
            dict(factor=docs.WHOLE_PERSON_FACTORS[0], aiRating="FAVORABLE",
                 assessment="No adverse information across all checked sources. "
                            "Credit, criminal-history, and education checks all "
                            "returned clean.",
                 evidence=[dict(type="DOCUMENT", ref=cr_url,
                                label="Equifax tri-bureau summary")]),
        ] + [
            dict(factor=f, aiRating="NEUTRAL",
                 assessment="Not applicable - no adverse information developed.",
                 evidence=[])
            for f in docs.WHOLE_PERSON_FACTORS[1:]
        ],
        guidelines=[],
        investigation=dict(
            recordChecks=[
                dict(item="Fingerprint / FBI criminal history", status="COMPLETE",
                     provider="FBI CJIS / NCIC + Rap Back", requestedDate="2026-06-11",
                     completedDate="2026-06-14",
                     scope="NGI fingerprint submission and NCIC query",
                     resultSummary="No record.", documentUrl=None),
                dict(item="Credit check", status="COMPLETE", provider="Equifax",
                     requestedDate="2026-06-11", completedDate="2026-06-14",
                     scope="Tri-bureau pull (Equifax, Experian, TransUnion)",
                     resultSummary="All accounts current; utilization 12%.",
                     documentUrl=cr_url),
                dict(item="Education verification", status="COMPLETE",
                     provider="LexisNexis", requestedDate="2026-06-11",
                     completedDate="2026-06-20",
                     scope="Degree verification, University of Maryland (2018)",
                     resultSummary="B.S. Finance verified.", documentUrl=None),
                dict(item="Employment verification", status="PENDING",
                     provider="LexisNexis", requestedDate="2026-06-11",
                     completedDate=None,
                     scope="Current employer verification (2019-present)",
                     resultSummary="Response pending from employer of record.",
                     documentUrl=None),
                dict(item="Subject interview", status="NOT_REQUIRED",
                     provider="DCSA field operations", requestedDate="2026-06-10",
                     completedDate=None,
                     scope="Not triggered - no issues developed",
                     resultSummary="Not required for clean T3.", documentUrl=None),
            ],
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
        documents=[dict(title="SF-86 excerpt - Section 20A", type="SF-86",
                        description="T3 questionnaire excerpt", url=sf_url),
                   dict(title="Equifax tri-bureau summary", type="Provider record",
                        description="Clean credit summary 2026-06-14", url=cr_url)],
        sourceDocuments={sf_url: sf_doc, cr_url: cr_doc},
    )
