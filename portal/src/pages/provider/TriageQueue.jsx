import { useNavigate } from 'react-router-dom';
import {
  ALERT_STATE_LABELS, ALERT_TRANSITIONS, ALERT_ACTION_LABELS, DEMO_TODAY,
} from '../../domain.js';
import KPICard from '../../components/KPICard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { EmptyState } from '../../components/States.jsx';

const SEVERITY_VARIANT = { HIGH: 'error', MODERATE: 'warning', LOW: 'info' };
const isOpen = (state) => !['ADJUDICATED', 'CLOSED'].includes(state);

const daysBetween = (from, to) =>
  Math.max(0, Math.round((new Date(to) - new Date(from)) / 86400000));

export function triageStats(alerts) {
  const open = alerts.filter((a) => isOpen(a.state));
  const oldestOpen = open.length
    ? Math.max(...open.map((a) => daysBetween(a.receivedDate, DEMO_TODAY)))
    : null;
  const ttas = alerts
    .map((a) => {
      const adj = (a.history || []).find((p) => p.state === 'ADJUDICATED');
      return adj ? daysBetween(a.receivedDate, adj.date) : null;
    })
    .filter((d) => d !== null)
    .sort((a, b) => a - b);
  const medianTta = ttas.length
    ? ttas[Math.floor((ttas.length - 1) / 2)]
    : null;
  return { open, oldestOpen, medianTta };
}

export default function TriageQueue({ alerts, isAnalyst, dispositionAlert }) {
  const navigate = useNavigate();
  const { open, oldestOpen, medianTta } = triageStats(alerts);
  const done = alerts.filter((a) => !isOpen(a.state));
  const queue = [...open].sort((a, b) =>
    (a.receivedDate < b.receivedDate ? -1 : 1)); // oldest open first
  const history = [...done].sort((a, b) =>
    (a.receivedDate < b.receivedDate ? 1 : -1));

  const openCase = (a) =>
    navigate(`/cases/${a.subjectId}?tab=continuous-vetting&alert=${a.id}`);

  return (
    <>
      <div className="kpi-grid kpi-grid-six">
        <KPICard label="Open Alerts" value={open.length}
          accent="var(--status-alert)" />
        <KPICard label="High Severity Open"
          value={open.filter((a) => a.severity === 'HIGH').length}
          accent="var(--risk-high)" />
        <KPICard label="Oldest Open"
          value={oldestOpen === null ? '-' : `${oldestOpen}d`}
          accent="var(--dcsa-gold)" />
        <KPICard label="Median Days To Adjudicate"
          value={medianTta === null ? '-' : `${medianTta}d`}
          accent="var(--dcsa-ocean)" />
        <KPICard label="Alerts Received" value={alerts.length}
          accent="var(--dcsa-navy)" />
        <KPICard label="Adjudicated / Closed" value={done.length}
          accent="var(--status-clear)" />
      </div>

      <div className="card">
        <h3>Work Queue - Open First</h3>
        {!isAnalyst && (
          <p className="muted triage-hint">
            Switch to the Analyst persona to disposition alerts from this queue.
          </p>
        )}
        {queue.length === 0 && (
          <EmptyState title="Queue clear"
            message="No open alerts from this source." />
        )}
        <ul className="triage-list">
          {queue.map((a) => (
            <li key={a.id} className="triage-row triage-open"
              onClick={() => openCase(a)}>
              <StatusBadge variant={SEVERITY_VARIANT[a.severity]}>
                {a.severity}
              </StatusBadge>
              <strong>{a.subjectName}</strong>
              <span className="muted triage-desc">{a.description}</span>
              <span className="muted triage-age">
                open {daysBetween(a.receivedDate, DEMO_TODAY)} days
              </span>
              {isAnalyst && (
                <span className="triage-actions">
                  {ALERT_TRANSITIONS[a.state].map((next) => (
                    <button key={next} type="button"
                      className={next === 'CLOSED' ? 'btn btn-ghost' : 'btn btn-secondary'}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispositionAlert(a.id, next, a.state);
                      }}>
                      {ALERT_ACTION_LABELS[next]}
                    </button>
                  ))}
                </span>
              )}
            </li>
          ))}
          {history.map((a) => {
            const last = (a.history || [])[(a.history || []).length - 1];
            return (
              <li key={a.id} className="triage-row triage-done muted"
                onClick={() => openCase(a)}>
                <StatusBadge variant={a.state === 'ADJUDICATED' ? 'success' : 'neutral'}>
                  {ALERT_STATE_LABELS[a.state]}
                </StatusBadge>
                <span>{a.subjectName}</span>
                <span className="triage-desc">{a.description}</span>
                <span className="triage-age">
                  {last ? `${last.actor}, ${last.date}` : a.receivedDate}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
