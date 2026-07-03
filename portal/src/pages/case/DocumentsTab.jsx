import { useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { EmptyState } from '../../components/States.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';

export default function DocumentsTab({ caseData }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!caseData.documents.length) {
    return <EmptyState title="No documents" message="No documents are on file for this case." />;
  }
  return (
    <div>
      {caseData.documents.map((d, i) => (
        <div key={d.title}>
          <div className="card document-card">
            <div>
              <h3><FiFileText className="section-icon" aria-hidden="true" />{d.title}</h3>
              <p className="muted">{d.type} · {d.description}</p>
            </div>
            {d.url
              ? (
                <button type="button" className="btn btn-secondary"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                  <FiFileText aria-hidden="true" /> View document
                </button>
              )
              : <span className="muted">Not available in demo</span>}
          </div>
          {openIndex === i && <DocumentViewer url={d.url} />}
        </div>
      ))}
    </div>
  );
}
