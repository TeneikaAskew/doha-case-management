import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiFileText, FiDollarSign, FiCreditCard, FiAlertTriangle, FiGlobe, FiAlertOctagon,
  FiKey, FiUserX, FiActivity, FiUserCheck, FiSliders, FiRotateCcw,
} from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_STATE_VARIANTS, ALERT_TRANSITIONS,
  ALERT_ACTION_LABELS,
} from '../../domain.js';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import ConfidenceBar from '../../components/ConfidenceBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import SourceChip from '../../components/SourceChip.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import { EmptyState } from '../../components/States.jsx';
import SectionRef, { RefLink } from '../../components/SectionRef.jsx';
import { REFS } from '../../references.js';

const CATEGORY_ICONS = {
  FINANCIAL: FiDollarSign,
  CREDIT: FiCreditCard,
  CRIMINAL: FiAlertTriangle,
  FOREIGN_TRAVEL: FiGlobe,
  TERRORISM: FiAlertOctagon,
  ELIGIBILITY: FiKey,
  SUITABILITY: FiUserX,
};

const PHASE_CHAIN = ['NEW', 'IDENTITY_CONFIRMED', 'VALIDATED', 'REFERRED', 'ADJUDICATED'];

function AlertPhases({ alert: a, state }) {
  const history = [...(a.history || [])];
  if (!history.length) return null;
  if (state !== history[history.length - 1].state) {
    history.push({ state, date: '2026-07-02', actor: 'You (demo session)', note: null });
  }
  const last = history[history.length - 1].state;
  const upcoming = (last === 'CLOSED' || last === 'ADJUDICATED')
    ? [] : PHASE_CHAIN.slice(PHASE_CHAIN.indexOf(last) + 1);
  const adjudicated = [...history].reverse().find((p) => p.state === 'ADJUDICATED');
  return (
    <div className="alert-phases">
      <h4 className="alert-phases-h">Phases</h4>
      <ol className="alert-stepper">
        {history.map((p, i) => (
          <li key={`done-${i}`} className="done">
            <span className="alert-step-marker" aria-hidden="true" />
            <span className="alert-step-state">{ALERT_STATE_LABELS[p.state]}</span>
            <span className="alert-step-meta">{p.date}, {p.actor}</span>
            {p.note && <span className="alert-step-note muted">{p.note}</span>}
          </li>
        ))}
        {upcoming.map((s) => (
          <li key={s} className="todo">
            <span className="alert-step-marker" aria-hidden="true" />
            <span className="alert-step-state">{ALERT_STATE_LABELS[s]}</span>
            <span className="alert-step-meta">-</span>
          </li>
        ))}
      </ol>
      {adjudicated && (
        <p className="alert-adjudicated">
          Adjudicated by <strong>{adjudicated.actor}</strong> on{' '}
          {adjudicated.date}
          {adjudicated.note && <span className="muted"> - {adjudicated.note}</span>}
        </p>
      )}
    </div>
  );
}

function AlertBody({ alert: a, state, isAnalyst, dispositionAlert }) {
  const [openDoc, setOpenDoc] = useState(null);

  return (
    <>
      <p className="muted">
        <SourceChip provider={a.provider} />
        {' '}| Severity: {a.severity} | AI priority {a.priorityScore}
        {' '}<AIBadge />
      </p>

      <div className="cv-steps">
        <div className="cv-step">
          <h4><FiUserCheck className="section-icon" aria-hidden="true" />Step 1 - Identity match</h4>
          <ConfidenceBar value={a.identityMatch.confidence} />
          <table className="inline-table">
            <thead><tr><th>Identifier</th><th>Subject</th><th>Record</th><th>Match</th></tr></thead>
            <tbody>
              {a.identityMatch.identifiers.map((idf) => (
                <tr key={idf.field}>
                  <td className="identity-field">
                    {idf.field}
                    {idf.score != null && (
                      <span className="identity-score">{Math.round(idf.score * 100)}%</span>
                    )}
                  </td>
                  <td>{idf.subjectValue}</td><td>{idf.recordValue}</td>
                  <td><StatusBadge variant={idf.match ? 'success' : 'error'}>
                    {idf.match ? 'Match' : 'No match'}
                  </StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cv-step">
          <h4><FiSliders className="section-icon" aria-hidden="true" />Step 2 - Investigative-standard threshold</h4>
          <p><strong>{a.threshold.rule}</strong>{' '}
            <StatusBadge variant={a.threshold.met ? 'error' : 'success'}>
              {a.threshold.met ? 'Threshold met' : 'Below threshold'}
            </StatusBadge></p>
          <p className="muted">{a.threshold.detail}</p>
        </div>

        <div className="cv-step">
          <h4><FiRotateCcw className="section-icon" aria-hidden="true" />Step 3 - Prior adjudication check</h4>
          <p>
            <StatusBadge variant={a.priorAdjudication.previouslyAdjudicated
              ? 'neutral' : 'info'}>
              {a.priorAdjudication.previouslyAdjudicated
                ? 'Previously adjudicated' : 'Not previously adjudicated'}
            </StatusBadge>
            {a.priorAdjudication.reference && (
              <span className="muted"> - {a.priorAdjudication.reference}</span>)}
          </p>
        </div>
      </div>

      {(a.documents || []).length > 0 && (
        <>
          <div className="cv-actions">
            {a.documents.map((d) => (
              <button key={d.url} type="button" className="btn btn-ghost"
                onClick={() => setOpenDoc(openDoc === d.url ? null : d.url)}>
                <FiFileText aria-hidden="true" /> Source document: {d.title}
              </button>
            ))}
          </div>
          {openDoc && <DocumentViewer url={openDoc} />}
        </>
      )}

      {isAnalyst && ALERT_TRANSITIONS[state].length > 0 && (
        <div className="cv-actions">
          {ALERT_TRANSITIONS[state].map((next) => (
            <button key={next} type="button"
              className={next === 'CLOSED' ? 'btn btn-ghost' : 'btn btn-secondary'}
              onClick={() => dispositionAlert(a.id, next, a.state)}>
              {ALERT_ACTION_LABELS[next]}
            </button>
          ))}
        </div>
      )}

      <AlertPhases alert={a} state={state} />
    </>
  );
}

export default function CVTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, dispositionAlert } = useDemo();
  const [params] = useSearchParams();
  const focusId = params.get('alert');

  if (!caseData.alerts.length) {
    return <EmptyState title="No CV alerts"
      message="Continuous vetting has produced no alerts for this subject." />;
  }

  return (
    <div>
      {caseData.alerts.map((a) => {
        const state = demo.alertStates[a.id] || a.state;
        const CategoryIcon = CATEGORY_ICONS[a.category] || FiActivity;
        return (
          <CollapsibleSection key={a.id}
            title={`${ALERT_CATEGORY_LABELS[a.category]} - ${a.description}`}
            meta={<>
              <StatusBadge variant={ALERT_STATE_VARIANTS[state]}>
                {ALERT_STATE_LABELS[state]}
              </StatusBadge>
              <span className="muted">{a.receivedDate}</span>
            </>}
            icon={<CategoryIcon />}
            defaultOpen={a.id === focusId}>
            <AlertBody alert={a} state={state} isAnalyst={persona.id === 'analyst'}
              dispositionAlert={dispositionAlert} />
          </CollapsibleSection>
        );
      })}
      <SectionRef>
        Continuous vetting under <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>;
        enrollment and automated checks per{' '}
        <RefLink href={REFS.DCSA_CV}>DCSA Continuous Vetting</RefLink>.
      </SectionRef>
    </div>
  );
}
