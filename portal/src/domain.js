export const GUIDELINES = {
  A: 'Allegiance to the United States',
  B: 'Foreign Influence',
  C: 'Foreign Preference',
  D: 'Sexual Behavior',
  E: 'Personal Conduct',
  F: 'Financial Considerations',
  G: 'Alcohol Consumption',
  H: 'Drug Involvement and Substance Misuse',
  I: 'Psychological Conditions',
  J: 'Criminal Conduct',
  K: 'Handling Protected Information',
  L: 'Outside Activities',
  M: 'Use of Information Technology',
};

export const PERSONAS = [
  { id: 'investigator', label: 'Investigator', defaultCaseTab: 'investigation' },
  { id: 'analyst', label: 'Analyst', defaultCaseTab: 'continuous-vetting' },
  { id: 'adjudicator', label: 'Adjudicator', defaultCaseTab: 'adjudication' },
  { id: 'manager', label: 'Manager', defaultCaseTab: 'overview' },
];

// Which worker role owns a case at each lifecycle stage (mirrors data_gen
// workforce.STAGE_ROLE). Managers assign work rather than take it.
export const STAGE_ROLE = {
  INITIATION: 'INVESTIGATOR',
  INVESTIGATION: 'INVESTIGATOR',
  ADJUDICATION: 'ADJUDICATOR',
  CONTINUOUS_VETTING: 'ANALYST',
};

export const STAFF_ROLE_LABELS = {
  INVESTIGATOR: 'Investigator',
  ANALYST: 'Analyst',
  ADJUDICATOR: 'Adjudicator',
  MANAGER: 'Manager',
};

export const EMPLOYMENT_LABELS = { FEDERAL: 'Federal', CONTRACTOR: 'Contractor' };

export const STAFF_STATUS_LABELS = {
  AVAILABLE: 'Available',
  LIMITED: 'Limited',
  AT_CAPACITY: 'At Capacity',
  OUT: 'Out',
};

// Capacity, not severity: available is favorable (green), out is neutral gray.
export const STAFF_STATUS_VARIANTS = {
  AVAILABLE: 'success',
  LIMITED: 'warning',
  AT_CAPACITY: 'error',
  OUT: 'neutral',
};

export const STAGE_LABELS = {
  INITIATION: 'Initiation',
  INVESTIGATION: 'Investigation',
  ADJUDICATION: 'Adjudication',
  CONTINUOUS_VETTING: 'Continuous Vetting',
};

export const STATUS_LABELS = {
  CLEAR: 'Clear',
  NEEDS_REVIEW: 'Needs Review',
  ACTION_REQUIRED: 'Action Required',
};

export const STATUS_VARIANTS = {
  CLEAR: 'success',
  NEEDS_REVIEW: 'warning',
  ACTION_REQUIRED: 'error',
};

export const ELIGIBILITY_LABELS = {
  NONE: 'None',
  INTERIM: 'Interim',
  SECRET: 'Secret',
  TOP_SECRET: 'Top Secret',
};

export const ALERT_CATEGORY_LABELS = {
  CRIMINAL: 'Criminal',
  FINANCIAL: 'Financial',
  CREDIT: 'Credit',
  FOREIGN_TRAVEL: 'Foreign Travel',
  TERRORISM: 'Terrorism',
  ELIGIBILITY: 'Eligibility',
  SUITABILITY: 'Suitability',
};

export const ALERT_STATE_LABELS = {
  NEW: 'New',
  IDENTITY_CONFIRMED: 'Identity Confirmed',
  VALIDATED: 'Validated',
  REFERRED: 'Referred',
  ADJUDICATED: 'Adjudicated',
  CLOSED: 'Closed',
};

// Workflow states render gray/neutral so they never read as severity colors;
// only the favorable terminal state (adjudicated) gets a semantic color.
export const ALERT_STATE_VARIANTS = {
  NEW: 'neutral',
  IDENTITY_CONFIRMED: 'neutral',
  VALIDATED: 'neutral',
  REFERRED: 'neutral',
  ADJUDICATED: 'success',
  CLOSED: 'neutral',
};

export const ALERT_TRANSITIONS = {
  NEW: ['IDENTITY_CONFIRMED', 'CLOSED'],
  IDENTITY_CONFIRMED: ['VALIDATED', 'CLOSED'],
  VALIDATED: ['REFERRED', 'CLOSED'],
  REFERRED: ['ADJUDICATED'],
  ADJUDICATED: [],
  CLOSED: [],
};

export const ALERT_ACTION_LABELS = {
  IDENTITY_CONFIRMED: 'Confirm identity',
  VALIDATED: 'Validate threshold',
  REFERRED: 'Refer to adjudication',
  ADJUDICATED: 'Mark adjudicated',
  CLOSED: 'Close (false positive)',
};

export const ADJ_ACTION_LABELS = {
  GRANT: 'Grant',
  GRANT_WITH_EXCEPTION: 'Grant with exception',
  LOI: 'Letter of Interrogatory',
  SOR: 'Statement of Reasons',
  DENY: 'Deny / revoke',
};

// The demo's fixed reference date (matches data_gen TODAY).
export const DEMO_TODAY = '2026-07-02';

// Demo heuristic: which adjudicative guideline an alert category speaks to.
export const ALERT_CATEGORY_GUIDELINE = {
  CRIMINAL: 'J', FINANCIAL: 'F', CREDIT: 'F', FOREIGN_TRAVEL: 'B',
  TERRORISM: 'A', ELIGIBILITY: 'E', SUITABILITY: 'E',
};

export function riskBand(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

// Utilization reads as capacity pressure, not risk: low is favorable.
export function utilizationAccent(pct) {
  if (pct >= 90) return 'var(--status-alert)';
  if (pct >= 75) return 'var(--status-warning-dark)';
  return 'var(--status-clear)';
}

// A case's effective owner: a demo assignment (from DemoContext) overrides the
// generated assignee. Returns an {staffId,name,role} object or null.
export function effectiveAssignee(subject, assignments = {}, staffById = {}) {
  const demoStaffId = assignments[subject.id];
  if (demoStaffId && staffById[demoStaffId]) {
    const s = staffById[demoStaffId];
    return { staffId: s.id, name: s.name, role: s.role };
  }
  return subject.assignee || null;
}
