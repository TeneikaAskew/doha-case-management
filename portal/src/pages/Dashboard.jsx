import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { usePersona } from '../state/PersonaContext.jsx';
import { useDemo } from '../state/DemoContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, riskBand,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

function buildKpis(personaId, subjects, alerts) {
  const inStage = (st) => subjects.filter((s) => s.stage === st);
  const openAlerts = alerts.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.state));
  switch (personaId) {
    case 'investigator': {
      const inv = inStage('INVESTIGATION');
      const avg = inv.length
        ? Math.round(inv.reduce((n, s) => n + s.daysInStage, 0) / inv.length) : 0;
      return {
        queue: inv,
        title: 'Investigation Workload',
        kpis: [
          { label: 'Cases in Investigation', value: inv.length, accent: 'var(--dcsa-ocean)' },
          { label: 'Pending Coverage', value: inv.filter((s) => s.status !== 'CLEAR').length,
            accent: 'var(--status-warning)' },
          { label: 'Discrepancy Flags',
            value: inv.filter((s) => s.flaggedGuidelines.length > 0).length,
            accent: 'var(--status-alert)' },
          { label: 'Avg Days in Stage', value: avg, accent: 'var(--dcsa-gold)' },
        ],
      };
    }
    case 'analyst':
      return {
        queue: inStage('CONTINUOUS_VETTING'),
        title: 'Continuous Vetting Workload',
        kpis: [
          { label: 'Open Alerts', value: openAlerts.length, accent: 'var(--status-alert)' },
          { label: 'New Alerts', value: alerts.filter((a) => a.state === 'NEW').length,
            accent: 'var(--status-warning)' },
          { label: 'High Severity',
            value: openAlerts.filter((a) => a.severity === 'HIGH').length,
            accent: 'var(--risk-high)' },
          { label: 'CV Subjects', value: subjects.filter((s) => s.cvEnrolled).length,
            accent: 'var(--dcsa-ocean)' },
        ],
      };
    default: {
      const adj = inStage('ADJUDICATION');
      return {
        queue: adj,
        title: 'Adjudication Workload',
        kpis: [
          { label: 'Ready for Decision', value: adj.length, accent: 'var(--dcsa-navy)' },
          { label: 'Action Required',
            value: subjects.filter((s) => s.status === 'ACTION_REQUIRED').length,
            accent: 'var(--status-alert)' },
          { label: 'Fast-Track Candidates', value: subjects.filter((s) => s.fastTrack).length,
            accent: 'var(--status-clear)' },
          { label: 'High Risk (75+)',
            value: subjects.filter((s) => riskBand(s.riskScore) === 'high').length,
            accent: 'var(--risk-high)' },
        ],
      };
    }
  }
}

export default function Dashboard() {
  const { persona } = usePersona();
  const { demo } = useDemo();
  const navigate = useNavigate();
  const subjectsQ = useData(getSubjects);
  const alertsQ = useData(getAlerts);

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data) return null;
    const effectiveAlerts = alertsQ.data.map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }));
    return buildKpis(persona.id, subjectsQ.data, effectiveAlerts);
  }, [persona.id, subjectsQ.data, alertsQ.data, demo.alertStates]);

  if (subjectsQ.loading || alertsQ.loading) return <Loading />;
  const error = subjectsQ.error || alertsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'AI risk', sortable: true },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Viewing as {persona.label} <AIBadge /></p>
        </div>
      </div>
      <div className="kpi-grid">
        {model.kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>
      <h2 className="dashboard-queue-title">{model.title}</h2>
      <DataTable columns={columns} rows={model.queue} rowKey="id"
        onRowClick={(s) => navigate(`/cases/${s.id}`)} />
    </div>
  );
}
