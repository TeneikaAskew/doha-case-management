import { useState } from 'react';
import { usePersona } from '../../state/PersonaContext.jsx';
import { useDemo } from '../../state/DemoContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';

const COVERAGE_VARIANT = { COMPLETE: 'success', PENDING: 'warning', NOT_REQUIRED: 'neutral' };
const COVERAGE_LABEL = { COMPLETE: 'Complete', PENDING: 'Pending', NOT_REQUIRED: 'Not required' };
const ROI_ITEMS = ['Financial', 'Foreign contacts', 'Employment', 'Criminal', 'General'];

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
        <h3>Coverage checklist</h3>
        <ul className="coverage-list">
          {inv.coverage.map((c) => (
            <li key={c.item}>
              <span>{c.item}</span>
              <StatusBadge variant={COVERAGE_VARIANT[c.status]}>
                {COVERAGE_LABEL[c.status]}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>SF-86 review — self-report vs record checks</h3>
        {inv.sf86Sections.map((s) => (
          <div key={s.section} className={`sf86-section ${s.discrepancy ? 'flagged' : ''}`}>
            <div className="sf86-heading">
              <strong>{s.section} — {s.title}</strong>
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
              <span className="muted"> — {iv.date}, {iv.interviewer}</span>
              <p>{iv.summary}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Report of Investigation entries</h3>
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
