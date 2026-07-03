import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Help from '../pages/Help.jsx';

describe('Help', () => {
  it('renders the app breakdown, scoring, legends, and FAQ sections', () => {
    render(<Help />);
    expect(screen.getByText('The App at a Glance')).toBeInTheDocument();
    expect(screen.getByText('How Scoring Works')).toBeInTheDocument();
    expect(screen.getByText('Labels and Legends')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
  });

  it('legend renders the true label components with their variants', () => {
    render(<Help />);
    const actionRequired = screen.getByText('Action Required');
    expect(actionRequired).toHaveClass('status-badge', 'error');
    const adjudicated = screen.getByText('Adjudicated');
    expect(adjudicated).toHaveClass('status-badge', 'success');
    const newState = screen.getByText('New');
    expect(newState).toHaveClass('status-badge', 'neutral');
  });

  it('documents the risk bands with thresholds', () => {
    render(<Help />);
    expect(screen.getByText('Low (0-39)')).toBeInTheDocument();
    expect(screen.getByText('Moderate (40-74)')).toBeInTheDocument();
    expect(screen.getByText('High (75-100)')).toBeInTheDocument();
  });

  it('lists all 13 SEAD-4 guidelines', () => {
    render(<Help />);
    expect(screen.getByText('Financial Considerations')).toBeInTheDocument();
    expect(screen.getByText('Allegiance to the United States')).toBeInTheDocument();
    expect(screen.getByText('Use of Information Technology')).toBeInTheDocument();
  });

  it('answers FAQ items in expandable rows', () => {
    render(<Help />);
    expect(screen.getByText('Is any of this data real?')).toBeInTheDocument();
    expect(screen.getByText('Why are alert states gray?')).toBeInTheDocument();
    expect(screen.getByText(/The only real data is the DOHA decision corpus/))
      .toBeInTheDocument();
  });

  it('cites the governing authorities with links', () => {
    render(<Help />);
    expect(screen.getByRole('link', { name: /SEAD 4/ }))
      .toHaveAttribute('href', expect.stringContaining('dni.gov'));
    expect(screen.getByRole('link', { name: /Federal Investigative Standards/ }))
      .toHaveAttribute('href', expect.stringContaining('dcsa.mil'));
  });
});
