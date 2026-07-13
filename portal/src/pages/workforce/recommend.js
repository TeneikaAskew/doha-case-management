import { STAGE_ROLE, STAFF_ROLE_LABELS, riskBand } from '../../domain.js';

// Deterministic assignment recommendations. Given a case (subject summary) and
// the staff roster, return eligible workers ranked best-first, each with a 0-100
// score and short human reasons. No randomness, no time-of-day dependence.
//
// Factors (all confirmed with the product owner):
//   - SLA / turnaround history (on-time %, and median turnaround for escalations)
//   - spare capacity / utilization
//   - specialty / tier fit
//   - location & staff type (federal vs contractor)

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

// escalated cases (fast-track SLA pressure, or high risk) weight speed higher
function isEscalated(subject) {
  return Boolean(subject.fastTrack) || riskBand(subject.riskScore) === 'high';
}

export function eligibleStaff(subject, staff) {
  const role = STAGE_ROLE[subject.stage];
  return staff.filter((s) => s.role === role
    && s.tierCoverage.includes(subject.tier)
    && s.status !== 'OUT');
}

export function recommendAssignees(subject, staff) {
  const eligible = eligibleStaff(subject, staff);
  if (eligible.length === 0) return [];

  const escalated = isEscalated(subject);
  const codes = subject.flaggedGuidelines || [];
  const turnarounds = eligible.map((s) => s.medianTurnaroundDays);
  const minTT = Math.min(...turnarounds);
  const maxTT = Math.max(...turnarounds);
  // weights shift toward speed for escalated cases
  const W = escalated
    ? { capacity: 0.25, sla: 0.40, fit: 0.25, loc: 0.10 }
    : { capacity: 0.30, sla: 0.30, fit: 0.30, loc: 0.10 };

  const scored = eligible.map((s) => {
    // spare capacity
    const capacity = clamp01(1 - s.utilizationPct / 100);
    // sla: on-time adherence, blended with relative turnaround speed
    const speed = maxTT === minTT ? 1 : (maxTT - s.medianTurnaroundDays) / (maxTT - minTT);
    const sla = clamp01(0.6 * (s.onTimePct / 100) + 0.4 * speed);
    // fit: specialty overlap with the case's flagged guidelines (tier already covered)
    const matched = codes.filter((c) => s.specialties.includes(c));
    const fit = codes.length
      ? clamp01(matched.length / codes.length)
      : 0.5; // no developed issues yet: neutral fit
    // location & staff type: federal weighted slightly higher for sensitive work,
    // central (National Capital Region) offices score a small edge
    const sensitive = subject.tier === 'T5' || riskBand(subject.riskScore) === 'high';
    const fed = s.employmentType === 'FEDERAL';
    const loc = clamp01((fed ? 0.6 : 0.4) + (sensitive && fed ? 0.2 : 0)
      + (s.location === 'National Capital Region' ? 0.2 : 0));

    const score = Math.round(
      100 * (W.capacity * capacity + W.sla * sla + W.fit * fit + W.loc * loc));

    const reasons = [];
    if (matched.length) {
      reasons.push(`Specialty match: Guideline ${matched.join(', ')}`);
    } else {
      reasons.push(`Covers tier ${subject.tier}`);
    }
    const spare = Math.max(0, s.capacity - s.openCases);
    reasons.push(s.utilizationPct >= 90
      ? 'Near capacity'
      : `${spare} of ${s.capacity} slots open (${Math.round(s.utilizationPct)}% used)`);
    reasons.push(`${Math.round(s.onTimePct)}% on-time, ~${s.medianTurnaroundDays}d median`);
    reasons.push(`${fed ? 'Federal' : 'Contractor'}, ${s.location}`);

    return { staff: s, score, reasons, roleLabel: STAFF_ROLE_LABELS[s.role] };
  });

  // best score first; ties broken by lower utilization then stable id
  scored.sort((a, b) => b.score - a.score
    || a.staff.utilizationPct - b.staff.utilizationPct
    || a.staff.id.localeCompare(b.staff.id));
  return scored;
}
