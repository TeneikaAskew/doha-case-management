import { EmptyState } from '../../components/States.jsx';

export default function DocumentsTab({ caseData }) {
  if (!caseData.documents.length) {
    return <EmptyState title="No documents" message="No documents are on file for this case." />;
  }
  return (
    <div>
      {caseData.documents.map((d) => (
        <div key={d.title} className="card document-card">
          <div>
            <h3>{d.title}</h3>
            <p className="muted">{d.type} · {d.description}</p>
          </div>
          {d.url
            ? <a className="btn btn-secondary" href={d.url}>Open</a>
            : <span className="muted">Not available in demo</span>}
        </div>
      ))}
    </div>
  );
}
