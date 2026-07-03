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
        assert case.subject.ssnMasked.startswith("***-**-")


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


def test_every_document_and_alert_points_to_source_document(out):
    out_dir, _ = out
    doc_url = "documents/doha-record.json"
    case_files = sorted((out_dir / "cases").glob("*.json"))
    for f in case_files:
        case = schemas.CaseDetail.model_validate(json.loads(f.read_text(encoding="utf-8")))
        for d in case.documents:
            assert d.url == doc_url
        for a in case.alerts:
            assert a.documentUrl == doc_url
    alerts = schemas.AlertsFile.model_validate(
        json.loads((out_dir / "alerts.json").read_text(encoding="utf-8")))
    assert alerts.alerts
    for a in alerts.alerts:
        assert a.documentUrl == doc_url


def test_deterministic(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    gen.main(a)
    gen.main(b)
    assert (a / "subjects.json").read_text(encoding="utf-8") == \
           (b / "subjects.json").read_text(encoding="utf-8")
