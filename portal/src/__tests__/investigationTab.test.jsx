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

import InvestigationTab from '../pages/case/InvestigationTab.jsx';

function renderTab(personaId = 'investigator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><InvestigationTab caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('InvestigationTab', () => {
  it('renders the interview ledger with conflict verdicts and highlight', () => {
    renderTab();
    expect(screen.getByText('Enhanced Subject Interview')).toBeInTheDocument();
    expect(screen.getByText('Conflict')).toBeInTheDocument();
    expect(screen.getByText('No conflict')).toBeInTheDocument();
    const mark = screen.getByText('understated the debt total');
    expect(mark.tagName).toBe('MARK');
  });

  it('renders self-report vs matched result with discrepancy flag', () => {
    renderTab();
    expect(screen.getByText('Two delinquent accounts totaling about $9,000')).toBeInTheDocument();
    expect(screen.getByText('Five delinquent accounts totaling $47,300')).toBeInTheDocument();
    expect(screen.getByText('Discrepancy')).toBeInTheDocument();
  });

  it('renders record checks grouped by category with status pills', () => {
    renderTab();
    expect(screen.getByText('Record Checks')).toBeInTheDocument();
    // role disambiguates the category header from the ROI form's item option
    expect(screen.getByRole('button', { name: /subject interview/i })).toBeInTheDocument();
    expect(screen.getByText('Financial record checks')).toBeInTheDocument();
    expect(screen.getByText('Foreign travel & contacts')).toBeInTheDocument();
    // provider-specific checks live inside categories, not as top-level rows
    expect(screen.queryByText('SAR registry query')).not.toBeInTheDocument();
    expect(screen.getAllByText('Complete').length).toBeGreaterThan(0);
  });

  it('groups multiple sources as table rows under one category', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /financial record checks/i }));
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('TransUnion')).toBeInTheDocument();
    expect(screen.getByText('FinCEN / Treasury')).toBeInTheDocument();
    expect(screen.getByText('$47,300 delinquent across five accounts.')).toBeInTheDocument();
    expect(screen.getByText('One SAR: structured remittances, Jan-Mar 2026.')).toBeInTheDocument();
  });

  it('cites and links the coverage-scope authorities for the record checks', () => {
    renderTab();
    expect(screen.getByRole('link', { name: /federal investigative standards/i }))
      .toHaveAttribute('href', expect.stringContaining('dcsa.mil'));
    expect(screen.getByRole('link', { name: 'SEAD 3' }))
      .toHaveAttribute('href', expect.stringContaining('dni.gov'));
    expect(screen.getByText(/\(T5\)/)).toBeInTheDocument(); // subject's tier
  });

  it('expands a record check to show source dates and result', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /financial record checks/i }));
    expect(screen.getByText('2026-03-10')).toBeInTheDocument();
    expect(screen.getByText('2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('$47,300 delinquent across five accounts.'))
      .toBeInTheDocument();
    expect(screen.getByText('TransUnion')).toBeInTheDocument();
  });

  it('opens the linked source document from an expanded record check', async () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /financial record checks/i }));
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(await screen.findByText(/Meridian Auto Finance/))
      .toBeInTheDocument();
  });

  it('checks without a document show no view button when expanded', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: /subject interview/i }));
    expect(screen.queryByRole('button', { name: 'View' }))
      .not.toBeInTheDocument();
  });

  it('investigator can add an ROI entry; it appears in the list', () => {
    renderTab('investigator');
    fireEvent.change(screen.getByLabelText('Coverage item'), { target: { value: 'Financial' } });
    fireEvent.change(screen.getByLabelText('Entry'), { target: { value: 'New lead resolved.' } });
    fireEvent.click(screen.getByRole('button', { name: /add roi entry/i }));
    expect(screen.getByText('New lead resolved.')).toBeInTheDocument();
  });

  it('non-investigator personas do not see the ROI form', () => {
    renderTab('adjudicator');
    expect(screen.queryByRole('button', { name: /add roi entry/i })).not.toBeInTheDocument();
  });
});
