import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { ALERTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getAlerts: () => Promise.resolve(ALERTS),
}));

import CVAlerts from '../pages/CVAlerts.jsx';

function renderPage() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><CVAlerts /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CVAlerts', () => {
  it('renders KPI cards and the alert table', async () => {
    renderPage();
    expect(await screen.findByText('Open alerts')).toBeInTheDocument();
    const row = screen.getByText('Daniel R. Okafor').closest('tr');
    expect(within(row).getByText('Financial')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderPage();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'CRIMINAL' } });
    expect(screen.queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no alerts/i })).toBeInTheDocument();
  });
});
