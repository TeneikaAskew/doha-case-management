import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList } from 'react-icons/fi';
import { getSubjects, getAlerts, getStaff } from '../data/api.js';
import { useData } from '../data/useData.js';
import { usePersona } from '../state/PersonaContext.jsx';
import { useDemo } from '../state/DemoContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, riskBand, effectiveAssignee,
  effectiveStage,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

function buildKpis(personaId, subjects, alerts, staff, assignments) {
  const inStage = (st) => subjects.filter(
    (s) => effectiveStage(s, assignments) === st);
  const openAlerts = alerts.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.state));
  if (personaId === 'manager') {
    const staffById = Object.fromEntries((staff || []).map((s) => [s.id, s]));
    const workers = (staff || []).filter((s) => s.role !== 'MANAGER');
    const avg = (key) => (workers.length
      ? Math.round(workers.reduce((n, s) => n + s[key], 0) / workers.length) : 0);
    const unassigned = subjects.filter(
      (s) => !effectiveAssignee(s, assignments, staffById));
    return {
      queue: unassigned,
      title: 'Cases Awaiting Assignment',
      kpis: [
        { label: 'Workforce', value: workers.length, accent: 'var(--dcsa-ocean)' },
        { label: 'Available Now',
          value: workers.filter((s) => s.status === 'AVAILABLE').length,
          accent: 'var(--status-clear)' },
        { label: 'Avg Utilization', value: `${avg('utilizationPct')}%`,
          accent: 'var(--status-warning-dark)' },
        { label: 'Awaiting Assignment', value: unassigned.length,
          accent: unassigned.length ? 'var(--status-alert)' : 'var(--status-clear)' },
      ],
    };
  }
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
  const staffQ = useData(getStaff);

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data || !staffQ.data) return null;
    const effectiveAlerts = alertsQ.data.map((a) => ({ ...a, state: demo.alertStates[a.id] || a.state }));
    return buildKpis(persona.id, subjectsQ.data, effectiveAlerts, staffQ.data,
      demo.assignments);
  }, [persona.id, subjectsQ.data, alertsQ.data, staffQ.data, demo.alertStates,
    demo.assignments]);

  if (subjectsQ.loading || alertsQ.loading || staffQ.loading) return <Loading />;
  const error = subjectsQ.error || alertsQ.error || staffQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'Risk score', sortable: true },
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
      <h2 className="dashboard-queue-title">
        <FiList className="section-icon" aria-hidden="true" />{model.title}
      </h2>
      <DataTable columns={columns} rows={model.queue} rowKey="id"
        onRowClick={(s) => navigate(`/cases/${s.id}`)} />
      <SectionRef>
        Workload stages per{' '}
        <RefLink href={REFS.DCSA_PV}>DCSA Personnel Vetting (Trusted Workforce
        2.0)</RefLink>. Change the &quot;Viewing as&quot; role in the header to
        see the cases and KPIs for each stage: Investigator (investigation),
        Analyst (continuous vetting), Adjudicator (adjudication).
      </SectionRef>
    </div>
  );
}
