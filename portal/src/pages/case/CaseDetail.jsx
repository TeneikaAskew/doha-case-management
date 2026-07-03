import { useParams, useSearchParams } from 'react-router-dom';
import { getCase } from '../../data/api.js';
import { useData } from '../../data/useData.js';
import { usePersona } from '../../state/PersonaContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, ELIGIBILITY_LABELS, riskBand,
} from '../../domain.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import { Loading, ErrorAlert } from '../../components/States.jsx';
import OverviewTab from './OverviewTab.jsx';
import GuidelinesTab from './GuidelinesTab.jsx';
import InvestigationTab from './InvestigationTab.jsx';
import AdjudicationTab from './AdjudicationTab.jsx';
import CVTab from './CVTab.jsx';
import DocumentsTab from './DocumentsTab.jsx';
import './case.css';

const TABS = [
  { slug: 'overview', label: 'Overview', component: OverviewTab },
  { slug: 'guidelines', label: 'Guidelines', component: GuidelinesTab },
  { slug: 'investigation', label: 'Investigation', component: InvestigationTab },
  { slug: 'adjudication', label: 'Adjudication', component: AdjudicationTab },
  { slug: 'continuous-vetting', label: 'Continuous vetting', component: CVTab },
  { slug: 'documents', label: 'Documents', component: DocumentsTab },
];

export default function CaseDetail() {
  const { id } = useParams();
  const { persona } = usePersona();
  const [params, setParams] = useSearchParams();
  const { data: caseData, loading, error } = useData(() => getCase(id), [id]);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const active = params.get('tab') || persona.defaultCaseTab;
  const tab = TABS.find((t) => t.slug === active) || TABS[0];
  const TabBody = tab.component;
  const s = caseData.subject;
  const band = riskBand(s.riskScore);

  return (
    <div className="page">
      <div className="card subject-header">
        <div className="subject-main">
          <h1>{s.name}</h1>
          <div className="subject-meta">
            <span>{s.position}</span>
            <span>{s.dob}</span>
            <span>{s.ssn}</span>
            <span>Eligibility: {ELIGIBILITY_LABELS[s.eligibility]}</span>
            <span>{s.tier}</span>
          </div>
          <div className="subject-pills">
            <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge>
            <StatusBadge variant="info">{STAGE_LABELS[s.stage]}</StatusBadge>
            {s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
          </div>
        </div>
        <div className={`risk-dial risk-${band}`} title="AI triage risk score (0-100)">
          <span className="risk-dial-value">{s.riskScore}</span>
          <span className="risk-dial-label">AI risk</span>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button key={t.slug} role="tab" aria-selected={t.slug === tab.slug}
            className={`tab-button ${t.slug === tab.slug ? 'active' : ''}`}
            onClick={() => setParams({ tab: t.slug })}>
            {t.label}
          </button>
        ))}
      </div>

      <TabBody caseData={caseData} />
    </div>
  );
}
