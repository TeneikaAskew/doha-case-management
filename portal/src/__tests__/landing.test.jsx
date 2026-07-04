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
    expect(screen.getByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).toBeInTheDocument();
    expect(screen.queryByText('About This Demo')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Subjects' })).not.toBeInTheDocument();
  });

  it('renders stats, capabilities, personas, and the demo disclaimer', () => {
    render(<App />);
    expect(screen.getByText('33,610')).toBeInTheDocument();
    expect(screen.getByText('Real DOHA Decisions')).toBeInTheDocument();
    expect(screen.getByText('Whole-Person File')).toBeInTheDocument();
    expect(screen.getByText('AI Assists. People Decide.')).toBeInTheDocument();
    expect(screen.getByText('Adjudicator')).toBeInTheDocument();
    expect(screen.getByText(/all identities are fictional/i)).toBeInTheDocument();
  });

  it('Sign In reveals the SSO card and Back returns to the landing', () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole('button', { name: /sign in/i })[0]);
    expect(screen.getByText('About This Demo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /back to overview/i }));
    expect(screen.getByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).toBeInTheDocument();
  });

  it('signed-in sessions bypass the landing entirely', () => {
    localStorage.setItem('demo.session', 'active');
    render(<App />);
    expect(screen.queryByRole('heading',
      { name: 'One Person. One File. Every Fact Sourced.' })).not.toBeInTheDocument();
  });
});
