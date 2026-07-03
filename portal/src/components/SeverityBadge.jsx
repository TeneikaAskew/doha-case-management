import './components.css';

export default function SeverityBadge({ level }) {
  return (
    <span className={`severity-badge level-${level.toLowerCase()}`}
      title={`Severity ${level}`}>{level}</span>
  );
}
