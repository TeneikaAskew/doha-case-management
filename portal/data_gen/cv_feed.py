"""Procedural CV alert feed: fills every CV provider's inbox deterministically.

Appended AFTER hero/roster cases are built so authored cases stay readable.
Every alert meets the data standards the tests enforce: providerId, source
document, phase history, timeline events.
"""
from datetime import date, timedelta

import documents as docs
from roster import ALERT_EVENT_LABELS, _identity_identifiers

# (providerId, display provider, category, severity, description,
#  threshold rule, doc kind)
FEED = [
    ("equifax", "Equifax", "CREDIT", "LOW",
     "Credit utilization exceeded 90% on revolving accounts",
     "Utilization > 90% on any revolving account", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "HIGH",
     "SAR filed - structured cash deposits under reporting threshold",
     "Any SAR naming the subject", "sar"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "MODERATE",
     "Civil judgment filed - unpaid homeowners association assessment",
     "Civil judgment > $1,000", "public"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "MODERATE",
     "Disposition update - prior charge dismissed",
     "Any disposition change while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "LOW",
     "30-day delinquency reported on retail account",
     "Delinquent debt > $500", "credit"),
    ("cbp-i94", "CBP I-94", "FOREIGN_TRAVEL", "MODERATE",
     "Unreported foreign travel - 5-day trip",
     "Unreported foreign travel (SEAD-3)", "travel"),
    ("diss", "DISS / prior adjudications", "ELIGIBILITY", "LOW",
     "Incident report filed - badge left unattended in common area",
     "Any incident report while CV-enrolled", "incident"),
    ("equifax", "Equifax", "CREDIT", "MODERATE",
     "New tradeline dispute filed by subject",
     "Any disputed tradeline", "credit"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "LOW",
     "Professional license lapse - engineering certification expired",
     "Any professional license action", "public"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "MODERATE",
     "Currency transaction report cluster - three reports in 60 days",
     "3+ currency transaction reports in 90 days", "sar"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "HIGH",
     "Fingerprint-verified arrest notification - trespass",
     "Any arrest while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "MODERATE",
     "Collection account update - balance sold to new servicer",
     "Delinquent debt > $500", "credit"),
    ("cbp-i94", "CBP I-94", "FOREIGN_TRAVEL", "LOW",
     "Border crossing pair matched - reported vacation travel",
     "Unreported foreign travel (SEAD-3)", "travel"),
    ("diss", "DISS / prior adjudications", "ELIGIBILITY", "MODERATE",
     "Eligibility review flag - incident pattern review requested",
     "Two or more incidents in 24 months", "incident"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "MODERATE",
     "Eviction record - unlawful detainer filing",
     "Any eviction filing", "public"),
    ("equifax", "Equifax", "CREDIT", "LOW",
     "Address change reported by furnisher",
     "Identity-relevant record change", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "HIGH",
     "SAR filed - wire activity inconsistent with stated income",
     "Any SAR naming the subject", "sar"),
    ("fbi-cjis", "FBI CJIS / NCIC + Rap Back", "CRIMINAL", "LOW",
     "Record expungement notification",
     "Any disposition change while CV-enrolled", "rapback"),
    ("transunion", "TransUnion", "FINANCIAL", "LOW",
     "Delinquency cured - account returned to current",
     "Delinquent debt > $500", "credit"),
    ("lexisnexis", "LexisNexis", "SUITABILITY", "LOW",
     "Public record refresh - no new adverse items",
     "Scheduled public-records sweep", "public"),
    ("equifax", "Equifax", "CREDIT", "MODERATE",
     "New account opened - hard inquiry cluster",
     "3+ hard inquiries in 30 days", "credit"),
    ("fincen", "FinCEN / Treasury", "FINANCIAL", "MODERATE",
     "Currency transaction report - single cash transaction over $10,000",
     "Any currency transaction report naming the subject", "sar"),
]

HOSTS = ["SUBJ-012", "SUBJ-013", "SUBJ-014", "SUBJ-015", "SUBJ-001", "SUBJ-002"]
STATE_CYCLE = ["ADJUDICATED", "ADJUDICATED", "CLOSED", "ADJUDICATED",
               "NEW", "ADJUDICATED", "VALIDATED"]
SEVERITY_SCORE = {"HIGH": 74, "MODERATE": 52, "LOW": 28}
PHASE_ACTORS = {
    "NEW": "System",
    "IDENTITY_CONFIRMED": "R. Chen (Analyst)",
    "VALIDATED": "R. Chen (Analyst)",
    "REFERRED": "R. Chen (Analyst)",
    "ADJUDICATED": "L. Ortiz (Adjudicator)",
    "CLOSED": "R. Chen (Analyst)",
}
WALKS = {
    "ADJUDICATED": ["NEW", "IDENTITY_CONFIRMED", "VALIDATED", "REFERRED",
                    "ADJUDICATED"],
    "CLOSED": ["NEW", "CLOSED"],
    "VALIDATED": ["NEW", "IDENTITY_CONFIRMED", "VALIDATED"],
    "NEW": ["NEW"],
}
PHASE_OFFSETS = [0, 3, 8, 14, 21]


def _document(kind, subject_id, slug, received, description):
    if kind == "credit":
        bureau = "Equifax" if "equifax" in slug else "TransUnion"
        return docs.credit_extract(
            subject_id, slug, bureau=bureau,
            account_name="CV monitoring extract",
            account_number="(monitored file)", account_type="Consumer file",
            balance="-", past_due="-", days_past_due="-",
            date_reported=received,
            payment_status=description,
            history=f"{description}. Reported through scheduled CV credit "
                    "monitoring; full tradeline detail retained in bureau file.",
            received=received)
    if kind == "sar":
        return docs.sar(
            subject_id, slug, institution="First Commonwealth Bank",
            sar_number=f"SAR-{received.replace('-', '')}-{slug[-3:].upper()}",
            filing_date=received, period=received, total_amount="$18,400",
            narrative=description + ". Referred through the financial-"
                      "intelligence CV feed for personnel-security review.",
            transactions=[(received, "Cash deposit", "$6,200"),
                          (received, "Cash deposit", "$6,100"),
                          (received, "Cash deposit", "$6,100")],
            received=received)
    if kind == "rapback":
        return docs.rapback(
            subject_id, slug, notification_id=f"NGI-RB-{slug[-6:].upper()}",
            trigger_event=description, arrest_date=received,
            agency="Fairfax County Police Department, VA", ori="VA0290000",
            charges=[description], received=received)
    if kind == "travel":
        return docs.travel_record(
            subject_id, slug, traveler="(subject of record)",
            document_number="(on file)", carrier="United UA 1204",
            departure=f"{received} (IAD)", arrival=f"{received} (MEX)",
            destination="Mexico", returned=received, received=received)
    if kind == "public":
        return docs.public_record(
            subject_id, slug, record_type=description.split(" - ")[0],
            source="Fairfax County Circuit Court", filed=received,
            status="Recorded", detail=description + ".", received=received)
    # incident
    return docs.incident_report(
        subject_id, slug, incident_id=f"SIR-{received.replace('-', '')}",
        date=received, facility="Contractor facility, Chantilly VA",
        category="Security incident",
        summary=description + ". Entered in DISS by the facility security "
                "officer; no compromise determined.",
        received=received)


def extend_cases(cases: list[dict]) -> None:
    by_id = {c["subject"]["id"]: c for c in cases}
    base = date(2025, 8, 4)
    for i, (pid, provider, category, severity, description, rule, kind) in enumerate(FEED):
        case = by_id[HOSTS[i % len(HOSTS)]]
        subj = case["subject"]
        received_d = base + timedelta(days=13 * i)
        received = received_d.isoformat()
        state = STATE_CYCLE[i % len(STATE_CYCLE)]
        alert_id = f"ALERT-{500 + i}"
        slug = f"cv-feed-{alert_id.lower()}-{pid}"
        url, doc = _document(kind, subj["id"], slug, received, description)
        case.setdefault("sourceDocuments", {})[url] = doc

        history = []
        walk = WALKS[state]
        for j, phase in enumerate(walk):
            d = (received_d + timedelta(days=PHASE_OFFSETS[j])).isoformat()
            note = "Alert received via CV feed" if phase == "NEW" else None
            if phase == "CLOSED":
                note = "False positive - identifiers do not resolve to subject"
            if phase == "ADJUDICATED":
                note = "No action - resolved on review"
            history.append(dict(state=phase, date=d,
                                actor=PHASE_ACTORS[phase], note=note))

        case["alerts"].append(dict(
            id=alert_id, subjectId=subj["id"], subjectName=subj["name"],
            category=category, severity=severity,
            priorityScore=SEVERITY_SCORE[severity] + (i % 7),
            state=state, receivedDate=received,
            provider=provider, providerId=pid, description=description + ".",
            identityMatch=dict(
                confidence=round(0.94 + (i % 5) * 0.01, 2),
                identifiers=_identity_identifiers(i, subj)),
            threshold=dict(rule=rule, met=True,
                           detail="Meets CV investigative-standard threshold."),
            priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
            documents=[dict(title=doc["title"], url=url)],
            history=history,
        ))

        label = ALERT_EVENT_LABELS[category]
        case["timeline"].append(dict(
            date=received, actor="System", role="CV",
            event=f"{label} alert received", note=description))
        if state == "ADJUDICATED":
            case["timeline"].append(dict(
                date=history[-1]["date"], actor="R. Chen", role="Analyst",
                event=f"{label} alert adjudicated",
                note="No action - resolved on review"))
        case["timeline"].sort(key=lambda e: e["date"])
