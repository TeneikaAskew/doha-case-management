import { useState } from 'react';
import { FiChevronDown, FiFileText } from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import SourceChip from '../../components/SourceChip.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';

const CHECK_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const CHECK_LABEL = { COMPLETE: 'Complete', PENDING: 'Pending', NOT_REQUIRED: 'Not required' };
const ROI_ITEMS = ['Financial', 'Foreign contacts', 'Employment', 'Criminal', 'General'];

function RecordCheckRow({ check }) {
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  return (
    <li className="record-check">
      <button type="button" className="record-check-header" onClick={() => setOpen(!open)}
        aria-expanded={open}>
        <span className="record-check-item">{check.item}</span>
        <StatusBadge variant={CHECK_VARIANT[check.status]}>
          {CHECK_LABEL[check.status]}
        </StatusBadge>
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && (
        <div className="record-check-body">
          <div className="record-check-meta">
            <SourceChip provider={check.provider} />
            <span className="record-check-dates">
              <span className="record-check-lbl">Requested</span>
              <span>{check.requestedDate}</span>
              <span className="record-check-arrow" aria-hidden="true">→</span>
              <span className="record-check-lbl">Completed</span>
              <span>{check.completedDate || 'Pending'}</span>
            </span>
          </div>
          <div className="record-check-cell">
            <span className="record-check-lbl">What was checked</span>
            <span>{check.scope}</span>
          </div>
          <div className="record-check-cell">
            <span className="record-check-lbl">Result</span>
            <span>{check.resultSummary}</span>
          </div>
          {check.documentUrl && (
            <>
              <button type="button" className="btn btn-ghost"
                onClick={() => setDocOpen(!docOpen)}>
                <FiFileText aria-hidden="true" /> View document
              </button>
              {docOpen && <DocumentViewer url={check.documentUrl} />}
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default function InvestigationTab({ caseData }) {
  const { persona } = usePersona();
  const { demo, addRoiEntry } = useDemo();
  const inv = caseData.investigation;
  const caseId = caseData.subject.id;
  const [item, setItem] = useState(ROI_ITEMS[0]);
  const [text, setText] = useState('');

  const roiEntries = [...inv.roiEntries, ...(demo.roiEntries[caseId] || [])];

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addRoiEntry(caseId, {
      date: '2026-07-02', investigator: 'Demo investigator', item, text: text.trim(),
    });
    setText('');
  };

  return (
    <div>
      <div className="card">
        <h3>Record Checks</h3>
        <ul className="record-check-list">
          {inv.recordChecks.map((c) => <RecordCheckRow key={c.item} check={c} />)}
        </ul>
        <p className="muted section-ref">
          Coverage scope per the Federal Investigative Standards for tiered
          background investigations ({caseData.subject.tier}); subject reporting
          obligations per SEAD 3.
        </p>
      </div>

      <div className="card">
        <h3>SF-86 Review - Self-Report vs Record Checks</h3>
        {inv.sf86Sections.map((s) => (
          <div key={s.section} className={`sf86-section ${s.discrepancy ? 'flagged' : ''}`}>
            <div className="sf86-heading">
              <strong>{s.section} - {s.title}</strong>
              {s.discrepancy && <StatusBadge variant="error">Discrepancy</StatusBadge>}
              {s.guideline && <GuidelineChip code={s.guideline} />}
            </div>
            <div className="sf86-compare">
              <div>
                <div className="sf86-col-label">Subject self-report</div>
                <p>{s.subjectReport}</p>
              </div>
              <div>
                <div className="sf86-col-label">Matched result</div>
                <p>{s.matchedResult}</p>
                <div className="muted">Sources: {s.providers.join(', ')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {inv.interviews.length > 0 && (
        <div className="card">
          <h3>Interviews</h3>
          {inv.interviews.map((iv, i) => (
            <div key={i} className="interview">
              <strong>{iv.type}</strong>
              <span className="muted"> - {iv.date}, {iv.interviewer}</span>
              <p>{iv.summary}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Report of Investigation Entries</h3>
        {roiEntries.length === 0 && <p className="muted">No ROI entries yet.</p>}
        <ul className="roi-list">
          {roiEntries.map((r, i) => (
            <li key={i}>
              <span className="muted">{r.date} · {r.investigator} · {r.item}</span>
              <p>{r.text}</p>
            </li>
          ))}
        </ul>
        {persona.id === 'investigator' && (
          <form className="roi-form" onSubmit={submit}>
            <label className="form-group">
              <span>Coverage item</span>
              <select aria-label="Coverage item" value={item}
                onChange={(e) => setItem(e.target.value)}>
                {ROI_ITEMS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="form-group roi-entry-field">
              <span>Entry</span>
              <textarea aria-label="Entry" rows={2} value={text}
                onChange={(e) => setText(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-primary">Add ROI entry</button>
          </form>
        )}
      </div>
    </div>
  );
}
