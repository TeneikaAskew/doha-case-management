import { describe, it, expect } from 'vitest';
import { askCase, exampleQuestions } from '../pages/case/caseAssistant.js';
import { CASE_001 } from './fixtures.js';

describe('exampleQuestions', () => {
  it('suggests case-specific starter questions', () => {
    const qs = exampleQuestions(CASE_001);
    expect(qs.length).toBeGreaterThanOrEqual(3);
    expect(qs.length).toBeLessThanOrEqual(5);
    // flagged Guideline F case should surface a financial question
    expect(qs.join(' ')).toMatch(/financial|Guideline F/i);
    // every suggestion is a real question
    qs.forEach((q) => expect(q).toMatch(/\?$/));
  });
});

describe('askCase', () => {
  it('answers a financial question from case content with citations', () => {
    const res = askCase(CASE_001, 'How much delinquent debt does the subject have?');
    expect(res.answer).toMatch(/\$47,300/);
    expect(res.citations.length).toBeGreaterThanOrEqual(1);
    expect(res.citations[0]).toHaveProperty('label');
    expect(res.citations[0]).toHaveProperty('tab');
  });

  it('answers an interview question citing the investigation tab', () => {
    const res = askCase(CASE_001, 'What did the subject say in his interview?');
    expect(res.answer).toMatch(/understated the debt total/i);
    expect(res.citations.some((c) => c.tab === 'investigation')).toBe(true);
  });

  it('returns an honest fallback when nothing in the case matches', () => {
    const res = askCase(CASE_001, 'What is the subject favorite color?');
    expect(res.answer).toMatch(/couldn't find|could not find/i);
    expect(res.citations).toEqual([]);
  });

  it('includes a document citation when the best passage is a document', () => {
    const res = askCase(CASE_001, 'Show me the credit file extract from TransUnion');
    expect(res.citations.some((c) => c.docUrl)).toBe(true);
  });
});
