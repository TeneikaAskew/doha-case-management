import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { summarizeDecision } from '../pages/case/caseAgent.js';

const RECORD = {
  caseNumber: '23-01864', title: 'DOHA hearing decision 23-01864',
  caseType: 'hearing', date: '01/13/2026', outcome: 'DENIED', judge: 'Marshall',
  sourceUrl: null,
  fullText: 'DEPARTMENT OF DEFENSE DEFENSE OFFICE OF HEARINGS AND APPEALS. '
    + 'Applicant has delinquent debts totaling $30,000 under Guideline F. '.repeat(40)
    + 'Applicant did not mitigate the Guideline E concerns. '
    + 'It is not clearly consistent with the interests of national security to grant '
    + 'Applicant eligibility for access to classified information. '
    + 'Eligibility for access to classified information is denied.',
};

const geminiOk = (text) => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text }] } }] }),
});

vi.mock('../data/api.js', () => ({
  fetchJson: (url) => Promise.resolve(
    url.includes('with-pdf')
      ? { ...RECORD, pdfUrl: 'documents/doha/pdf/23-01864.pdf' }
      : RECORD,
  ),
}));

import DocumentViewer from '../components/DocumentViewer.jsx';

beforeEach(() => localStorage.clear());

describe('summarizeDecision', () => {
  it('summarizes via Gemini and stores the result', async () => {
    const fetchImpl = vi.fn(() => geminiOk('Denied over unresolved delinquent debt.'));
    const res = await summarizeDecision(RECORD, { apiKey: 'k', fetchImpl });
    expect(res.engine).toBe('gemini');
    expect(res.summary).toBe('Denied over unresolved delinquent debt.');
    const stored = JSON.parse(localStorage.getItem('demo.dohaSummaries'));
    expect(stored['23-01864'].summary).toBe('Denied over unresolved delinquent debt.');
  });

  it('serves the stored summary without calling Gemini again', async () => {
    const fetchImpl = vi.fn(() => geminiOk('First run.'));
    await summarizeDecision(RECORD, { apiKey: 'k', fetchImpl });
    const res = await summarizeDecision(RECORD, { apiKey: 'k', fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(res.summary).toBe('First run.');
    expect(res.cached).toBe(true);
  });

  it('falls back to a readable ruling extract without a key and does not cache it', async () => {
    const res = await summarizeDecision(RECORD, { apiKey: '' });
    expect(res.engine).toBe('local');
    expect(res.summary).toMatch(/^Eligibility denied\./);
    expect(res.summary).toMatch(/not clearly consistent with the interests/);
    expect(res.summary).not.toMatch(/~~|\$'/); // never OCR junk
    expect(localStorage.getItem('demo.dohaSummaries')).toBeNull();
  });
});

describe('DohaDocumentView', () => {
  it('shows the decision text and the stored summary side by side', async () => {
    localStorage.setItem('demo.dohaSummaries', JSON.stringify({
      '23-01864': { summary: 'Stored Gemini summary.', engine: 'gemini' },
    }));
    render(<DocumentViewer url="documents/doha/23-01864.json" />);
    expect(await screen.findByText(/DEFENSE OFFICE OF HEARINGS AND APPEALS/))
      .toBeInTheDocument();
    expect(await screen.findByText('Stored Gemini summary.')).toBeInTheDocument();
    expect(screen.getByText(/AI summary/i)).toBeInTheDocument();
  });

  it('embeds the original PDF when one is available, with a text toggle', async () => {
    const { container } = render(<DocumentViewer url="documents/doha/with-pdf.json" />);
    await screen.findByText('Guidelines at Issue');
    const obj = container.querySelector('object[type="application/pdf"]');
    expect(obj).toBeTruthy();
    expect(obj.getAttribute('data')).toContain('documents/doha/pdf/23-01864.pdf');
    // extracted text still reachable behind a toggle
    fireEvent.click(screen.getByRole('button', { name: /extracted text/i }));
    expect(screen.getByText(/DEFENSE OFFICE OF HEARINGS AND APPEALS/))
      .toBeInTheDocument();
  });

  it('structures the sidebar: guidelines at issue and the formal ruling', async () => {
    render(<DocumentViewer url="documents/doha/23-01864.json" />);
    await screen.findByText(/DEFENSE OFFICE OF HEARINGS AND APPEALS/);
    expect(screen.getByText('Guidelines at Issue')).toBeInTheDocument();
    // F and E parsed from the decision text, rendered as guideline chips
    expect(screen.getByTitle(/Financial Considerations/)).toBeInTheDocument();
    expect(screen.getByTitle(/Personal Conduct/)).toBeInTheDocument();
    expect(screen.getByText('Ruling')).toBeInTheDocument();
    // the ruling is quoted in the sidebar (it also exists inside the full text)
    const rulingEls = screen.getAllByText(/not clearly consistent with the interests/);
    expect(rulingEls.some((el) => el.tagName === 'BLOCKQUOTE')).toBe(true);
  });
});
