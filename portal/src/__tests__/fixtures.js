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
    priorAdjudication: { previouslyAdjudicated: false, reference: null } },
];
