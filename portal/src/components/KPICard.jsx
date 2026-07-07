import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import './components.css';

export default function KPICard({
  label, value, subtitle, accent = 'var(--dcsa-ocean)', onClick, active,
  trend, progressPct,
}) {
  const style = { '--kpi-accent': accent };
  const content = (
    <>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtitle && (
        <div className="kpi-subtitle">
          {trend === 'up' && (
            <FiArrowUpRight className="kpi-trend kpi-trend-up"
              aria-label="increasing" />
          )}
          {trend === 'down' && (
            <FiArrowDownRight className="kpi-trend kpi-trend-down"
              aria-label="decreasing" />
          )}
          {subtitle}
        </div>
      )}
      {progressPct !== undefined && (
        <div className="kpi-progress" role="img"
          aria-label={`${progressPct}% of 100`}>
          <span className="kpi-progress-fill"
            style={{ width: `${Math.min(progressPct, 100)}%` }} />
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={`kpi-card kpi-clickable ${active ? 'active' : ''}`}
        style={style} onClick={onClick} aria-pressed={!!active}>
        {content}
      </button>
    );
  }

  return (
    <div className="kpi-card" style={style}>
      {content}
    </div>
  );
}
