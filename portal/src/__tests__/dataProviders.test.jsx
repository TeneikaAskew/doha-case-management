import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const PROVIDERS = [
  { id: 'fbi-cjis', name: 'FBI CJIS / NCIC + Rap Back', category: 'Criminal history',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['J', 'D', 'G', 'H'],
    status: 'HEALTHY', recordCount: 84210556, lastSync: '2026-07-02T06:00:00Z' },
  { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)',
    usedIn: ['INVESTIGATION', 'CV'], guidelines: ['F'],
    status: 'DEGRADED', recordCount: 23910287, lastSync: '2026-07-02T06:00:00Z' },
];

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve(PROVIDERS),
}));

import DataProviders from '../pages/DataProviders.jsx';

describe('DataProviders', () => {
  it('renders provider cards with status and record counts', async () => {
    render(<MemoryRouter><DataProviders /></MemoryRouter>);
    const names = await screen.findAllByText('FBI CJIS / NCIC + Rap Back');
    expect(names.length > 0).toBe(true);
    expect(screen.getByText('84,210,556')).toBeInTheDocument();
    expect(screen.getByText('DEGRADED')).toBeInTheDocument();
  });

  it('renders the provider-to-guideline coverage matrix', async () => {
    render(<MemoryRouter><DataProviders /></MemoryRouter>);
    await screen.findAllByText('FBI CJIS / NCIC + Rap Back');
    const matrix = screen.getByRole('table', { name: /guideline coverage/i });
    expect(matrix).toBeInTheDocument();
    const fbiRow = screen.getAllByRole('row')
      .find((r) => r.textContent.includes('FBI CJIS'));
    expect(fbiRow.textContent).toContain('●');
  });
});
