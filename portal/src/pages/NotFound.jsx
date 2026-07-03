import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="muted">
        The page you requested does not exist. <Link to="/">Back to dashboard</Link>
      </p>
    </div>
  );
}
