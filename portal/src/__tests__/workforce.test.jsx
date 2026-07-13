import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, STAFF } from './fixtures.js';

// A freshly-initiated case with no assignee, to exercise the assignment panel.
const UNASSIGNED = {
  id: 'SUBJ-004', name: 'Alicia M. Grant', position: 'Software Developer',
  tier: 'T5', stage: 'INITIATION', status: 'CLEAR', eligibility: 'NONE',
  riskScore: 5, fastTrack: true, flaggedGuidelines: [], daysInStage: 3,
  cvEnrolled: false, openAlerts: 0, assignee: null,
};

vi.mock('../data/api.js', () => ({
  getStaff: () => Promise.resolve(STAFF),
  getSubjects: () => Promise.resolve([...SUBJECTS, UNASSIGNED]),
}));

import Workforce from '../pages/Workforce.jsx';

function renderWorkforce() {
  return render(
    <MemoryRouter initialEntries={['/workforce']}>
      <PersonaProvider><DemoProvider>
        <Routes>
          <Route path="/workforce" element={<Workforce />} />
          <Route path="/workforce/:id" element={<div>staff detail</div>} />
        </Routes>
      </DemoProvider></PersonaProvider>
    </MemoryRouter>);
}

beforeEach(() => localStorage.clear());

describe('Workforce', () => {
  it('lists the roster and workforce KPIs', async () => {
    renderWorkforce();
    expect(await screen.findByText('R. Chen')).toBeInTheDocument();
    expect(screen.getByText('L. Ortiz')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Workforce', level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByText('Available Now')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Assignment')).toBeInTheDocument();
  });

  it('filters the roster by role', async () => {
    renderWorkforce();
    await screen.findByText('L. Ortiz');
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'ANALYST' } });
    expect(screen.getByText('R. Chen')).toBeInTheDocument();
    expect(screen.queryByText('L. Ortiz')).not.toBeInTheDocument();
  });

  it('surfaces the unassigned case with recommendations, no Assign for non-managers',
    async () => {
      renderWorkforce();
      await screen.findByText('L. Ortiz');
      expect(screen.getByText('Alicia M. Grant')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Assign to/ }))
        .not.toBeInTheDocument();
    });

  it('lets a manager assign a recommended staff member', async () => {
    localStorage.setItem('demo.persona', 'manager');
    renderWorkforce();
    await screen.findByText('Alicia M. Grant');
    const assign = screen.getAllByRole('button', { name: /Assign to/ })[0];
    fireEvent.click(assign);
    // once assigned, the case leaves the awaiting-assignment panel
    expect(screen.queryByText('Alicia M. Grant')).not.toBeInTheDocument();
  });
});
