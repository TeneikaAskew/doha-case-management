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

  it('deletes a conversation from the sidebar and returns to the empty state', async () => {
    renderTab();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await screen.findByText(/\$47,300/);
    // the first turn creates a conversation listed in the sidebar
    fireEvent.click(screen.getByRole('button', { name: /delete conversation 1/i }));
    expect(screen.queryByText(/\$47,300/)).not.toBeInTheDocument();
    // empty state returns
    expect(screen.getByText(/Why is this case flagged under Guideline F/))
      .toBeInTheDocument();
  });

  it('keeps separate threads for separate conversations', async () => {
    renderTab();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await screen.findByText(/\$47,300/);

    // start a fresh conversation - its thread is empty
    fireEvent.click(screen.getByRole('button', { name: /new conversation/i }));
    expect(screen.queryByText(/\$47,300/)).not.toBeInTheDocument();
    expect(screen.getByText(/Why is this case flagged under Guideline F/))
      .toBeInTheDocument();

    // switching back to the first conversation restores its answer
    fireEvent.click(screen.getByRole('button', { name: /^conversation 1$/i }));
    expect(screen.getByText(/\$47,300/)).toBeInTheDocument();
  });

  it('renames a conversation from the sidebar', async () => {
    renderTab();
    fireEvent.change(screen.getByLabelText(/ask about this case/i),
      { target: { value: 'How much delinquent debt does he have?' } });
    fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));
    await screen.findByText(/\$47,300/);
    fireEvent.click(screen.getByRole('button', { name: /rename conversation 1/i }));
    const field = screen.getByLabelText(/rename conversation/i);
    fireEvent.change(field, { target: { value: 'Finances' } });
    fireEvent.submit(field);
    expect(screen.getByRole('button', { name: /^finances$/i })).toBeInTheDocument();
  });

  it('collapses and expands the conversation panel', () => {
    renderTab();
    expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /hide conversations/i }));
    expect(screen.queryByRole('button', { name: /new conversation/i }))
      .not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show conversations/i }));
    expect(screen.getByRole('button', { name: /new conversation/i })).toBeInTheDocument();
  });
});
