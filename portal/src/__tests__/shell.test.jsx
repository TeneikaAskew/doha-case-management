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
    for (const label of ['Subjects', 'Dashboard', 'Case queue', 'CV alerts',
      'Data providers', 'Analytics']) {
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

  it('toggles sidebar collapse state and persists it to localStorage', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Toggle sidebar' });
    const nav = screen.getByRole('link', { name: 'Subjects' }).closest('nav');

    fireEvent.click(toggle);
    expect(localStorage.getItem('demo.sidebar')).toBe('collapsed');
    expect(nav.className).toContain('collapsed');

    fireEvent.click(toggle);
    expect(localStorage.getItem('demo.sidebar')).toBe('expanded');
    expect(nav.className).not.toContain('collapsed');
  });
});
