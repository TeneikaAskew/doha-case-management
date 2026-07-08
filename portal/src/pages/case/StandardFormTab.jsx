import { FiFileText, FiAlertTriangle } from 'react-icons/fi';
import CollapsibleSection from '../../components/CollapsibleSection.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

const BADGE_ANSWERS = { Yes: 'warning', No: 'neutral', 'Not applicable': 'neutral' };

function QuestionRow({ q }) {
  const badgeVariant = q.flagged ? 'warning' : BADGE_ANSWERS[q.answer];
  return (
    <li className={`sf-question ${q.flagged ? 'sf-flagged' : ''}`}>
      <div className="sf-question-main">
        <span className="sf-qnum">{q.number}</span>
        <span className="sf-qtext">{q.question}</span>
        {badgeVariant
          ? <StatusBadge variant={badgeVariant}>{q.answer}</StatusBadge>
          : <span className="sf-answer-value">{q.answer}</span>}
      </div>
      {q.detail && (
        <p className="muted sf-detail">
          {q.flagged && <FiAlertTriangle className="sf-flag-icon" aria-label="Flagged" />}
          {q.detail}
        </p>
      )}
    </li>
  );
}

export default function StandardFormTab({ caseData }) {
  const form = caseData.standardForm;
  if (!form) {
    return (
      <div className="card">
        <p className="muted">No standard form on file for this subject.</p>
      </div>
    );
  }
  return (
    <div className="sf-tab">
      <div className="card sf-head">
        <h3><FiFileText className="section-icon" aria-hidden="true" />
          Standard Form (SF-86 / PVQ)</h3>
        <p className="muted">
          {form.formVersion} - submitted {form.submitted} - {form.status}.
          Flagged items mark answers that later verification contradicted or
          events that postdate submission.
        </p>
      </div>
      {form.sections.map((s, i) => {
        const flagged = s.questions.filter((q) => q.flagged).length;
        return (
          <CollapsibleSection key={s.section} defaultOpen={i === 0}
            title={`${s.section} - ${s.title}`}
            meta={flagged
              ? <StatusBadge variant="warning">
                  {flagged} flagged
                </StatusBadge>
              : `${s.questions.length} item${s.questions.length === 1 ? '' : 's'}`}>
            <ul className="sf-questions">
              {s.questions.map((q) => <QuestionRow key={q.number} q={q} />)}
            </ul>
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
