import { GUIDELINES } from '../../domain.js';

// Severity uses the app's semantic status colors (never categorical hues).
const SEVERITIES = [
  { id: 'high', label: 'High', color: 'var(--status-alert)' },
  { id: 'moderate', label: 'Moderate', color: 'var(--status-warning)' },
  { id: 'low', label: 'Low', color: 'var(--status-info)' },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmt = (n) => n.toLocaleString('en-US');

// Charts draw on the source's network-wide stats (all monitored subjects),
// so every provider has a full year of data even with no demo case attached.
export function VolumeByMonth({ network, isCv }) {
  const noun = isCv ? 'alerts' : 'findings';
  const buckets = network.monthly;
  const max = Math.max(...buckets.map((b) => b.findings), 1);

  return (
    <div className="card provider-chart-card">
      <div className="provider-chart-head">
        <h3>{isCv ? 'Alert Volume by Month' : 'Finding Volume by Month'}</h3>
        <div className="chart-legend" aria-hidden="true">
          {SEVERITIES.map((s) => (
            <span key={s.id} className="chart-legend-key">
              <span className="chart-legend-swatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <p className="muted provider-chart-sub">
        All monitored subjects, trailing 12 months
      </p>
      <div className="volume-chart" role="img"
        aria-label={`${isCv ? 'Alerts' : 'Findings'} per month: ${buckets
          .map((b) => `${b.month}: ${b.findings}`).join(', ')}`}>
        {buckets.map((b) => (
          <div key={b.month} className="volume-col"
            title={`${b.month}: ${fmt(b.findings)} ${noun} from ${fmt(b.checks)} checks`}>
            {b.findings === max && (
              <span className="volume-max-label">{fmt(b.findings)}</span>
            )}
            <div className="volume-bar">
              {SEVERITIES.filter((s) => b[s.id] > 0).map((s) => (
                <span key={s.id} className="volume-seg"
                  style={{ height: `${(b[s.id] / max) * 100}%`, background: s.color }} />
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

export function GuidelineYield({ provider }) {
  const byGuideline = provider.network.findingsByGuideline;
  const rows = provider.guidelines.map((code) => ({
    code,
    name: GUIDELINES[code],
    count: byGuideline[code] || 0,
  })).sort((a, b) => b.count - a.count);
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="card provider-chart-card">
      <h3>Guideline Yield</h3>
      <p className="muted provider-chart-sub">
        Findings per covered guideline, trailing 12 months
      </p>
      <div className="an-hbars">
        {rows.map((r) => (
          <div key={r.code} className="an-hbar"
            title={`${r.name}: ${fmt(r.count)} findings`}>
            <span className="an-hbar-label">{r.code}</span>
            <span className="an-hbar-track">
              {r.count > 0 && (
                <span className="an-hbar-fill"
                  style={{ width: `${(r.count / max) * 100}%`,
                    background: 'var(--dcsa-ocean)' }} />
              )}
            </span>
            <span className="an-hbar-value">{fmt(r.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
