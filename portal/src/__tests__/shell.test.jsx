import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('AppShell', () => {
  it('renders header, sidebar links, and dashboard route', () => {
    render(<App />);
    expect(screen.getByText('Personnel Vetting')).toBeInTheDocument();
    for (const label of ['Dashboard', 'Case queue', 'CV alerts', 'Data providers', 'Analytics']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('switches persona via the header select', () => {
    render(<App />);
    const select = screen.getByLabelText('Persona');
    fireEvent.change(select, { target: { value: 'investigator' } });
    expect(select.value).toBe('investigator');
    expect(localStorage.getItem('demo.persona')).toBe('investigator');
  });

  it('unknown route shows NotFound', () => {
    window.location.hash = '#/nope';
    render(<App />);
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
