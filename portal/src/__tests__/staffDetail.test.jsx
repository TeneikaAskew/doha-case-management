import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS, STAFF } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getStaff: () => Promise.resolve(STAFF),
  getSubjects: () => Promise.resolve(SUBJECTS),
}));

import StaffDetail from '../pages/workforce/StaffDetail.jsx';

function renderDetail(id) {
  return render(
    <MemoryRouter initialEntries={[`/workforce/${id}`]}>
      <DemoProvider>
        <Routes>
          <Route path="/workforce/:id" element={<StaffDetail />} />
          <Route path="/cases/:cid" element={<div>case detail</div>} />
        </Routes>
      </DemoProvider>
    </MemoryRouter>);
}

beforeEach(() => localStorage.clear());

describe('StaffDetail', () => {
  it('shows the profile and current caseload for a staff member', async () => {
    renderDetail('STAFF-010');
    expect(await screen.findByRole('heading', { name: 'L. Ortiz' }))
      .toBeInTheDocument();
    expect(screen.getByText('Adjudicator')).toBeInTheDocument();
    // SUBJ-001 is assigned to STAFF-010 in the fixture
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    // utilization stat renders
    expect(screen.getByText('Utilization')).toBeInTheDocument();
  });

  it('shows an error state for an unknown staff id', async () => {
    renderDetail('STAFF-999');
    expect(await screen.findByText(/Staff not found: STAFF-999/))
      .toBeInTheDocument();
  });
});
