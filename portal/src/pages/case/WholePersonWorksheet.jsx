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

  return (
    <li className="worksheet-factor">
      <button type="button" className="record-check-header" aria-expanded={open}
        onClick={() => setOpen(!open)}>
        <span className="record-check-item">{factor.factor}</span>
        {savedRating && (
          <StatusBadge variant={savedRating.variant}>{savedRating.label}</StatusBadge>
        )}
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && (
        <div className="record-check-body">
          <p>{factor.assessment} <AIBadge /></p>
          <EvidenceChips evidence={factor.evidence || []}
            onOpenDoc={(url) => setDocUrl(docUrl === url ? null : url)} />
          {docUrl && <DocumentViewer url={docUrl} />}
          {canRate && (
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
      )}
    </li>
  );
}

export default function WholePersonWorksheet({ caseData }) {
  const { persona } = usePersona();
  const { demo } = useDemo();
  const caseId = caseData.subject.id;
  const ratings = Object.values(demo.worksheetRatings[caseId] || {});
  const tally = (id) => ratings.filter((r) => r.rating === id).length;

  return (
    <div className="card">
      <div className="worksheet-head">
        <h3>Whole-person worksheet <AIBadge /></h3>
        {ratings.length > 0 && (
          <div className="worksheet-tally">
            <StatusBadge variant="success">{tally('FAVORABLE')} favorable</StatusBadge>
            <StatusBadge variant="neutral">{tally('NEUTRAL')} neutral</StatusBadge>
            <StatusBadge variant="error">{tally('CONCERN')} concern</StatusBadge>
          </div>
        )}
      </div>
      <ul className="record-check-list">
        {caseData.wholePerson.map((f, i) => (
          <FactorRow key={f.factor} factor={f} index={i} caseId={caseId}
            canRate={persona.id === 'adjudicator'} />
        ))}
      </ul>
    </div>
  );
}
