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
];

export const STAGE_LABELS = {
  INITIATION: 'Initiation',
  INVESTIGATION: 'Investigation',
  ADJUDICATION: 'Adjudication',
  CONTINUOUS_VETTING: 'Continuous vetting',
};

export const STATUS_LABELS = {
  CLEAR: 'Clear',
  NEEDS_REVIEW: 'Needs review',
  ACTION_REQUIRED: 'Action required',
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
  FOREIGN_TRAVEL: 'Foreign travel',
  TERRORISM: 'Terrorism',
  ELIGIBILITY: 'Eligibility',
  SUITABILITY: 'Suitability',
};

export const ALERT_STATE_LABELS = {
  NEW: 'New',
  IDENTITY_CONFIRMED: 'Identity confirmed',
  VALIDATED: 'Validated',
  REFERRED: 'Referred',
  ADJUDICATED: 'Adjudicated',
  CLOSED: 'Closed',
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

export function riskBand(score) {
  if (score >= 75) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}
