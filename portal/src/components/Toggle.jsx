import './components.css';

/* Switch-style boolean control. Keeps a real checkbox input for keyboard,
   label, and testing semantics; the track/thumb are purely visual. */
export default function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <label className={`toggle ${disabled ? 'toggle-disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={checked}
        disabled={disabled} onChange={onChange} aria-label={label} />
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-thumb" />
      </span>
      {label && <span className="toggle-text">{label}</span>}
    </label>
  );
}
