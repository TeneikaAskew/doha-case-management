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
  title: 'Arrest report 26-044812 — Chesapeake Police Department',
  provider: 'State & local courts',
  receivedDate: '2026-06-30',
  subjectId: 'SUBJ-002',
  fields: [
    { label: 'Agency', value: 'Chesapeake Police Department' },
    { label: 'Charges', value: 'DUI — 1st offense (VA 18.2-266)' },
  ],
  sections: [{ heading: 'Officer narrative', body: 'Vehicle observed varying speed.' }],
  transactions: [],
};

const SAR_FIXTURE = {
  docType: 'SAR',
  title: 'Suspicious Activity Report SAR-2026-0415-88231',
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
    expect(screen.getByText(/23-01864 · 01\/13\/2026 · Eric C\. Price/)).toBeInTheDocument();
    expect(screen.getByText('DENIED')).toBeInTheDocument();
    expect(screen.getByText(/Decision text\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /doha\.ogc\.osd\.mil/i }))
      .toHaveAttribute('href', DOC_FIXTURE.sourceUrl);
    expect(screen.getByRole('link', { name: /year index/i }))
      .toHaveAttribute('href',
        'https://doha.ogc.osd.mil/Industrial-Security-Program/Industrial-Security-Clearance-Decisions/ISCR-Hearing-Decisions/2026-ISCR-Hearing-Decisions');
  });

  it('renders a typed police report with provider stamp, fields, and narrative', async () => {
    render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-002/police-report.json" />
    </MemoryRouter>);
    expect(await screen.findByText(/Arrest report 26-044812/)).toBeInTheDocument();
    expect(screen.getByText('Chesapeake Police Department')).toBeInTheDocument();
    expect(screen.getByText('Officer narrative')).toBeInTheDocument();
    expect(screen.getByText(/Received via State & local courts · 2026-06-30/))
      .toBeInTheDocument();
  });

  it('renders SAR transactions as a table', async () => {
    render(<MemoryRouter>
      <DocumentViewer url="documents/SUBJ-001/sar.json" />
    </MemoryRouter>);
    expect(await screen.findByText(/SAR-2026-0415-88231/)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Wire (outbound)')).toBeInTheDocument();
    expect(screen.getByText('$3,000')).toBeInTheDocument();
  });
});
