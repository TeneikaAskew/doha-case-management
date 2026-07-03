import { FiZap } from 'react-icons/fi';
import './components.css';

export default function AIBadge() {
  return (
    <span className="ai-badge" title="AI-assisted - human decision authority">
      <FiZap aria-hidden="true" />
      AI-assisted
    </span>
  );
}
