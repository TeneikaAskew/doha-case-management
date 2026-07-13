import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider, usePersona } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, ALERTS, STAFF } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
  getStaff: () => Promise.resolve(STAFF),
}));

import Dashboard from '../pages/Dashboard.jsx';

function renderDash(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><Dashboard /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('Dashboard', () => {
  it('adjudicator sees decision-focused KPIs and adjudication queue', async () => {
    renderDash('adjudicator');
    expect(await screen.findByText('Ready for Decision')).toBeInTheDocument();
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Priya N. Shah')).not.toBeInTheDocument();
  });

  it('analyst sees alert-focused KPIs', async () => {
    renderDash('analyst');
    expect(await screen.findByText('Open Alerts')).toBeInTheDocument();
    expect(screen.getByText('New Alerts')).toBeInTheDocument();
  });

  it('investigator sees investigation queue', async () => {
    renderDash('investigator');
    expect(await screen.findByText('Cases in Investigation')).toBeInTheDocument();
    expect(screen.getByText('Priya N. Shah')).toBeInTheDocument();
  });

  it('analyst KPIs respect demo alert dispositions', async () => {
    localStorage.setItem('demo.state',
      JSON.stringify({ alertStates: { 'ALERT-101': 'CLOSED' }, decisions: {}, roiEntries: {} }));
    renderDash('analyst');
    expect(await screen.findByText('Open Alerts')).toBeInTheDocument();
    const openCard = screen.getByText('Open Alerts').closest('.kpi-card');
    expect(openCard).toHaveTextContent('0');
  });
});
