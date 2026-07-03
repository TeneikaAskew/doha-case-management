import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import { ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS } from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';

const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const STATE_VARIANT = {
  NEW: 'warning', IDENTITY_CONFIRMED: 'info', VALIDATED: 'info',
  REFERRED: 'warning', ADJUDICATED: 'success', CLOSED: 'neutral',
};

export default function CVAlerts() {
  const navigate = useNavigate();
  const { demo } = useDemo();
  const [category, setCategory] = useState('ALL');
  const { data, loading, error } = useData(getAlerts);

  const alerts = useMemo(() => {
    if (!data) return [];
    return data
      .map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }))
      .filter((a) => category === 'ALL' || a.category === category);
  }, [data, demo.alertStates, category]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const all = data.map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }));
  const open = all.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.state));

  const columns = [
    { key: 'subjectName', label: 'Subject', sortable: true,
      render: (a) => <strong>{a.subjectName}</strong> },
    { key: 'category', label: 'Category', sortable: true,
      render: (a) => ALERT_CATEGORY_LABELS[a.category] },
    { key: 'severity', label: 'Severity',
      render: (a) => <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>{a.severity}</StatusBadge> },
    { key: 'priorityScore', label: 'AI priority', sortable: true },
    { key: 'state', label: 'State',
      render: (a) => <StatusBadge variant={STATE_VARIANT[a.state]}>{ALERT_STATE_LABELS[a.state]}</StatusBadge> },
    { key: 'receivedDate', label: 'Received', sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>CV alerts</h1>
          <p>Continuous vetting alert inbox <AIBadge /></p>
        </div>
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
      <div className="kpi-grid">
        <KPICard label="Open alerts" value={open.length} accent="var(--status-alert)" />
        <KPICard label="New" value={all.filter((a) => a.state === 'NEW').length}
          accent="var(--status-warning)" />
        <KPICard label="High severity"
          value={open.filter((a) => a.severity === 'HIGH').length}
          accent="var(--risk-high)" />
        <KPICard label="Referred"
          value={all.filter((a) => a.state === 'REFERRED').length}
          accent="var(--dcsa-gold)" />
      </div>
      {alerts.length === 0
        ? <EmptyState title="No alerts" message="No alerts match the current filter." />
        : <DataTable columns={columns} rows={alerts} rowKey="id"
            onRowClick={(a) =>
              navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`)} />}
    </div>
  );
}
