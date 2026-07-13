import { describe, it, expect } from 'vitest';
import { recommendAssignees, eligibleStaff } from '../pages/workforce/recommend.js';
import { STAFF } from './fixtures.js';

const adjudicationCase = {
  id: 'SUBJ-001', stage: 'ADJUDICATION', tier: 'T5',
  flaggedGuidelines: ['F', 'B'], fastTrack: false, riskScore: 78,
};
const initiationCase = {
  id: 'SUBJ-004', stage: 'INITIATION', tier: 'T5',
  flaggedGuidelines: [], fastTrack: true, riskScore: 5,
};

describe('recommendAssignees', () => {
  it('only proposes staff whose role matches the stage and who cover the tier', () => {
    const recos = recommendAssignees(adjudicationCase, STAFF);
    // ADJUDICATION -> ADJUDICATOR; only L. Ortiz qualifies (covers T5, not OUT)
    expect(recos.map((r) => r.staff.id)).toEqual(['STAFF-010']);
    // managers, analysts, investigators are excluded
    expect(recos.every((r) => r.staff.role === 'ADJUDICATOR')).toBe(true);
  });

  it('ranks a specialty + tier match at the top with an explaining reason', () => {
    const recos = recommendAssignees(adjudicationCase, STAFF);
    const top = recos[0];
    expect(top.staff.name).toBe('L. Ortiz');
    expect(top.score).toBeGreaterThan(0);
    expect(top.reasons.some((r) => /Specialty match/.test(r))).toBe(true);
    expect(top.reasons.some((r) => /on-time/.test(r))).toBe(true);
  });

  it('excludes staff who are out of office', () => {
    const outStaff = STAFF.map((s) => (
      s.id === 'STAFF-010' ? { ...s, status: 'OUT' } : s));
    expect(eligibleStaff(adjudicationCase, outStaff)).toHaveLength(0);
    expect(recommendAssignees(adjudicationCase, outStaff)).toHaveLength(0);
  });

  it('gives a neutral fit reason when no guidelines are flagged yet', () => {
    // INITIATION -> INVESTIGATOR; M. Delgado covers T5
    const recos = recommendAssignees(initiationCase, STAFF);
    expect(recos.map((r) => r.staff.id)).toEqual(['STAFF-001']);
    expect(recos[0].reasons.some((r) => /Covers tier T5/.test(r))).toBe(true);
  });

  it('is deterministic: same inputs yield the same ordering and scores', () => {
    const a = recommendAssignees(adjudicationCase, STAFF);
    const b = recommendAssignees(adjudicationCase, STAFF);
    expect(a).toEqual(b);
  });
});
