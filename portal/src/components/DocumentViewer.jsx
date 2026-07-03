import { useData } from '../data/useData.js';
import { fetchJson } from '../data/api.js';
import StatusBadge from './StatusBadge.jsx';
import KVGrid from './KVGrid.jsx';
import SourceChip from './SourceChip.jsx';
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
};

const listingUrl = (u) => {
  const i = u?.toLowerCase().indexOf('/fileid/');
  return i > 0 ? u.slice(0, i) : null;
};

function DohaDocumentView({ doc }) {
  return (
    <div className="document-viewer">
      <div className="document-viewer-head">
        <div>
          <h4>{doc.title}</h4>
          <p className="muted">
            {doc.caseNumber} · {doc.date}
            {doc.judge && ` · ${doc.judge}`}
          </p>
        </div>
        <StatusBadge variant={OUTCOME_VARIANT[doc.outcome] || 'neutral'}>{doc.outcome}</StatusBadge>
      </div>
      <pre className="document-viewer-body">{doc.fullText}</pre>
      {doc.sourceUrl && (
        <p className="muted document-viewer-source">
          Source: <a href={doc.sourceUrl} target="_blank" rel="noreferrer">{doc.sourceUrl}</a>
          {listingUrl(doc.sourceUrl) && (
            <>
              {' · '}
              <a href={listingUrl(doc.sourceUrl)} target="_blank" rel="noreferrer">Year index</a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function GeneratedDocumentView({ doc }) {
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
      <div className="document-viewer-content">
        <KVGrid items={doc.fields
          .filter((f) => {
            const header = `${doc.title} ${doc.reference || ''}`.toLowerCase();
            return !((header.includes(f.value.toLowerCase()) && f.value.length >= 5)
              || f.value === doc.provider || f.value === doc.receivedDate);
          })
          .map((f) => ({ label: f.label, value: f.value }))} />
        {doc.transactions.length > 0 && (
          <table className="inline-table">
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
          <div key={s.heading} className="document-section">
            <h5>{s.heading}</h5>
            <p>{s.body}</p>
          </div>
        ))}
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
