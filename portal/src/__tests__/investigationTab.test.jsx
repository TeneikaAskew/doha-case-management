import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import InvestigationTab from '../pages/case/InvestigationTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab(personaId = 'investigator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <InvestigationTab caseData={CASE_001} />
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('InvestigationTab', () => {
  it('renders self-report vs matched result with discrepancy flag', () => {
    renderTab();
    expect(screen.getByText('Two delinquent accounts totaling about $9,000')).toBeInTheDocument();
    expect(screen.getByText('Five delinquent accounts totaling $47,300')).toBeInTheDocument();
    expect(screen.getByText('Discrepancy')).toBeInTheDocument();
  });

  it('renders coverage checklist with status pills', () => {
    renderTab();
    expect(screen.getByText('Subject interview (ESI)')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
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
