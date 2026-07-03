import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const DOC_FIXTURE = {
  caseNumber: '23-01864',
  title: 'DOHA hearing decision 23-01864',
  caseType: 'hearing',
  date: '01/13/2026',
  outcome: 'DENIED',
  judge: 'Eric C. Price',
  sourceUrl: 'https://doha.ogc.osd.mil/example',
  fullText: 'DEPARTMENT OF DEFENSE\nDEFENSE OFFICE OF HEARINGS AND APPEALS\n\nDecision text.',
};

vi.mock('../data/api.js', () => ({
  fetchJson: () => Promise.resolve(DOC_FIXTURE),
}));

import DocumentViewer from '../components/DocumentViewer.jsx';

describe('DocumentViewer', () => {
  it('renders the source document title, case number, outcome, and full text', async () => {
    render(<DocumentViewer url="documents/doha-record.json" />);
    expect(await screen.findByText('DOHA hearing decision 23-01864')).toBeInTheDocument();
    expect(screen.getByText(/23-01864 · 01\/13\/2026 · Eric C\. Price/)).toBeInTheDocument();
    expect(screen.getByText('DENIED')).toBeInTheDocument();
    expect(screen.getByText(/Decision text\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /doha\.ogc\.osd\.mil/i }))
      .toHaveAttribute('href', DOC_FIXTURE.sourceUrl);
  });
});
