import { GUIDELINES } from '../domain.js';
import './components.css';

export default function GuidelineChip({ code }) {
  return <span className="guideline-chip" title={GUIDELINES[code]}>{code}</span>;
}
