import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import { CASE_001 } from './fixtures.js';

vi.mock('../pages/case/caseAgent.js', () => ({
  configuredApiKey: () => 'test-key',
  answerQuestion: vi.fn(() => Promise.resolve({
    answer: 'Grounded answer.', citations: [], engine: 'gemini',
  })),
}));

import AskCaseTab from '../pages/case/AskCaseTab.jsx';
import { answerQuestion } from '../pages/case/caseAgent.js';

function renderTab() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><AskCaseTab caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  answerQuestion.mockClear();
});

describe('AskCaseTab Gemini toggle (key configured)', () => {
  it('defaults on and asks with the configured key', async () => {
    renderTab();
    const toggle = screen.getByLabelText(/use gemini/i);
    expect(toggle).toBeEnabled();
    expect(toggle).toBeChecked();
    fireEvent.click(screen.getByText(/What did the interviews establish/));
    await screen.findByText('Grounded answer.');
    expect(answerQuestion.mock.calls[0][2].apiKey).toBe('test-key');
  });

  it('turning it off forces the simulated engine', async () => {
    renderTab();
    fireEvent.click(screen.getByLabelText(/use gemini/i));
    fireEvent.click(screen.getByText(/What did the interviews establish/));
    await screen.findByText('Grounded answer.');
    expect(answerQuestion.mock.calls[0][2].apiKey).toBe('');
    // preference persists
    expect(localStorage.getItem('demo.useGemini')).toBe('off');
  });
});
