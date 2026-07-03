import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve({}),
  getProviders: () => Promise.resolve([]),
}));

import OverviewTab from '../pages/case/OverviewTab.jsx';

const render = (ui) => rtlRender(
  <PersonaProvider><DemoProvider>
    <MemoryRouter>{ui}</MemoryRouter>
  </DemoProvider></PersonaProvider>
);

describe('OverviewTab', () => {
  it('renders a CV alert summary card with a Financial count for a subject with alerts', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('CV Alert Summary')).toBeInTheDocument();
    expect(screen.getByText('Financial')).toBeInTheDocument();
    const card = screen.getByText('Financial').closest('.alert-summary-card');
    expect(within(card).getByText('1')).toBeInTheDocument();
  });

  it('renders no CV alert summary card for a subject with no alerts', () => {
    render(<OverviewTab caseData={{ ...CASE_001, alerts: [] }} />);
    expect(screen.queryByText('CV Alert Summary')).not.toBeInTheDocument();
  });

  it('renders full subject information with demographics', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('Subject Information')).toBeInTheDocument();
    expect(screen.getByText('923-04-4821')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Nigeria')).toBeInTheDocument();
    expect(screen.getByText('United States (naturalized 2003)')).toBeInTheDocument();
    expect(screen.getByText('American')).toBeInTheDocument();   // nationality
    expect(screen.getByText("6' 1\"")).toBeInTheDocument();
    expect(screen.getByText('Brown')).toBeInTheDocument();      // eye color
    expect(screen.getByText('Married')).toBeInTheDocument();
    expect(screen.getByText('(703) 555-0142')).toBeInTheDocument();
  });

  it('renders address history with per-entry start and end dates', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('Address History')).toBeInTheDocument();
    expect(screen.getByText('7605 Sudley Rd Apt 214, Manassas, VA 20109')).toBeInTheDocument();
    expect(screen.getAllByText('2019-08').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Present').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('2014-06').length).toBeGreaterThanOrEqual(1);
  });

  it('renders employment history with role, employer address, and dates', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getByText('Employment History')).toBeInTheDocument();
    expect(screen.getByText('Sentinel Dynamics LLC')).toBeInTheDocument();
    expect(screen.getByText('Senior Systems Engineer')).toBeInTheDocument();
    expect(screen.getByText('14840 Conference Center Dr Suite 300, Chantilly, VA 20151'))
      .toBeInTheDocument();
    expect(screen.getByText('Praxis Federal Solutions')).toBeInTheDocument();
    expect(screen.getByText('11951 Freedom Dr Suite 900, Reston, VA 20190'))
      .toBeInTheDocument();
    expect(screen.getByText('2013-01')).toBeInTheDocument();
    expect(screen.getAllByText('2018-02').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a horizontal timeline strip with events in date order', () => {
    const twoEvents = { ...CASE_001,
      timeline: [
        { date: '2026-06-01', actor: 'B. Late', role: 'Analyst',
          event: 'Second event', note: null },
        { date: '2026-01-27', actor: 'S. Whitfield', role: 'Investigator',
          event: 'First event', note: 'Financial issues flagged' },
      ] };
    const { container } = render(<OverviewTab caseData={twoEvents} />);
    expect(screen.getByText('Case Timeline')).toBeInTheDocument();
    const items = container.querySelectorAll('.timeline-strip-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('First event');
    expect(items[1].textContent).toContain('Second event');
  });

  it('expands the full vertical timeline detail on demand', () => {
    render(<OverviewTab caseData={CASE_001} />);
    expect(screen.getAllByText('ROI transmitted')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /show full detail/i }));
    expect(screen.getAllByText('ROI transmitted')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /hide full detail/i }));
    expect(screen.getAllByText('ROI transmitted')).toHaveLength(1);
  });
});
