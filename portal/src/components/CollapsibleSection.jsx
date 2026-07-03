import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import './components.css';

export default function CollapsibleSection({
  title, meta = null, icon = null, defaultOpen = false, children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="collapsible card">
      <button type="button" className="collapsible-header" onClick={() => setOpen(!open)}>
        {icon && <span className="section-icon" aria-hidden="true">{icon}</span>}
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-meta">{meta}</span>
        <FiChevronDown className={open ? 'collapsible-chevron open' : 'collapsible-chevron'}
          aria-hidden="true" />
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
