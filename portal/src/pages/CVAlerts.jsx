import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_STATE_VARIANTS,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };

export default function CVAlerts() {
  const navigate = useNavigate();
  const { demo } = useDemo();
  const [category, setCategory] = useState('ALL');
  const [kpiFilter, setKpiFilter] = useState(null);
  const { data, loading, error } = useData(getAlerts);

  const alerts = useMemo(() => {
    if (!data) return [];
    return data
      .map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }))
      .filter((a) => category === 'ALL' || a.category === category)
      .filter((a) => {
        const isOpen = !['ADJUDICATED', 'CLOSED'].includes(a.state);
        switch (kpiFilter) {
          case 'OPEN': return isOpen;
          case 'NEW': return a.state === 'NEW';
          case 'HIGH': return isOpen && a.severity === 'HIGH';
          case 'REFERRED': return a.state === 'REFERRED';
          default: return true;
        }
      });
  }, [data, demo.alertStates, category, kpiFilter]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const toggleKpi = (key) => setKpiFilter((prev) => (prev === key ? null : key));

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
      render: (a) => <StatusBadge variant={ALERT_STATE_VARIANTS[a.state]}>{ALERT_STATE_LABELS[a.state]}</StatusBadge> },
    { key: 'receivedDate', label: 'Received', sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Alerts from Data Providers</h1>
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
        <KPICard label="Open Alerts" value={open.length} accent="var(--status-alert)"
          onClick={() => toggleKpi('OPEN')} active={kpiFilter === 'OPEN'} />
        <KPICard label="New" value={all.filter((a) => a.state === 'NEW').length}
          accent="var(--status-warning)"
          onClick={() => toggleKpi('NEW')} active={kpiFilter === 'NEW'} />
        <KPICard label="High Severity"
          value={open.filter((a) => a.severity === 'HIGH').length}
          accent="var(--risk-high)"
          onClick={() => toggleKpi('HIGH')} active={kpiFilter === 'HIGH'} />
        <KPICard label="Referred"
          value={all.filter((a) => a.state === 'REFERRED').length}
          accent="var(--dcsa-gold)"
          onClick={() => toggleKpi('REFERRED')} active={kpiFilter === 'REFERRED'} />
      </div>
      {alerts.length === 0
        ? <EmptyState title="No alerts" message="No alerts match the current filter." />
        : <DataTable columns={columns} rows={alerts} rowKey="id"
            onRowClick={(a) =>
              navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`)} />}
      <SectionRef>
        Continuous vetting under <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>;
        enrollment and automated checks per{' '}
        <RefLink href={REFS.DCSA_CV}>DCSA Continuous Vetting</RefLink>.
      </SectionRef>
    </div>
  );
}
