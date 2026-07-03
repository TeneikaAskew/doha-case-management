import { Link } from 'react-router-dom';
import { FiDatabase } from 'react-icons/fi';
import { getProviders } from '../data/api.js';
import { useData } from '../data/useData.js';
import './components.css';

// Legacy display strings used in alert data → canonical providers.json names.
const ALIASES = {
  'FBI Rap Back': 'FBI CJIS / NCIC + Rap Back',
  'FBI CJIS/NCIC': 'FBI CJIS / NCIC + Rap Back',
  'CBP I-94': 'CBP I-94 Foreign Travel',
};

export default function SourceChip({ provider }) {
  const { data: providers } = useData(getProviders);
  const canonical = ALIASES[provider] || provider;
  const info = providers?.find((p) => p.name === canonical);

  const body = (
    <>
      <FiDatabase aria-hidden="true" />
      <span>{provider}</span>
    </>
  );
  if (!info) return <span className="source-chip">{body}</span>;
  return (
    <Link className="source-chip source-chip-link" to="/providers" title={info.category}>
      {body}
    </Link>
  );
}
