import { useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { EmptyState } from '../../components/States.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import SectionRef, { RefLink } from '../../components/SectionRef.jsx';
import { REFS } from '../../references.js';

export default function DocumentsTab({ caseData }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!caseData.documents.length) {
    return <EmptyState title="No documents" message="No documents are on file for this case." />;
  }
  return (
    <div className="document-list">
      {caseData.documents.map((d, i) => (
        <div key={d.title}>
          <div className="card document-card">
            <div>
              <h3><FiFileText className="section-icon" aria-hidden="true" />{d.title}</h3>
              <p className="muted">{d.type}, {d.description}</p>
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
      <SectionRef>
        DOHA precedent decisions from the published{' '}
        <RefLink href={REFS.DOHA_DECISIONS}>Industrial Security Clearance
        Decisions</RefLink>, issued under{' '}
        <RefLink href={REFS.DODD_52206}>DoDD 5220.6</RefLink> and{' '}
        <RefLink href={REFS.EO_10865}>E.O. 10865</RefLink>.
      </SectionRef>
    </div>
  );
}
