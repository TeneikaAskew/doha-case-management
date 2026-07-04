/* Live integration: exercises the real Gemini API through answerQuestion.
   Skipped when no key is configured (local dev, forks). In the deploy
   workflow REQUIRE_GEMINI=1 turns a missing/empty key into a hard failure,
   so a misnamed repo secret cannot silently ship a keyless bundle. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answerQuestion } from '../pages/case/caseAgent.js';

const KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const REQUIRED = Boolean(process.env.REQUIRE_GEMINI);

const caseFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../public/data/cases/SUBJ-001.json',
);
const loadCase = () => JSON.parse(
  fs.readFileSync(caseFile, 'utf8').replace(/^﻿/, ''),
);

describe.skipIf(!KEY && !REQUIRED)('Gemini live integration', () => {
  it('answers a case question through the real Gemini API', async () => {
    expect(KEY, 'REQUIRE_GEMINI is set but VITE_GEMINI_API_KEY is missing').toBeTruthy();
    const res = await answerQuestion(loadCase(),
      'How much delinquent debt does the subject have?', { apiKey: KEY });
    expect(res.engine, `fell back to local: ${res.error || 'no error captured'}`)
      .toBe('gemini');
    expect(res.answer.length).toBeGreaterThan(20);
    expect(res.answer).toMatch(/47,300|47300/);
    expect(res.citations.length).toBeGreaterThanOrEqual(1);
  }, 30_000);

  it('handles a chat follow-up with history through the real API', async () => {
    const caseData = loadCase();
    const first = await answerQuestion(caseData,
      'How much delinquent debt does the subject have?', { apiKey: KEY });
    const history = [
      { role: 'user', text: 'How much delinquent debt does the subject have?' },
      { role: 'assistant', text: first.answer, citations: first.citations },
    ];
    const res = await answerQuestion(caseData, 'what else should I look at?',
      { apiKey: KEY, history });
    expect(res.engine, `fell back to local: ${res.error || 'no error captured'}`)
      .toBe('gemini');
    expect(res.answer.length).toBeGreaterThan(20);
  }, 60_000);
});
