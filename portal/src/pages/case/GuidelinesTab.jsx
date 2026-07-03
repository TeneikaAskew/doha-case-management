import {
  FiExternalLink, FiShield, FiZap, FiFolder, FiAlertCircle, FiCheckCircle, FiBookOpen,
} from 'react-icons/fi';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import SeverityBadge from '../../components/SeverityBadge.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import { EmptyState } from '../../components/States.jsx';
import SectionRef, { RefLink } from '../../components/SectionRef.jsx';
import { REFS } from '../../references.js';

const APPLICABILITY_VARIANT = { FULL: 'success', PARTIAL: 'warning', NONE: 'error' };
const OUTCOME_VARIANT = { GRANTED: 'success', DENIED: 'error' };

export default function GuidelinesTab({ caseData }) {
  const { guidelines } = caseData;
  if (!guidelines.length) {
    return <EmptyState title="No adjudicative guidelines flagged"
      message="No disqualifying information has been developed against any SEAD-4 guideline." />;
  }
  return (
    <div>
      {guidelines.map((g, i) => (
        <CollapsibleSection key={g.code}
          title={`${g.code} - ${g.name}`}
          meta={<SeverityBadge level={g.severity} />}
          icon={<FiShield />}
          defaultOpen={i === 0}>
          <div className="guideline-ai card-inset">
            <h4><FiZap className="section-icon" aria-hidden="true" />AI assessment <AIBadge /></h4>
            <p>{g.aiReasoning}</p>
          </div>

          <h4><FiFolder className="section-icon" aria-hidden="true" />Evidence</h4>
          <table className="inline-table">
            <thead><tr><th>Provider</th><th>Type</th><th>Description</th><th>Date</th></tr></thead>
            <tbody>
              {g.evidence.map((e, j) => (
                <tr key={j}>
                  <td>{e.provider}</td><td>{e.type}</td>
                  <td>{e.description}</td><td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4><FiAlertCircle className="section-icon" aria-hidden="true" />Disqualifying conditions</h4>
          <ul className="condition-list">
            {g.disqualifiers.map((d) => (
              <li key={d.code} className="condition disqualifier">
                <strong>{d.code}</strong> - {d.description}
                <div className="muted">Evidence: {d.evidence}</div>
              </li>
            ))}
          </ul>

          <h4><FiCheckCircle className="section-icon" aria-hidden="true" />Mitigating conditions</h4>
          <ul className="condition-list">
            {g.mitigators.map((m) => (
              <li key={m.code} className="condition mitigator">
                <strong>{m.code}</strong> - {m.description}{' '}
                <StatusBadge variant={APPLICABILITY_VARIANT[m.applicability]}>
                  {m.applicability}
                </StatusBadge>
                <div className="muted">{m.reasoning}</div>
              </li>
            ))}
          </ul>

          <h4><FiBookOpen className="section-icon" aria-hidden="true" />DOHA precedents <AIBadge /></h4>
          <table className="inline-table">
            <thead><tr><th>Case</th><th>Outcome</th><th>Year</th><th>Relevance</th></tr></thead>
            <tbody>
              {g.precedents.map((p) => (
                <tr key={p.caseNumber}>
                  <td>
                    {p.sourceUrl ? (
                      <a href={p.sourceUrl} target="_blank" rel="noreferrer"
                        title="Open official DOHA decision (PDF)">
                        {p.caseNumber} <FiExternalLink aria-hidden="true" />
                      </a>
                    ) : p.caseNumber}
                  </td>
                  <td><StatusBadge variant={OUTCOME_VARIANT[p.outcome] || 'neutral'}>
                    {p.outcome}</StatusBadge></td>
                  <td>{p.year ?? '-'}</td>
                  <td>{p.relevance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CollapsibleSection>
      ))}
      <SectionRef>
        Disqualifying and mitigating conditions per{' '}
        <RefLink href={REFS.SEAD4}>SEAD 4, National Security Adjudicative
        Guidelines</RefLink>; precedents from{' '}
        <RefLink href={REFS.DOHA_DECISIONS}>DOHA Industrial Security Clearance
        Decisions</RefLink>.
      </SectionRef>
    </div>
  );
}
