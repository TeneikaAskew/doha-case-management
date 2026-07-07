import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiCheckSquare } from 'react-icons/fi';
import { getAlerts, getProviderActivity, getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import { usePersona } from '../state/PersonaContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_STATE_VARIANTS,
} from '../domain.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';
import HealthKpis from './provider/HealthKpis.jsx';
import { VolumeByMonth, GuidelineYield } from './provider/ProviderCharts.jsx';
import TriageQueue from './provider/TriageQueue.jsx';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const CHECK_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };
const TRIAGE_KEY = 'demo.providerTriage';

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { demo, dispositionAlert } = useDemo();
  const { persona } = usePersona();
  const providersQ = useData(getProviders);
  const alertsQ = useData(getAlerts);
  const activityQ = useData(getProviderActivity);
  const [category, setCategory] = useState('ALL');
  const [triage, setTriage] = useState(
    () => localStorage.getItem(TRIAGE_KEY) === 'on');

  const toggleTriage = () => {
    const next = !triage;
    localStorage.setItem(TRIAGE_KEY, next ? 'on' : 'off');
    setTriage(next);
  };

  const loading = providersQ.loading || alertsQ.loading || activityQ.loading;
  const error = providersQ.error || alertsQ.error || activityQ.error;

  const model = useMemo(() => {
    if (loading || error) return null;
    const provider = providersQ.data.find((p) => p.id === id);
    if (!provider) return { missing: true };
    const alerts = alertsQ.data
      .filter((a) => a.providerId === id)
      .map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }))
      .sort((a, b) => (a.receivedDate < b.receivedDate ? 1 : -1));
    const activity = activityQ.data[id] || { recordChecks: [], documents: [] };
    return { provider, alerts, activity };
  }, [loading, error, providersQ.data, alertsQ.data, activityQ.data, id,
    demo.alertStates]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;
  if (model.missing) {
    return <div className="page"><ErrorAlert message={`Provider not found: ${id}`} /></div>;
  }

  const { provider: p, alerts, activity } = model;
  const isCv = p.usedIn.includes('CV');
  const triageOn = isCv && triage;

  const visible = alerts
    .filter((a) => category === 'ALL' || a.category === category);

  const alertColumns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (a) => <strong>{a.subjectName}</strong> },
    { key: 'category', label: 'Category', sortable: true,
      render: (a) => ALERT_CATEGORY_LABELS[a.category] },
    { key: 'severity', label: 'Severity',
      render: (a) => <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</StatusBadge> },
    { key: 'priorityScore', label: 'AI Priority', sortable: true },
    { key: 'state', label: 'State',
      render: (a) => <StatusBadge variant={ALERT_STATE_VARIANTS[a.state]}>{ALERT_STATE_LABELS[a.state]}</StatusBadge> },
    { key: 'receivedDate', label: 'Received', sortable: true },
  ];

  const checkRows = activity.recordChecks.map((c) => ({
    ...c, key: `${c.caseId}-${c.item}`,
  }));
  const checkColumns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (c) => <strong>{c.subjectName}</strong> },
    { key: 'item', label: 'Check' },
    { key: 'status', label: 'Status',
      render: (c) => <StatusBadge variant={CHECK_VARIANT[c.status]}>{c.status}</StatusBadge> },
    { key: 'completedDate', label: 'Completed', sortable: true,
      render: (c) => c.completedDate || 'Pending' },
    { key: 'caseId', label: 'Case',
      render: (c) => (
        <Link to={`/cases/${c.caseId}?tab=investigation`}
          onClick={(e) => e.stopPropagation()}>
          View in case
        </Link>
      ) },
  ];

  const recordChecksTable = checkRows.length === 0
    ? <p className="muted">No record checks delivered in the demo data.</p>
    : <DataTable columns={checkColumns} rows={checkRows} rowKey="key"
        onRowClick={(c) => navigate(`/cases/${c.caseId}?tab=investigation`)} />;

  return (
    <div className="page">
      <Link className="provider-back" to="/providers">
        <FiArrowLeft aria-hidden="true" /> Data Providers
      </Link>
      <div className="page-header">
        <div>
          <h1>{p.name}</h1>
          <p className="provider-meta">
            {p.category}
            <span className="provider-usedin-pills">
              {p.usedIn.map((u) => (
                <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>))}
              {p.guidelines.map((g) => <GuidelineChip key={g} code={g} />)}
            </span>
          </p>
        </div>
        <div className="provider-header-right">
          <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
          {isCv && (
            <button type="button" role="switch" aria-checked={triage}
              className={`triage-switch ${triage ? 'on' : ''}`}
              onClick={toggleTriage}>
              <span className="triage-switch-label">Triage</span>
              <span className="triage-switch-track" aria-hidden="true">
                <span className="triage-switch-thumb" />
              </span>
            </button>
          )}
        </div>
      </div>

      {triageOn ? (
        <TriageQueue alerts={alerts} isAnalyst={persona.id === 'analyst'}
          dispositionAlert={dispositionAlert} />
      ) : (
        <>
          <HealthKpis provider={p} />
          {p.network && (
            <div className="provider-charts">
              <VolumeByMonth network={p.network} isCv={isCv} />
              <GuidelineYield provider={p} />
            </div>
          )}
          {isCv ? (
            <div className="card">
              <div className="provider-alerts-head">
                <h3><FiActivity className="section-icon" aria-hidden="true" />
                  Alerts from This Source</h3>
                <label className="form-group">
                  <span>Category</span>
                  <select aria-label="Category" value={category}
                    onChange={(e) => setCategory(e.target.value)}>
                    <option value="ALL">All categories</option>
                    {Object.entries(ALERT_CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>))}
                  </select>
                </label>
              </div>
              {visible.length === 0
                ? <EmptyState title="No alerts"
                    message="No alerts match the current filter." />
                : <DataTable columns={alertColumns} rows={visible} rowKey="id"
                    onRowClick={(a) =>
                      navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`)} />}
            </div>
          ) : (
            <div className="card">
              <h3><FiActivity className="section-icon" aria-hidden="true" />
                Alerts from This Source</h3>
              <p className="muted">
                This source feeds investigations, not continuous vetting - it
                delivers record checks during background investigations and does
                not generate CV alerts.
              </p>
            </div>
          )}
        </>
      )}

      {triageOn ? (
        <CollapsibleSection
          title="Record Checks Delivered"
          meta={<span className="muted">
            {checkRows.length} checks, {activity.documents.length} documents
          </span>}
          icon={<FiCheckSquare />}>
          {recordChecksTable}
        </CollapsibleSection>
      ) : (
        <div className="card">
          <h3><FiCheckSquare className="section-icon" aria-hidden="true" />
            Record Checks Delivered
            {activity.documents.length > 0 && (
              <span className="muted provider-doc-count">
                {activity.documents.length} documents delivered
              </span>
            )}
          </h3>
          {recordChecksTable}
        </div>
      )}

      <SectionRef>
        Continuous vetting under <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>;
        record checks per the{' '}
        <RefLink href={REFS.FIS}>Federal Investigative Standards</RefLink>.
        With Triage on, the Analyst role (&quot;Viewing as&quot; in the header)
        can disposition alerts inline.
      </SectionRef>
    </div>
  );
}
