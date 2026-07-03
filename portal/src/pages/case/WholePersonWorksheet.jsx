import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';

const RATINGS = [
  { id: 'FAVORABLE', label: 'Favorable', variant: 'success' },
  { id: 'NEUTRAL', label: 'Neutral', variant: 'neutral' },
  { id: 'CONCERN', label: 'Concern', variant: 'error' },
];

const SHORT_LABELS = {
  'Nature, extent, and seriousness of the conduct': 'Nature & seriousness',
  'Circumstances surrounding the conduct': 'Circumstances',
  'Frequency and recency of the conduct': 'Frequency & recency',
  "Individual's age and maturity at the time of the conduct": 'Age & maturity',
  'Extent to which participation is voluntary': 'Voluntariness',
  'Presence or absence of rehabilitation and other permanent behavioral changes':
    'Rehabilitation',
  'Motivation for the conduct': 'Motivation',
  'Potential for pressure, coercion, exploitation, or duress':
    'Pressure / duress potential',
  'Likelihood of continuation or recurrence': 'Likelihood of recurrence',
};

function EvidenceChips({ evidence, onOpenDoc }) {
  const [, setParams] = useSearchParams();
  const jump = (ev) => {
    if (ev.type === 'ALERT') setParams({ tab: 'continuous-vetting', alert: ev.ref });
    if (ev.type === 'RECORD_CHECK') setParams({ tab: 'investigation' });
  };
  if (!evidence.length) return null;
  return (
    <div className="worksheet-evidence">
      {evidence.map((ev) => (
        <button key={`${ev.type}-${ev.ref}`} type="button" className="evidence-chip"
          onClick={() => (ev.type === 'DOCUMENT' ? onOpenDoc(ev.ref) : jump(ev))}>
          {ev.type === 'DOCUMENT' && <FiFileText aria-hidden="true" />}
          {ev.label}
        </button>
      ))}
    </div>
  );
}

function FactorRow({ factor, index, caseId, canRate }) {
  const { demo, setWorksheetRating } = useDemo();
  const [open, setOpen] = useState(false);
  const [docUrl, setDocUrl] = useState(null);
  const saved = demo.worksheetRatings[caseId]?.[index];
  const [note, setNote] = useState(saved?.note || '');
  const savedRating = saved && RATINGS.find((r) => r.id === saved.rating);
  const dot = (saved?.rating || factor.aiRating || 'NEUTRAL').toLowerCase();
  const label = SHORT_LABELS[factor.factor] || factor.factor;

  return (
    <li className="briefing-factor">
      <span className={`briefing-dot rating-${dot}`} aria-hidden="true" />
      <div className="briefing-factor-body">
        {canRate ? (
          <button type="button" className="briefing-factor-toggle" aria-expanded={open}
            aria-label={factor.factor} title={factor.factor}
            onClick={() => setOpen(!open)}>
            <span className="briefing-factor-label">{label}</span>
            {savedRating && (
              <StatusBadge variant={savedRating.variant}>{savedRating.label}</StatusBadge>
            )}
            <FiChevronDown
              className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
              aria-hidden="true" />
          </button>
        ) : (
          <span className="briefing-factor-label" title={factor.factor}>{label}</span>
        )}
        <p className="briefing-assessment">{factor.assessment}</p>
        <EvidenceChips evidence={factor.evidence || []}
          onOpenDoc={(url) => setDocUrl(docUrl === url ? null : url)} />
        {docUrl && <DocumentViewer url={docUrl} />}
        {open && canRate && (
          <div className="worksheet-rating">
            <div className="worksheet-rating-buttons" role="group"
              aria-label={`Assessment for ${factor.factor}`}>
              {RATINGS.map((r) => (
                <button key={r.id} type="button"
                  className={`btn ${saved?.rating === r.id ? 'btn-secondary' : 'btn-ghost'}`}
                  onClick={() => setWorksheetRating(caseId, index, r.id, note)}>
                  {r.label}
                </button>
              ))}
            </div>
            <label className="form-group">
              <span>Adjudicator note</span>
              <textarea aria-label={`Note for ${factor.factor}`} rows={2} value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => saved && setWorksheetRating(caseId, index, saved.rating, note)} />
            </label>
          </div>
        )}
      </div>
    </li>
  );
}

export default function WholePersonWorksheet({ caseData }) {
  const { persona } = usePersona();
  const { demo } = useDemo();
  const caseId = caseData.subject.id;
  const canRate = persona.id === 'adjudicator';
  const ratings = Object.values(demo.worksheetRatings[caseId] || {});
  const tally = (id) => ratings.filter((r) => r.rating === id).length;

  return (
    <div className="card">
      <div className="worksheet-head">
        <h3>Whole-Person Briefing <AIBadge /></h3>
        {ratings.length > 0 ? (
          <div className="worksheet-tally">
            <StatusBadge variant="success">{tally('FAVORABLE')} favorable</StatusBadge>
            <StatusBadge variant="neutral">{tally('NEUTRAL')} neutral</StatusBadge>
            <StatusBadge variant="error">{tally('CONCERN')} concern</StatusBadge>
          </div>
        ) : canRate && (
          <span className="briefing-head-note">Expand a factor to rate it</span>
        )}
      </div>
      {caseData.wholePersonSummary && (
        <div className="briefing-bluf">
          <div className="briefing-bluf-label">Bottom line</div>
          <p>{caseData.wholePersonSummary}</p>
        </div>
      )}
      <ul className="briefing-grid">
        {caseData.wholePerson.map((f, i) => (
          <FactorRow key={f.factor} factor={f} index={i} caseId={caseId}
            canRate={canRate} />
        ))}
      </ul>
    </div>
  );
}
