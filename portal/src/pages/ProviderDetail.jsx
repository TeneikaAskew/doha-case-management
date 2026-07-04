import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiActivity, FiCheckSquare, FiFileText } from 'react-icons/fi';
import { getAlerts, getProviderActivity, getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_STATE_VARIANTS,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import KVGrid from '../components/KVGrid.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const STATUS_VARIANT = { HEALTHY: 'success', DEGRADED: 'warning', OFFLINE: 'error' };
const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const CHECK_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const USED_IN_LABEL = { INVESTIGATION: 'Investigation', CV: 'Continuous vetting' };
const isOpen = (state) => !['ADJUDICATED', 'CLOSED'].includes(state);

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { demo } = useDemo();
  const providersQ = useData(getProviders);
  const alertsQ = useData(getAlerts);
  const activityQ = useData(getProviderActivity);
  const [kpiFilter, setKpiFilter] = useState(null);
  const [category, setCategory] = useState('ALL');

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
  const open = alerts.filter((a) => isOpen(a.state));
  const toggleKpi = (key) => setKpiFilter((prev) => (prev === key ? null : key));

  const visible = alerts
    .filter((a) => category === 'ALL' || a.category === category)
    .filter((a) => {
      switch (kpiFilter) {
        case 'OPEN': return isOpen(a.state);
        case 'HIGH': return isOpen(a.state) && a.severity === 'HIGH';
        case 'DONE': return !isOpen(a.state);
        default: return true;
      }
    });

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

  return (
    <div className="page">
      <Link className="provider-back" to="/providers">
        <FiArrowLeft aria-hidden="true" /> Data Providers
      </Link>
      <div className="page-header">
        <div>
          <h1>{p.name}</h1>
          <p>{p.category}</p>
        </div>
        <StatusBadge variant={STATUS_VARIANT[p.status]}>{p.status}</StatusBadge>
      </div>

      <div className="card provider-stats">
        <KVGrid items={[
          { label: 'Records', value: p.recordCount.toLocaleString('en-US') },
          { label: 'Last sync', value: p.lastSync.slice(0, 10) },
          { label: 'Used in',
            value: (
              <span className="provider-usedin-pills">
                {p.usedIn.map((u) => (
                  <StatusBadge key={u} variant="neutral">{USED_IN_LABEL[u]}</StatusBadge>))}
              </span>
            ) },
          { label: 'Guidelines covered',
            value: p.guidelines.map((g) => <GuidelineChip key={g} code={g} />) },
        ]} />
      </div>

      {isCv ? (
        <>
          <div className="kpi-grid">
            <KPICard label="Alerts Received" value={alerts.length}
              accent="var(--dcsa-navy)"
              onClick={() => toggleKpi(null)} active={kpiFilter === null} />
            <KPICard label="Open Alerts" value={open.length}
              accent="var(--status-alert)"
              onClick={() => toggleKpi('OPEN')} active={kpiFilter === 'OPEN'} />
            <KPICard label="High Severity"
              value={open.filter((a) => a.severity === 'HIGH').length}
              accent="var(--risk-high)"
              onClick={() => toggleKpi('HIGH')} active={kpiFilter === 'HIGH'} />
            <KPICard label="Adjudicated / Closed"
              value={alerts.length - open.length}
              accent="var(--status-clear)"
              onClick={() => toggleKpi('DONE')} active={kpiFilter === 'DONE'} />
          </div>
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
        </>
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

      <div className="card">
        <h3><FiCheckSquare className="section-icon" aria-hidden="true" />
          Record Checks Delivered
          {activity.documents.length > 0 && (
            <span className="muted provider-doc-count">
              <FiFileText aria-hidden="true" /> {activity.documents.length} documents delivered
            </span>
          )}
        </h3>
        {checkRows.length === 0
          ? <p className="muted">No record checks delivered in the demo data.</p>
          : <DataTable columns={checkColumns} rows={checkRows} rowKey="key"
              onRowClick={(c) => navigate(`/cases/${c.caseId}?tab=investigation`)} />}
      </div>

      <SectionRef>
        Continuous vetting under <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>;
        record checks per the{' '}
        <RefLink href={REFS.FIS}>Federal Investigative Standards</RefLink>.
      </SectionRef>
    </div>
  );
}
