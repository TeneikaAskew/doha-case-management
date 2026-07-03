import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const DOC_FIXTURE = {
  caseNumber: '23-01864',
  title: 'DOHA hearing decision 23-01864',
  caseType: 'hearing',
  date: '01/13/2026',
  outcome: 'DENIED',
  judge: 'Eric C. Price',
  sourceUrl: 'https://doha.ogc.osd.mil/Industrial-Security-Program/Industrial-Security-Clearance-Decisions/ISCR-Hearing-Decisions/2026-ISCR-Hearing-Decisions/FileId/245264/',
  fullText: 'DEPARTMENT OF DEFENSE\nDEFENSE OFFICE OF HEARINGS AND APPEALS\n\nDecision text.',
};

const POLICE_FIXTURE = {
  docType: 'POLICE_REPORT',
  title: 'Arrest report 26-044812',
  reference: 'Report 26-044812, Chesapeake Police Department',
  provider: 'State & local courts',
  receivedDate: '2026-06-30',
  subjectId: 'SUBJ-002',
  fields: [
    { label: 'Agency', value: 'Chesapeake Police Department' },
    { label: 'Report number', value: '26-044812' },
    { label: 'Charges', value: 'DUI - 1st offense (VA 18.2-266)' },
  ],
  sections: [{ heading: 'Officer narrative', body: 'Vehicle observed varying speed.' }],
  transactions: [],
};

const SAR_FIXTURE = {
  docType: 'SAR',
  title: 'SAR-2026-0415-88231',
  reference: 'SAR-2026-0415-88231, First Commonwealth Bank',
  provider: 'FinCEN / Treasury',
  receivedDate: '2026-04-16',
  subjectId: 'SUBJ-001',
  fields: [{ label: 'Filing institution', value: 'First Commonwealth Bank' }],
  sections: [{ heading: 'Narrative', body: 'Nine outbound wire remittances.' }],
  transactions: [{ date: '2026-01-05', type: 'Wire (outbound)', amount: '$3,000' }],
};

vi.mock('../data/api.js', () => ({
  fetchJson: (url) => Promise.resolve({
    'documents/doha-record.json': DOC_FIXTURE,
    'documents/SUBJ-002/police-report.json': POLICE_FIXTURE,
    'documents/SUBJ-001/sar.json': SAR_FIXTURE,
  }[url]),
  getProviders: () => Promise.resolve([
    { id: 'courts', name: 'State & local courts', category: 'Dockets and dispositions' },
    { id: 'fincen', name: 'FinCEN / Treasury', category: 'Financial intelligence' },
  ]),
}));

import DocumentViewer from '../components/DocumentViewer.jsx';

describe('DocumentViewer', () => {
  it('renders the source document title, case number, outcome, and full text', async () => {
    render(<MemoryRouter><DocumentViewer url="documents/doha-record.json" /></MemoryRouter>);
    expect(await screen.findByText('DOHA hearing decision 23-01864')).toBeInTheDocument();
    expect(screen.getByText(/23-01864, 01\/13\/2026, Eric C\. Price/)).toBeInTheDocument();
    expect(screen.getByText('DENIED')).toBeInTheDocument();
    expect(screen.getByText(/Decision text\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /doha\.ogc\.osd\.mil/i }))
      .toHaveAttribute('href', DOC_FIXTURE.sourceUrl);
    expect(screen.getByRole('link', { name: /year index/i }))
      .toHaveAttribute('href',
        'https://doha.ogc.osd.mil/Industrial-Security-Program/Industrial-Security-Clearance-Decisions/ISCR-Hearing-Decisions/2026-ISCR-Hearing-Decisions');
  });

  it('renders a typed police report with header label, paper facsimile, and narrative', async () => {
    const { container } = render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-002/police-report.json" />
    </MemoryRouter>);
    // reference appears in the header line and on the paper letterhead
    expect((await screen.findAllByText('Report 26-044812, Chesapeake Police Department'))
      .length).toBe(2);
    expect(screen.getAllByText('Police report').length).toBe(2); // pill + letterhead
    expect(screen.getByText('2026-06-30')).toBeInTheDocument();          // received date
    expect(screen.getByText('State & local courts')).toBeInTheDocument(); // source chip
    expect(container.querySelector('.document-paper')).toBeInTheDocument();
    expect(screen.getByText('Officer narrative')).toBeInTheDocument();
  });

  it('extracted-data pane drops fields duplicating the header, provider, or date', async () => {
    const { container } = render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-002/police-report.json" />
    </MemoryRouter>);
    await screen.findAllByText('Report 26-044812, Chesapeake Police Department');
    const context = container.querySelector('.document-context');
    expect(context).not.toHaveTextContent('Report number');
    expect(context).not.toHaveTextContent('Agency');
    expect(context).toHaveTextContent(/DUI - 1st offense/);              // kept
    // the paper facsimile still shows the full document, duplicates included
    const paper = container.querySelector('.document-paper');
    expect(paper).toHaveTextContent('Report number:');
  });

  it('renders SAR transactions as a table on the paper facsimile', async () => {
    const { container } = render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-001/sar.json" />
    </MemoryRouter>);
    expect((await screen.findAllByText(/SAR-2026-0415-88231/)).length).toBe(2);
    expect(container.querySelector('.document-paper table')).toBeInTheDocument();
    expect(screen.getByText('Wire (outbound)')).toBeInTheDocument();
    expect(screen.getByText('$3,000')).toBeInTheDocument();
  });
});
