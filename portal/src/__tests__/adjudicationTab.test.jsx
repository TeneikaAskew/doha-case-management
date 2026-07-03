import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import AdjudicationTab from '../pages/case/AdjudicationTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab(personaId = 'adjudicator') {
  localStorage.setItem('demo.persona', personaId);
  return render(
    <PersonaProvider><DemoProvider>
      <AdjudicationTab caseData={CASE_001} />
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('AdjudicationTab', () => {
  it('shows the AI recommendation with action label', () => {
    renderTab();
    expect(screen.getByText(/Unmitigated F concerns/)).toBeInTheDocument();
    const allHeadings = screen.getAllByText(/Statement of Reasons/);
    expect(allHeadings.length).toBeGreaterThan(0);
  });

  it('shows the guideline weighing table and whole-person worksheet', () => {
    renderTab();
    expect(screen.getByText('Financial Considerations')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes('Frequency and recency') && element.tagName === 'STRONG';
    })).toBeInTheDocument();
  });

  it('adjudicator records a decision and it appears in history', () => {
    renderTab('adjudicator');
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: 'LOI' } });
    fireEvent.change(screen.getByLabelText('Rationale'),
      { target: { value: 'Request subject response first.' } });
    fireEvent.click(screen.getByRole('button', { name: /record decision/i }));
    expect(screen.getByText(/Request subject response first/)).toBeInTheDocument();
  });

  it('non-adjudicator personas do not see the decision form', () => {
    renderTab('analyst');
    expect(screen.queryByRole('button', { name: /record decision/i })).not.toBeInTheDocument();
  });
});
