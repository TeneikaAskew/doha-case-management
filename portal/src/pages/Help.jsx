import {
  FiBookOpen, FiSliders, FiTag, FiHelpCircle,
} from 'react-icons/fi';
import {
  GUIDELINES, STAGE_LABELS, STATUS_LABELS, STATUS_VARIANTS,
  ALERT_STATE_LABELS, ALERT_STATE_VARIANTS,
} from '../domain.js';
import StatusBadge from '../components/StatusBadge.jsx';
import SeverityBadge from '../components/SeverityBadge.jsx';
import GuidelineChip from '../components/GuidelineChip.jsx';
import AIBadge from '../components/AIBadge.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const PAGES = [
  ['Subjects', 'The home page. Population KPIs, the vetting pipeline, risk score '
    + 'distribution, subjects needing attention, and a searchable directory.'],
  ['Dashboard', 'Persona-aware workload: each role (Investigator, Analyst, '
    + 'Adjudicator) sees its own KPIs and queue.'],
  ['Case Queue', 'Every case with stage, status, risk score, and flagged guidelines. '
    + 'Filter by stage or guideline; search from the header.'],
  ['Case detail', 'The whole-person hub: Overview (identity, worksheet, timeline), '
    + 'Guidelines (SEAD-4 analysis with precedents), Investigation (record checks, '
    + 'SF-86 review, interviews, ROI), Adjudication (recommendation, decisions), '
    + 'Continuous Vetting (alert triage), and Documents.'],
  ['Alerts', 'Alerts from data providers - the initial and continuous vetting '
    + 'alert pipeline. Each alert carries a 3-step validation: identity match, '
    + 'threshold, prior adjudication.'],
  ['Data Providers', 'The record sources feeding investigations and continuous '
    + 'vetting, with the provider-to-guideline coverage matrix.'],
  ['Analytics', 'The real DOHA decision corpus (~36,700 cases) and demo pipeline '
    + 'metrics.'],
];

const RISK_BANDS = [
  ['low', 'Low', '0-39', 'No or minor issues; fast-track candidate when clean.'],
  ['moderate', 'Moderate', '40-74', 'One or more developed issues; needs review.'],
  ['high', 'High', '75-100', 'Significant unresolved concerns; action required.'],
];

const ALERT_SEVERITIES = [
  ['HIGH', 'error', 'Meets an investigative threshold with serious potential impact.'],
  ['MODERATE', 'warning', 'Meets a threshold; impact depends on context.'],
  ['LOW', 'info', 'Recorded for awareness; often resolved without action.'],
];

const FAQ = [
  ['Is any of this data real?',
   'The subjects, alerts, and documents are fictional and generated '
   + 'deterministically (900-series SSNs are never issued; phones use the 555 '
   + 'range). The only real data is the DOHA decision corpus behind Analytics '
   + 'and the precedent links on the Guidelines tab.'],
  ['What does the risk score mean?',
   'A 0-100 triage score computed from flagged guidelines, alert counts, and '
   + 'severity. It prioritizes work; it never decides. Every screen that shows '
   + 'AI output carries the AI-assisted badge, and decision authority stays '
   + 'with the human adjudicator.'],
  ['Why are alert states gray?',
   'Workflow states (New, Identity Confirmed, Validated, Referred) are process '
   + 'positions, not judgments, so they render neutral gray. Color is reserved '
   + 'for severity, status, and risk so it always means the same thing.'],
  ['What is continuous vetting (CV)?',
   'Under SEAD 6, enrolled clearance holders are checked continuously through '
   + 'automated record sources instead of periodic reinvestigations. New '
   + 'records become alerts that analysts validate and refer.'],
  ['What do the personas change?',
   'The "Viewing as" switcher changes the Dashboard, the default case tab, and '
   + 'which actions are available: investigators write ROI entries, analysts '
   + 'disposition alerts, adjudicators rate worksheet factors and record '
   + 'decisions.'],
  ['What does Reset demo do?',
   'It clears every interaction saved in your browser: alert dispositions, '
   + 'decisions, ROI entries, and worksheet ratings. The generated case data '
   + 'itself never changes.'],
  ['Where do the documents come from?',
   'Each alert and completed record check links to a generated source document '
   + '(police report, credit-file extract, SAR, Rap Back notification, SF-86 '
   + 'excerpt). The viewer shows a facsimile of the document beside the '
   + 'extracted data, stamped with the provider it came through.'],
];

function LegendRow({ swatch, term, note }) {
  return (
    <div className="legend-row">
      <span className="legend-key">
        {swatch}
        {term && <span className="legend-term">{term}</span>}
      </span>
      <span className="legend-note muted">{note}</span>
    </div>
  );
}

export default function Help() {
  return (
    <div className="page help-page">
      <div className="page-header">
        <div>
          <h1>Help</h1>
          <p>How the demo works: pages, scoring, labels, and sources</p>
        </div>
      </div>

      <div className="card">
        <h3><FiBookOpen className="section-icon" aria-hidden="true" />The App at a Glance</h3>
        <p>
          This is a stakeholder demo of whole-person personnel-vetting case
          management across the Trusted Workforce 2.0 lifecycle: initiation,
          tiered investigation, SEAD-4 adjudication, and continuous vetting,
          with AI assistance <AIBadge /> woven throughout.
        </p>
        <dl className="help-pages">
          {PAGES.map(([name, blurb]) => (
            <div key={name} className="help-page-row">
              <dt>{name}</dt>
              <dd>{blurb}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card" id="scoring">
        <h3><FiSliders className="section-icon" aria-hidden="true" />How Scoring Works</h3>
        <p>
          Every subject carries an AI-computed <strong>risk score (0-100)</strong>,
          computed from flagged SEAD-4 guidelines, open alert counts, and alert
          severity. It is a triage aid - it orders the queue and flags cases for
          attention, and a human makes every decision. CV alerts carry a
          separate <strong>AI priority score (0-100)</strong> built the same
          way for the alert inbox.
        </p>
        <div className="legend">
          {RISK_BANDS.map(([band, label, range, note]) => (
            <LegendRow key={band}
              swatch={<span className={`legend-dot risk-${band}-dot`} aria-hidden="true" />}
              term={`${label} (${range})`} note={note} />
          ))}
        </div>
        <p className="muted">
          Whole-person factor ratings (Favorable / Neutral / Concern) are the
          adjudicator's own assessment per SEAD-4 para. 2(d) and never change
          the AI score.
        </p>
      </div>

      <div className="card">
        <h3><FiTag className="section-icon" aria-hidden="true" />Labels and Legends</h3>

        <h4 className="legend-h">Case status</h4>
        <div className="legend">
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <LegendRow key={k}
              swatch={<StatusBadge variant={STATUS_VARIANTS[k]}>{label}</StatusBadge>}
              term=""
              note={{
                CLEAR: 'No open issues at this stage.',
                NEEDS_REVIEW: 'A developed issue or new alert awaits review.',
                ACTION_REQUIRED: 'A decision or response is overdue.',
              }[k]} />
          ))}
        </div>

        <h4 className="legend-h">Lifecycle stage</h4>
        <div className="legend">
          {Object.entries(STAGE_LABELS).map(([k, label]) => (
            <LegendRow key={k}
              swatch={<StatusBadge variant="neutral">{label}</StatusBadge>}
              term=""
              note={{
                INITIATION: 'SF-86 submitted; case opened in NBIS.',
                INVESTIGATION: 'Record checks and tier-required fieldwork underway.',
                ADJUDICATION: 'ROI complete; awaiting a decision.',
                CONTINUOUS_VETTING: 'Eligibility granted; enrolled in automated checks.',
              }[k]} />
          ))}
        </div>

        <h4 className="legend-h">Alert severity</h4>
        <div className="legend">
          {ALERT_SEVERITIES.map(([label, variant, note]) => (
            <LegendRow key={label}
              swatch={<StatusBadge variant={variant}>{label}</StatusBadge>}
              term="" note={note} />
          ))}
        </div>

        <h4 className="legend-h">Alert workflow state</h4>
        <div className="legend">
          {Object.entries(ALERT_STATE_LABELS).map(([k, label]) => (
            <LegendRow key={k}
              swatch={<StatusBadge variant={ALERT_STATE_VARIANTS[k]}>{label}</StatusBadge>}
              term=""
              note={{
                NEW: 'Just received from a provider.',
                IDENTITY_CONFIRMED: 'Analyst confirmed the record matches the subject.',
                VALIDATED: 'Meets the investigative-standard threshold.',
                REFERRED: 'Sent to adjudication.',
                ADJUDICATED: 'Decision recorded.',
                CLOSED: 'False positive or below threshold.',
              }[k]} />
          ))}
        </div>

        <h4 className="legend-h">Guideline severity (per flagged guideline)</h4>
        <div className="legend">
          {[['A', 'Minor or fully mitigated'], ['B', 'Developed issue, partial mitigation'],
            ['C', 'Serious, largely unmitigated'], ['D', 'Severe or disqualifying']]
            .map(([level, note]) => (
              <LegendRow key={level}
                swatch={<SeverityBadge level={level} />}
                term="" note={note} />
            ))}
        </div>

        <h4 className="legend-h">SEAD-4 guidelines A-M</h4>
        <div className="legend legend-guidelines">
          {Object.entries(GUIDELINES).map(([code, name]) => (
            <LegendRow key={code}
              swatch={<GuidelineChip code={code} />}
              term="" note={name} />
          ))}
        </div>
      </div>

      <div className="card">
        <h3><FiHelpCircle className="section-icon" aria-hidden="true" />FAQ</h3>
        {FAQ.map(([q, a]) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <SectionRef>
          Authorities: <RefLink href={REFS.SEAD4}>SEAD 4 (adjudicative
          guidelines and whole-person concept)</RefLink>,{' '}
          <RefLink href={REFS.SEAD3}>SEAD 3 (reporting)</RefLink>,{' '}
          <RefLink href={REFS.SEAD6}>SEAD 6 (continuous vetting)</RefLink>,{' '}
          <RefLink href={REFS.FIS}>Federal Investigative Standards
          (DCSA)</RefLink>, and <RefLink href={REFS.DOHA_DECISIONS}>DOHA
          Industrial Security Clearance Decisions</RefLink>.
        </SectionRef>
      </div>
    </div>
  );
}
