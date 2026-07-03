import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve({
    docType: 'CREDIT_REPORT',
    title: 'Meridian Auto Finance',
    provider: 'TransUnion', receivedDate: '2026-06-20', subjectId: 'SUBJ-001',
    fields: [{ label: 'Balance', value: '$12,400' }], sections: [], transactions: [],
  }),
  getProviders: () => Promise.resolve([
    { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)' },
  ]),
}));

import CVTab from '../pages/case/CVTab.jsx';

function renderTab(personaId = 'analyst', initial = '/cases/SUBJ-001') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[initial]}><CVTab caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CVTab', () => {
  it('lists alerts with category and state', () => {
    renderTab();
    expect(screen.getByText(/Financial - New collection account/)).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('expands to show the 3-step validation', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('Delinquent debt > $5,000')).toBeInTheDocument();
    expect(screen.getByText(/not previously adjudicated/i)).toBeInTheDocument();
  });

  it('shows the alert provider as a source chip', async () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    const chip = await screen.findByRole('link', { name: /TransUnion/ });
    expect(chip).toHaveAttribute('title', 'Credit bureau (CV provider)');
  });

  it('renders one source-document button per alert document and opens it', async () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    fireEvent.click(screen.getByRole('button',
      { name: /TransUnion credit-file extract/i }));
    expect(await screen.findByText(/Meridian Auto Finance/))
      .toBeInTheDocument();
  });

  it('analyst dispositions an alert through a legal transition', () => {
    renderTab('analyst');
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm identity' }));
    expect(screen.getByText('Identity Confirmed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Validate threshold' })).toBeInTheDocument();
  });

  it('non-analyst personas see no disposition buttons', () => {
    renderTab('adjudicator');
    fireEvent.click(screen.getByRole('button', { name: /new collection account/i }));
    expect(screen.queryByRole('button', { name: 'Confirm identity' })).not.toBeInTheDocument();
  });

  it('shows empty state when subject has no alerts', () => {
    localStorage.setItem('demo.persona', 'analyst');
    render(
      <PersonaProvider><DemoProvider>
        <MemoryRouter><CVTab caseData={{ ...CASE_001, alerts: [] }} /></MemoryRouter>
      </DemoProvider></PersonaProvider>
    );
    expect(screen.getByText(/no cv alerts/i)).toBeInTheDocument();
  });
});
