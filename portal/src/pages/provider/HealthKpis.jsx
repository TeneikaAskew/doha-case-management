import KPICard from '../../components/KPICard.jsx';

// Trailing-quarter check volume vs the quarter before it, from the
// provider's own monthly series.
function quarterTrend(monthly) {
  if (monthly.length < 6) return null;
  const sum = (ms) => ms.reduce((t, m) => t + m.checks, 0);
  const last = sum(monthly.slice(-3));
  const prior = sum(monthly.slice(-6, -3));
  if (!prior) return null;
  const pct = ((last - prior) / prior) * 100;
  return {
    dir: pct >= 0 ? 'up' : 'down',
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs prior quarter`,
  };
}

// Status and last sync live in the page header; the KPI band is one row.
export default function HealthKpis({ provider: p }) {
  const n = p.network;
  const checksTrend = n && quarterTrend(n.monthly);
  return (
    <div className="kpi-grid kpi-grid-six">
      <KPICard label="Records" value={p.recordCount.toLocaleString('en-US')}
        accent="var(--dcsa-ocean)" subtitle={p.recordsGrowthQtr}
        trend={p.recordsGrowthQtr.startsWith('+') ? 'up' : 'down'} />
      <KPICard label="Match Error Rate" value={`${p.matchErrorRate}%`}
        accent={p.matchErrorRate >= 2 ? 'var(--status-warning)' : 'var(--dcsa-gold)'}
        subtitle="identifier mismatches" />
      {n && (
        <>
          <KPICard label="Covered Subjects"
            value={n.coveredSubjects.toLocaleString('en-US')}
            accent="var(--dcsa-navy)" subtitle="wired to this source" />
          <KPICard label="Checks Past Year"
            value={n.checks12mo.toLocaleString('en-US')}
            accent="var(--dcsa-ocean)"
            subtitle={checksTrend ? checksTrend.label : 'network-wide deliveries'}
            trend={checksTrend?.dir} />
          <KPICard label="Alerts Past Year"
            value={n.findings12mo.toLocaleString('en-US')}
            accent="var(--status-warning)"
            subtitle={`auto-clear ${n.autoClearPct}%`}
            progressPct={n.autoClearPct} />
          <KPICard label="Median Turnaround"
            value={`${n.medianTurnaroundDays}d`}
            accent="var(--dcsa-gold)" subtitle="request to delivery, days" />
        </>
      )}
    </div>
  );
}
