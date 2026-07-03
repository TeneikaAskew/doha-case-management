import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

describe('Sign-in gate', () => {
  it('renders the consent banner when signed out, with no app shell', () => {
    render(<App />);
    expect(screen.getByText('Standard Mandatory DoD Notice and Consent')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Subjects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset demo' })).not.toBeInTheDocument();
  });

  it('signs in on click and renders the app shell, persisting to localStorage', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /accept conditions and sign in/i }));
    expect(screen.getByRole('link', { name: 'Subjects' })).toBeInTheDocument();
    expect(localStorage.getItem('demo.session')).toBe('active');
  });

  it('renders the app directly when a session is already active', () => {
    localStorage.setItem('demo.session', 'active');
    render(<App />);
    expect(screen.queryByText('Standard Mandatory DoD Notice and Consent')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Subjects' })).toBeInTheDocument();
  });
});
