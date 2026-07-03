import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import OverviewTab from '../pages/case/OverviewTab.jsx';
import { CASE_001 } from './fixtures.js';

describe('OverviewTab', () => {
  it('renders a CV alert summary card with a Financial count for a subject with alerts', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('CV alert summary')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
    const card = screen.getByText('Financial').closest('.alert-summary-card');
    expect(within(card).getByText('1')).toBeInTheDocument();
  });

  it('renders no CV alert summary card for a subject with no alerts', () => {
    render(<OverviewTab caseData={{ ...CASE_001, alerts: [] }} />);
    expect(screen.queryByText('CV alert summary')).not.toBeInTheDocument();
  });
});
