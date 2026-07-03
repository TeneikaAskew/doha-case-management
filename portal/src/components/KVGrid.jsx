import './components.css';

export default function KVGrid({ items }) {
  return (
    <dl className="kv-grid">
      {items.map(({ label, value }) => (
        <div key={label} className="kv-item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
