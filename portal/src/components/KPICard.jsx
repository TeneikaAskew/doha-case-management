import './components.css';

export default function KPICard({ label, value, subtitle, accent = 'var(--dcsa-ocean)' }) {
  return (
    <div className="kpi-card" style={{ '--kpi-accent': accent }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  );
}
