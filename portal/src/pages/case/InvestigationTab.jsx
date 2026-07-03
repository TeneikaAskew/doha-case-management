import { useState } from 'react';
import {
  FiChevronDown, FiFileText, FiCheckSquare, FiColumns, FiMessageSquare, FiEdit3,
} from 'react-icons/fi';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import SourceChip from '../../components/SourceChip.jsx';
import DocumentViewer from '../../components/DocumentViewer.jsx';
import SectionRef, { RefLink } from '../../components/SectionRef.jsx';
import { REFS } from '../../references.js';

const CHECK_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const CHECK_LABEL = { COMPLETE: 'Complete', PENDING: 'Pending', NOT_REQUIRED: 'Not required' };
const ROI_ITEMS = ['Financial', 'Foreign contacts', 'Foreign travel', 'Employment',
  'Education', 'References', 'Subject interview', 'Criminal', 'General'];

const CHECK_CATEGORY_LABELS = {
  CRIMINAL: 'Criminal record checks',
  FINANCIAL: 'Financial record checks',
  FOREIGN: 'Foreign travel & contacts',
  EMPLOYMENT: 'Employment verification',
  EDUCATION: 'Education verification',
  REFERENCES: 'References & neighborhood',
  SUBJECT_INTERVIEW: 'Subject interview',
  SECURITY: 'Security & conduct records',
  FIELDWORK: 'Investigative fieldwork',
};
const CATEGORY_ORDER = Object.keys(CHECK_CATEGORY_LABELS);

function InterviewSummary({ summary, highlight }) {
  if (!highlight) return summary;
  const at = summary.indexOf(highlight);
  if (at === -1) return summary;
  return (
    <>
      {summary.slice(0, at)}
      <mark className="interview-mark">{highlight}</mark>
      {summary.slice(at + highlight.length)}
    </>
  );
}

function rollupStatus(checks) {
  if (checks.some((c) => c.status === 'PENDING')) return 'PENDING';
  if (checks.every((c) => c.status === 'NOT_REQUIRED')) return 'NOT_REQUIRED';
  return 'COMPLETE';
}

function groupChecks(checks) {
  const byCategory = new Map();
  checks.forEach((c) => {
    const key = c.category || 'FIELDWORK';
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(c);
  });
  return [...byCategory.entries()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]));
}

function RecordCheckGroup({ category, checks }) {
  const [open, setOpen] = useState(false);
  const [openDoc, setOpenDoc] = useState(null);
  const status = rollupStatus(checks);
  return (
    <li className="record-check">
      <button type="button" className="record-check-header" onClick={() => setOpen(!open)}
        aria-expanded={open}>
        <span className="record-check-item">
          {CHECK_CATEGORY_LABELS[category] || category}
        </span>
        <StatusBadge variant={CHECK_VARIANT[status]}>
          {CHECK_LABEL[status]}
        </StatusBadge>
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && (
        <div className="record-check-body">
          <div className="record-check-table-wrap">
            <table className="inline-table">
              <thead>
                <tr><th>Source</th><th>Requested</th><th>Completed</th>
                  <th>Result</th><th>Document</th></tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.item} title={`${c.item} - ${c.scope}`}>
                    <td><SourceChip provider={c.provider} /></td>
                    <td className="record-check-date">{c.requestedDate}</td>
                    <td className="record-check-date">
                      {c.completedDate || 'Pending'}
                    </td>
                    <td className="record-check-result">{c.resultSummary}</td>
                    <td>
                      {c.documentUrl ? (
                        <button type="button"
                          className="btn btn-ghost record-check-view"
                          onClick={() => setOpenDoc(
                            openDoc === c.documentUrl ? null : c.documentUrl)}>
                          <FiFileText aria-hidden="true" /> View
                        </button>
                      ) : <span className="muted">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {openDoc && <DocumentViewer url={openDoc} />}
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
        <h3><FiCheckSquare className="section-icon" aria-hidden="true" />Record Checks</h3>
        <ul className="record-check-list">
          {groupChecks(inv.recordChecks).map(([category, checks]) => (
            <RecordCheckGroup key={category} category={category} checks={checks} />
          ))}
        </ul>
        <SectionRef>
          Coverage scope per the{' '}
          <RefLink href={REFS.FIS}>Federal Investigative Standards for tiered
          background investigations</RefLink> ({caseData.subject.tier});
          subject reporting obligations per <RefLink href={REFS.SEAD3}>SEAD 3</RefLink>.
        </SectionRef>
      </div>

      <div className="card">
        <h3><FiColumns className="section-icon" aria-hidden="true" />SF-86 Review - Self-Report vs Record Checks</h3>
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
        <SectionRef>
          Self-reported items from <RefLink href={REFS.SF86}>Standard Form 86
          (OPM)</RefLink>, compared against provider record checks.
        </SectionRef>
      </div>

      {inv.interviews.length > 0 && (
        <div className="card">
          <h3><FiMessageSquare className="section-icon" aria-hidden="true" />Interviews</h3>
          <ul className="interview-ledger">
            {inv.interviews.map((iv, i) => (
              <li key={i} className="interview-row">
                <span className="interview-date">{iv.date}</span>
                <span className="interview-rail" aria-hidden="true" />
                <div className="interview-who">
                  <div className="interview-type">{iv.type}</div>
                  <span className={`conflict-chip ${iv.conflict ? 'conflict' : 'clear'}`}>
                    {iv.conflict ? 'Conflict' : 'No conflict'}
                  </span>
                  <div className="interview-interviewer">{iv.interviewer}</div>
                </div>
                <blockquote className="interview-quote">
                  <InterviewSummary summary={iv.summary} highlight={iv.highlight} />
                </blockquote>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3><FiEdit3 className="section-icon" aria-hidden="true" />Report of Investigation Entries</h3>
        {roiEntries.length === 0 && <p className="muted">No ROI entries yet.</p>}
        <ul className="interview-ledger roi-ledger">
          {roiEntries.map((r, i) => (
            <li key={i} className="interview-row">
              <span className="interview-date">{r.date}</span>
              <span className="interview-rail" aria-hidden="true" />
              <div className="interview-who">
                <div className="interview-type">{r.item}</div>
                <div className="interview-interviewer">{r.investigator}</div>
              </div>
              <blockquote className="interview-quote">{r.text}</blockquote>
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
