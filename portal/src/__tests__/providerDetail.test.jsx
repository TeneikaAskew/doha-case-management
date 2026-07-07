import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';

const PROVIDERS = [
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'], status: 'HEALTHY',
    recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z',
    uptimePct: 99.97, syncCadence: 'Nightly 06:00Z',
    recordsGrowthQtr: '+1.1% this quarter', matchErrorRate: 0.8,
    network: {
      coveredSubjects: 1150000, checks12mo: 3100, findings12mo: 170,
      autoClearPct: 76, medianTurnaroundDays: 1,
      findingsByGuideline: { F: 170 },
      monthly: [
        { month: '2026-02', checks: 900, findings: 45, high: 9, moderate: 18, low: 18 },
        { month: '2026-03', checks: 900, findings: 45, high: 9, moderate: 18, low: 18 },
        { month: '2026-04', checks: 900, findings: 45, high: 9, moderate: 18, low: 18 },
        { month: '2026-05', checks: 1000, findings: 50, high: 10, moderate: 20, low: 20 },
        { month: '2026-06', checks: 1200, findings: 80, high: 20, moderate: 30, low: 30 },
        { month: '2026-07', checks: 900, findings: 40, high: 5, moderate: 15, low: 20 },
      ] } },
  { id: 'dmv', name: 'DMV records', category: 'Driver records',
    usedIn: ['INVESTIGATION'], guidelines: ['G', 'J'], status: 'HEALTHY',
    recordCount: 61208443, lastSync: '2026-07-02T06:00:00Z',
    uptimePct: 99.88, syncCadence: 'Nightly 05:00Z',
    recordsGrowthQtr: '+0.5% this quarter', matchErrorRate: 1.1,
    network: {
      coveredSubjects: 1800000, checks12mo: 2000, findings12mo: 60,
      autoClearPct: 88, medianTurnaroundDays: 2,
      findingsByGuideline: { G: 38, J: 22 },
      monthly: [
        { month: '2026-06', checks: 1000, findings: 30, high: 2, moderate: 8, low: 20 },
        { month: '2026-07', checks: 1000, findings: 30, high: 2, moderate: 8, low: 20 },
      ] } },
];
const ALERTS = [
  { id: 'ALERT-1', subjectId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'HIGH', priorityScore: 82, state: 'NEW', receivedDate: '2026-06-20',
    description: 'New collection account.',
    history: [{ state: 'NEW', date: '2026-06-20', actor: 'System', note: null }] },
  { id: 'ALERT-2', subjectId: 'SUBJ-002', subjectName: 'Marcus T. Bell',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'LOW', priorityScore: 22, state: 'ADJUDICATED',
    receivedDate: '2025-10-12', description: 'Resolved delinquency.',
    history: [
      { state: 'NEW', date: '2025-10-12', actor: 'System', note: null },
      { state: 'ADJUDICATED', date: '2025-11-20', actor: 'L. Ortiz (Adjudicator)',
        note: 'No action' },
    ] },
];
const ACTIVITY = {
  transunion: {
    alertIds: ['ALERT-1', 'ALERT-2'],
    recordChecks: [{ caseId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
      item: 'Credit check', category: 'FINANCIAL', status: 'COMPLETE',
      completedDate: '2026-03-15',
      documentUrl: 'documents/SUBJ-001/credit-extract.json' }],
    documents: [{ caseId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
      title: 'TransUnion credit-file extract',
      url: 'documents/SUBJ-001/credit-extract.json',
      receivedDate: '2026-06-20' }],
  },
  dmv: { alertIds: [], recordChecks: [{ caseId: 'SUBJ-003',
    subjectName: 'Priya N. Shah', item: 'Driver record check',
    category: 'CRIMINAL', status: 'COMPLETE', completedDate: '2026-06-14',
    documentUrl: null }], documents: [] },
};

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve(PROVIDERS),
  getAlerts: () => Promise.resolve(ALERTS),
  getProviderActivity: () => Promise.resolve(ACTIVITY),
}));

import ProviderDetail from '../pages/ProviderDetail.jsx';

function renderPage(id = 'transunion', personaId = 'analyst') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[`/providers/${id}`]}>
        <Routes><Route path="/providers/:id" element={<ProviderDetail />} /></Routes>
      </MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('ProviderDetail - default (health) view', () => {
  it('leads with source-health KPIs, not alert KPIs', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'TransUnion' })).toBeInTheDocument();
    // status is a header badge, last sync a header line - not KPI cards
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(screen.queryByText('Last Sync')).not.toBeInTheDocument();
    const sync = screen.getByLabelText('Last sync 2026-07-02');
    expect(sync).toHaveAttribute('title', 'Nightly 06:00Z');
    expect(screen.getByText('23,910,287')).toBeInTheDocument();
    expect(screen.getByText('+1.1% this quarter')).toBeInTheDocument();
    expect(screen.getByText('Match Error Rate').closest('.kpi-card')).toHaveTextContent('0.8%');
    expect(screen.queryByText('uptime 99.97%')).not.toBeInTheDocument();
    expect(screen.queryByText('Alerts Received')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Alerts')).not.toBeInTheDocument();
  });

  it('renders network-wide volume and guideline-yield charts', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Alert Volume by Month')).toBeInTheDocument();
    const volume = screen.getByRole('img', { name: /alerts per month/i });
    expect(volume.getAttribute('aria-label')).toContain('2026-06: 80');
    expect(volume.getAttribute('aria-label')).toContain('2026-07: 40');
    const yieldCard = screen.getByText('Guideline Yield').closest('.card');
    expect(within(yieldCard).getByTitle(/Financial Considerations: 170 findings/))
      .toBeInTheDocument();
  });

  it('shows the network KPI row from provider stats, without any case data', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Covered Subjects').closest('.kpi-card'))
      .toHaveTextContent('1,150,000');
    const checks = screen.getByText('Checks Past Year').closest('.kpi-card');
    expect(checks).toHaveTextContent('3,100');
    // (1000+1200+900) vs (900*3) = +14.8%, with an upward trend arrow
    expect(checks).toHaveTextContent('+14.8% vs prior quarter');
    expect(within(checks).getByLabelText('increasing')).toBeInTheDocument();
    expect(screen.getByText('Alerts Past Year').closest('.kpi-card'))
      .toHaveTextContent('auto-clear 76%');
    expect(screen.getByText('Median Turnaround').closest('.kpi-card'))
      .toHaveTextContent('1d');
  });

  it('keeps the alerts table with its category filter', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });
});

describe('ProviderDetail - triage mode', () => {
  it('toggles on, persists, and shows the queue KPIs', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    fireEvent.click(screen.getByRole('switch', { name: /triage/i }));
    expect(localStorage.getItem('demo.providerTriage')).toBe('on');
    expect(screen.getByText('Work Queue - Open First')).toBeInTheDocument();
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('1');
    expect(screen.getByText('High Severity Open').closest('.kpi-card')).toHaveTextContent('1');
    expect(screen.getByText('Oldest Open').closest('.kpi-card')).toHaveTextContent('12d');
    expect(screen.getByText('Median Days To Adjudicate').closest('.kpi-card'))
      .toHaveTextContent('39d');
    expect(screen.getByText('Alerts Received').closest('.kpi-card')).toHaveTextContent('2');
    expect(screen.getByText('Adjudicated / Closed').closest('.kpi-card')).toHaveTextContent('1');
    expect(screen.queryByText('Match Error Rate')).not.toBeInTheDocument();
  });

  it('starts in triage when the session remembered it', async () => {
    localStorage.setItem('demo.providerTriage', 'on');
    renderPage();
    expect(await screen.findByText('Work Queue - Open First')).toBeInTheDocument();
  });

  it('queues open alerts first with age; analyst gets legal actions', async () => {
    localStorage.setItem('demo.providerTriage', 'on');
    renderPage('transunion', 'analyst');
    await screen.findByText('Work Queue - Open First');
    expect(screen.getByText('open 12 days')).toBeInTheDocument();
    // NEW alert offers its legal transitions only
    expect(screen.getByRole('button', { name: 'Confirm identity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Validate threshold' }))
      .not.toBeInTheDocument();
    // adjudicated row is demoted with its actor and date
    expect(screen.getByText(/L\. Ortiz \(Adjudicator\), 2025-11-20/)).toBeInTheDocument();
  });

  it('non-analyst personas see the queue read-only with a hint', async () => {
    localStorage.setItem('demo.providerTriage', 'on');
    renderPage('transunion', 'adjudicator');
    await screen.findByText('Work Queue - Open First');
    expect(screen.queryByRole('button', { name: 'Confirm identity' }))
      .not.toBeInTheDocument();
    expect(screen.getByText(/switch to the analyst persona/i)).toBeInTheDocument();
  });

  it('triage KPIs respect demo alert dispositions', async () => {
    localStorage.setItem('demo.providerTriage', 'on');
    localStorage.setItem('demo.state', JSON.stringify({
      alertStates: { 'ALERT-1': 'CLOSED' }, decisions: {}, roiEntries: {},
      worksheetRatings: {}, askThreads: {},
    }));
    renderPage();
    await screen.findByText('Work Queue - Open First');
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('0');
    expect(screen.getByText('Queue clear')).toBeInTheDocument();
  });
});

describe('ProviderDetail - investigation-only providers', () => {
  it('has no triage switch and shows the neutral alerts note', async () => {
    renderPage('dmv');
    await screen.findByRole('heading', { name: 'DMV records' });
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByText(/feeds investigations, not continuous vetting/i))
      .toBeInTheDocument();
    expect(screen.getByText('Driver record check')).toBeInTheDocument();
    // health KPIs still lead; sync sits in the header
    expect(screen.getByText('Match Error Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Last sync 2026-07-02')).toBeInTheDocument();
    // network charts render even though no demo alert points at this source
    expect(screen.getByText('Finding Volume by Month')).toBeInTheDocument();
    const yieldCard = screen.getByText('Guideline Yield').closest('.card');
    expect(within(yieldCard).getByTitle(/Alcohol Consumption: 38 findings/))
      .toBeInTheDocument();
  });

  it('unknown provider id shows an error', async () => {
    renderPage('nope');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });
});
