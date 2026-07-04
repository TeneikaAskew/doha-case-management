import pytest
from pydantic import ValidationError

import schemas


def make_subject(**overrides):
    base = dict(
        id="SUBJ-001", name="Test Person", position="Systems Engineer",
        tier="T5", stage="ADJUDICATION", status="NEEDS_REVIEW",
        eligibility="INTERIM", riskScore=72, fastTrack=False,
        flaggedGuidelines=["F", "B"], daysInStage=41, cvEnrolled=True, openAlerts=1,
    )
    base.update(overrides)
    return base


def test_subject_summary_valid():
    s = schemas.SubjectSummary.model_validate(make_subject())
    assert s.riskScore == 72 and s.flaggedGuidelines == ["F", "B"]


def test_subject_rejects_bad_values():
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(riskScore=140))
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(tier="T9"))
    with pytest.raises(ValidationError):
        schemas.SubjectSummary.model_validate(make_subject(flaggedGuidelines=["Z"]))


def test_cv_alert_valid():
    alert = schemas.CVAlert.model_validate(dict(
        id="ALERT-001", subjectId="SUBJ-001", subjectName="Test Person",
        category="FINANCIAL", severity="MODERATE", priorityScore=64, state="NEW",
        receivedDate="2026-06-20", provider="TransUnion", providerId="transunion",
        description="New delinquent account reported, $12,400 past due.",
        identityMatch=dict(confidence=0.94, identifiers=[
            dict(field="Name", subjectValue="Test Person", recordValue="Test Person", match=True),
            dict(field="DOB", subjectValue="1988-03-14", recordValue="1988-03-14", match=True),
        ]),
        threshold=dict(rule="Delinquent debt > $5,000", met=True,
                       detail="Reported past-due balance $12,400 exceeds threshold."),
        priorAdjudication=dict(previouslyAdjudicated=False, reference=None),
    ))
    assert alert.identityMatch.confidence == pytest.approx(0.94)


def test_case_detail_requires_nested_blocks():
    with pytest.raises(ValidationError):
        schemas.CaseDetail.model_validate({"subject": make_subject()})


def test_analytics_roundtrip():
    a = schemas.Analytics.model_validate(dict(
        corpus=dict(totalCases=36700, byOutcome={"GRANTED": 12000, "DENIED": 16000},
                    byYear=[dict(year=2020, granted=1500, denied=2100)],
                    byGuideline=[dict(code="F", name="Financial Considerations",
                                      cases=15000, deniedPct=61.5)],
                    byCaseType={"hearing": 28650, "appeal": 8050}),
        pipeline=dict(timeliness=[dict(stage="Investigation", avgDays=73, targetDays=90)],
                      alertVolume=[dict(category="FINANCIAL", count=42)],
                      triageDistribution=[dict(band="high", count=3)]),
    ))
    assert a.corpus.totalCases == 36700
