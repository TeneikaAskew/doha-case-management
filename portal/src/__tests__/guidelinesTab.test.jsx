import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GuidelinesTab from '../pages/case/GuidelinesTab.jsx';
import { CASE_001 } from './fixtures.js';

describe('GuidelinesTab', () => {
  it('renders a section per guideline with severity badge', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    expect(screen.getByText('F - Financial Considerations')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument(); // severity badge
  });

  it('shows disqualifiers, mitigators, evidence, and precedents in the open first section', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    expect(screen.getByText('AG ¶ 19(a)')).toBeInTheDocument();
    expect(screen.getByText('AG ¶ 20(b)')).toBeInTheDocument();
    expect(screen.getByText('PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('$47,300 delinquent across 5 accounts')).toBeInTheDocument();
    expect(screen.getByText('20-01001')).toBeInTheDocument();
    expect(screen.getByText('DENIED')).toBeInTheDocument();
  });

  it('renders the precedent case number as an external link to the official decision', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    expect(screen.getByRole('link', { name: /20-01001/ }))
      .toHaveAttribute('href', 'https://doha.example/2021-ISCR-Hearing-Decisions/FileId/111111/');
  });

  it('collapses the first section when its header is clicked', () => {
    render(<GuidelinesTab caseData={CASE_001} />);
    fireEvent.click(screen.getByRole('button', { name: /financial considerations/i }));
    expect(screen.queryByText('AG ¶ 19(a)')).not.toBeInTheDocument();
  });

  it('renders empty state when no guidelines flagged', () => {
    render(<GuidelinesTab caseData={{ ...CASE_001, guidelines: [] }} />);
    expect(screen.getByText(/no adjudicative guidelines/i)).toBeInTheDocument();
  });
});
