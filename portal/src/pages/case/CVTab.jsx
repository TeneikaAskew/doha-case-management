import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import {
  ALERT_CATEGORY_LABELS, ALERT_STATE_LABELS, ALERT_TRANSITIONS, ALERT_ACTION_LABELS,
} from '../../domain.js';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import ConfidenceBar from '../../components/ConfidenceBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import { EmptyState } from '../../components/States.jsx';

const STATE_VARIANT = {
  NEW: 'warning', IDENTITY_CONFIRMED: 'info', VALIDATED: 'info',
  REFERRED: 'warning', ADJUDICATED: 'success', CLOSED: 'neutral',
};

function AlertBody({ alert: a, state, isAnalyst, dispositionAlert }) {
  const [docOpen, setDocOpen] = useState(false);

  return (
    <>
      <p className="muted">
        Provider: {a.provider} · Severity: {a.severity} · AI priority {a.priorityScore}
        {' '}<AIBadge />
      </p>

      <div className="cv-steps">
        <div className="cv-step">
          <h4>Step 1 — Identity match</h4>
          <ConfidenceBar value={a.identityMatch.confidence} />
          <table className="inline-table">
            <thead><tr><th>Identifier</th><th>Subject</th><th>Record</th><th>Match</th></tr></thead>
            <tbody>
              {a.identityMatch.identifiers.map((idf) => (
                <tr key={idf.field}>
                  <td>{idf.field}</td><td>{idf.subjectValue}</td><td>{idf.recordValue}</td>
                  <td><StatusBadge variant={idf.match ? 'success' : 'error'}>
                    {idf.match ? 'Match' : 'No match'}
                  </StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cv-step">
          <h4>Step 2 — Investigative-standard threshold</h4>
          <p><strong>{a.threshold.rule}</strong>{' '}
            <StatusBadge variant={a.threshold.met ? 'error' : 'success'}>
              {a.threshold.met ? 'Threshold met' : 'Below threshold'}
            </StatusBadge></p>
          <p className="muted">{a.threshold.detail}</p>
        </div>

        <div className="cv-step">
          <h4>Step 3 — Prior adjudication check</h4>
          <p>
            <StatusBadge variant={a.priorAdjudication.previouslyAdjudicated
              ? 'neutral' : 'info'}>
              {a.priorAdjudication.previouslyAdjudicated
                ? 'Previously adjudicated' : 'Not previously adjudicated'}
            </StatusBadge>
            {a.priorAdjudication.reference && (
              <span className="muted"> — {a.priorAdjudication.reference}</span>)}
          </p>
        </div>
      </div>

      {a.documentUrl && (
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setDocOpen(!docOpen)}>
            <FiFileText aria-hidden="true" /> Source document
          </button>
          {docOpen && <DocumentViewer url={a.documentUrl} />}
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
        return (
          <CollapsibleSection key={a.id}
            title={`${ALERT_CATEGORY_LABELS[a.category]} — ${a.description}`}
            meta={<>
              <StatusBadge variant={STATE_VARIANT[state]}>
                {ALERT_STATE_LABELS[state]}
              </StatusBadge>
              <span className="muted">{a.receivedDate}</span>
            </>}
            defaultOpen={a.id === focusId}>
            <AlertBody alert={a} state={state} isAnalyst={persona.id === 'analyst'}
              dispositionAlert={dispositionAlert} />
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
