import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
  getAlerts: () => Promise.resolve(ALERTS),
}));

import SubjectsHome from '../pages/SubjectsHome.jsx';

function renderHome() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><SubjectsHome /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('SubjectsHome', () => {
  it('shows subject-population KPIs', async () => {
    renderHome();
    expect(await screen.findByText('Total Subjects')).toBeInTheDocument();
    const total = screen.getByText('Total Subjects').closest('.kpi-card');
    expect(total).toHaveTextContent('3');
    const cv = screen.getByText('CV Subjects').closest('.kpi-card');
    expect(cv).toHaveTextContent('2');
    const backlog = screen.getByText('Initial Vetting Backlog').closest('.kpi-card');
    expect(backlog).toHaveTextContent('1'); // SUBJ-003 in INVESTIGATION
    const withAlerts = screen.getByText('Open Alerts').closest('.kpi-card');
    expect(withAlerts).toHaveTextContent('1'); // ALERT-101 (SUBJ-001) is NEW
  });

  it('open-alert KPI respects demo alert dispositions', async () => {
    localStorage.setItem('demo.state', JSON.stringify({
      alertStates: { 'ALERT-101': 'CLOSED' }, decisions: {}, roiEntries: {},
      worksheetRatings: {},
    }));
    renderHome();
    expect(await screen.findByText('Open Alerts')).toBeInTheDocument();
    expect(screen.getByText('Open Alerts').closest('.kpi-card'))
      .toHaveTextContent('0');
  });

  it('ranks needs-attention subjects by status, alerts, then risk', async () => {
    renderHome();
    const cards = await screen.findAllByTestId('attention-card');
    expect(cards[0]).toHaveTextContent('Daniel R. Okafor'); // ACTION_REQUIRED
    expect(cards[1]).toHaveTextContent('Marcus T. Bell');   // NEEDS_REVIEW
  });

  it('directory search filters subjects', async () => {
    renderHome();
    await screen.findByText('Total Subjects');
    fireEvent.change(screen.getByLabelText('Search subjects in directory'),
      { target: { value: 'shah' } });
    const table = screen.getByRole('table');
    expect(within(table).queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
    expect(within(table).getByText('Priya N. Shah')).toBeInTheDocument();
  });

  it('renders the vetting pipeline with stage counts', async () => {
    renderHome();
    expect(await screen.findByText('Vetting Pipeline')).toBeInTheDocument();
    const seg = screen.getByRole('link', { name: '1 Adjudication' });
    expect(seg.getAttribute('href')).toContain('/cases?stage=ADJUDICATION');
  });
});
