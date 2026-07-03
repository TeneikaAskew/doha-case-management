import { useState } from 'react';
import './components.css';

export default function CollapsibleSection({ title, meta = null, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible card">
      <button type="button" className="collapsible-header" onClick={() => setOpen(!open)}>
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-meta">{meta}</span>
        <span className="collapsible-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
