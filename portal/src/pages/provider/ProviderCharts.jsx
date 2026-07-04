import { GUIDELINES, ALERT_CATEGORY_GUIDELINE, DEMO_TODAY } from '../../domain.js';

// Severity uses the app's semantic status colors (never categorical hues).
const SEVERITIES = [
  { id: 'HIGH', label: 'High', color: 'var(--status-alert)' },
  { id: 'MODERATE', label: 'Moderate', color: 'var(--status-warning)' },
  { id: 'LOW', label: 'Low', color: 'var(--status-info)' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthRange(from, to) {
  const months = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return months;
}

export function VolumeByMonth({ alerts }) {
  if (!alerts.length) return null;
  const firstMonth = alerts
    .map((a) => a.receivedDate.slice(0, 7)).sort()[0];
  const months = monthRange(firstMonth, DEMO_TODAY.slice(0, 7));
  const buckets = months.map((month) => {
    const inMonth = alerts.filter((a) => a.receivedDate.startsWith(month));
    return {
      month,
      total: inMonth.length,
      bySeverity: SEVERITIES.map((s) => ({
        ...s, count: inMonth.filter((a) => a.severity === s.id).length,
      })),
    };
  });
  const max = Math.max(...buckets.map((b) => b.total), 1);

  return (
    <div className="card provider-chart-card">
      <div className="provider-chart-head">
        <h3>Alert Volume by Month</h3>
        <div className="chart-legend" aria-hidden="true">
          {SEVERITIES.map((s) => (
            <span key={s.id} className="chart-legend-key">
              <span className="chart-legend-swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="volume-chart" role="img"
        aria-label={`Alerts per month: ${buckets.filter((b) => b.total)
          .map((b) => `${b.month}: ${b.total}`).join(', ') || 'none'}`}>
        {buckets.map((b) => (
          <div key={b.month} className="volume-col"
            title={`${b.month}: ${b.total} alert${b.total === 1 ? '' : 's'}`}>
            {b.total === b.total && b.total === max && (
              <span className="volume-max-label">{b.total}</span>
            )}
            <div className="volume-bar">
              {b.bySeverity.filter((s) => s.count > 0).map((s) => (
                <span key={s.id} className="volume-seg"
                  style={{ height: `${(s.count / max) * 100}%`, background: s.color }} />
              ))}
            </div>
            <span className="volume-month">
              {MONTH_LABELS[Number(b.month.slice(5)) - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuidelineYield({ provider, alerts }) {
  const rows = provider.guidelines.map((code) => ({
    code,
    name: GUIDELINES[code],
    count: alerts.filter((a) => ALERT_CATEGORY_GUIDELINE[a.category] === code).length,
  })).sort((a, b) => b.count - a.count);
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="card provider-chart-card">
      <h3>Guideline Yield</h3>
      <p className="muted provider-chart-sub">Alerts per covered guideline</p>
      <div className="an-hbars">
        {rows.map((r) => (
          <div key={r.code} className="an-hbar" title={`${r.name}: ${r.count} alerts`}>
            <span className="an-hbar-label">{r.code}</span>
            <span className="an-hbar-track">
              {r.count > 0 && (
                <span className="an-hbar-fill"
                  style={{ width: `${(r.count / max) * 100}%`,
                    background: 'var(--dcsa-ocean)' }} />
              )}
            </span>
            <span className="an-hbar-value">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
