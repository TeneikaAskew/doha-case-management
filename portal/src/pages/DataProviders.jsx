import { FiGrid, FiDatabase, FiCheck } from 'react-icons/fi';
import { getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { GUIDELINES } from '../domain.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };

export default function DataProviders() {
  const { data: providers, loading, error } = useData(getProviders);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const codes = Object.keys(GUIDELINES);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Data Providers</h1>
          <p>Record sources feeding investigations and continuous vetting</p>
        </div>
      </div>

      <div className="provider-grid">
        {providers.map((p) => (
          <div key={p.id} className="card provider-card">
            <div className="provider-card-head">
              <h3><FiDatabase className="section-icon" aria-hidden="true" />{p.name}</h3>
              <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
            </div>
            <p className="muted">{p.category}</p>
            <div className="provider-pills">
              {p.usedIn.map((u) => (
                <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>))}
            </div>
            <p><strong>{p.recordCount.toLocaleString('en-US')}</strong>
              <span className="muted"> records, last sync {p.lastSync.slice(0, 10)}</span></p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 id="coverage-matrix-title">
          <FiGrid className="section-icon" aria-hidden="true" />Provider to Guideline Coverage
        </h3>
        <div className="matrix-wrap">
          <table className="inline-table coverage-matrix" aria-labelledby="coverage-matrix-title">
            <thead>
              <tr>
                <th>Provider</th>
                {codes.map((c) => <th key={c} title={GUIDELINES[c]}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  {codes.map((c) => (
                    <td key={c} className="matrix-cell">
                      {p.guidelines.includes(c) && (
                        <FiCheck aria-label={`Covers Guideline ${c}`} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <SectionRef>
        Automated record checks per the{' '}
        <RefLink href={REFS.FIS}>Federal Investigative Standards</RefLink> and{' '}
        <RefLink href={REFS.DCSA_CV}>DCSA Continuous Vetting</RefLink>.
      </SectionRef>
    </div>
  );
}
