import './components.css';

export default function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  return (
    <span className="confidence-bar-wrap">
      <span className="confidence-bar">
        <span className="confidence-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="confidence-pct">{pct}%</span>
    </span>
  );
}
