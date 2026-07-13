import { describe, it, expect } from 'vitest';
import {
  GUIDELINES, PERSONAS, ALERT_TRANSITIONS, riskBand, STATUS_VARIANTS,
  applyAssignments, effectiveStage,
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

  it('effectiveStage advances an assigned initiation case to investigation', () => {
    const init = { id: 'C1', stage: 'INITIATION' };
    expect(effectiveStage(init, {})).toBe('INITIATION');           // unassigned
    expect(effectiveStage(init, { C1: 'S1' })).toBe('INVESTIGATION'); // assigned
    // other stages are never rewritten
    const cv = { id: 'C2', stage: 'CONTINUOUS_VETTING' };
    expect(effectiveStage(cv, { C2: 'S1' })).toBe('CONTINUOUS_VETTING');
  });

  it('applyAssignments moves load from the old owner to the new on reassignment', () => {
    const staff = [
      { id: 'S1', role: 'ADJUDICATOR', capacity: 10, openCases: 8,
        assignedCaseIds: ['C1'], utilizationPct: 80, status: 'LIMITED' },
      { id: 'S2', role: 'ADJUDICATOR', capacity: 10, openCases: 5,
        assignedCaseIds: [], utilizationPct: 50, status: 'AVAILABLE' },
    ];
    const subjects = [{ id: 'C1', assignee: { staffId: 'S1', name: 'A', role: 'ADJUDICATOR' } }];
    const eff = applyAssignments(staff, subjects, { C1: 'S2' });
    const s1 = eff.find((s) => s.id === 'S1');
    const s2 = eff.find((s) => s.id === 'S2');
    expect(s1.assignedCaseIds).toEqual([]);      // lost the case
    expect(s1.openCases).toBe(7);                // baseline 7, no demo cases
    expect(s1.utilizationPct).toBe(70);
    expect(s2.assignedCaseIds).toEqual(['C1']);  // gained the case
    expect(s2.openCases).toBe(6);                // baseline 5 + 1
    expect(s2.utilizationPct).toBe(60);
  });
});
