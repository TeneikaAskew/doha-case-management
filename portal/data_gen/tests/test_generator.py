import json
from pathlib import Path

import pytest

import schemas
import generate_demo_data as gen


@pytest.fixture(scope="module")
def out(tmp_path_factory):
    out_dir = tmp_path_factory.mktemp("data")
    counts = gen.main(out_dir)
    return out_dir, counts


def test_counts(out):
    _, counts = out
    assert counts == {"subjects": 15, "cases": 15, "alerts": counts["alerts"]}
    assert counts["alerts"] >= 4


def test_subjects_file_validates(out):
    out_dir, _ = out
    data = json.loads((out_dir / "subjects.json").read_text(encoding="utf-8"))
    parsed = schemas.SubjectsFile.model_validate(data)
    assert len(parsed.subjects) == 15
    stages = {s.stage for s in parsed.subjects}
    assert stages == {"INITIATION", "INVESTIGATION", "ADJUDICATION", "CONTINUOUS_VETTING"}
    assert any(s.fastTrack for s in parsed.subjects)


def test_every_case_file_validates(out):
    out_dir, _ = out
    case_files = sorted((out_dir / "cases").glob("*.json"))
    assert len(case_files) == 15
    for f in case_files:
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        # Fictional 900-series SSNs only (never issued by SSA).
        assert case.subject.ssn.startswith("9") and len(case.subject.ssn) == 11
        assert case.subject.addressHistory and case.subject.employmentHistory


def test_every_subject_profile_is_complete(out):
    """Demo requirement: no biographic field may be missing or blank, anywhere."""
    out_dir, _ = out
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        s = case.subject
        for field in ("name", "position", "ssn", "dob", "placeOfBirth",
                      "citizenship", "nationality", "gender", "race", "height",
                      "weight", "eyeColor", "hairColor", "maritalStatus",
                      "phone", "email", "address"):
            assert getattr(s, field), f"{s.id}: blank {field}"
        assert len(s.addressHistory) >= 2, f"{s.id}: needs address history"
        assert s.addressHistory[0].toDate is None, f"{s.id}: first address must be current"
        assert s.addressHistory[0].address == s.address
        for a in s.addressHistory:
            assert a.address and a.fromDate, f"{s.id}: incomplete address entry"
        assert len(s.employmentHistory) >= 2, f"{s.id}: needs employment history"
        assert s.employmentHistory[0].toDate is None, f"{s.id}: first job must be current"
        assert s.employmentHistory[0].title == s.position
        for e in s.employmentHistory:
            assert e.employer and e.title and e.address and e.fromDate, \
                f"{s.id}: incomplete employment entry"


ALERT_EVENT_LABELS = {
    "CRIMINAL": "Criminal", "FINANCIAL": "Financial", "CREDIT": "Credit",
    "FOREIGN_TRAVEL": "Foreign travel", "TERRORISM": "Terrorism",
    "ELIGIBILITY": "Eligibility", "SUITABILITY": "Suitability",
}
PROVIDER_WORDS = ("Rap Back", "TransUnion", "Equifax", "Experian", "FinCEN",
                  "CBP", "LexisNexis", "NCIC", "NBIS", "eApp", "DISS")


def test_timeline_standard(out):
    """Every case: full lifecycle timeline, ascending dates, source-free event
    titles, and a '<Category> alert received' event per alert (plus
    'adjudicated' when the alert reached that state)."""
    out_dir, _ = out
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        sid = case.subject.id
        timeline = case.timeline
        assert timeline, f"{sid}: empty timeline"
        dates = [e.date for e in timeline]
        assert dates == sorted(dates), f"{sid}: timeline out of order"
        assert any(e.event == "Case initiated" for e in timeline), \
            f"{sid}: missing 'Case initiated'"
        for e in timeline:
            for word in PROVIDER_WORDS:
                assert word not in e.event, \
                    f"{sid}: source '{word}' leaked into event title '{e.event}'"
        events = [e.event for e in timeline]
        for a in case.alerts:
            label = ALERT_EVENT_LABELS[a.category]
            received = [e for e in timeline
                        if e.event == f"{label} alert received"]
            assert any(e.date == a.receivedDate for e in received), \
                f"{sid}: no '{label} alert received' on {a.receivedDate} for {a.id}"
            if a.state == "ADJUDICATED":
                assert f"{label} alert adjudicated" in events, \
                    f"{sid}: {a.id} adjudicated but no timeline event"


def test_alert_phase_history(out):
    """Every alert walks its workflow: history starts at NEW on the received
    date, ends at the alert's current state, and dates ascend."""
    out_dir, _ = out
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        for a in case.alerts:
            assert a.history, f"{a.id}: no phase history"
            assert a.history[0].state == "NEW", f"{a.id}: history must start at NEW"
            assert a.history[0].date == a.receivedDate, \
                f"{a.id}: first phase date != receivedDate"
            assert a.history[-1].state == a.state, \
                f"{a.id}: history ends at {a.history[-1].state}, alert is {a.state}"
            dates = [p.date for p in a.history]
            assert dates == sorted(dates), f"{a.id}: phase dates out of order"
            for p in a.history:
                assert p.actor, f"{a.id}: phase {p.state} has no actor"


def test_hero1_depth(out):
    out_dir, _ = out
    case = schemas.CaseDetail.model_validate(
        json.loads((out_dir / "cases" / "SUBJ-001.json").read_text(encoding="utf-8")))
    codes = {g.code for g in case.guidelines}
    assert {"F", "B"} <= codes
    assert case.adjudication.sorDraft
    assert any(s.discrepancy for s in case.investigation.sf86Sections)
    assert all(g.precedents for g in case.guidelines)
    assert len(case.alerts) == 2


def test_alerts_and_providers_and_analytics_validate(out):
    out_dir, _ = out
    schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8")))
    providers = schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8")))
    assert len(providers.providers) == 12
    schemas.Analytics.model_validate(
        json.loads((out_dir / "analytics.json").read_text(encoding="utf-8")))


def test_source_document_validates(out):
    out_dir, _ = out
    data = json.loads((out_dir / "documents" / "doha-record.json").read_text(encoding="utf-8"))
    schemas.SourceDocument.model_validate(data)


def test_every_case_leads_with_its_own_doha_decision(out):
    """Each case's Documents tab starts with a real DOHA decision - and when
    the corpus is available, every case gets a different one, matched to the
    case's primary flagged guideline."""
    out_dir, result = out
    numbers = {}
    for case_file in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(
            json.loads(case_file.read_text(encoding="utf-8")))
        first = case.documents[0]
        assert first.url.startswith("documents/doha"), \
            f"{case_file.name} does not lead with a DOHA decision"
        record = schemas.SourceDocument.model_validate(
            json.loads((out_dir / first.url).read_text(encoding="utf-8")))
        assert record.caseNumber in first.title
        # decision text is cleaned: opens with the standard header, not OCR junk
        assert record.fullText.startswith("DEPARTMENT OF DEFENSE") \
            or "DEPARTMENT OF DEFENSE" not in record.fullText, case_file.name
        numbers[case.subject.id] = record.caseNumber
    if (out_dir / "documents" / "doha").exists():  # corpus present
        assert len(set(numbers.values())) == len(numbers), \
            f"duplicate DOHA decisions across cases: {numbers}"


def _load_case(out_dir, subj_id):
    return schemas.CaseDetail.model_validate(
        json.loads((out_dir / "cases" / f"{subj_id}.json").read_text(encoding="utf-8")))


def _provider_names(out_dir):
    providers = schemas.ProvidersFile.model_validate(
        json.loads((out_dir / "providers.json").read_text(encoding="utf-8")))
    return {p.name for p in providers.providers}


def test_typed_documents_exist_and_validate(out):
    out_dir, _ = out
    doc_files = sorted((out_dir / "documents").glob("SUBJ-*/*.json"))
    assert doc_files, "expected per-subject generated documents"
    for f in doc_files:
        doc = schemas.GeneratedDocument.model_validate(
            json.loads(f.read_text(encoding="utf-8")))
        assert doc.subjectId == f.parent.name
        assert doc.fields
        assert doc.reference, f"{f.name}: missing reference"


def test_every_alert_document_and_record_check_resolves(out):
    out_dir, _ = out
    names = _provider_names(out_dir)
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        for a in case.alerts:
            assert a.documents, f"{a.id} has no source documents"
            for d in a.documents:
                assert (out_dir / d.url).is_file(), f"missing {d.url}"
        for rc in case.investigation.recordChecks:
            if rc.documentUrl:
                assert (out_dir / rc.documentUrl).is_file(), f"missing {rc.documentUrl}"
                assert rc.provider in names, f"non-canonical provider {rc.provider}"
            if rc.status == "COMPLETE":
                assert rc.completedDate


def test_whole_person_has_nine_canonical_factors(out):
    out_dir, _ = out
    import documents as docsmod
    for f in sorted((out_dir / "cases").glob("*.json")):
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        assert [w.factor for w in case.wholePerson] == docsmod.WHOLE_PERSON_FACTORS
        for w in case.wholePerson:
            for ev in w.evidence:
                if ev.type == "DOCUMENT":
                    assert (out_dir / ev.ref).is_file()
                if ev.type == "ALERT":
                    assert ev.ref in {a.id for a in case.alerts}


def test_hero2_police_report_wiring(out):
    out_dir, _ = out
    case = _load_case(out_dir, "SUBJ-002")
    pr = next(rc for rc in case.investigation.recordChecks
              if "Police report" in rc.item)
    assert pr.status == "COMPLETE" and pr.documentUrl
    doc = schemas.GeneratedDocument.model_validate(
        json.loads((out_dir / pr.documentUrl).read_text(encoding="utf-8")))
    assert doc.docType == "POLICE_REPORT"
    alert = next(a for a in case.alerts if a.id == "ALERT-201")
    assert {d.url for d in alert.documents} >= {pr.documentUrl}


def test_case_links_file_validates_and_covers_precedents(out):
    out_dir, _ = out
    data = json.loads((out_dir / "case-links.json").read_text(encoding="utf-8"))
    parsed = schemas.CaseLinksFile.model_validate(data)
    assert parsed.links

    subj1 = schemas.CaseDetail.model_validate(
        json.loads((out_dir / "cases" / "SUBJ-001.json").read_text(encoding="utf-8")))
    precedent_numbers = {p.caseNumber for g in subj1.guidelines for p in g.precedents}
    linked_numbers = {link.caseNumber for link in parsed.links}
    assert precedent_numbers <= linked_numbers

    for link in parsed.links:
        if link.pdfUrl:
            assert link.listingUrl
            assert link.pdfUrl.startswith(link.listingUrl)


def test_deterministic(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    gen.main(a)
    gen.main(b)
    assert (a / "subjects.json").read_text(encoding="utf-8") == \
           (b / "subjects.json").read_text(encoding="utf-8")


def test_no_em_dashes_or_mojibake_in_generated_data(out):
    """CLAUDE.md copy rule: hyphens only. Catches raw and double-encoded dashes.

    doha-record.json is exempt: it is the verbatim text of a real DOHA decision.
    """
    out_dir, _ = out
    banned = ["—", "–", "â€"]  # em dash, en dash, mojibake prefix
    for f in sorted(out_dir.rglob("*.json")):
        # verbatim texts of real DOHA decisions are exempt
        if f.name == "doha-record.json" or f.parent.name == "doha":
            continue
        text = f.read_text(encoding="utf-8")
        for ch in banned:
            assert ch not in text, f"{f.name} contains banned dash {ch!r}"
