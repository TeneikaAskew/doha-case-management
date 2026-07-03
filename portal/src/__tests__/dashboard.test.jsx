import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider, usePersona } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
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
    expect(await screen.findByText('Ready for decision')).toBeInTheDocument();
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Priya N. Shah')).not.toBeInTheDocument();
  });

  it('analyst sees alert-focused KPIs', async () => {
    renderDash('analyst');
    expect(await screen.findByText('Open alerts')).toBeInTheDocument();
    expect(screen.getByText('New alerts')).toBeInTheDocument();
  });

  it('investigator sees investigation queue', async () => {
    renderDash('investigator');
    expect(await screen.findByText('Cases in investigation')).toBeInTheDocument();
    expect(screen.getByText('Priya N. Shah')).toBeInTheDocument();
  });
});
