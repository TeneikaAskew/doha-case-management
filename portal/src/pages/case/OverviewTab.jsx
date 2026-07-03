import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import KVGrid from '../../components/KVGrid.jsx';
import AIBadge from '../../components/AIBadge.jsx';
import GuidelineChip from '../../components/GuidelineChip.jsx';
import DataTable from '../../components/DataTable.jsx';
import WholePersonWorksheet from './WholePersonWorksheet.jsx';
import { ALERT_CATEGORY_LABELS } from '../../domain.js';

const ADDRESS_COLUMNS = [
  { key: 'address', label: 'Address' },
  { key: 'fromDate', label: 'Start' },
  { key: 'toDate', label: 'End', render: (row) => row.toDate || 'Present' },
];

const EMPLOYMENT_COLUMNS = [
  { key: 'employer', label: 'Employer' },
  { key: 'title', label: 'Role' },
  { key: 'address', label: 'Employer address' },
  { key: 'fromDate', label: 'Start' },
  { key: 'toDate', label: 'End', render: (row) => row.toDate || 'Present' },
];

function TimelineStrip({ events }) {
  const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ol className="timeline-strip">
      {ordered.map((e, i) => (
        <li key={i} className="timeline-strip-item">
          <span className="timeline-strip-date">{e.date}</span>
          <span className="timeline-strip-marker" aria-hidden="true" />
          <span className="timeline-strip-event">{e.event}</span>
        </li>
      ))}
    </ol>
  );
}

function CaseTimelineCard({ timeline }) {
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <div className="card">
      <h3>Case Timeline</h3>
      <TimelineStrip events={timeline} />
      <button type="button" className="btn btn-ghost timeline-detail-toggle"
        aria-expanded={detailOpen} onClick={() => setDetailOpen(!detailOpen)}>
        {detailOpen ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
        {detailOpen ? 'Hide full detail' : 'Show full detail'}
      </button>
      {detailOpen && (
        <ol className="timeline">
          {timeline.map((e, i) => (
            <li key={i}>
              <span className="timeline-date">{e.date}</span>
              <span className="timeline-body">
                <strong>{e.event}</strong>
                <span className="muted"> - {e.actor} ({e.role})</span>
                {e.note && <div className="muted">{e.note}</div>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function alertAccent(category) {
  if (category === 'TERRORISM') return 'var(--status-hrh)';
  if (category === 'CRIMINAL') return 'var(--status-warning)';
  if (category === 'FINANCIAL') return 'var(--status-caution)';
  return 'var(--accent-teal)';
}

export default function OverviewTab({ caseData }) {
  const s = caseData.subject;
  const alertCounts = caseData.alerts.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  return (
    <div>
      <div className="card ai-summary">
        <h3>Executive Summary <AIBadge /></h3>
        <p>{caseData.aiSummary}</p>
      </div>
      {caseData.alerts.length > 0 && (
        <div className="card">
          <h3>CV Alert Summary</h3>
          <div className="alert-summary-grid">
            {Object.entries(alertCounts).map(([category, count]) => (
              <div key={category} className="alert-summary-card"
                style={{ '--alert-accent': alertAccent(category) }}>
                <div className="alert-count">{count}</div>
                <div className="alert-type">{ALERT_CATEGORY_LABELS[category] || category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <h3>Subject Information</h3>
        <KVGrid items={[
          { label: 'Full name', value: s.name },
          { label: 'Date of birth', value: s.dob },
          { label: 'Place of birth', value: s.placeOfBirth },
          { label: 'SSN', value: s.ssn },
          { label: 'Citizenship', value: s.citizenship },
          { label: 'Nationality', value: s.nationality },
          { label: 'Gender', value: s.gender },
          { label: 'Race', value: s.race },
          { label: 'Height', value: s.height },
          { label: 'Weight', value: s.weight },
          { label: 'Eye color', value: s.eyeColor },
          { label: 'Hair color', value: s.hairColor },
          { label: 'Marital status', value: s.maritalStatus },
          { label: 'Phone', value: s.phone },
          { label: 'Email', value: s.email },
          { label: 'Current address', value: s.address },
          { label: 'Tier', value: s.tier },
          { label: 'Days in stage', value: s.daysInStage },
          { label: 'Flagged guidelines',
            value: s.flaggedGuidelines.length
              ? s.flaggedGuidelines.map((g) => <GuidelineChip key={g} code={g} />)
              : 'None' },
        ]} />
        <h4 className="subject-subhead">Address History</h4>
        <DataTable columns={ADDRESS_COLUMNS} rows={s.addressHistory || []}
          rowKey="fromDate" />
        <h4 className="subject-subhead">Employment History</h4>
        <DataTable columns={EMPLOYMENT_COLUMNS} rows={s.employmentHistory || []}
          rowKey="fromDate" />
      </div>
      <WholePersonWorksheet caseData={caseData} />
      <CaseTimelineCard timeline={caseData.timeline} />
    </div>
  );
}
