"""Per-subject SF-86 / PVQ questionnaire.

All 29 sections of the SF-86 (Nov 2016), with questions abbreviated from the
form and answers derived from each subject's seeded profile. OVERRIDES ties
answers to each case's developed issues, including candor discrepancies
(answers that record verification later contradicted) and post-submission
events surfaced by continuous vetting.
"""

ELIGIBILITY_LABELS = {
    "NONE": None, "INTERIM": "Interim eligibility",
    "SECRET": "Secret eligibility", "TOP_SECRET": "Top Secret eligibility",
}

# subject id -> submission date; default applies to current initial cases
SUBMITTED = {
    "SUBJ-001": "2025-09-08",
    "SUBJ-002": "2023-01-15",
    "SUBJ-003": "2026-06-10",
    "SUBJ-012": "2025-06-20",
    "SUBJ-013": "2025-11-12",
    "SUBJ-014": "2024-12-09",
    "SUBJ-015": "2025-09-30",
}
DEFAULT_SUBMITTED = "2026-04-15"

# subject id -> {question number: partial override}
OVERRIDES = {
    "SUBJ-001": {
        "3.1": dict(detail="Born in Lagos, Nigeria; immigrated to the United "
                           "States and naturalized in 2003."),
        "5.1": dict(answer="No",
                    detail="No maiden name, alias, or nickname used; identity "
                           "confirmed across bureau and DMV record checks."),
        "8.1": dict(answer="Yes",
                    detail="U.S. passport No. 531048291 on file; used for the "
                           "April 2026 Nigeria travel reported in Section 20."),
        "9.1": dict(detail="Naturalized U.S. citizen since 2003; Nigerian "
                           "citizen by birth (see Section 10)."),
        "10.1": dict(answer="Yes",
                     detail="Held Nigerian citizenship by birth; renounced on "
                            "U.S. naturalization in 2003. No dual citizenship "
                            "claimed since."),
        "10.2": dict(answer="Yes",
                     detail="Held a Nigerian passport before U.S. naturalization; "
                            "it expired and was not renewed. No non-U.S. passport "
                            "held since 2003."),
        "12.1": dict(answer="No",
                     detail="No school attendance within the last 10 years; "
                            "higher education completed before the coverage "
                            "window."),
        "13.2": dict(answer="No",
                     detail="No termination for cause. A six-month involuntary "
                            "layoff in 2024 (reduction in force) is corroborated "
                            "by employer records; the subject was rehired at a "
                            "comparable grade."),
        "15.1": dict(answer="No", detail="No U.S. military service."),
        "16.1": dict(answer="3 references provided",
                     detail="Three references furnished - a current supervisor "
                            "at Sentinel Dynamics, a six-year Manassas neighbor, "
                            "and a former colleague; all interviewed and "
                            "favorable."),
        "17.1": dict(detail="Married; spouse is a U.S. citizen residing with the "
                            "subject in Manassas, VA."),
        "18.1": dict(answer="Mother and two siblings listed", flagged=True,
                     detail="Spouse is a U.S. citizen. Mother and two siblings "
                            "are Nigerian citizens resident in Lagos, Nigeria; "
                            "one sibling is employed by a state-owned oil "
                            "company - developed through record checks and not "
                            "disclosed on the questionnaire. See Guideline B."),
        "19.1": dict(answer="Yes", flagged=True,
                     detail="Continuing contact with his mother and two siblings "
                            "in Nigeria, including monthly financial remittances "
                            "to Lagos beneficiaries (Jan-Mar 2026). Assessed "
                            "under Guideline B."),
        "20.1": dict(answer="No",
                     detail="No foreign financial accounts or property. Outbound "
                            "family remittances to Nigeria are addressed in "
                            "Section 19 and the FinCEN SAR."),
        "20.2": dict(answer="No",
                     detail="No foreign-government employment. A sibling's "
                            "employment with a Nigerian state-owned enterprise "
                            "is addressed in Section 18."),
        "20.3": dict(answer="Yes", flagged=True,
                     detail="Prior personal travel to Nigeria to visit family "
                            "was reported. The April 2026 trip (2026-04-11 to "
                            "2026-04-25, for a family funeral) postdates this "
                            "submission and was not reported to the FSO as "
                            "required by SEAD-3; captured via CBP I-94."),
        "21.1": dict(answer="No",
                     detail="No court-ordered mental-health consultation and no "
                            "condition affecting judgment, reliability, or "
                            "trustworthiness."),
        "22.1": dict(answer="No",
                     detail="No arrests in the last seven years; NCIC and DMV "
                            "checks returned no record."),
        "22.2": dict(answer="No", detail="No felony charges of any kind."),
        "23.1": dict(answer="No",
                     detail="No illegal drug or controlled-substance use; the "
                            "SEAD-5 social-media review developed no contrary "
                            "information."),
        "24.1": dict(answer="No",
                     detail="No alcohol-related impact on work, relationships, "
                            "finances, or law-enforcement involvement."),
        "25.1": dict(answer="Yes",
                     detail="Interim eligibility granted at initiation; this T5 "
                            "periodic reinvestigation (DCSA-PR-2025-448121) is in "
                            "adjudication."),
        "26.1": dict(answer="Yes", flagged=True,
                     detail="Reported two accounts totaling approximately $9,000 "
                            "delinquent following the 2024 layoff, with repayment "
                            "intended on re-employment. Tri-bureau verification "
                            "established $47,300 delinquent across five accounts "
                            "(two charged off); the understatement raised a "
                            "candor concern under Guideline F."),
        "26.2": dict(answer="Yes", flagged=True,
                     detail="Collection accounts acknowledged. Verification "
                            "developed two charge-offs and a new $12,400 "
                            "auto-loan collection (reported June 2026, placed "
                            "with Harborline Recovery). See the credit evidence "
                            "under Guideline F."),
        "27.1": dict(answer="No",
                     detail="No unauthorized access to any information "
                            "technology system."),
        "28.1": dict(answer="No", flagged=True,
                     detail="Answered No. A 2025 small-claims judgment ($3,100, "
                            "unpaid) predates submission and was not listed; "
                            "developed through state-court records and "
                            "cross-referenced under Guideline F."),
        "29.1": dict(answer="No",
                     detail="No membership in any organization advocating the "
                            "overthrow of the U.S. Government by force or "
                            "violence."),
    },
    "SUBJ-002": {
        "3.1": dict(detail="Born in Norfolk, Virginia; U.S. citizen by birth."),
        "5.1": dict(answer="No",
                    detail="No alias or nickname used; identity confirmed via "
                           "fingerprint enrollment and DMV records."),
        "9.1": dict(detail="U.S. citizen by birth; no other citizenship held."),
        "10.1": dict(answer="No",
                     detail="No current or prior citizenship of any other "
                            "country."),
        "12.1": dict(answer="No",
                     detail="No school attendance within the last 10 years."),
        "13.2": dict(answer="No",
                     detail="No termination for cause across the employment "
                            "history (Tidewater Defense Logistics, Port of "
                            "Virginia, U.S. Navy)."),
        "15.1": dict(answer="Yes",
                     detail="U.S. Navy, enlisted - Logistics Specialist (LS2), "
                            "2010-08-09 to 2014-09-30; honorable separation."),
        "16.1": dict(answer="3 references provided",
                     detail="Three references furnished - a Tidewater Defense "
                            "Logistics supervisor, a former Navy colleague, and "
                            "a Chesapeake neighbor; contact information verified "
                            "in eApp."),
        "17.1": dict(detail="Divorced; no current spouse or cohabitant."),
        "18.1": dict(answer="Immediate family listed",
                     detail="Immediate family are U.S. citizens residing in "
                            "Virginia; no foreign relatives reported."),
        "19.1": dict(answer="No",
                     detail="No close or continuing contact with any foreign "
                            "national."),
        "20.1": dict(answer="No", detail="No foreign financial interests."),
        "20.2": dict(answer="No",
                     detail="No employment with or service to a foreign "
                            "government or entity."),
        "20.3": dict(answer="Yes",
                     detail="Personal vacation travel reported; border-crossing "
                            "records matched (adjudicated no-action)."),
        "21.1": dict(answer="No",
                     detail="No court-ordered mental-health consultation and no "
                            "condition affecting judgment or reliability."),
        "22.1": dict(answer="No", flagged=True,
                     detail="Accurate at submission (January 2023). A DUI arrest "
                            "on 2026-06-21 (Chesapeake PD, first offense, BAC "
                            "0.18%) postdates the form and was captured via FBI "
                            "Rap Back; disposition pending arraignment "
                            "2026-07-14."),
        "22.2": dict(answer="No",
                     detail="No felony charges; the 2026 DUI is charged as a "
                            "first-offense misdemeanor."),
        "23.1": dict(answer="No",
                     detail="No illegal drug or controlled-substance use "
                            "reported."),
        "24.1": dict(answer="No", flagged=True,
                     detail="Accurate at submission. The alcohol-related arrest "
                            "of 2026-06-21 postdates the form; evaluation pending "
                            "under Guideline G."),
        "25.1": dict(answer="Yes",
                     detail="Favorable T3 adjudication in 2023; Secret "
                            "eligibility granted and currently enrolled in "
                            "continuous vetting."),
        "26.1": dict(answer="No",
                     detail="Accurate at submission. A 30-day, $800 retail-card "
                            "delinquency surfaced via CV in October 2025, was "
                            "brought current in November 2025, and was "
                            "adjudicated no-action - it never reached 120 days."),
        "26.2": dict(answer="No",
                     detail="No defaults or collections. The 2025 retail "
                            "delinquency reached 30 days only and was resolved "
                            "by payment."),
        "27.1": dict(answer="No",
                     detail="No unauthorized access to any information "
                            "technology system."),
        "28.1": dict(answer="No",
                     detail="No public-record civil court actions."),
        "29.1": dict(answer="No",
                     detail="No membership in any organization advocating the "
                            "overthrow of the U.S. Government by force or "
                            "violence."),
    },
    "SUBJ-003": {
        "3.1": dict(detail="Born in Edison, New Jersey; U.S. citizen by birth."),
        "5.1": dict(answer="No",
                    detail="No maiden name, alias, or nickname used."),
        "8.1": dict(answer="No",
                    detail="No U.S. passport reported on the questionnaire."),
        "9.1": dict(detail="U.S. citizen by birth; no other citizenship held."),
        "10.1": dict(answer="No",
                     detail="No current or prior foreign citizenship."),
        "12.1": dict(answer="Yes",
                     detail="B.S. Finance, University of Maryland, conferred "
                            "2018 - within the 10-year coverage window; verified "
                            "through the National Student Clearinghouse."),
        "13.2": dict(answer="No",
                     detail="No termination for cause (Chesapeake Analytics "
                            "Group; T. Rowe Price)."),
        "15.1": dict(answer="No", detail="No U.S. military service."),
        "16.1": dict(answer="3 references provided",
                     detail="Three references furnished - a Chesapeake Analytics "
                            "supervisor, a former T. Rowe Price colleague, and a "
                            "Columbia, MD neighbor; contact information verified "
                            "in eApp."),
        "17.1": dict(detail="Never married; no spouse or cohabitant."),
        "18.1": dict(answer="Immediate family listed",
                     detail="Immediate family are U.S. citizens residing in New "
                            "Jersey and Maryland; no foreign relatives "
                            "reported."),
        "19.1": dict(answer="No",
                     detail="No close or continuing contact with any foreign "
                            "national."),
        "20.1": dict(answer="No", detail="No foreign financial interests."),
        "20.2": dict(answer="No",
                     detail="No employment with or service to a foreign "
                            "government or entity."),
        "20.3": dict(answer="No",
                     detail="No foreign travel in the last seven years."),
        "21.1": dict(answer="No",
                     detail="No court-ordered mental-health consultation and no "
                            "condition affecting judgment or reliability."),
        "22.1": dict(answer="No",
                     detail="No arrests; NCIC and fingerprint checks returned no "
                            "record."),
        "22.2": dict(answer="No", detail="No felony charges."),
        "23.1": dict(answer="No",
                     detail="No illegal drug or controlled-substance use."),
        "24.1": dict(answer="No",
                     detail="No alcohol-related incident or impact reported."),
        "25.1": dict(answer="No",
                     detail="This T3 initial investigation is the subject's "
                            "first; no prior clearance."),
        "26.1": dict(answer="No",
                     detail="No delinquencies. The tri-bureau summary shows "
                            "eight open accounts, all current, 12% utilization, "
                            "with no collections, judgments, or bankruptcies."),
        "26.2": dict(answer="No",
                     detail="No defaults or accounts placed for collection."),
        "27.1": dict(answer="No",
                     detail="No unauthorized access to any information "
                            "technology system."),
        "28.1": dict(answer="No",
                     detail="No public-record civil court actions."),
        "29.1": dict(answer="No",
                     detail="No membership in any organization advocating the "
                            "overthrow of the U.S. Government by force or "
                            "violence."),
    },
    "SUBJ-006": {
        "13.2": dict(flagged=True,
                     detail="Employer records show a 2022 termination for cause "
                            "omitted from the employment application; see "
                            "Guideline E."),
    },
    "SUBJ-007": {
        "27.1": dict(flagged=True,
                     detail="UAM audit logs subsequently recorded an "
                            "unauthorized USB device on a standalone lab system "
                            "(Guideline M); subject response pending."),
    },
    "SUBJ-009": {
        "23.1": dict(answer="Yes", flagged=True,
                     detail="Self-reported marijuana use, four occasions, most "
                            "recent 2024 and prior to sponsorship (Guideline "
                            "H)."),
    },
    "SUBJ-012": {
        "8.1": dict(answer="Yes", detail="U.S. passport on file."),
        "20.3": dict(answer="Yes",
                     detail="Vacation travel reported; border-crossing records "
                            "matched (adjudicated no-action)."),
    },
    "SUBJ-014": {
        "28.1": dict(flagged=True,
                     detail="HOA judgment and unlawful detainer filings "
                            "surfaced via CV in 2025-2026, after submission; "
                            "both dispositioned no-action."),
    },
    "SUBJ-015": {
        "26.1": dict(flagged=True,
                     detail="Accurate at submission. Two accounts became "
                            "delinquent in 2026-02 and surfaced via CV credit "
                            "monitoring (Guideline F)."),
    },
}


def _q(number, question, answer, detail=None):
    return dict(number=number, question=question, answer=answer,
                detail=detail, flagged=False)


def _residences(subj):
    return "; ".join(
        f"{h['address']} ({h['fromDate']} to {h['toDate'] or 'present'})"
        for h in subj["addressHistory"])


def _employers(subj):
    return "; ".join(
        f"{e['title']}, {e['employer']} ({e['fromDate']} to "
        f"{e['toDate'] or 'present'})"
        for e in subj["employmentHistory"])


def _sections(subj):
    elig = ELIGIBILITY_LABELS.get(subj["eligibility"])
    male = subj["gender"] == "Male"
    return [
        ("Section 1", "Full Name", [
            _q("1.1", "Provide your full legal name.", subj["name"]),
        ]),
        ("Section 2", "Date of Birth", [
            _q("2.1", "Provide your date of birth.", subj["dob"]),
        ]),
        ("Section 3", "Place of Birth", [
            _q("3.1", "Provide your place of birth.", subj["placeOfBirth"]),
        ]),
        ("Section 4", "Social Security Number", [
            _q("4.1", "Provide your U.S. Social Security Number.", subj["ssn"]),
        ]),
        ("Section 5", "Other Names Used", [
            _q("5.1", "Have you used any other names (maiden name, alias, "
               "nickname)?", "No"),
        ]),
        ("Section 6", "Your Identifying Information", [
            _q("6.1", "Height.", subj["height"]),
            _q("6.2", "Weight.", subj["weight"]),
            _q("6.3", "Hair color.", subj["hairColor"]),
            _q("6.4", "Eye color.", subj["eyeColor"]),
            _q("6.5", "Sex.", subj["gender"]),
        ]),
        ("Section 7", "Your Contact Information", [
            _q("7.1", "Home telephone number.", subj["phone"]),
            _q("7.2", "Personal email address.", subj["email"]),
        ]),
        ("Section 8", "U.S. Passport Information", [
            _q("8.1", "Do you possess a current U.S. passport?", "No"),
        ]),
        ("Section 9", "Citizenship", [
            _q("9.1", "Provide your citizenship status.", subj["citizenship"]),
        ]),
        ("Section 10", "Dual/Multiple Citizenship", [
            _q("10.1", "Do you now hold, or have you ever held, citizenship "
               "of another country?", "No"),
            _q("10.2", "Have you ever been issued a passport by a country "
               "other than the United States?", "No"),
        ]),
        ("Section 11", "Where You Have Lived", [
            _q("11.1", "List where you have lived, beginning with your "
               "present residence.",
               f"{len(subj['addressHistory'])} residences listed",
               _residences(subj)),
        ]),
        ("Section 12", "Where You Went to School", [
            _q("12.1", "Have you attended any schools in the last 10 years?",
               "No", "Education completed before the 10-year coverage "
               "window."),
        ]),
        ("Section 13", "Employment Activities", [
            _q("13.1", "List your employment activities, beginning with the "
               "present.",
               f"{len(subj['employmentHistory'])} employers listed",
               _employers(subj)),
            _q("13.2", "In the last 7 years, have you been fired, or quit a "
               "job after being told you would be fired?", "No"),
        ]),
        ("Section 14", "Selective Service Record", [
            _q("14.1", "If you are a male born after December 31, 1959, have "
               "you registered with the Selective Service System?",
               "Yes" if male else "Not applicable",
               "Registration verified." if male else None),
        ]),
        ("Section 15", "Military History", [
            _q("15.1", "Have you ever served in the U.S. military?", "No"),
        ]),
        ("Section 16", "People Who Know You Well", [
            _q("16.1", "Provide three people who know you well.",
               "3 references provided",
               "Names and contact information verified in eApp; on file with "
               "the case."),
        ]),
        ("Section 17", "Marital/Relationship Status", [
            _q("17.1", "Provide your current marital/relationship status.",
               subj["maritalStatus"]),
        ]),
        ("Section 18", "Relatives", [
            _q("18.1", "Provide your relatives and their citizenship and "
               "country of residence.", "Immediate family listed",
               "All listed relatives are U.S. citizens residing in the "
               "United States."),
        ]),
        ("Section 19", "Foreign Contacts", [
            _q("19.1", "Do you have, or have you had, close and/or continuing "
               "contact with a foreign national within the last 7 years?",
               "No"),
        ]),
        ("Section 20", "Foreign Activities", [
            _q("20.1", "Do you have any foreign financial interests?", "No"),
            _q("20.2", "Have you provided services to, or held employment "
               "with, a foreign government or entity?", "No"),
            _q("20.3", "Have you traveled outside the United States in the "
               "last 7 years?", "No"),
        ]),
        ("Section 21", "Psychological and Emotional Health", [
            _q("21.1", "Has a court or administrative agency ever ordered you "
               "to consult with a mental health professional, or do you have "
               "a condition that could affect your judgment, reliability, or "
               "trustworthiness?", "No"),
        ]),
        ("Section 22", "Police Record", [
            _q("22.1", "In the last 7 years, have you been arrested by any "
               "police officer, sheriff, marshal, or any other type of law "
               "enforcement official?", "No"),
            _q("22.2", "Have you ever been charged with a felony offense?",
               "No"),
        ]),
        ("Section 23", "Illegal Use of Drugs or Drug Activity", [
            _q("23.1", "In the last 7 years, have you illegally used any "
               "drugs or controlled substances?", "No"),
        ]),
        ("Section 24", "Use of Alcohol", [
            _q("24.1", "In the last 7 years, has your use of alcohol had a "
               "negative impact on your work performance, professional or "
               "personal relationships, your finances, or resulted in "
               "intervention by law enforcement or public safety personnel?",
               "No"),
        ]),
        ("Section 25", "Investigations and Clearance Record", [
            _q("25.1", "Has the U.S. Government ever investigated your "
               "background and/or granted you a security clearance "
               "eligibility?", "Yes" if elig else "No",
               f"Current standing: {elig}." if elig
               else "This is the subject's first investigation."),
        ]),
        ("Section 26", "Financial Record", [
            _q("26.1", "Are you currently over 120 days delinquent on any "
               "debt?", "No"),
            _q("26.2", "In the last 7 years, have you defaulted on any type "
               "of loan or had bills turned over to a collection agency?",
               "No"),
        ]),
        ("Section 27", "Use of Information Technology Systems", [
            _q("27.1", "In the last 7 years, have you illegally or without "
               "proper authorization accessed or attempted to access any "
               "information technology system?", "No"),
        ]),
        ("Section 28", "Involvement in Non-Criminal Court Actions", [
            _q("28.1", "In the last 10 years, have you been a party to any "
               "public record civil court action?", "No"),
        ]),
        ("Section 29", "Association Record", [
            _q("29.1", "Have you ever been a member of an organization "
               "dedicated to the use of violence or force to overthrow the "
               "U.S. Government?", "No"),
        ]),
    ]


def build_standard_form(subj: dict) -> dict:
    overrides = OVERRIDES.get(subj["id"], {})
    sections = []
    for section, title, questions in _sections(subj):
        for q in questions:
            if q["number"] in overrides:
                q.update(overrides[q["number"]])
        sections.append(dict(section=section, title=title,
                             questions=questions))
    return dict(
        formVersion="SF-86 (Nov 2016), PVQ transition",
        submitted=SUBMITTED.get(subj["id"], DEFAULT_SUBMITTED),
        status="Released to DCSA via eApp",
        sections=sections,
    )
