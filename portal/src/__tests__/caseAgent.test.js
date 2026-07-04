import { describe, it, expect, vi } from 'vitest';
import { answerQuestion, GEMINI_MODEL } from '../pages/case/caseAgent.js';
import { CASE_001 } from './fixtures.js';

const geminiOk = (text) => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    candidates: [{ content: { parts: [{ text }] } }],
  }),
});

describe('answerQuestion', () => {
  it('grounds Gemini with retrieved passages and returns its text', async () => {
    const fetchImpl = vi.fn(() => geminiOk('The subject owes $47,300 across five accounts.'));
    const res = await answerQuestion(CASE_001, 'How much delinquent debt?', {
      apiKey: 'test-key', fetchImpl,
    });
    expect(res.engine).toBe('gemini');
    expect(res.answer).toBe('The subject owes $47,300 across five accounts.');
    // still cites the retrieved passages
    expect(res.citations.length).toBeGreaterThanOrEqual(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain(GEMINI_MODEL);
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    const body = JSON.parse(init.body);
    const prompt = JSON.stringify(body);
    expect(prompt).toContain('How much delinquent debt?');
    expect(prompt).toContain('$47,300'); // grounding passage made it into the request
  });

  it('answers locally without any network call when no key is configured', async () => {
    const fetchImpl = vi.fn();
    const res = await answerQuestion(CASE_001, 'How much delinquent debt?', {
      apiKey: '', fetchImpl,
    });
    expect(res.engine).toBe('local');
    expect(res.answer).toMatch(/\$47,300/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports the HTTP status and body when Gemini rejects the call', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve({
      ok: false,
      status: 403,
      text: () => Promise.resolve('{"error":{"message":"API key not valid"}}'),
    }));
    const res = await answerQuestion(CASE_001, 'How much delinquent debt?', {
      apiKey: 'test-key', fetchImpl,
    });
    expect(res.engine).toBe('local');
    expect(res.error).toContain('403');
    expect(res.error).toContain('API key not valid');
  });

  it('falls back to the local answer when the Gemini call fails', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('network down')));
    const res = await answerQuestion(CASE_001, 'How much delinquent debt?', {
      apiKey: 'test-key', fetchImpl,
    });
    expect(res.error).toContain('network down');
    expect(res.engine).toBe('local');
    expect(res.answer).toMatch(/\$47,300/);
  });

  it('sends the conversation history to Gemini for follow-ups', async () => {
    const fetchImpl = vi.fn(() => geminiOk('He also has an unpaid judgment.'));
    const history = [
      { role: 'user', text: 'How much delinquent debt does the subject have?' },
      { role: 'assistant', text: 'He owes $47,300.', citations: [] },
    ];
    const res = await answerQuestion(CASE_001, 'what else?', {
      apiKey: 'test-key', fetchImpl, history,
    });
    expect(res.engine).toBe('gemini');
    const prompt = JSON.stringify(JSON.parse(fetchImpl.mock.calls[0][1].body));
    expect(prompt).toContain('what else?');
    expect(prompt).toContain('How much delinquent debt does the subject have?');
  });

  it('does not call Gemini for questions with no case-file matches', async () => {
    const fetchImpl = vi.fn();
    const res = await answerQuestion(CASE_001, 'What is the subject favorite color?', {
      apiKey: 'test-key', fetchImpl,
    });
    expect(res.answer).toMatch(/couldn't find/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
