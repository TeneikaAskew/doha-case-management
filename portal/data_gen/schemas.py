"""Pydantic contracts for portal/public/data/*.json. camelCase fields serialize 1:1."""
from typing import Literal, Optional
from pydantic import BaseModel, Field

Tier = Literal["T1", "T2", "T3", "T4", "T5"]
Stage = Literal["INITIATION", "INVESTIGATION", "ADJUDICATION", "CONTINUOUS_VETTING"]
Status = Literal["CLEAR", "NEEDS_REVIEW", "ACTION_REQUIRED"]
Eligibility = Literal["NONE", "INTERIM", "SECRET", "TOP_SECRET"]
GuidelineCode = Literal["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]
Severity = Literal["A", "B", "C", "D"]  # D most severe, per EVC badge pattern
AlertCategory = Literal["CRIMINAL", "FINANCIAL", "CREDIT", "FOREIGN_TRAVEL",
                        "TERRORISM", "ELIGIBILITY", "SUITABILITY"]
AlertSeverity = Literal["HIGH", "MODERATE", "LOW"]
AlertState = Literal["NEW", "IDENTITY_CONFIRMED", "VALIDATED", "REFERRED",
                     "ADJUDICATED", "CLOSED"]
Applicability = Literal["FULL", "PARTIAL", "NONE"]
CoverageStatus = Literal["COMPLETE", "PENDING", "NOT_REQUIRED"]
AdjAction = Literal["GRANT", "GRANT_WITH_EXCEPTION", "LOI", "SOR", "DENY"]


class SubjectSummary(BaseModel):
    id: str
    name: str
    position: str
    tier: Tier
    stage: Stage
    status: Status
    eligibility: Eligibility
    riskScore: int = Field(ge=0, le=100)
    fastTrack: bool
    flaggedGuidelines: list[GuidelineCode]
    daysInStage: int = Field(ge=0)
    cvEnrolled: bool
    openAlerts: int = Field(ge=0)


class SubjectProfile(SubjectSummary):
    ssnMasked: str
    dob: str
    address: str


class EvidenceItem(BaseModel):
    provider: str
    type: str
    description: str
    date: str


class Disqualifier(BaseModel):
    code: str          # e.g. "AG ¶ 19(a)"
    description: str
    evidence: str


class Mitigator(BaseModel):
    code: str
    description: str
    applicability: Applicability
    reasoning: str


class Precedent(BaseModel):
    caseNumber: str
    outcome: str
    year: Optional[int] = None
    relevance: str


class GuidelineAssessment(BaseModel):
    code: GuidelineCode
    name: str
    severity: Severity
    aiReasoning: str
    evidence: list[EvidenceItem]
    disqualifiers: list[Disqualifier]
    mitigators: list[Mitigator]
    precedents: list[Precedent]


class TimelineEvent(BaseModel):
    date: str
    actor: str
    role: str
    event: str
    note: Optional[str] = None


class WholePersonFactor(BaseModel):
    factor: str
    assessment: str


class CoverageItem(BaseModel):
    item: str
    status: CoverageStatus


class SF86Section(BaseModel):
    section: str       # e.g. "Section 20A"
    title: str
    subjectReport: str
    matchedResult: str
    discrepancy: bool
    providers: list[str]
    guideline: Optional[GuidelineCode] = None


class Interview(BaseModel):
    date: str
    type: str
    interviewer: str
    summary: str


class RoiEntry(BaseModel):
    date: str
    investigator: str
    item: str
    text: str


class Investigation(BaseModel):
    coverage: list[CoverageItem]
    sf86Sections: list[SF86Section]
    interviews: list[Interview]
    roiEntries: list[RoiEntry]


class Recommendation(BaseModel):
    action: AdjAction
    aiSuggested: bool
    rationale: str


class Decision(BaseModel):
    date: str
    adjudicator: str
    action: AdjAction
    rationale: str


class Adjudication(BaseModel):
    recommendation: Recommendation
    sorDraft: Optional[str] = None
    decisions: list[Decision]


class IdentityIdentifier(BaseModel):
    field: str
    subjectValue: str
    recordValue: str
    match: bool


class IdentityMatch(BaseModel):
    confidence: float = Field(ge=0.0, le=1.0)
    identifiers: list[IdentityIdentifier]


class Threshold(BaseModel):
    rule: str
    met: bool
    detail: str


class PriorAdjudication(BaseModel):
    previouslyAdjudicated: bool
    reference: Optional[str] = None


class CVAlert(BaseModel):
    id: str
    subjectId: str
    subjectName: str
    category: AlertCategory
    severity: AlertSeverity
    priorityScore: int = Field(ge=0, le=100)
    state: AlertState
    receivedDate: str
    provider: str
    description: str
    identityMatch: IdentityMatch
    threshold: Threshold
    priorAdjudication: PriorAdjudication
    documentUrl: Optional[str] = None


class Document(BaseModel):
    title: str
    type: str
    description: str
    url: Optional[str] = None


class SourceDocument(BaseModel):
    caseNumber: str
    title: str
    caseType: str
    date: str
    outcome: str
    judge: Optional[str] = None
    sourceUrl: Optional[str] = None
    fullText: str


class CaseDetail(BaseModel):
    subject: SubjectProfile
    aiSummary: str
    timeline: list[TimelineEvent]
    wholePerson: list[WholePersonFactor]
    guidelines: list[GuidelineAssessment]
    investigation: Investigation
    adjudication: Adjudication
    alerts: list[CVAlert]
    documents: list[Document]


class ProviderInfo(BaseModel):
    id: str
    name: str
    category: str
    usedIn: list[Literal["INVESTIGATION", "CV"]]
    guidelines: list[GuidelineCode]
    status: Literal["HEALTHY", "DEGRADED", "OFFLINE"]
    recordCount: int = Field(ge=0)
    lastSync: str


class YearStat(BaseModel):
    year: int
    granted: int
    denied: int


class GuidelineStat(BaseModel):
    code: GuidelineCode
    name: str
    cases: int
    deniedPct: float


class CorpusStats(BaseModel):
    totalCases: int
    byOutcome: dict[str, int]
    byYear: list[YearStat]
    byGuideline: list[GuidelineStat]
    byCaseType: dict[str, int]


class TimelinessStat(BaseModel):
    stage: str
    avgDays: int
    targetDays: int


class AlertVolume(BaseModel):
    category: AlertCategory
    count: int


class TriageBand(BaseModel):
    band: Literal["low", "moderate", "high"]
    count: int


class PipelineStats(BaseModel):
    timeliness: list[TimelinessStat]
    alertVolume: list[AlertVolume]
    triageDistribution: list[TriageBand]


class Analytics(BaseModel):
    corpus: CorpusStats
    pipeline: PipelineStats


class SubjectsFile(BaseModel):
    subjects: list[SubjectSummary]


class AlertsFile(BaseModel):
    alerts: list[CVAlert]


class ProvidersFile(BaseModel):
    providers: list[ProviderInfo]
