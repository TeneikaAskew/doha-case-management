import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiClipboard } from 'react-icons/fi';
import { getStaff, getSubjects } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import { usePersona } from '../state/PersonaContext.jsx';
import {
  STAFF_ROLE_LABELS, EMPLOYMENT_LABELS, STAFF_STATUS_LABELS,
  STAFF_STATUS_VARIANTS, STAGE_LABELS, utilizationAccent,
  effectiveAssignee, applyAssignments,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';
import { recommendAssignees } from './workforce/recommend.js';

function UtilBar({ pct }) {
  return (
    <div className="wf-bar" title={`${pct}% utilized`}
      role="img" aria-label={`${pct} percent utilized`}>
      <div className="wf-bar-fill"
        style={{ width: `${pct}%`, background: utilizationAccent(pct) }} />
      <span className="wf-bar-label">{pct}%</span>
    </div>
  );
}

function AssignmentPanel({ unassigned, staff, isManager, onAssign }) {
  if (unassigned.length === 0) return null;
  return (
    <div className="card">
      <h3><FiClipboard className="section-icon" aria-hidden="true" />
        Cases Awaiting Assignment <AIBadge /></h3>
      <p className="muted">
        {isManager
          ? 'Recommended assignees are ranked by fit, capacity, and turnaround. Assign the best match or pick another.'
          : 'Recommended assignees are ranked by fit, capacity, and turnaround. Switch to the Manager role to assign.'}
      </p>
      {unassigned.map((subj) => {
        const recos = recommendAssignees(subj, staff).slice(0, 3);
        return (
          <div key={subj.id} className="wf-assign-row">
            <div className="wf-assign-case">
              <strong>{subj.name}</strong>
              <div className="muted">{subj.position}</div>
              <div className="wf-assign-meta">
                <StatusBadge variant="neutral">{subj.tier}</StatusBadge>
                <span className="muted">{STAGE_LABELS[subj.stage]}</span>
                {subj.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
              </div>
            </div>
            <div className="wf-reco-list">
              {recos.map((r, i) => (
                <div key={r.staff.id} className={`wf-reco ${i === 0 ? 'wf-reco-top' : ''}`}>
                  <div className="wf-reco-head">
                    <span>
                      <strong>{r.staff.name}</strong>
                      <span className="muted"> {r.roleLabel}</span>
                    </span>
                    <span className="wf-score" title="Match score">{r.score}</span>
                  </div>
                  <ul className="wf-reasons">
                    {r.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  {isManager && (
                    <button type="button" className="btn btn-primary wf-assign-btn"
                      onClick={() => onAssign(subj.id, r.staff.id)}>
                      Assign to {r.staff.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Workforce() {
  const navigate = useNavigate();
  const { persona } = usePersona();
  const { demo, assignCase } = useDemo();
  const staffQ = useData(getStaff);
  const subjectsQ = useData(getSubjects);
  const [role, setRole] = useState('ALL');
  const [employment, setEmployment] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [availability, setAvailability] = useState('ALL');

  const isManager = persona.id === 'manager';

  const staff = staffQ.data;
  const subjects = subjectsQ.data;

  const model = useMemo(() => {
    if (!staff || !subjects) return null;
    const eff = applyAssignments(staff, subjects, demo.assignments);
    const staffById = Object.fromEntries(eff.map((s) => [s.id, s]));
    const workers = eff.filter((s) => s.role !== 'MANAGER');
    const avg = (arr, key) => (arr.length
      ? Math.round(arr.reduce((n, s) => n + s[key], 0) / arr.length) : 0);
    const unassigned = subjects.filter(
      (s) => !effectiveAssignee(s, demo.assignments, staffById));
    const locations = [...new Set(eff.map((s) => s.location))].sort();
    return {
      eff,
      workers,
      unassigned,
      locations,
      kpis: [
        { label: 'Workforce', value: workers.length, accent: 'var(--dcsa-ocean)' },
        { label: 'Available Now',
          value: workers.filter((s) => s.status === 'AVAILABLE').length,
          accent: 'var(--status-clear)' },
        { label: 'Avg Utilization', value: `${avg(workers, 'utilizationPct')}%`,
          accent: 'var(--status-warning-dark)' },
        { label: 'SLA On-Time', value: `${avg(workers, 'onTimePct')}%`,
          accent: 'var(--dcsa-navy)' },
        { label: 'Awaiting Assignment', value: unassigned.length,
          accent: unassigned.length ? 'var(--status-alert)' : 'var(--status-clear)' },
      ],
    };
  }, [staff, subjects, demo.assignments]);

  if (staffQ.loading || subjectsQ.loading) return <Loading />;
  const error = staffQ.error || subjectsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const rows = model.eff.filter((s) =>
    (role === 'ALL' || s.role === role)
    && (employment === 'ALL' || s.employmentType === employment)
    && (location === 'ALL' || s.location === location)
    && (availability === 'ALL' || s.status === availability));

  const isMgr = (s) => s.role === 'MANAGER';
  const columns = [
    { key: 'name', label: 'Staff', sortable: true,
      render: (s) => (
        <div><strong>{s.name}</strong><div className="muted">{s.team}</div></div>) },
    { key: 'role', label: 'Role', sortable: true,
      render: (s) => STAFF_ROLE_LABELS[s.role] },
    { key: 'employmentType', label: 'Type', sortable: true,
      render: (s) => (
        <StatusBadge variant="neutral">{EMPLOYMENT_LABELS[s.employmentType]}</StatusBadge>) },
    { key: 'status', label: 'Status',
      render: (s) => (
        <StatusBadge variant={STAFF_STATUS_VARIANTS[s.status]}>
          {STAFF_STATUS_LABELS[s.status]}
        </StatusBadge>) },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'tierCoverage', label: 'Tiers',
      render: (s) => (isMgr(s) ? <span className="muted">All</span>
        : s.tierCoverage.join('/')) },
    { key: 'utilizationPct', label: 'Utilization', sortable: true,
      render: (s) => (isMgr(s) ? <span className="muted">-</span>
        : <UtilBar pct={Math.round(s.utilizationPct)} />) },
    { key: 'openCases', label: 'Load',
      render: (s) => (isMgr(s) ? <span className="muted">-</span>
        : `${s.openCases}/${s.capacity}`) },
    { key: 'medianTurnaroundDays', label: 'Median TAT', sortable: true,
      render: (s) => (isMgr(s) ? <span className="muted">-</span>
        : `${s.medianTurnaroundDays}d`) },
    { key: 'onTimePct', label: 'On-time', sortable: true,
      render: (s) => (isMgr(s) ? <span className="muted">-</span>
        : `${Math.round(s.onTimePct)}%`) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Workforce</h1>
          <p>Investigator, analyst, and adjudicator capacity and case assignment</p>
        </div>
        <div className="queue-filters">
          <label className="form-group">
            <span>Role</span>
            <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ALL">All roles</option>
              {Object.entries(STAFF_ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>))}
            </select>
          </label>
          <label className="form-group">
            <span>Type</span>
            <select aria-label="Type" value={employment}
              onChange={(e) => setEmployment(e.target.value)}>
              <option value="ALL">All types</option>
              {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>))}
            </select>
          </label>
          <label className="form-group">
            <span>Location</span>
            <select aria-label="Location" value={location}
              onChange={(e) => setLocation(e.target.value)}>
              <option value="ALL">All locations</option>
              {model.locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="form-group">
            <span>Availability</span>
            <select aria-label="Availability" value={availability}
              onChange={(e) => setAvailability(e.target.value)}>
              <option value="ALL">All</option>
              {Object.entries(STAFF_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>))}
            </select>
          </label>
        </div>
      </div>

      <div className="kpi-grid">
        {model.kpis.map((k) => <KPICard key={k.label} {...k} />)}
      </div>

      <AssignmentPanel unassigned={model.unassigned} staff={model.eff}
        isManager={isManager} onAssign={assignCase} />

      <div className="card">
        <h3><FiUsers className="section-icon" aria-hidden="true" />Staff Roster</h3>
        {rows.length === 0
          ? <EmptyState title="No staff"
              message="No staff match the current filters." />
          : <DataTable columns={columns} rows={rows} rowKey="id"
              onRowClick={(s) => navigate(`/workforce/${s.id}`)} />}
      </div>

      <SectionRef>
        Workforce capacity and assignment support the{' '}
        <RefLink href={REFS.DCSA_PV}>DCSA personnel vetting mission (Trusted
        Workforce 2.0)</RefLink>. Recommended assignees are a demo heuristic over
        role and tier coverage, spare capacity, guideline specialty, and
        historical turnaround; the manager makes the assignment.
      </SectionRef>
    </div>
  );
}
