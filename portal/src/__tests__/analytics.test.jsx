import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DemoProvider } from '../state/DemoContext.jsx';

const ANALYTICS = {
  corpus: {
    totalCases: 36700,
    byOutcome: { GRANTED: 13200, DENIED: 19800, OTHER: 3700 },
    byYear: [{ year: 2020, granted: 1500, denied: 2100 }],
    byGuideline: [{ code: 'F', name: 'Financial Considerations', cases: 15000, deniedPct: 61.5 }],
    byCaseType: { hearing: 28650, appeal: 8050 },
  },
  pipeline: {
    timeliness: [
      { stage: 'Investigation', avgDays: 73, targetDays: 90 },
      { stage: 'Adjudication', avgDays: 32, targetDays: 30 },
      { stage: 'CV alert triage', avgDays: 4, targetDays: 7 },
    ],
    alertVolume: [{ category: 'FINANCIAL', count: 2 }],
    triageDistribution: [{ band: 'low', count: 9 }],
  },
};

const SUBJECTS = [
  { id: 'SUBJ-001', name: 'A', position: 'x', tier: 'T5', stage: 'ADJUDICATION',
    status: 'ACTION_REQUIRED', eligibility: 'INTERIM', riskScore: 78, fastTrack: false,
    flaggedGuidelines: ['F', 'B'], daysInStage: 41, cvEnrolled: true, openAlerts: 2 },
  { id: 'SUBJ-002', name: 'B', position: 'x', tier: 'T3', stage: 'CONTINUOUS_VETTING',
    status: 'NEEDS_REVIEW', eligibility: 'SECRET', riskScore: 64, fastTrack: false,
    flaggedGuidelines: ['J'], daysInStage: 9, cvEnrolled: true, openAlerts: 1 },
  { id: 'SUBJ-003', name: 'C', position: 'x', tier: 'T3', stage: 'INVESTIGATION',
    status: 'CLEAR', eligibility: 'NONE', riskScore: 8, fastTrack: true,
    flaggedGuidelines: [], daysInStage: 22, cvEnrolled: false, openAlerts: 0 },
];

const ALERTS = [
  { id: 'ALERT-101', subjectId: 'SUBJ-001', category: 'FINANCIAL', severity: 'HIGH',
    state: 'NEW' },
  { id: 'ALERT-201', subjectId: 'SUBJ-002', category: 'CRIMINAL', severity: 'HIGH',
    state: 'VALIDATED' },
];

vi.mock('../data/api.js', () => ({
  getAnalytics: () => Promise.resolve(ANALYTICS),
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
}));

import Analytics from '../pages/Analytics.jsx';

function renderPage(initial = '/analytics') {
  return render(
    <DemoProvider>
      <MemoryRouter initialEntries={[initial]}><Analytics /></MemoryRouter>
    </DemoProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('Analytics', () => {
  it('defaults to the Overview tab with population KPIs and panels', async () => {
    renderPage();
    expect(await screen.findByText('Population Risk Posture')).toBeInTheDocument();
    expect(screen.getByText('Cases by Adjudication Level')).toBeInTheDocument();
    expect(screen.getByText('Case Aging (Days in Stage)')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the Continuous Vetting tab with funnel and categories', async () => {
    renderPage();
    await screen.findByText('Population Risk Posture');
    fireEvent.click(screen.getByRole('tab', { name: 'Continuous Vetting' }));
    expect(screen.getByText('Alert Funnel')).toBeInTheDocument();
    expect(screen.getByText('Alerts by Category')).toBeInTheDocument();
    expect(screen.getByText('Avg Triage Time')).toBeInTheDocument();
  });

  it('renders the corpus tab with DOHA aggregates and hides filters there', async () => {
    renderPage('/analytics?tab=corpus');
    expect(await screen.findByText('36,700')).toBeInTheDocument();
    expect(screen.getByText('19,800')).toBeInTheDocument();
    expect(screen.getByText('Cases by Guideline')).toBeInTheDocument();
    expect(screen.getByText('Outcomes by Year')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /filters/i })).not.toBeInTheDocument();
  });

  it('filter panel is collapsed by default, expands, and scopes the population', async () => {
    renderPage();
    await screen.findByText('Population Risk Posture');
    expect(screen.queryByText('Risk band')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByText('Risk band')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('T5'));
    expect(screen.getByText('1 of 3 subjects match')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(screen.queryByText(/subjects match/)).not.toBeInTheDocument();
  });
});
