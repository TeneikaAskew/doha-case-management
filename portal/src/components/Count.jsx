import { formatCompact } from '../domain.js';
import './components.css';

// A large count that shows its full comma-grouped value on desktop and a compact
// K/M/B value on phones (e.g. 3,410,000 -> 3.4M). The two forms toggle purely by
// CSS at the mobile breakpoint, so there is no resize listener and the visible
// form is the only one exposed to assistive tech.
export default function Count({ value }) {
  return (
    <>
      <span className="count-full">{value.toLocaleString('en-US')}</span>
      <span className="count-compact">{formatCompact(value)}</span>
    </>
  );
}
