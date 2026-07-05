import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PersonaProvider } from '../state/PersonaContext.jsx';
import { DemoProvider } from '../state/DemoContext.jsx';
import AskCaseTab from '../pages/case/AskCaseTab.jsx';
import { CASE_001 } from './fixtures.js';

function renderTab() {
  return render(
    <PersonaProvider><DemoProvider>
      <MemoryRouter><AskCaseTab caseData={CASE_001} /></MemoryRouter>
    </DemoProvider></PersonaProvider>
  );
}

beforeEach(() => localStorage.clear());

describe('AskCaseTab', () => {
  it('shows example questions, an input, and the simulation disclaimer', () => {
    renderTab();
    expect(screen.getByText(/Why is this case flagged under Guideline F/))
      .toBeInTheDocument();
    expect(screen.getByLabelText(/ask about this case/i)).toBeInTheDocument();
    expect(screen.getByText(/answers come only from this case file/i))
      .toBeInTheDocument();
  });

  it('answers an example question with cited sources when clicked', async () => {
    renderTab();
    fireEvent.click(screen.getByText(/Why is this case flagged under Guideline F/));
    // user bubble appears immediately
    expect(screen.getByText('Why is this case flagged under Guideline F (Financial Considerations)?'))
      .toBeInTheDocument();
    // assistant answer is grounded in guideline content, with a citation chip
    expect(await screen.findByText(/AG ¶ 19\(a\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guideline F - Financial Considerations/ }))
      .toBeInTheDocument();
  });

  it('answers a typed question submitted through the form', async () => {
    renderTab();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    expect(await screen.findByText(/\$47,300/)).toBeInTheDocument();
  });

  it('labels the engine as simulated when no Gemini key is configured', () => {
    renderTab();
    expect(screen.getByText(/simulated/i)).toBeInTheDocument();
  });

  it('persists the conversation across unmount and remount', async () => {
    const first = renderTab();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await screen.findByText(/\$47,300/);
    first.unmount();
    renderTab();
    expect(screen.getByText('How much delinquent debt does he have?')).toBeInTheDocument();
    expect(screen.getByText(/\$47,300/)).toBeInTheDocument();
  });

  it('shows a disabled Use Gemini toggle with a key hint when no key is set', () => {
    renderTab();
    const toggle = screen.getByLabelText(/use gemini/i);
    expect(toggle).toBeDisabled();
    expect(screen.getByText(/VITE_GEMINI_API_KEY/)).toBeInTheDocument();
  });

  it('clears the conversation from the trash button', async () => {
    renderTab();
    expect(screen.queryByRole('button', { name: /clear conversation/i }))
      .not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await screen.findByText(/\$47,300/);
    fireEvent.click(screen.getByRole('button', { name: /clear conversation/i }));
    expect(screen.queryByText(/\$47,300/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear conversation/i }))
      .not.toBeInTheDocument();
    // empty state returns
    expect(screen.getByText(/Why is this case flagged under Guideline F/))
      .toBeInTheDocument();
  });
});
