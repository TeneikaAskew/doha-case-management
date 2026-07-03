import './components.css';

export function RefLink({ href, children }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export default function SectionRef({ children }) {
  return <p className="muted section-ref">{children}</p>;
}
