import { useData } from '../data/useData.js';
import { fetchJson } from '../data/api.js';
import StatusBadge from './StatusBadge.jsx';
import { Loading, ErrorAlert } from './States.jsx';
import './components.css';

const OUTCOME_VARIANT = { GRANTED: 'success', DENIED: 'error' };

export default function DocumentViewer({ url }) {
  const { data: doc, loading, error } = useData(() => fetchJson(url), [url]);
  if (loading) return <Loading />;
  if (error) return <ErrorAlert message={error} />;
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
        </p>
      )}
    </div>
  );
}
