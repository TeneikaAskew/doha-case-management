import './components.css';

export function Loading() {
  return <div className="state-block muted" role="status">Loading…</div>;
}

export function ErrorAlert({ message }) {
  return (
    <div className="state-block error-alert" role="alert">
      <strong>Something went wrong.</strong> {message}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="state-block empty-state">
      <h3>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
