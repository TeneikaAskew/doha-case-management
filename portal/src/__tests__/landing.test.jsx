import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('Landing page', () => {
  it('shows the landing to signed-out visitors, not the SSO card or app shell', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toMatch(/with confidence/i);
    expect(screen.queryByText('About This Demo')).not.toBeInTheDocument();
    // "Subjects" also appears as a footer nav-column link on the landing page
    // itself, so check for the app shell's own header brand instead.
    expect(screen.queryByText('Personnel Vetting')).not.toBeInTheDocument();
  });

  it('renders stats, John Smith, and the demo disclaimer', () => {
    render(<App />);
    expect(screen.getByText('Vetting at scale')).toBeInTheDocument();
    expect(screen.getByText('33,610')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText(/all identities are fictional/i)).toBeInTheDocument();
  });

  it('persona tabs switch panels', () => {
    render(<App />);
    // Investigator panel shows by default
    expect(screen.getByText(/coverage that doesn't make you choose/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Analyst' }));
    expect(screen.getByText('Alerts that arrive validated, not just detected')).toBeInTheDocument();
    expect(screen.queryByText(/coverage that doesn't make you choose/i)).not.toBeInTheDocument();
  });

  it('Sign In reveals the SSO card and Back returns to the landing', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
    expect(screen.getByText('About This Demo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to overview/i }));
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toMatch(/with confidence/i);
  });

  it('signed-in sessions bypass the landing entirely', () => {
    localStorage.setItem('demo.session', 'active');
    render(<App />);
    const headings = screen.queryAllByRole('heading', { level: 1 })
      .filter((h) => /with confidence/i.test(h.textContent));
    expect(headings).toHaveLength(0);
    expect(screen.queryByText('About This Demo')).not.toBeInTheDocument();
  });

  it('footer section links never touch the URL hash the HashRouter reads', () => {
    render(<App />);
    window.location.hash = '#/';
    fireEvent.click(screen.getByRole('button', { name: 'Case Queue' }));
    expect(window.location.hash).toBe('#/');
  });
});
