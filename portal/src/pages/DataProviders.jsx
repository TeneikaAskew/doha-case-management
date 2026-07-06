import { useNavigate } from 'react-router-dom';
import { FiGrid, FiDatabase, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { getAlerts, getProviderActivity, getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { GUIDELINES } from '../domain.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };

export default function DataProviders() {
  const navigate = useNavigate();
  const { data: providers, loading, error } = useData(getProviders);
  const alertsQ = useData(getAlerts);
  const activityQ = useData(getProviderActivity);

  if (loading || alertsQ.loading || activityQ.loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const counts = (id) => ({
    alerts: (alertsQ.data || []).filter((a) => a.providerId === id).length,
    checks: activityQ.data?.[id]?.recordChecks.length || 0,
  });

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
          <button key={p.id} type="button"
            className="card card-interactive provider-card"
            onClick={() => navigate(`/providers/${p.id}`)}>
            <div className="provider-card-head">
              <h3><FiDatabase className="section-icon" aria-hidden="true" />{p.name}</h3>
              <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
            </div>
            <p className="muted">{p.category}</p>
            <div className="provider-pills">
              {p.usedIn.map((u) => (
                <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>))}
            </div>
            <div className="provider-sync-row">
              <p><strong>{p.recordCount.toLocaleString('en-US')}</strong>
                <span className="muted"> records</span></p>
              <span className="muted provider-sync"
                aria-label={`Last sync ${p.lastSync.slice(0, 10)}`}
                title="Last sync">
                <FiRefreshCw aria-hidden="true" />{p.lastSync.slice(0, 10)}
              </span>
            </div>
            <p className="muted provider-activity-line">
              {counts(p.id).alerts} alerts · {counts(p.id).checks} record checks
            </p>
          </button>
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
        <RefLink href={REFS.DCSA_CV}>DCSA Continuous Vetting</RefLink>; social
        media checks per <RefLink href={REFS.SEAD5}>SEAD 5</RefLink>; criminal
        arrest subscriptions via <RefLink href={REFS.RAPBACK}>FBI NGI Rap
        Back</RefLink>; consumer credit reports governed by the{' '}
        <RefLink href={REFS.FCRA}>Fair Credit Reporting Act</RefLink>.
      </SectionRef>
    </div>
  );
}
