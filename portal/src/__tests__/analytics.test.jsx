import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const ANALYTICS = {
  corpus: {
    totalCases: 36700,
    byOutcome: { GRANTED: 13200, DENIED: 19800, OTHER: 3700 },
    byYear: [{ year: 2020, granted: 1500, denied: 2100 }],
    byGuideline: [{ code: 'F', name: 'Financial Considerations', cases: 15000, deniedPct: 61.5 }],
    byCaseType: { hearing: 28650, appeal: 8050 },
  },
  pipeline: {
    timeliness: [{ stage: 'Investigation', avgDays: 73, targetDays: 90 }],
    alertVolume: [{ category: 'FINANCIAL', count: 2 }],
    triageDistribution: [{ band: 'low', count: 9 }],
  },
};

vi.mock('../data/api.js', () => ({
  getAnalytics: () => Promise.resolve(ANALYTICS),
}));

import Analytics from '../pages/Analytics.jsx';

describe('Analytics', () => {
  it('renders corpus KPIs from real DOHA aggregates', async () => {
    render(<MemoryRouter><Analytics /></MemoryRouter>);
    expect(await screen.findByText('36,700')).toBeInTheDocument();
    expect(screen.getByText('19,800')).toBeInTheDocument();
  });

  it('renders the three chart sections', async () => {
    render(<MemoryRouter><Analytics /></MemoryRouter>);
    await screen.findByText('36,700');
    expect(screen.getByText('Cases by Guideline')).toBeInTheDocument();
    expect(screen.getByText('Outcomes by Year')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Timeliness')).toBeInTheDocument();
  });
});
