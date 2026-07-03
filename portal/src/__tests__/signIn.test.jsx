import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Test-only hash (sha256 of 'test-pass'); the real hash ships in accessControl.js
vi.mock('../accessControl.js', async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod,
    PASSWORD_SHA256: '661ea2edce1d4894ab62edb966f83c890f6c90399109e3826193461ce333b5e1' };
});

import App from '../App.jsx';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});

const typePassword = (value) =>
  fireEvent.change(screen.getByLabelText('Access password'), { target: { value } });

describe('Sign-in gate', () => {
  it('renders the consent banner and password field when signed out, with no app shell', () => {
    render(<App />);
    expect(screen.getByText('Standard Mandatory DoD Notice and Consent')).toBeInTheDocument();
    expect(screen.getByLabelText('Access password')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Subjects' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reset demo' })).not.toBeInTheDocument();
  });

  it('rejects a wrong password and stays gated', async () => {
    render(<App />);
    typePassword('wrong-password');
    fireEvent.click(screen.getByRole('button', { name: /accept conditions and sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect access password/i);
    expect(screen.queryByRole('link', { name: 'Subjects' })).not.toBeInTheDocument();
    expect(localStorage.getItem('demo.session')).toBeNull();
  });

  it('signs in with the correct password and persists the session', async () => {
    render(<App />);
    typePassword('test-pass');
    fireEvent.click(screen.getByRole('button', { name: /accept conditions and sign in/i }));
    expect(await screen.findByRole('link', { name: 'Subjects' })).toBeInTheDocument();
    expect(localStorage.getItem('demo.session')).toBe('active');
  });

  it('renders the app directly when a session is already active', () => {
    localStorage.setItem('demo.session', 'active');
    render(<App />);
    expect(screen.queryByText('Standard Mandatory DoD Notice and Consent')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Subjects' })).toBeInTheDocument();
  });
});
