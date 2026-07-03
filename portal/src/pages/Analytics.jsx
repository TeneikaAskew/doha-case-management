import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getAnalytics } from '../data/api.js';
import { useData } from '../data/useData.js';
import KPICard from '../components/KPICard.jsx';
import { Loading, ErrorAlert } from '../components/States.jsx';

const TICK = { fill: 'var(--text-secondary)', fontSize: 12 };
const TOOLTIP_STYLE = {
  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-dropdown)',
};
const fmt = (n) => n.toLocaleString('en-US');

export default function Analytics() {
  const { data, loading, error } = useData(getAnalytics);

  if (loading) return <Loading />;
  if (error) return <div className="page"><ErrorAlert message={error} /></div>;

  const { corpus, pipeline } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Aggregates from the public DOHA decision corpus and demo pipeline metrics</p>
        </div>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total DOHA Cases" value={fmt(corpus.totalCases)}
          accent="var(--dcsa-navy)" />
        <KPICard label="Granted" value={fmt(corpus.byOutcome.GRANTED ?? 0)}
          accent="var(--status-clear)" />
        <KPICard label="Denied" value={fmt(corpus.byOutcome.DENIED ?? 0)}
          accent="var(--status-alert)" />
        <KPICard label="Hearings / Appeals"
          value={`${fmt(corpus.byCaseType.hearing ?? 0)} / ${fmt(corpus.byCaseType.appeal ?? 0)}`}
          accent="var(--dcsa-gold)" />
      </div>

      <div className="card chart-card">
        <h3>Cases by Guideline</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={corpus.byGuideline}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="code" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="cases" name="Cases" fill="var(--dcsa-ocean)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card chart-card">
        <h3>Outcomes by Year</h3>
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

      <div className="card chart-card">
        <h3>Pipeline Timeliness</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pipeline.timeliness}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="stage" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="avgDays" name="Average days" fill="var(--dcsa-ocean)" />
            <Bar dataKey="targetDays" name="Target days" fill="var(--dcsa-navy)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
