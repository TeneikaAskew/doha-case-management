import { useState } from 'react';
import { FiFlag, FiSliders, FiArchive, FiFileText } from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import { ADJ_ACTION_LABELS } from '../../domain.js';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import SeverityBadge from '../../components/SeverityBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import WholePersonWorksheet from './WholePersonWorksheet.jsx';
import SectionRef, { RefLink } from '../../components/SectionRef.jsx';
import { REFS } from '../../references.js';

export default function AdjudicationTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, recordDecision } = useDemo();
  const adj = caseData.adjudication;
  const caseId = caseData.subject.id;
  const [action, setAction] = useState('GRANT');
  const [rationale, setRationale] = useState('');

  const decisions = [...adj.decisions, ...(demo.decisions[caseId] || [])];

  const submit = (e) => {
    e.preventDefault();
    if (!rationale.trim()) return;
    recordDecision(caseId, {
      date: '2026-07-02', adjudicator: 'Demo adjudicator',
      action, rationale: rationale.trim(),
    });
    setRationale('');
  };

  return (
    <div>
      <div className="card recommendation-panel">
        <h3><FiFlag className="section-icon" aria-hidden="true" />Recommendation {adj.recommendation.aiSuggested && <AIBadge />}</h3>
        <p className="recommendation-action">{ADJ_ACTION_LABELS[adj.recommendation.action]}</p>
        <p>{adj.recommendation.rationale}</p>
      </div>

      <div className="card">
        <h3><FiSliders className="section-icon" aria-hidden="true" />Guideline Weighing</h3>
        <table className="inline-table">
          <thead>
            <tr><th>Guideline</th><th>Severity</th><th>Disqualifiers</th>
              <th>Full mitigation</th></tr>
          </thead>
          <tbody>
            {caseData.guidelines.map((g) => (
              <tr key={g.code}>
                <td><strong>{g.code}</strong> {g.name}</td>
                <td><SeverityBadge level={g.severity} /></td>
                <td>{g.disqualifiers.length}</td>
                <td>{g.mitigators.filter((m) => m.applicability === 'FULL').length}
                  {' '}of {g.mitigators.length}</td>
              </tr>
            ))}
            {caseData.guidelines.length === 0 && (
              <tr><td colSpan={4} className="muted">No guidelines flagged.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <WholePersonWorksheet caseData={caseData} />

      {adj.sorDraft && (
        <CollapsibleSection title="Statement of Reasons - draft" meta={<AIBadge />}
          icon={<FiFileText />}>
          <pre className="sor-draft">{adj.sorDraft}</pre>
        </CollapsibleSection>
      )}

      <div className="card">
        <h3><FiArchive className="section-icon" aria-hidden="true" />Decision History</h3>
        {decisions.length === 0 && <p className="muted">No decisions recorded.</p>}
        <ul className="decision-list">
          {decisions.map((d, i) => (
            <li key={i}>
              <span className="muted">{d.date}, {d.adjudicator}</span>
              <div><strong>{ADJ_ACTION_LABELS[d.action]}</strong> - {d.rationale}</div>
            </li>
          ))}
        </ul>
        {persona.id === 'adjudicator' && (
          <form className="decision-form" onSubmit={submit}>
            <label className="form-group">
              <span>Decision</span>
              <select aria-label="Decision" value={action}
                onChange={(e) => setAction(e.target.value)}>
                {Object.entries(ADJ_ACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>))}
              </select>
            </label>
            <label className="form-group decision-rationale">
              <span>Rationale</span>
              <textarea aria-label="Rationale" rows={2} value={rationale}
                onChange={(e) => setRationale(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary">Record decision</button>
          </form>
        )}
        <SectionRef>
          Adjudication standards per <RefLink href={REFS.SEAD4}>SEAD 4</RefLink>;
          LOI/SOR due process for contractor cases administered by{' '}
          <RefLink href={REFS.DOHA}>DOHA</RefLink>.
        </SectionRef>
      </div>
    </div>
  );
}
