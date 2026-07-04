import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
} from 'recharts';
import { FiBarChart2, FiTrendingUp, FiFilter, FiChevronDown } from 'react-icons/fi';
import { getAnalytics, getSubjects, getAlerts } from '../data/api.js';
import { useData } from '../data/useData.js';
import { useDemo } from '../state/DemoContext.jsx';
import {
  STAGE_LABELS, ELIGIBILITY_LABELS, ALERT_CATEGORY_LABELS, riskBand,
} from '../domain.js';
import KPICard from '../components/KPICard.jsx';
import Toggle from '../components/Toggle.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';
import SectionRef, { RefLink } from '../components/SectionRef.jsx';
import { REFS } from '../references.js';

const TICK = { fill: 'var(--text-secondary)', fontSize: 12 };
const TOOLTIP_STYLE = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-dropdown)',
};
const fmt = (n) => n.toLocaleString('en-US');
// compact data labels: 20,881 -> "20.9k", 941 -> "941"
const kfmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

const TABS = [
  { slug: 'overview', label: 'Overview' },
  { slug: 'initial', label: 'Initial Vetting' },
  { slug: 'adjudication', label: 'Adjudication' },
  { slug: 'cv', label: 'Continuous Vetting' },
  { slug: 'corpus', label: 'DOHA Corpus' },
];
const STAGES = ['INITIATION', 'INVESTIGATION', 'ADJUDICATION', 'CONTINUOUS_VETTING'];
const TIERS = ['T1', 'T2', 'T3', 'T5'];
const BANDS = ['low', 'moderate', 'high'];
const BAND_LABELS = { low: 'Low', moderate: 'Moderate', high: 'High' };
// ordinal eligibility gets a sequential navy ramp, light -> dark
const ELIG_ORDER = ['NONE', 'INTERIM', 'SECRET', 'TOP_SECRET'];
const ELIG_RAMP = { NONE: '#C7D6E5', INTERIM: '#8FA9C4', SECRET: '#4A6E96', TOP_SECRET: '#002D5B' };
const AGE_BUCKETS = [
  { label: '0-14 d', test: (d) => d <= 14 },
  { label: '15-45 d', test: (d) => d >= 15 && d <= 45 },
  { label: '46-120 d', test: (d) => d >= 46 && d <= 120 },
  { label: '120 d +', test: (d) => d > 120, color: 'var(--dcsa-gold)' },
];
const BAND_STRIP = {
  low: { bg: 'var(--status-info-bg)', ink: 'var(--status-info)' },
  moderate: { bg: 'var(--status-warning-bg)', ink: 'var(--status-warning-dark)' },
  high: { bg: 'var(--status-alert-bg)', ink: 'var(--status-alert)' },
};

function count(list, pred) { return list.filter(pred).length; }

function HBars({ items, total }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const base = total ?? items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div className="an-hbars">
      {items.map((i) => (
        <div key={i.label} className="an-hbar">
          <span className="an-hbar-label">{i.label}</span>
          <span className="an-hbar-track">
            <span className="an-hbar-fill"
              style={{ width: `${(i.value / max) * 100}%`, background: i.color || 'var(--dcsa-ocean)' }} />
          </span>
          <span className="an-hbar-value">
            {i.value}
            {base > 0 && (
              <span className="an-hbar-pct">{Math.round((i.value / base) * 100)}%</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function Bullets({ items }) {
  const max = Math.max(1, ...items.flatMap((i) => [i.value, i.target]));
  return (
    <div className="an-bullets">
      {items.map((i) => (
        <div key={i.label} className="an-bullet">
          <span className="an-hbar-label">{i.label}</span>
          <span className="an-bullet-track">
            <span className={`an-bullet-fill ${i.value > i.target ? 'over' : ''}`}
              style={{ width: `${(i.value / max) * 100}%` }} />
            <span className="an-bullet-target" style={{ left: `${(i.target / max) * 100}%` }} />
          </span>
          <span className="an-hbar-value">{i.value} / {i.target}</span>
        </div>
      ))}
    </div>
  );
}

function PostureStrip({ subjects }) {
  const counts = BANDS.map((b) => ({
    band: b, n: count(subjects, (s) => riskBand(s.riskScore) === b),
  }));
  return (
    <>
      <div className="risk-bar" role="img"
        aria-label={counts.map((c) => `${BAND_LABELS[c.band]}: ${c.n}`).join(', ')}>
        {counts.map((c) => c.n > 0 && (
          <div key={c.band} className="risk-bar-segment"
            style={{
              flex: c.n,
              '--band-bg': BAND_STRIP[c.band].bg, '--band-ink': BAND_STRIP[c.band].ink,
            }}>
            {c.n}
          </div>
        ))}
      </div>
      <div className="risk-bar-legend">
        {counts.map((c) => (
          <span key={c.band} className="risk-bar-key"
            style={{ '--band-swatch': `var(--risk-${c.band})` }}>
            {BAND_LABELS[c.band]}: {c.n}
            {subjects.length > 0 && ` (${Math.round((c.n / subjects.length) * 100)}%)`}
          </span>
        ))}
      </div>
    </>
  );
}

function FilterPanel({ filters, setFilters, matching, total }) {
  const [open, setOpen] = useState(false);
  const active = filters.stages.size + filters.tiers.size + filters.bands.size
    + (filters.cvOnly ? 1 : 0);
  const toggleIn = (key, value) => setFilters((f) => {
    const next = new Set(f[key]);
    if (next.has(value)) next.delete(value); else next.add(value);
    return { ...f, [key]: next };
  });
  return (
    <div className="an-filters">
      <div className="an-filters-row">
        <button type="button" className="btn btn-ghost an-filters-toggle"
          aria-expanded={open} onClick={() => setOpen(!open)}>
          <FiFilter aria-hidden="true" /> Filters{active > 0 && ` (${active})`}
          <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
            aria-hidden="true" />
        </button>
        {active > 0 && (
          <span className="an-filters-summary">
            {matching} of {total} subjects match
            <button type="button" className="btn btn-ghost"
              onClick={() => setFilters({
                stages: new Set(), tiers: new Set(), bands: new Set(), cvOnly: false,
              })}>
              Clear all
            </button>
          </span>
        )}
      </div>
      {open && (
        <div className="card an-filter-panel">
          <div className="an-filter-group">
            <h6>Stage</h6>
            {STAGES.map((st) => (
              <label key={st}>
                <input type="checkbox" checked={filters.stages.has(st)}
                  onChange={() => toggleIn('stages', st)} /> {STAGE_LABELS[st]}
              </label>
            ))}
          </div>
          <div className="an-filter-group">
            <h6>Tier</h6>
            {TIERS.map((t) => (
              <label key={t}>
                <input type="checkbox" checked={filters.tiers.has(t)}
                  onChange={() => toggleIn('tiers', t)} /> {t}
              </label>
            ))}
          </div>
          <div className="an-filter-group">
            <h6>Risk band</h6>
            {BANDS.map((b) => (
              <label key={b}>
                <input type="checkbox" checked={filters.bands.has(b)}
                  onChange={() => toggleIn('bands', b)} /> {BAND_LABELS[b]}
              </label>
            ))}
          </div>
          <div className="an-filter-group">
            <h6>Continuous vetting</h6>
            <Toggle checked={filters.cvOnly}
              onChange={() => setFilters((f) => ({ ...f, cvOnly: !f.cvOnly }))}
              label="Enrolled only" />
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ subjects }) {
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="Subjects" value={subjects.length} accent="var(--dcsa-navy)" />
        <KPICard label="Clear" value={count(subjects, (s) => s.status === 'CLEAR')}
          accent="var(--status-clear)" />
        <KPICard label="Needs Review" value={count(subjects, (s) => s.status === 'NEEDS_REVIEW')}
          accent="var(--status-warning)" />
        <KPICard label="Action Required"
          value={count(subjects, (s) => s.status === 'ACTION_REQUIRED')}
          accent="var(--status-alert)" />
        <KPICard label="Fast-Track"
          value={`${subjects.length
            ? Math.round((count(subjects, (s) => s.fastTrack) / subjects.length) * 100) : 0}%`}
          subtitle={`${count(subjects, (s) => s.fastTrack)} of ${subjects.length}`}
          accent="var(--dcsa-ocean)" />
      </div>
      <div className="card">
        <h3>Population Risk Posture</h3>
        <PostureStrip subjects={subjects} />
      </div>
      <div className="an-panel-grid">
        <div className="card">
          <h3>Cases by Adjudication Level</h3>
          <HBars items={ELIG_ORDER.map((e) => ({
            label: ELIGIBILITY_LABELS[e],
            value: count(subjects, (s) => s.eligibility === e),
            color: ELIG_RAMP[e],
          }))} />
        </div>
        <div className="card">
          <h3>Case Aging (Days in Stage)</h3>
          <HBars items={AGE_BUCKETS.map((b) => ({
            label: b.label,
            value: count(subjects, (s) => b.test(s.daysInStage)),
            color: b.color,
          }))} />
        </div>
        <div className="card">
          <h3>Guideline Flags</h3>
          <HBars total={subjects.length}
            items={Object.entries(subjects.reduce((acc, s) => {
              s.flaggedGuidelines.forEach((g) => { acc[g] = (acc[g] || 0) + 1; });
              return acc;
            }, {}))
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .slice(0, 6)
              .map(([g, n]) => ({ label: `Guideline ${g}`, value: n }))} />
        </div>
      </div>
    </>
  );
}

function InitialVettingTab({ subjects, timeliness }) {
  const backlog = subjects.filter((s) => ['INITIATION', 'INVESTIGATION'].includes(s.stage));
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="Initial Vetting Backlog" value={backlog.length}
          accent="var(--dcsa-gold)" />
        <KPICard label="In Initiation" value={count(subjects, (s) => s.stage === 'INITIATION')}
          accent="var(--dcsa-navy)" />
        <KPICard label="In Investigation"
          value={count(subjects, (s) => s.stage === 'INVESTIGATION')}
          accent="var(--dcsa-ocean)" />
        <KPICard label="Fast-Track Candidates" value={count(subjects, (s) => s.fastTrack)}
          accent="var(--status-clear)" />
      </div>
      <div className="an-panel-grid two">
        <div className="card">
          <h3>Stage Timeliness vs Target (Days)</h3>
          <Bullets items={timeliness.map((t) => ({
            label: t.stage, value: t.avgDays, target: t.targetDays,
          }))} />
          <SectionRef>
            Targets per the <RefLink href={REFS.FIS}>Federal Investigative
            Standards</RefLink> and Trusted Workforce 2.0 goals.
          </SectionRef>
        </div>
        <div className="card">
          <h3>Workload by Tier</h3>
          <HBars items={TIERS.map((t) => ({
            label: t, value: count(subjects, (s) => s.tier === t),
          }))} />
        </div>
      </div>
    </>
  );
}

function CVTab({ subjects, alerts, timeliness }) {
  const open = alerts.filter((a) => !['ADJUDICATED', 'CLOSED'].includes(a.effectiveState));
  const triage = timeliness.find((t) => t.stage === 'CV alert triage');
  const funnelOrder = ['NEW', 'IDENTITY_CONFIRMED', 'VALIDATED', 'REFERRED', 'ADJUDICATED', 'CLOSED'];
  const funnelLabels = {
    NEW: 'New', IDENTITY_CONFIRMED: 'Identity confirmed', VALIDATED: 'Validated',
    REFERRED: 'Referred', ADJUDICATED: 'Adjudicated', CLOSED: 'Closed',
  };
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="CV-Enrolled Subjects" value={count(subjects, (s) => s.cvEnrolled)}
          accent="var(--dcsa-ocean)" />
        <KPICard label="Open Alerts" value={open.length} accent="var(--status-alert)" />
        <KPICard label="High Severity Open"
          value={count(open, (a) => a.severity === 'HIGH')} accent="var(--status-warning)" />
        <KPICard label="Avg Triage Time" value={triage ? `${triage.avgDays} d` : '-'}
          subtitle={triage ? `target ${triage.targetDays} d` : undefined}
          accent="var(--dcsa-navy)" />
      </div>
      <div className="an-panel-grid two">
        <div className="card">
          <h3>Alert Funnel</h3>
          <HBars items={funnelOrder
            .map((st) => ({
              label: funnelLabels[st],
              value: count(alerts, (a) => a.effectiveState === st),
            }))
            .filter((i) => i.value > 0)} />
        </div>
        <div className="card">
          <h3>Alerts by Category</h3>
          <HBars items={Object.entries(alerts.reduce((acc, a) => {
            acc[a.category] = (acc[a.category] || 0) + 1;
            return acc;
          }, {}))
            .sort((a, b) => b[1] - a[1])
            .map(([c, n]) => ({ label: ALERT_CATEGORY_LABELS[c] || c, value: n }))} />
        </div>
      </div>
      <SectionRef>
        Continuous vetting alerting per <RefLink href={REFS.SEAD6}>SEAD 6</RefLink>.
      </SectionRef>
    </>
  );
}

function AdjudicationTab({ subjects, timeliness }) {
  const adj = timeliness.find((t) => t.stage === 'Adjudication');
  const inAdj = subjects.filter((s) => s.stage === 'ADJUDICATION');
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="Awaiting Adjudication" value={inAdj.length}
          accent="var(--status-warning)" />
        <KPICard label="Action Required"
          value={count(subjects, (s) => s.status === 'ACTION_REQUIRED')}
          accent="var(--status-alert)" />
        <KPICard label="Avg Days in Adjudication" value={adj ? `${adj.avgDays}` : '-'}
          subtitle={adj ? `target ${adj.targetDays}` : undefined}
          accent="var(--dcsa-navy)" />
        <KPICard label="Interim Eligibility"
          value={count(subjects, (s) => s.eligibility === 'INTERIM')}
          accent="var(--dcsa-gold)" />
      </div>
      <div className="an-panel-grid two">
        <div className="card">
          <h3>Cases by Adjudication Level</h3>
          <HBars items={ELIG_ORDER.map((e) => ({
            label: ELIGIBILITY_LABELS[e],
            value: count(subjects, (s) => s.eligibility === e),
            color: ELIG_RAMP[e],
          }))} />
        </div>
        <div className="card">
          <h3>Risk Band in Adjudication</h3>
          <HBars items={BANDS.map((b) => ({
            label: BAND_LABELS[b],
            value: count(inAdj, (s) => riskBand(s.riskScore) === b),
            color: `var(--risk-${b})`,
          }))} />
        </div>
      </div>
      <SectionRef>
        Adjudication standards per <RefLink href={REFS.SEAD4}>SEAD 4</RefLink>.
      </SectionRef>
    </>
  );
}

function CorpusTab({ corpus }) {
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="Total DOHA Cases" value={fmt(corpus.totalCases)}
          accent="var(--dcsa-navy)" />
        <KPICard label="Granted" value={fmt(corpus.byOutcome.GRANTED ?? 0)}
          accent="var(--status-clear)" />
        <KPICard label="Denied" value={fmt(corpus.byOutcome.DENIED ?? 0)}
          accent="var(--status-alert)" />
        <KPICard label="Hearings" value={fmt(corpus.byCaseType.hearing ?? 0)}
          accent="var(--dcsa-gold)" />
        <KPICard label="Appeals" value={fmt(corpus.byCaseType.appeal ?? 0)}
          accent="var(--dcsa-ocean)" />
      </div>
      <div className="card chart-card">
        <h3><FiBarChart2 className="section-icon" aria-hidden="true" />Cases by Guideline</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={corpus.byGuideline} margin={{ top: 18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="code" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="cases" name="Cases" fill="var(--dcsa-ocean)">
              <LabelList dataKey="cases" position="top" formatter={kfmt}
                fill="var(--text-secondary)" fontSize={11} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card chart-card">
        <h3><FiTrendingUp className="section-icon" aria-hidden="true" />Outcomes by Year</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={corpus.byYear}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="year" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Line type="monotone" dataKey="granted" name="Granted"
              stroke="var(--status-clear)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="denied" name="Denied"
              stroke="var(--status-alert)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <SectionRef>
        Corpus derived from{' '}
        <RefLink href={REFS.DOHA_DECISIONS}>DOHA Industrial Security Clearance
        Decisions</RefLink>.
      </SectionRef>
    </>
  );
}

export default function Analytics() {
  const { demo } = useDemo();
  const analyticsQ = useData(getAnalytics);
  const subjectsQ = useData(getSubjects);
  const alertsQ = useData(getAlerts);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    stages: new Set(), tiers: new Set(), bands: new Set(), cvOnly: false,
  });

  const active = params.get('tab') || 'overview';
  const tab = TABS.find((t) => t.slug === active) || TABS[0];

  const model = useMemo(() => {
    if (!subjectsQ.data || !alertsQ.data) return null;
    const subjects = subjectsQ.data.filter((s) => (
      (!filters.stages.size || filters.stages.has(s.stage))
      && (!filters.tiers.size || filters.tiers.has(s.tier))
      && (!filters.bands.size || filters.bands.has(riskBand(s.riskScore)))
      && (!filters.cvOnly || s.cvEnrolled)
    ));
    const ids = new Set(subjects.map((s) => s.id));
    const alerts = alertsQ.data
      .filter((a) => ids.has(a.subjectId))
      .map((a) => ({ ...a, effectiveState: demo.alertStates[a.id] || a.state }));
    return { subjects, alerts };
  }, [subjectsQ.data, alertsQ.data, filters, demo.alertStates]);

  if (analyticsQ.loading || subjectsQ.loading || alertsQ.loading) return <Loading />;
  const error = analyticsQ.error || subjectsQ.error || alertsQ.error;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const { corpus, pipeline } = analyticsQ.data;
  const { subjects, alerts } = model;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Case-population metrics by mission area, plus the public DOHA decision corpus</p>
        </div>
      </div>

      <div className="tab-bar" role="tablist">
        {TABS.map((t) => (
          <button key={t.slug} role="tab" aria-selected={t.slug === tab.slug}
            className={`tab-button ${t.slug === tab.slug ? 'active' : ''}`}
            onClick={() => setParams({ tab: t.slug })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab.slug !== 'corpus' && (
        <FilterPanel filters={filters} setFilters={setFilters}
          matching={subjects.length} total={subjectsQ.data.length} />
      )}

      {tab.slug === 'overview' && <OverviewTab subjects={subjects} />}
      {tab.slug === 'initial' && (
        <InitialVettingTab subjects={subjects} timeliness={pipeline.timeliness} />
      )}
      {tab.slug === 'cv' && (
        <CVTab subjects={subjects} alerts={alerts} timeliness={pipeline.timeliness} />
      )}
      {tab.slug === 'adjudication' && (
        <AdjudicationTab subjects={subjects} timeliness={pipeline.timeliness} />
      )}
      {tab.slug === 'corpus' && <CorpusTab corpus={corpus} />}
    </div>
  );
}
