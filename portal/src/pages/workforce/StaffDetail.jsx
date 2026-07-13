import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiBriefcase } from 'react-icons/fi';
import { getStaff, getSubjects } from '../../data/api.js';
import { useData } from '../../data/useData.js';
import { useDemo } from '../../state/DemoContext.jsx';
import {
  STAFF_ROLE_LABELS, EMPLOYMENT_LABELS, STAFF_STATUS_LABELS,
  STAFF_STATUS_VARIANTS, STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS,
  utilizationAccent, effectiveAssignee, applyAssignments,
} from '../../domain.js';
import KVGrid from '../../components/KVGrid.jsx';
import DataTable from '../../components/DataTable.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import { Loading, ErrorAlert, EmptyState } from '../../components/States.jsx';

export default function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { demo } = useDemo();
  const staffQ = useData(getStaff);
  const subjectsQ = useData(getSubjects);

  const model = useMemo(() => {
    if (!staffQ.data || !subjectsQ.data) return null;
    const eff = applyAssignments(staffQ.data, subjectsQ.data, demo.assignments);
    const person = eff.find((s) => s.id === id);
    if (!person) return { missing: true };
    const staffById = Object.fromEntries(eff.map((s) => [s.id, s]));
    const caseload = subjectsQ.data.filter((subj) => {
      const owner = effectiveAssignee(subj, demo.assignments, staffById);
      return owner && owner.staffId === id;
    });
    return { person, caseload };
  }, [staffQ.data, subjectsQ.data, id, demo.assignments]);

  if (staffQ.loading || subjectsQ.loading) return <Loading />;
  const error = staffQ.error || subjectsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;
  if (model.missing) {
    return <div className="page"><ErrorAlert message={`Staff not found: ${id}`} /></div>;
  }

  const { person: p, caseload } = model;
  const isManager = p.role === 'MANAGER';
  const util = Math.round(p.utilizationPct);

  const caseColumns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'stage', label: 'Stage', render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => (s.flaggedGuidelines.length
        ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
        : <span className="muted">-</span>) },
  ];

  const profileItems = [
    { label: 'Role', value: STAFF_ROLE_LABELS[p.role] },
    { label: 'Staff type', value: EMPLOYMENT_LABELS[p.employmentType] },
    { label: 'Team', value: p.team },
    { label: 'Location', value: p.location },
    { label: 'Tier coverage', value: isManager ? 'All tiers' : p.tierCoverage.join(', ') },
    { label: 'Specialties',
      value: p.specialties.length
        ? p.specialties.map((g) => <GuidelineChip key={g} code={g} />)
        : 'General' },
    { label: 'Next available', value: p.nextAvailable },
  ];

  return (
    <div className="page">
      <Link className="provider-back" to="/workforce">
        <FiArrowLeft aria-hidden="true" /> Workforce
      </Link>
      <div className="page-header">
        <div>
          <h1>{p.name}</h1>
          <p className="provider-meta">
            {STAFF_ROLE_LABELS[p.role]} - {p.team}
          </p>
        </div>
        <StatusBadge variant={STAFF_STATUS_VARIANTS[p.status]}>
          {STAFF_STATUS_LABELS[p.status]}
        </StatusBadge>
      </div>

      {!isManager && (
        <div className="kpi-grid">
          <div className="card wf-stat">
            <div className="wf-stat-label">Utilization</div>
            <div className="wf-bar wf-bar-lg" role="img"
              aria-label={`${util} percent utilized`}>
              <div className="wf-bar-fill"
                style={{ width: `${util}%`, background: utilizationAccent(util) }} />
              <span className="wf-bar-label">{util}%</span>
            </div>
            <div className="muted">{p.openCases} of {p.capacity} cases</div>
          </div>
          <div className="card wf-stat">
            <div className="wf-stat-label">Median Turnaround</div>
            <div className="wf-stat-value">{p.medianTurnaroundDays}d</div>
          </div>
          <div className="card wf-stat">
            <div className="wf-stat-label">On-Time (SLA)</div>
            <div className="wf-stat-value">{Math.round(p.onTimePct)}%</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3><FiUser className="section-icon" aria-hidden="true" />Profile</h3>
        <KVGrid items={profileItems} />
      </div>

      <div className="card">
        <h3><FiBriefcase className="section-icon" aria-hidden="true" />
          Current Caseload</h3>
        {caseload.length === 0
          ? <EmptyState title="No assigned cases"
              message={isManager
                ? 'Managers assign work rather than carry a caseload.'
                : 'This person has no demo cases assigned.'} />
          : <DataTable columns={caseColumns} rows={caseload} rowKey="id"
              onRowClick={(s) => navigate(`/cases/${s.id}`)} />}
      </div>
    </div>
  );
}
