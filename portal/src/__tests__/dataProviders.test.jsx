import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';

const PROVIDERS = [
  { id: 'fbi-cjis', name: 'FBI CJIS / NCIC + Rap Back', category: 'Criminal history',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['J', 'D', 'G', 'H'],
    status: 'HEALTHY', recordCount: 84210556, lastSync: '2026-07-02T06:00:00Z' },
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'],
    status: 'DEGRADED', recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z' },
];
const ALERTS = [
  { id: 'ALERT-1', providerId: 'transunion' },
  { id: 'ALERT-2', providerId: 'transunion' },
];
const ACTIVITY = {
  'fbi-cjis': { alertIds: [], recordChecks: [], documents: [] },
  transunion: {
    alertIds: ['ALERT-1', 'ALERT-2'],
    recordChecks: [{ caseId: 'SUBJ-001', subjectName: 'Daniel R. Okafor',
      item: 'Credit check', category: 'FINANCIAL', status: 'COMPLETE',
      completedDate: '2026-03-15', documentUrl: null }],
    documents: [],
  },
};

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve(PROVIDERS),
  getAlerts: () => Promise.resolve(ALERTS),
  getProviderActivity: () => Promise.resolve(ACTIVITY),
}));

import DataProviders from '../pages/DataProviders.jsx';

function Probe() {
  const { id } = useParams();
  return <div data-testid="provider-detail-probe">{id}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/providers']}>
      <Routes>
        <Route path="/providers" element={<DataProviders />} />
        <Route path="/providers/:id" element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DataProviders', () => {
  it('renders provider cards with status and record counts', async () => {
    renderPage();
    const names = await screen.findAllByText('FBI CJIS / NCIC + Rap Back');
    expect(names.length > 0).toBe(true);
    expect(screen.getByText('84,210,556')).toBeInTheDocument();
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('renders the provider-to-guideline coverage matrix', async () => {
    renderPage();
    await screen.findAllByText('FBI CJIS / NCIC + Rap Back');
    const matrix = screen.getByRole('table', { name: /guideline coverage/i });
    expect(matrix).toBeInTheDocument();
    const fbiRow = screen.getAllByRole('row')
      .find((r) => r.textContent.includes('FBI CJIS'));
    expect(fbiRow.querySelectorAll('[aria-label^="Covers Guideline"]').length)
      .toBeGreaterThan(0);
  });

  it('cards show activity counts and click through to the provider detail page', async () => {
    renderPage();
    const heading = (await screen.findAllByText('TransUnion'))[0];
    const card = heading.closest('.provider-card');
    expect(card).toHaveTextContent(/2 alerts/);
    expect(card).toHaveTextContent(/1 record check/);
    fireEvent.click(card);
    expect(await screen.findByTestId('provider-detail-probe'))
      .toHaveTextContent('transunion');
  });
});
