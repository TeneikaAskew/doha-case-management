import KPICard from '../../components/KPICard.jsx';

// Status and last sync live in the page header; the KPI band is one row.
export default function HealthKpis({ provider: p }) {
  const n = p.network;
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
            accent="var(--dcsa-ocean)" subtitle="network-wide deliveries" />
          <KPICard label="Findings Past Year"
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
