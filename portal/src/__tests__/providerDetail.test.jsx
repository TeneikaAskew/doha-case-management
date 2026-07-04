import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';

const PROVIDERS = [
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'], status: 'HEALTHY',
    recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z' },
  { id: 'dmv', name: 'DMV records', category: 'Driver records',
    usedIn: ['INVESTIGATION'], guidelines: ['G', 'J'], status: 'HEALTHY',
    recordCount: 61208443, lastSync: '2026-07-02T06:00:00Z' },
];
const ALERTS = [
  { id: 'ALERT-1', subjectId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'HIGH', priorityScore: 82, state: 'NEW', receivedDate: '2026-06-20',
    description: 'New collection account.' },
  { id: 'ALERT-2', subjectId: 'SUBJ-002', subjectName: 'Marcus T. Bell',
    providerId: 'transunion', provider: 'TransUnion', category: 'FINANCIAL',
    severity: 'LOW', priorityScore: 22, state: 'ADJUDICATED',
    receivedDate: '2025-10-12', description: 'Resolved delinquency.' },
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

function renderPage(id = 'transunion') {
  localStorage.setItem('demo.persona', 'analyst');
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[`/providers/${id}`]}>
        <Routes><Route path="/providers/:id" element={<ProviderDetail />} /></Routes>
      </MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('ProviderDetail', () => {
  it('shows the provider header with health and reach', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'TransUnion' })).toBeInTheDocument();
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(screen.getByText('23,910,287')).toBeInTheDocument();
  });

  it('computes alert KPIs and filters via KPI click', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Alerts Received').closest('.kpi-card')).toHaveTextContent('2');
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('1');
    fireEvent.click(screen.getByText('Open Alerts').closest('.kpi-card'));
    const table = screen.getAllByRole('table')[0];
    expect(within(table).getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(within(table).queryByText('Marcus T. Bell')).not.toBeInTheDocument();
  });

  it('open KPI respects demo alert dispositions', async () => {
    localStorage.setItem('demo.state', JSON.stringify({
      alertStates: { 'ALERT-1': 'CLOSED' }, decisions: {}, roiEntries: {},
      worksheetRatings: {}, askThreads: {},
    }));
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Open Alerts').closest('.kpi-card')).toHaveTextContent('0');
  });

  it('lists record checks delivered with a case link', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'TransUnion' });
    expect(screen.getByText('Record Checks Delivered')).toBeInTheDocument();
    expect(screen.getByText('Credit check')).toBeInTheDocument();
    expect(screen.getByText(/1 documents delivered/)).toBeInTheDocument();
  });

  it('investigation-only provider shows the neutral alerts note and no KPI band', async () => {
    renderPage('dmv');
    await screen.findByRole('heading', { name: 'DMV records' });
    expect(screen.getByText(/feeds investigations, not continuous vetting/i))
      .toBeInTheDocument();
    expect(screen.queryByText('Alerts Received')).not.toBeInTheDocument();
    expect(screen.getByText('Driver record check')).toBeInTheDocument();
  });

  it('unknown provider id shows an error', async () => {
    renderPage('nope');
    expect(await screen.findByRole('alert')).toHaveTextContent(/not found/i);
  });
});
