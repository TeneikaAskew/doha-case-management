import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getAlerts: vi.fn(),
}));

import CVAlerts from '../pages/CVAlerts.jsx';
import { getAlerts } from '../data/api.js';

// Local-only fixture extension (does not touch fixtures.js) so the KPI-filter test
// has a second, non-NEW alert to filter out.
const ALERTS_WITH_REFERRED = [
  ...ALERTS,
  { id: 'ALERT-202', subjectId: 'SUBJ-002', subjectName: 'Marcus T. Bell',
    category: 'ELIGIBILITY', severity: 'MODERATE', priorityScore: 55, state: 'REFERRED',
    receivedDate: '2026-06-10', provider: 'NCIC',
    description: 'Eligibility review referred for adjudication.',
    identityMatch: { confidence: 0.9, identifiers: [] },
    threshold: { rule: 'n/a', met: true, detail: '' },
    priorAdjudication: { previouslyAdjudicated: false, reference: null } },
];

function renderPage() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><CVAlerts /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  getAlerts.mockResolvedValue(ALERTS);
});

describe('CVAlerts', () => {
  it('renders KPI cards and the alert table', async () => {
    renderPage();
    expect(await screen.findByText('Open alerts')).toBeInTheDocument();
    const row = screen.getByText('Daniel R. Okafor').closest('tr');
    expect(within(row).getByText('Financial')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderPage();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'CRIMINAL' } });
    expect(screen.queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no alerts/i })).toBeInTheDocument();
  });

  it('clicking the New KPI filters the table to NEW alerts; clicking again restores', async () => {
    getAlerts.mockResolvedValue(ALERTS_WITH_REFERRED);
    renderPage();
    await screen.findByText('Daniel R. Okafor');
    expect(screen.getByText('Marcus T. Bell')).toBeInTheDocument();

    const newKpi = screen.getByRole('button', { name: /new/i });
    fireEvent.click(newKpi);
    expect(newKpi).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Marcus T. Bell')).not.toBeInTheDocument();

    fireEvent.click(newKpi);
    expect(newKpi).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Marcus T. Bell')).toBeInTheDocument();
  });
});
