import { useEffect, useState } from 'react';
import { useData } from '../data/useData.js';
import { fetchJson } from '../data/api.js';
import { summarizeDecision, rulingSentence } from '../pages/case/caseAgent.js';
import StatusBadge from './StatusBadge.jsx';
import KVGrid from './KVGrid.jsx';
import SourceChip from './SourceChip.jsx';
import AIBadge from './AIBadge.jsx';
import GuidelineChip from './GuidelineChip.jsx';
import { Loading, ErrorAlert } from './States.jsx';
import './components.css';

const OUTCOME_VARIANT = { GRANTED: 'success', DENIED: 'error' };

const DOC_TYPE_LABELS = {
  POLICE_REPORT: 'Police report',
  CREDIT_REPORT: 'Credit-file extract',
  SAR: 'Suspicious Activity Report',
  RAPBACK_NOTIFICATION: 'Rap Back notification',
  SF86_EXCERPT: 'SF-86 excerpt',
  TRAVEL_RECORD: 'Travel record',
  INCIDENT_REPORT: 'Security incident report',
  ROI: 'Report of Investigation',
};

const field = (doc, label) => doc.fields.find((f) => f.label === label)?.value;

// Letterhead issuer for the paper facsimile, per document type.
const PAPER_ISSUER = {
  POLICE_REPORT: (d) => field(d, 'Agency') || d.provider,
  CREDIT_REPORT: (d) => field(d, 'Bureau') || d.provider,
  SAR: (d) => 'Financial Crimes Enforcement Network (FinCEN)',
  RAPBACK_NOTIFICATION: () => 'Federal Bureau of Investigation - CJIS Division',
  SF86_EXCERPT: () => 'U.S. Office of Personnel Management',
  TRAVEL_RECORD: () => 'U.S. Customs and Border Protection',
  INCIDENT_REPORT: (d) => d.provider,
  ROI: () => 'Defense Counterintelligence and Security Agency',
};

const listingUrl = (u) => {
  const i = u?.toLowerCase().indexOf('/fileid/');
  return i > 0 ? u.slice(0, i) : null;
};

// guideline letters actually cited in the decision text, in SEAD-4 order
function guidelinesAtIssue(doc) {
  const found = new Set();
  for (const m of (doc.fullText || '').matchAll(/Guideline ([A-M])\b/g)) {
    found.add(m[1]);
  }
  return [...found].sort();
}

function DohaDocumentView({ doc }) {
  const [summary, setSummary] = useState(null);
  const ruling = rulingSentence(doc);

  useEffect(() => {
    let mounted = true;
    setSummary(null);
    summarizeDecision(doc).then((s) => { if (mounted) setSummary(s); });
    return () => { mounted = false; };
  }, [doc.caseNumber]);

  return (
    <div className="document-viewer">
      <div className="document-viewer-head">
        <div>
          <h4>{doc.title}</h4>
          <p className="muted">
            {doc.caseNumber}, {doc.date}
            {doc.judge && `, ${doc.judge}`}
          </p>
        </div>
        <StatusBadge variant={OUTCOME_VARIANT[doc.outcome] || 'neutral'}>{doc.outcome}</StatusBadge>
      </div>
      <div className="document-split doha-split">
        <pre className="document-viewer-body">{doc.fullText}</pre>
        <div className="document-context">
          <h5 className="document-context-h">Guidelines at Issue</h5>
          <div className="doha-guidelines">
            {guidelinesAtIssue(doc).map((g) => <GuidelineChip key={g} code={g} />)}
            {guidelinesAtIssue(doc).length === 0 && (
              <span className="muted">None cited by letter.</span>
            )}
          </div>
          {ruling && (
            <>
              <h5 className="document-context-h">Ruling</h5>
              <blockquote className="doha-ruling">{ruling}</blockquote>
            </>
          )}
          <h5 className="document-context-h">AI Summary <AIBadge /></h5>
          {summary ? (
            <>
              {/* the local extract just repeats the ruling shown above */}
              {!(summary.engine === 'local' && ruling) && (
                <p className="doha-summary">{summary.summary}</p>
              )}
              <p className="muted document-context-note">
                {summary.engine === 'gemini'
                  ? (summary.cached
                    ? 'Gemini summary, stored from an earlier run.'
                    : 'Gemini summary - stored for reuse.')
                  : 'Enable Gemini for a narrative summary; the ruling above is '
                    + 'extracted from the decision.'}
              </p>
            </>
          ) : (
            <p className="muted">Summarizing decision…</p>
          )}
        </div>
      </div>
      {doc.sourceUrl && (
        <p className="muted document-viewer-source">
          Source: <a href={doc.sourceUrl} target="_blank" rel="noreferrer">{doc.sourceUrl}</a>
          {listingUrl(doc.sourceUrl) && (
            <>
              {' | '}
              <a href={listingUrl(doc.sourceUrl)} target="_blank" rel="noreferrer">Year index</a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function DocumentPaper({ doc }) {
  const issuer = (PAPER_ISSUER[doc.docType] || ((d) => d.provider))(doc);
  return (
    <div className="document-paper" aria-label="Document facsimile">
      <div className="paper-letterhead">
        <div className="paper-org">{issuer}</div>
        <div className="paper-doc-type">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</div>
        <div className="paper-ref">{doc.reference || doc.title}</div>
      </div>
      <div className="paper-fields">
        {doc.fields.map((f) => (
          <div key={f.label} className="paper-field">
            <span className="paper-field-label">{f.label}:</span> {f.value}
          </div>
        ))}
      </div>
      {doc.transactions.length > 0 && (
        <table className="paper-table">
          <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
          <tbody>
            {doc.transactions.map((t) => (
              <tr key={`${t.date}-${t.amount}`}>
                <td>{t.date}</td><td>{t.type}</td><td>{t.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {doc.sections.map((s) => (
        <div key={s.heading} className="paper-section">
          <div className="paper-section-h">{s.heading}</div>
          <p>{s.body}</p>
        </div>
      ))}
      <div className="paper-footer">Page 1 of 1 | Demo facsimile | not an official record</div>
    </div>
  );
}

function GeneratedDocumentView({ doc }) {
  const contextFields = doc.fields.filter((f) => {
    const header = `${doc.title} ${doc.reference || ''}`.toLowerCase();
    return !((header.includes(f.value.toLowerCase()) && f.value.length >= 5)
      || f.value === doc.provider || f.value === doc.receivedDate);
  });
  return (
    <div className="document-viewer">
      <div className="document-viewer-head document-viewer-head-line">
        <div className="document-head-line">
          <span className="document-type-pill">
            {DOC_TYPE_LABELS[doc.docType] || doc.docType}
          </span>
          <span className="document-ref">{doc.reference || doc.title}</span>
        </div>
        <div className="document-head-right">
          <SourceChip provider={doc.provider} />
          <span className="document-date">{doc.receivedDate}</span>
        </div>
      </div>
      <div className="document-split">
        <DocumentPaper doc={doc} />
        <div className="document-context">
          <h5 className="document-context-h">Extracted data</h5>
          <KVGrid items={contextFields.map((f) => ({ label: f.label, value: f.value }))} />
          {doc.transactions.length > 0 && (
            <p className="muted document-context-note">
              {doc.transactions.length} transactions listed on the document.
            </p>
          )}
          <h5 className="document-context-h">Provenance</h5>
          <p className="muted document-context-note">
            Received {doc.receivedDate} via {doc.provider}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DocumentViewer({ url }) {
  const { data: doc, loading, error } = useData(() => fetchJson(url), [url]);
  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;
  return doc.docType
    ? <GeneratedDocumentView doc={doc} />
    : <DohaDocumentView doc={doc} />;
}
