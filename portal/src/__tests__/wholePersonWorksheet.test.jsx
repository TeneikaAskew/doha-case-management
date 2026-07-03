import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve({
    docType: 'CREDIT_REPORT', title: 'Meridian Auto Finance',
    provider: 'TransUnion', receivedDate: '2026-06-20', subjectId: 'SUBJ-001',
    fields: [{ label: 'Balance', value: '$12,400' }], sections: [], transactions: [],
  }),
  getProviders: () => Promise.resolve([]),
}));

import WholePersonWorksheet from '../pages/case/WholePersonWorksheet.jsx';

function renderSheet(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><WholePersonWorksheet caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('WholePersonWorksheet', () => {
  it('shows the bottom-line summary and each factor assessment up front', () => {
    renderSheet();
    expect(screen.getByText('Bottom line')).toBeInTheDocument();
    expect(screen.getByText(/Sustained delinquency compounded by incomplete/))
      .toBeInTheDocument();
    expect(screen.getByText('Nature & seriousness')).toBeInTheDocument();
    expect(screen.getByText(/Sustained delinquency; serious\./)).toBeInTheDocument();
  });

  it('shows evidence chips without expanding a factor', () => {
    renderSheet();
    expect(screen.getByText('New collection account alert')).toBeInTheDocument();
  });

  it('opens document evidence inline', async () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button',
      { name: /TransUnion credit-file extract/i }));
    expect(await screen.findByText(/Meridian Auto Finance/)).toBeInTheDocument();
  });

  it('adjudicator expands a factor, rates it, and the tally updates', () => {
    renderSheet('adjudicator');
    fireEvent.click(screen.getByRole('button',
      { name: /nature, extent, and seriousness/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Concern' }));
    expect(screen.getByText('1 concern')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('demo.state'))
      .worksheetRatings['SUBJ-001'][0].rating).toBe('CONCERN');
  });

  it('non-adjudicator personas see no rating controls', () => {
    renderSheet('investigator');
    expect(screen.queryByRole('button',
      { name: /nature, extent, and seriousness/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Concern' })).not.toBeInTheDocument();
  });
});
