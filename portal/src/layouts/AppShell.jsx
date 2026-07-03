import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { usePersona } from '../state/PersonaContext.jsx';
import { useDemo } from '../state/DemoContext.jsx';
import { PERSONAS } from '../domain.js';
import './shell.css';

export default function AppShell() {
  const { persona, setPersona } = usePersona();
  const { reset } = useDemo();
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q')?.trim();
    navigate(q ? `/cases?q=${encodeURIComponent(q)}` : '/cases');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-seal" aria-hidden="true">DCSA</span>
          <div>
            <div className="app-header-title">Personnel Vetting</div>
            <div className="app-header-subtitle">Case management demo</div>
          </div>
        </div>
        <form className="app-header-search" onSubmit={onSearch} role="search">
          <input name="q" type="search" placeholder="Search subjects…"
            aria-label="Search subjects" />
        </form>
        <div className="app-header-actions">
          <label className="persona-switch">
            <span>Viewing as</span>
            <select aria-label="Persona" value={persona.id}
              onChange={(e) => setPersona(e.target.value)}>
              {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-ghost header-reset" onClick={reset}>
            Reset demo
          </button>
        </div>
      </header>
      <nav className="app-sidebar">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/cases">Case queue</NavLink>
        <NavLink to="/alerts">CV alerts</NavLink>
        <NavLink to="/providers">Data providers</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
