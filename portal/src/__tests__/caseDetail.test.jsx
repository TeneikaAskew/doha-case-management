import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getCase: (id) => id === 'SUBJ-001'
    ? Promise.resolve(CASE_001)
    : Promise.reject(new Error(`Failed to load cases/${id}.json (HTTP 404)`)),
}));

import CaseDetail from '../pages/case/CaseDetail.jsx';

function renderCase(personaId = 'adjudicator', id = 'SUBJ-001') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[`/cases/${id}`]}>
        <Routes><Route path="/cases/:id" element={<CaseDetail />} /></Routes>
      </MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CaseDetail', () => {
  it('renders subject header with pills and risk score', async () => {
    renderCase();
    expect(await screen.findByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('1988-03-14')).toBeInTheDocument();
    expect(screen.getByText('923-04-4821')).toBeInTheDocument();
    expect(screen.getByText(/Eligibility: Interim/)).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('offers the Ask the Case tab immediately after Documents', async () => {
    renderCase();
    await screen.findByText('Daniel R. Okafor');
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent);
    const docsAt = tabs.indexOf('Documents');
    expect(docsAt).toBeGreaterThan(-1);
    expect(tabs[docsAt + 1]).toMatch(/Ask the Case/);
  });

  it('does not render redundant eligibility or CV enrolled pills', async () => {
    renderCase();
    await screen.findByText('Daniel R. Okafor');
    expect(screen.queryByText('CV enrolled')).not.toBeInTheDocument();
  });

  it('defaults the active tab to the persona preference (adjudicator)', async () => {
    renderCase('adjudicator');
    await screen.findByText('Daniel R. Okafor');
    expect(screen.getByRole('tab', { name: 'Adjudication' }))
      .toHaveAttribute('aria-selected', 'true');
  });

  it('switches tabs and shows overview content', async () => {
    renderCase();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText(/Significant unresolved financial concerns/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    expect(screen.getByText('Report of Investigation (ROI)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view document/i })).toBeInTheDocument();
  });

  it('shows an error state for unknown case ids', async () => {
    renderCase('adjudicator', 'SUBJ-999');
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 404');
  });
});
