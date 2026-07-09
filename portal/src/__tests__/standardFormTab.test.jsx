import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StandardFormTab from '../pages/case/StandardFormTab.jsx';

const CASE = {
  standardForm: {
    formVersion: 'SF-86 (Nov 2016), PVQ transition',
    submitted: '2025-09-08',
    status: 'Released to DCSA via eApp',
    sections: [
      { section: 'Section 1', title: 'Full Name', questions: [
        { number: '1.1', question: 'Provide your full legal name.',
          answer: 'Daniel R. Okafor', detail: null, flagged: false },
      ] },
      { section: 'Section 22', title: 'Police Record', questions: [
        { number: '22.1',
          question: 'In the last 7 years, have you been arrested?',
          answer: 'No', detail: null, flagged: false },
      ] },
      { section: 'Section 26', title: 'Financial Record', questions: [
        { number: '26.1',
          question: 'Are you currently over 120 days delinquent on any debt?',
          answer: 'Yes',
          detail: 'Reported $18,900; verification shows $47,300.',
          flagged: true },
      ] },
      { section: 'Section 18', title: 'Relatives', questions: [
        { number: '18.1', question: 'Provide your relatives.',
          answer: '2 relatives', detail: null, flagged: false,
          table: {
            rowKey: 'name',
            columns: [
              { key: 'relationship', label: 'Relationship' },
              { key: 'name', label: 'Name' },
              { key: 'residence', label: 'Country of residence' },
            ],
            rows: [
              { relationship: 'Mother', name: 'Ngozi Okafor',
                residence: 'Lagos, Nigeria' },
              { relationship: 'Spouse', name: 'Amara O. Okafor',
                residence: 'Manassas, VA, USA' },
            ],
          } },
      ] },
    ],
  },
};

describe('StandardFormTab', () => {
  it('opens Section 1 by default and keeps the rest collapsed', () => {
    render(<StandardFormTab caseData={CASE} />);
    expect(screen.getByText('Standard Form (SF-86 / PVQ)')).toBeInTheDocument();
    expect(screen.getByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText(/have you been arrested/i)).not.toBeInTheDocument();
  });

  it('expands and collapses a section on click', () => {
    render(<StandardFormTab caseData={CASE} />);
    fireEvent.click(screen.getByRole('button', { name: /Section 22/ }));
    expect(screen.getByText(/have you been arrested/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Section 22/ }));
    expect(screen.queryByText(/have you been arrested/i)).not.toBeInTheDocument();
  });

  it('marks flagged sections and explains the flagged answer', () => {
    render(<StandardFormTab caseData={CASE} />);
    // collapsed section still shows its flag count in the header
    expect(screen.getByText('1 flagged')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Section 26/ }));
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText(/verification shows \$47,300/)).toBeInTheDocument();
  });

  it('renders a structured list answer as a table', () => {
    render(<StandardFormTab caseData={CASE} />);
    fireEvent.click(screen.getByRole('button', { name: /Section 18/ }));
    // column headers and row values from the table both render
    expect(screen.getByText('Country of residence')).toBeInTheDocument();
    expect(screen.getByText('Ngozi Okafor')).toBeInTheDocument();
    expect(screen.getByText('Lagos, Nigeria')).toBeInTheDocument();
    expect(screen.getByText('Amara O. Okafor')).toBeInTheDocument();
  });

  it('handles a case without a form', () => {
    render(<StandardFormTab caseData={{}} />);
    expect(screen.getByText(/no standard form on file/i)).toBeInTheDocument();
  });
});
