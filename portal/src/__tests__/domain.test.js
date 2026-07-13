import { describe, it, expect } from 'vitest';
import {
  GUIDELINES, PERSONAS, ALERT_TRANSITIONS, riskBand, STATUS_VARIANTS,
} from '../domain.js';

describe('domain', () => {
  it('defines all 13 guidelines', () => {
    expect(Object.keys(GUIDELINES)).toEqual(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']);
    expect(GUIDELINES.F).toBe('Financial Considerations');
  });

  it('defines the personas with default case tabs', () => {
    expect(PERSONAS.map((p) => p.id)).toEqual(
      ['investigator', 'analyst', 'adjudicator', 'manager']);
    expect(PERSONAS.find((p) => p.id === 'adjudicator').defaultCaseTab).toBe('adjudication');
    expect(PERSONAS.find((p) => p.id === 'manager').defaultCaseTab).toBe('overview');
  });

  it('risk bands', () => {
    expect(riskBand(8)).toBe('low');
    expect(riskBand(40)).toBe('moderate');
    expect(riskBand(75)).toBe('high');
  });

  it('alert state machine only allows legal transitions', () => {
    expect(ALERT_TRANSITIONS.NEW).toEqual(['IDENTITY_CONFIRMED', 'CLOSED']);
    expect(ALERT_TRANSITIONS.VALIDATED).toEqual(['REFERRED', 'CLOSED']);
    expect(ALERT_TRANSITIONS.CLOSED).toEqual([]);
  });

  it('maps statuses to badge variants', () => {
    expect(STATUS_VARIANTS.CLEAR).toBe('success');
    expect(STATUS_VARIANTS.ACTION_REQUIRED).toBe('error');
  });
});
