import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTrendingUp, FiPieChart, FiAlertCircle, FiUsers,
} from 'react-icons/fi';
import { getSubjects, getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, riskBand,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import Toggle from '../components/Toggle.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const STAGES = ['INITIATION', 'INVESTIGATION', 'ADJUDICATION', 'CONTINUOUS_VETTING'];
const STATUS_RANK = { ACTION_REQUIRED: 0, NEEDS_REVIEW: 1, CLEAR: 2 };
const BANDS = [
  // bg: light tint fill; ink: dark AA text on the tint; swatch: true hue for the legend
  { id: 'low', label: 'Low (<40)', bg: 'var(--risk-low-bg)', ink: 'var(--risk-low)',
    swatch: 'var(--risk-low)' },
  { id: 'moderate', label: 'Moderate (40-74)',
    bg: 'var(--risk-moderate-bg)', ink: 'var(--status-warning-dark)',
    swatch: 'var(--risk-moderate)' },
  { id: 'high', label: 'High (75+)', bg: 'var(--risk-high-bg)', ink: 'var(--risk-high)',
    swatch: 'var(--risk-high)' },
];

export default function SubjectsHome() {
  const navigate = useNavigate();
  const { demo } = useDemo();
  const subjectsQ = useData(getSubjects);
  const alertsQ = useData(getAlerts);
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [cvOnly, setCvOnly] = useState(false);
  const [alertsOnly, setAlertsOnly] = useState(false);

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data) return null;
    const openBySubject = {};
    for (const a of alertsQ.data) {
      const state = demo.alertStates[a.id] || a.state;
      if (!['ADJUDICATED', 'CLOSED'].includes(state)) {
        openBySubject[a.subjectId] = (openBySubject[a.subjectId] || 0) + 1;
      }
    }
    const subjects = subjectsQ.data.map((s) => ({
      ...s, effectiveOpenAlerts: openBySubject[s.id] || 0,
    }));
    const attention = subjects
      .filter((s) => s.status !== 'CLEAR' || s.effectiveOpenAlerts > 0)
      .sort((a, b) =>
        STATUS_RANK[a.status] - STATUS_RANK[b.status]
        || b.effectiveOpenAlerts - a.effectiveOpenAlerts
        || b.riskScore - a.riskScore)
      .slice(0, 5);
    return { subjects, attention };
  }, [subjectsQ.data, alertsQ.data, demo.alertStates]);

  if (subjectsQ.loading || alertsQ.loading) return <Loading />;
  const error = subjectsQ.error || alertsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const { subjects, attention } = model;
  const stageCount = (st) => subjects.filter((s) => s.stage === st).length;
  const bandCount = (b) => subjects.filter((s) => riskBand(s.riskScore) === b).length;

  const directory = subjects
    .filter((s) => `${s.name} ${s.position}`.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => stageFilter === 'ALL' || s.stage === stageFilter)
    .filter((s) => !cvOnly || s.cvEnrolled)
    .filter((s) => !alertsOnly || s.effectiveOpenAlerts > 0);

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'Risk score', sortable: true },
    { key: 'cvEnrolled', label: 'CV',
      render: (s) => (s.cvEnrolled ? <StatusBadge variant="success">Enrolled</StatusBadge>
        : <span className="muted">-</span>) },
    { key: 'effectiveOpenAlerts', label: 'Alerts', sortable: true },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Whole-person view of the vetted population <AIBadge /></p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Subjects" value={subjects.length}
          accent="var(--dcsa-navy)" />
        <KPICard label="CV Subjects"
          value={subjects.filter((s) => s.cvEnrolled).length}
          accent="var(--dcsa-ocean)" />
        <KPICard label="Initial Vetting Backlog"
          value={subjects.filter((s) => ['INITIATION', 'INVESTIGATION'].includes(s.stage)).length}
          accent="var(--dcsa-gold)" />
        <KPICard label="Awaiting Adjudication" value={stageCount('ADJUDICATION')}
          accent="var(--status-warning)" />
        <KPICard label="Open Alerts"
          value={subjects.filter((s) => s.effectiveOpenAlerts > 0).length}
          accent="var(--status-alert)" />
      </div>

      <div className="card">
        <h3><FiTrendingUp className="section-icon" aria-hidden="true" />Vetting Pipeline</h3>
        <div className="pipeline-strip">
          {STAGES.map((st) => (
            <Link key={st} className="pipeline-segment" to={`/cases?stage=${st}`}>
              <span className="pipeline-count">{stageCount(st)}</span>
              <span className="pipeline-label">{STAGE_LABELS[st]}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h3><FiPieChart className="section-icon" aria-hidden="true" />AI Risk Distribution</h3>
        <div className="risk-bar" role="img"
          aria-label={BANDS.map((b) => `${b.label}: ${bandCount(b.id)}`).join(', ')}>
          {BANDS.map((b) => bandCount(b.id) > 0 && (
            <div key={b.id} className="risk-bar-segment"
              style={{ flex: bandCount(b.id), '--band-bg': b.bg, '--band-ink': b.ink }}>
              {bandCount(b.id)}
            </div>
          ))}
        </div>
        <div className="risk-bar-legend">
          {BANDS.map((b) => (
            <span key={b.id} className="risk-bar-key" style={{ '--band-swatch': b.swatch }}>
              {b.label}: {bandCount(b.id)}
            </span>
          ))}
        </div>
      </div>

      <h2 className="dashboard-queue-title">
        <FiAlertCircle className="section-icon" aria-hidden="true" />Needs Attention
      </h2>
      <div className="attention-grid">
        {attention.map((s) => (
          <button key={s.id} type="button" className="card card-interactive attention-card"
            data-testid="attention-card" onClick={() => navigate(`/cases/${s.id}`)}>
            <div className="attention-head">
              <div>
                <strong>{s.name}</strong>
                <div className="muted">{s.position}</div>
              </div>
              <div className={`risk-dial risk-${riskBand(s.riskScore)} risk-dial-sm`}
                aria-label={`Risk score ${s.riskScore} of 100`}>
                <span className="risk-dial-value">{s.riskScore}</span>
              </div>
            </div>
            <div className="subject-pills">
              <StatusBadge variant="neutral">{STAGE_LABELS[s.stage]}</StatusBadge>
              <StatusBadge variant={STATUS_VARIANTS[s.status]}>
                {STATUS_LABELS[s.status]}
              </StatusBadge>
              {s.effectiveOpenAlerts > 0 && (
                <StatusBadge variant="alerts">
                  {s.effectiveOpenAlerts} open alert{s.effectiveOpenAlerts > 1 ? 's' : ''}
                </StatusBadge>
              )}
              {s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
            </div>
          </button>
        ))}
      </div>

      <h2 className="dashboard-queue-title">
        <FiUsers className="section-icon" aria-hidden="true" />Subject Directory
      </h2>
      <div className="card directory-filters">
        <label className="form-group directory-search">
          <span>Search</span>
          <input type="search" aria-label="Search subjects in directory" value={q}
            onChange={(e) => setQ(e.target.value)} placeholder="Name or position..." />
        </label>
        <label className="form-group">
          <span>Stage</span>
          <select aria-label="Directory stage filter" value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}>
            <option value="ALL">All stages</option>
            {STAGES.map((st) => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
          </select>
        </label>
        <div className="directory-check">
          <Toggle checked={cvOnly} onChange={(e) => setCvOnly(e.target.checked)}
            label="CV-enrolled only" />
        </div>
        <div className="directory-check">
          <Toggle checked={alertsOnly} onChange={(e) => setAlertsOnly(e.target.checked)}
            label="Has open alerts" />
        </div>
      </div>
      <DataTable columns={columns} rows={directory} rowKey="id"
        onRowClick={(s) => navigate(`/cases/${s.id}`)} />
      <SectionRef>
        Vetting lifecycle per{' '}
        <RefLink href={REFS.DCSA_PV}>DCSA Personnel Vetting (Trusted Workforce
        2.0)</RefLink>; continuous vetting under{' '}
        <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>.
      </SectionRef>
    </div>
  );
}
