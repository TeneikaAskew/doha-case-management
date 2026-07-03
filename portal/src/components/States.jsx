import { FiFileText } from 'react-icons/fi';
import './components.css';

export function Loading() {
  return (
    <div className="state-block loading-container" role="status">
      <div className="loading-bar"><div className="loading-bar-fill" /></div>
      <span className="loading-text">Loading...</span>
    </div>
  );
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
      <FiFileText className="empty-state-icon" aria-hidden="true" />
      <h3>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
