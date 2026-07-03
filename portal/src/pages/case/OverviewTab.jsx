import KVGrid from '../../components/KVGrid.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';

export default function OverviewTab({ caseData }) {
  const s = caseData.subject;
  return (
    <div>
      <div className="card ai-summary">
        <h3>Executive summary <AIBadge /></h3>
        <p>{caseData.aiSummary}</p>
      </div>
      <div className="card">
        <h3>Subject</h3>
        <KVGrid items={[
          { label: 'Date of birth', value: s.dob },
          { label: 'Address', value: s.address },
          { label: 'Tier', value: s.tier },
          { label: 'Days in stage', value: s.daysInStage },
          { label: 'Flagged guidelines',
            value: s.flaggedGuidelines.length
              ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
              : 'None' },
        ]} />
      </div>
      <div className="card">
        <h3>Whole-person snapshot</h3>
        <ul className="whole-person-list">
          {caseData.wholePerson.map((w) => (
            <li key={w.factor}><strong>{w.factor}.</strong> {w.assessment}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Case timeline</h3>
        <ol className="timeline">
          {caseData.timeline.map((e, i) => (
            <li key={i}>
              <span className="timeline-date">{e.date}</span>
              <span className="timeline-body">
                <strong>{e.event}</strong>
                <span className="muted"> — {e.actor} ({e.role})</span>
                {e.note && <div className="muted">{e.note}</div>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
