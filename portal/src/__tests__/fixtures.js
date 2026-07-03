export const SUBJECTS = [
  { id: 'SUBJ-001', name: 'Daniel R. Okafor', position: 'Senior Systems Engineer',
    tier: 'T5', stage: 'ADJUDICATION', status: 'ACTION_REQUIRED', eligibility: 'INTERIM',
    riskScore: 78, fastTrack: false, flaggedGuidelines: ['F', 'B'], daysInStage: 41,
    cvEnrolled: true, openAlerts: 2 },
  { id: 'SUBJ-002', name: 'Marcus T. Bell', position: 'Logistics Coordinator',
    tier: 'T3', stage: 'CONTINUOUS_VETTING', status: 'NEEDS_REVIEW', eligibility: 'SECRET',
    riskScore: 64, fastTrack: false, flaggedGuidelines: ['J', 'G'], daysInStage: 9,
    cvEnrolled: true, openAlerts: 1 },
  { id: 'SUBJ-003', name: 'Priya N. Shah', position: 'Financial Analyst',
    tier: 'T3', stage: 'INVESTIGATION', status: 'CLEAR', eligibility: 'NONE',
    riskScore: 8, fastTrack: true, flaggedGuidelines: [], daysInStage: 22,
    cvEnrolled: false, openAlerts: 0 },
];

export const ALERTS = [
  { id: 'ALERT-101', subjectId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
    category: 'FINANCIAL', severity: 'HIGH', priorityScore: 82, state: 'NEW',
    receivedDate: '2026-06-20', provider: 'TransUnion',
    description: 'New collection account reported.',
    identityMatch: { confidence: 0.96, identifiers: [
      { field: 'Name', subjectValue: 'Daniel R. Okafor', recordValue: 'Daniel Okafor', match: true }] },
    threshold: { rule: 'Delinquent debt > $5,000', met: true, detail: 'Exceeds threshold.' },
    priorAdjudication: { previouslyAdjudicated: false, reference: null },
    documentUrl: 'documents/doha-record.json' },
];

export const CASE_001 = {
  subject: { ...SUBJECTS[0], ssnMasked: '***-**-4821', dob: '1988-03-14',
    address: '1427 Birch Hollow Ct, Manassas, VA 20109' },
  aiSummary: 'Significant unresolved financial concerns under Guideline F.',
  timeline: [
    { date: '2026-01-27', actor: 'S. Whitfield', role: 'Investigator',
      event: 'ROI transmitted', note: 'Financial issues flagged' },
  ],
  wholePerson: [
    { factor: 'Frequency and recency', assessment: 'Ongoing; newest alert June 2026.' },
  ],
  guidelines: [
    { code: 'F', name: 'Financial Considerations', severity: 'C',
      aiReasoning: 'AG ¶ 19(a) established by the credit record.',
      evidence: [{ provider: 'TransUnion', type: 'Credit report',
        description: '$47,300 delinquent across 5 accounts', date: '2026-03-15' }],
      disqualifiers: [{ code: 'AG ¶ 19(a)', description: 'Inability to satisfy debts',
        evidence: '$47,300 delinquent' }],
      mitigators: [{ code: 'AG ¶ 20(b)', description: 'Conditions beyond control',
        applicability: 'PARTIAL', reasoning: 'Job loss involuntary; no repayment since.' }],
      precedents: [{ caseNumber: '20-01001', outcome: 'DENIED', year: 2021,
        relevance: 'DOHA hearing decision involving Guideline F',
        sourceUrl: 'https://doha.example/2021-ISCR-Hearing-Decisions/FileId/111111/' }] },
  ],
  investigation: {
    coverage: [{ item: 'Subject interview (ESI)', status: 'COMPLETE' }],
    sf86Sections: [
      { section: 'Section 20A', title: 'Financial record — delinquencies',
        subjectReport: 'Two delinquent accounts totaling about $9,000',
        matchedResult: 'Five delinquent accounts totaling $47,300',
        discrepancy: true, providers: ['TransUnion', 'Equifax'], guideline: 'F' },
    ],
    interviews: [{ date: '2025-11-19', type: 'Enhanced Subject Interview',
      interviewer: 'S. Whitfield', summary: 'Subject understated debt total.' }],
    roiEntries: [{ date: '2026-01-27', investigator: 'S. Whitfield', item: 'Financial',
      text: 'Credit data establishes sustained delinquency.' }],
  },
  adjudication: {
    recommendation: { action: 'SOR', aiSuggested: true,
      rationale: 'Unmitigated F concerns with candor issues.' },
    sorDraft: 'STATEMENT OF REASONS (DRAFT) — Guideline F: …',
    decisions: [],
  },
  alerts: ALERTS,
  documents: [{ title: 'Report of Investigation (ROI)', type: 'ROI',
    description: 'T5 ROI transmitted 2026-01-27', url: 'documents/doha-record.json' }],
};
