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
    recordsGrowthQtr: '+1.1% this quarter', matchErrorRate: 0.8 },
  { id: 'dmv', name: 'DMV records', category: 'Driver records',
    usedIn: ['INVESTIGATION'], guidelines: ['G', 'J'], status: 'HEALTHY',
    recordCount: 61208443, lastSync: '2026-07-02T06:00:00Z',
    uptimePct: 99.88, syncCadence: 'Nightly 05:00Z',
    recordsGrowthQtr: '+0.5% this quarter', matchErrorRate: 1.1 },
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
    // 'Status' also appears as a table column header; take the KPI instance
    expect(screen.getAllByText('Status')[0].closest('.kpi-card')).toHaveTextContent('HEALTHY');
    expect(screen.getByText('uptime 99.97%')).toBeInTheDocument();
    expect(screen.getByText('Last Sync').closest('.kpi-card')).toHaveTextContent('2026-07-02');
    expect(screen.getByText('Nightly 06:00Z')).toBeInTheDocument();
    expect(screen.getByText('23,910,287')).toBeInTheDocument();
    expect(screen.getByText('+1.1% this quarter')).toBeInTheDocument();
    expect(screen.getByText('Match Error Rate').closest('.kpi-card')).toHaveTextContent('0.8%');
    expect(screen.queryByText('Alerts Received')).not.toBeInTheDocument();
    expect(screen.queryByText('Open Alerts')).not.toBeInTheDocument();
  });

  it('renders the volume and guideline-yield charts from the alerts', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Alert Volume by Month')).toBeInTheDocument();
    const volume = screen.getByRole('img', { name: /alerts per month/i });
    expect(volume.getAttribute('aria-label')).toContain('2026-06: 1');
    expect(volume.getAttribute('aria-label')).toContain('2025-10: 1');
    const yieldCard = screen.getByText('Guideline Yield').closest('.card');
    expect(within(yieldCard).getByTitle(/Financial Considerations: 2 alerts/))
      .toBeInTheDocument();
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
    expect(screen.getByText('Median Time To Adjudicate').closest('.kpi-card'))
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
    // health KPIs still lead
    expect(screen.getByText('uptime 99.88%')).toBeInTheDocument();
  });

  it('unknown provider id shows an error', async () => {
    renderPage('nope');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });
});
