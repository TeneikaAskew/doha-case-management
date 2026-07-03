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

  it('renders full subject information with demographics', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('Subject information')).toBeInTheDocument();
    expect(screen.getByText('923-04-4821')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Nigeria')).toBeInTheDocument();
    expect(screen.getByText('United States (naturalized 2003)')).toBeInTheDocument();
    expect(screen.getByText("6' 1\"")).toBeInTheDocument();
    expect(screen.getByText('Brown')).toBeInTheDocument();   // eye color
    expect(screen.getByText('Married')).toBeInTheDocument();
    expect(screen.getByText('(703) 555-0142')).toBeInTheDocument();
  });

  it('renders address and employment history tables', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('Address history')).toBeInTheDocument();
    expect(screen.getByText('7605 Sudley Rd Apt 214, Manassas, VA 20109')).toBeInTheDocument();
    expect(screen.getByText('2019-08 — Present')).toBeInTheDocument();
    expect(screen.getByText('Employment history')).toBeInTheDocument();
    expect(screen.getByText('Sentinel Dynamics LLC')).toBeInTheDocument();
    expect(screen.getByText('Praxis Federal Solutions')).toBeInTheDocument();
    expect(screen.getByText('2013-01 — 2018-02')).toBeInTheDocument();
  });
});
