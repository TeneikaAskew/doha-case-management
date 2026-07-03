import './components.css';

export default function StatusBadge({ variant = 'info', children }) {
  return <span className={`status-badge ${variant}`}>{children}</span>;
}
