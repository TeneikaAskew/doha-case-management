import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSubjects } from '../data/api.js';
import { useData } from '../data/useData.js';
import { usePersona } from '../state/PersonaContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, GUIDELINES, riskBand,
} from '../domain.js';
import DataTable from '../components/DataTable.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import { Loading, ErrorAlert, EmptyState } from '../components/States.jsx';

const PERSONA_STAGE = {
  investigator: 'INVESTIGATION',
  analyst: 'CONTINUOUS_VETTING',
  adjudicator: 'ADJUDICATION',
};

const RISK_ACCENT = {
  low: 'var(--risk-low)', moderate: 'var(--risk-moderate)', high: 'var(--risk-high)',
};

export default function CaseQueue() {
  const { persona } = usePersona();
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();
  const [stage, setStage] = useState(q ? 'ALL' : PERSONA_STAGE[persona.id]);
  const [guideline, setGuideline] = useState('ALL');
  const navigate = useNavigate();
  const { data: subjects, loading, error } = useData(getSubjects);

  const rows = useMemo(() => {
    if (!subjects) return [];
    return subjects.filter((s) =>
      (stage === 'ALL' || s.stage === stage) &&
      (guideline === 'ALL' || s.flaggedGuidelines.includes(guideline)) &&
      (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)));
  }, [subjects, stage, guideline, q]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const columns = [
    { key: 'name', label: 'Subject', sortable: true,
      render: (s) => <div><strong>{s.name}</strong><div className="muted">{s.position}</div></div> },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'stage', label: 'Stage', sortable: true, render: (s) => STAGE_LABELS[s.stage] },
    { key: 'status', label: 'Status',
      render: (s) => <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge> },
    { key: 'riskScore', label: 'AI risk', sortable: true,
      render: (s) => (
        <span className="risk-cell" style={{ '--risk-color': RISK_ACCENT[riskBand(s.riskScore)] }}>
          {s.riskScore}{s.fastTrack && <span className="fast-track" title="AI fast-track candidate"> FT</span>}
        </span>) },
    { key: 'flaggedGuidelines', label: 'Guidelines',
      render: (s) => s.flaggedGuidelines.length
        ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
        : <span className="muted">—</span> },
    { key: 'daysInStage', label: 'Days in stage', sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Case queue</h1>
          <p>{rows.length} case{rows.length === 1 ? '' : 's'}{q && ` matching "${q}"`} <AIBadge /></p>
        </div>
        <div className="queue-filters">
          <label className="form-group">
            <span>Stage</span>
            <select aria-label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="ALL">All stages</option>
              {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="form-group">
            <span>Guideline</span>
            <select aria-label="Guideline" value={guideline}
              onChange={(e) => setGuideline(e.target.value)}>
              <option value="ALL">All guidelines</option>
              {Object.entries(GUIDELINES).map(([k, v]) => (
                <option key={k} value={k}>{k} — {v}</option>))}
            </select>
          </label>
        </div>
      </div>
      {rows.length === 0
        ? <EmptyState title="No cases" message="No cases match the current filters." />
        : <DataTable columns={columns} rows={rows} rowKey="id"
            onRowClick={(s) => navigate(`/cases/${s.id}`)} />}
    </div>
  );
}
