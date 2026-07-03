import './components.css';

export default function KPICard({
  label, value, subtitle, accent = 'var(--dcsa-ocean)', onClick, active,
}) {
  const style = { '--kpi-accent': accent };
  const content = (
    <>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
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
