import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import { getCase, getStaff } from '../../data/api.js';
import { useData } from '../../data/useData.js';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import {
  STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS, ELIGIBILITY_LABELS, riskBand,
  effectiveAssignee,
} from '../../domain.js';
import { recommendAssignees } from '../workforce/recommend.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import { Loading, ErrorAlert } from '../../components/States.jsx';
import SectionRef from '../../components/SectionRef.jsx';
import OverviewTab from './OverviewTab.jsx';
import GuidelinesTab from './GuidelinesTab.jsx';
import InvestigationTab from './InvestigationTab.jsx';
import AdjudicationTab from './AdjudicationTab.jsx';
import CVTab from './CVTab.jsx';
import StandardFormTab from './StandardFormTab.jsx';
import DocumentsTab from './DocumentsTab.jsx';
import AskCaseTab from './AskCaseTab.jsx';
import './case.css';

const TABS = [
  { slug: 'overview', label: 'Overview', component: OverviewTab },
  { slug: 'guidelines', label: 'Guidelines', component: GuidelinesTab },
  { slug: 'investigation', label: 'Investigation', component: InvestigationTab },
  { slug: 'adjudication', label: 'Adjudication', component: AdjudicationTab },
  { slug: 'continuous-vetting', label: 'Continuous Vetting', component: CVTab },
  { slug: 'standard-form', label: 'SF / PVQ', component: StandardFormTab },
  { slug: 'documents', label: 'Documents', component: DocumentsTab },
  { slug: 'ask', label: 'Ask the Case', Icon: FiMessageCircle, component: AskCaseTab },
];

export default function CaseDetail() {
  const { id } = useParams();
  const { persona } = usePersona();
  const { demo, assignCase } = useDemo();
  const [params, setParams] = useSearchParams();
  const { data: caseData, loading, error } = useData(() => getCase(id), [id]);
  const staffQ = useData(getStaff);

  if (loading || staffQ.loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const active = params.get('tab') || persona.defaultCaseTab;
  const tab = TABS.find((t) => t.slug === active) || TABS[0];
  const TabBody = tab.component;
  const s = caseData.subject;
  const band = riskBand(s.riskScore);
  const staff = staffQ.data || [];
  const staffById = Object.fromEntries(staff.map((m) => [m.id, m]));
  const assignee = effectiveAssignee(s, demo.assignments, staffById);
  const isManager = persona.id === 'manager';
  const recos = recommendAssignees(s, staff);

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
            <span className="subject-tier">{s.tier}</span>
          </div>
          <div className="subject-pills">
            <StatusBadge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</StatusBadge>
            <StatusBadge variant="neutral">{STAGE_LABELS[s.stage]}</StatusBadge>
            {s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)}
          </div>
          <div className="subject-assignment">
            <span className="muted">Assignee:</span>
            {assignee
              ? <Link to={`/workforce/${assignee.staffId}`}>{assignee.name}</Link>
              : <em className="muted">Unassigned</em>}
            {isManager && recos.length > 0 && (
              <label className="subject-reassign">
                <span className="form-label-inline">
                  {assignee ? 'Reassign' : 'Assign'}
                </span>
                <select aria-label="Assign case" value={assignee?.staffId || ''}
                  onChange={(e) => assignCase(s.id, e.target.value)}>
                  {!assignee && <option value="" disabled>Select assignee</option>}
                  {recos.map((r) => (
                    <option key={r.staff.id} value={r.staff.id}>
                      {r.staff.name} - {r.roleLabel} ({r.score})
                    </option>))}
                </select>
              </label>
            )}
          </div>
        </div>
        <div className="risk-dial-wrap">
          <div className={`risk-dial risk-${band}`} title="AI triage risk score (0-100)">
            <span className="risk-dial-value">{s.riskScore}</span>
            <span className="risk-dial-label">Risk score</span>
          </div>
          <Link className="risk-dial-caption" to="/help#scoring">
            Based on weighted risk factors
          </Link>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button key={t.slug} role="tab" aria-selected={t.slug === tab.slug}
            className={`tab-button ${t.slug === tab.slug ? 'active' : ''}`}
            onClick={() => setParams({ tab: t.slug })}>
            {t.Icon && <t.Icon className="tab-icon" aria-hidden="true" />}
            {t.label}
          </button>
        ))}
      </div>

      <TabBody caseData={caseData} />
      <SectionRef>
        The &quot;Viewing as&quot; role sets the opening tab and unlocks its
        actions: Investigator adds ROI entries on Investigation, Analyst
        dispositions alerts on Continuous Vetting, Adjudicator rates
        whole-person factors and records decisions on Adjudication.
      </SectionRef>
    </div>
  );
}
