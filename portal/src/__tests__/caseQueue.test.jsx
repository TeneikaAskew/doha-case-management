import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { SUBJECTS } from './fixtures.js';

vi.mock('../data/api.js', () => ({
  getSubjects: () => Promise.resolve(SUBJECTS),
}));

import CaseQueue from '../pages/CaseQueue.jsx';

function renderQueue(initial = '/cases') {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter initialEntries={[initial]}><CaseQueue /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('CaseQueue', () => {
  it('defaults to the persona stage filter (adjudicator → Adjudication)', async () => {
    renderQueue();
    expect(await screen.findByText('Daniel R. Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Priya N. Shah')).not.toBeInTheDocument();
  });

  it('shows all subjects when stage filter cleared', async () => {
    renderQueue();
    await screen.findByText('Daniel R. Okafor');
    fireEvent.change(screen.getByLabelText('Stage'), { target: { value: 'ALL' } });
    expect(screen.getByText('Priya N. Shah')).toBeInTheDocument();
    expect(screen.getByText('Marcus T. Bell')).toBeInTheDocument();
  });

  it('applies ?q= search filter across all stages', async () => {
    renderQueue('/cases?q=shah');
    expect(await screen.findByText('Priya N. Shah')).toBeInTheDocument();
    expect(screen.queryByText('Daniel R. Okafor')).not.toBeInTheDocument();
  });

  it('renders status pills and guideline chips', async () => {
    renderQueue('/cases?q=okafor');
    await screen.findByText('Daniel R. Okafor');
    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('searching while already on the queue clears the stage filter', async () => {
    localStorage.setItem('demo.persona', 'adjudicator');
    function Harness() {
      const navigate = useNavigate();
      return (
        <>
          <button onClick={() => navigate('/cases?q=shah')}>go-search</button>
          <CaseQueue />
        </>
      );
    }
    render(
      <PersonaProvider><DemoProvider>
        <MemoryRouter initialEntries={['/cases']}>
          <Routes><Route path="/cases" element={<Harness />} /></Routes>
        </MemoryRouter>
      </DemoProvider></PersonaProvider>
    );
    expect(await screen.findByText('Daniel R. Okafor')).toBeInTheDocument();
    fireEvent.click(screen.getByText('go-search'));
    expect(await screen.findByText('Priya N. Shah')).toBeInTheDocument();
  });
});
