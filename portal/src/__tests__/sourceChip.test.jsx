import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../data/api.js', () => ({
  getProviders: () => Promise.resolve([
    { id: 'transunion', name: 'TransUnion', category: 'Credit bureau (CV provider)' },
    { id: 'fbi-cjis', name: 'FBI CJIS / NCIC + Rap Back', category: 'Criminal history' },
  ]),
}));

import SourceChip from '../components/SourceChip.jsx';

describe('SourceChip', () => {
  it('links a known provider to the providers page with its category as title', async () => {
    render(<MemoryRouter><SourceChip provider="TransUnion" /></MemoryRouter>);
    const link = await screen.findByRole('link', { name: /TransUnion/ });
    expect(link.getAttribute('href')).toContain('/providers');
    expect(link).toHaveAttribute('title', 'Credit bureau (CV provider)');
  });

  it('resolves aliases like FBI Rap Back to the canonical provider', async () => {
    render(<MemoryRouter><SourceChip provider="FBI Rap Back" /></MemoryRouter>);
    const link = await screen.findByRole('link', { name: /FBI Rap Back/ });
    expect(link).toHaveAttribute('title', 'Criminal history');
  });

  it('renders unknown sources as a plain chip', async () => {
    render(<MemoryRouter><SourceChip provider="DCSA field operations" /></MemoryRouter>);
    expect(await screen.findByText('DCSA field operations')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
