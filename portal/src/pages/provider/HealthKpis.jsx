import KPICard from '../../components/KPICard.jsx';

const STATUS_ACCENT = {
  HEALTHY: 'var(--status-clear)',
  DEGRADED: 'var(--status-warning)',
  OFFLINE: 'var(--status-alert)',
};

export default function HealthKpis({ provider: p }) {
  const n = p.network;
  return (
    <>
      <div className="kpi-grid">
        <KPICard label="Status" value={p.status} accent={STATUS_ACCENT[p.status]}
          subtitle={`uptime ${p.uptimePct}%`} />
        <KPICard label="Last Sync" value={p.lastSync.slice(0, 10)}
          accent="var(--dcsa-navy)" subtitle={p.syncCadence} />
        <KPICard label="Records" value={p.recordCount.toLocaleString('en-US')}
          accent="var(--dcsa-ocean)" subtitle={p.recordsGrowthQtr} />
        <KPICard label="Match Error Rate" value={`${p.matchErrorRate}%`}
          accent={p.matchErrorRate >= 2 ? 'var(--status-warning)' : 'var(--dcsa-gold)'}
          subtitle="identifier mismatches" />
      </div>
      {n && (
        <div className="kpi-grid">
          <KPICard label="Covered Subjects"
            value={n.coveredSubjects.toLocaleString('en-US')}
            accent="var(--dcsa-navy)" subtitle="wired to this source" />
          <KPICard label="Checks Past Year"
            value={n.checks12mo.toLocaleString('en-US')}
            accent="var(--dcsa-ocean)" subtitle="network-wide deliveries" />
          <KPICard label="Findings Past Year"
            value={n.findings12mo.toLocaleString('en-US')}
            accent="var(--status-warning)"
            subtitle={`auto-clear ${n.autoClearPct}%`} />
          <KPICard label="Median Turnaround"
            value={`${n.medianTurnaroundDays}d`}
            accent="var(--dcsa-gold)" subtitle="request to delivery, days" />
        </div>
      )}
    </>
  );
}
