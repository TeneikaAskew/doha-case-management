import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiHome, FiUser, FiUsers, FiActivity, FiDatabase, FiBarChart2,
  FiChevronLeft, FiChevronRight, FiSearch, FiRotateCcw,
} from 'react-icons/fi';
import { usePersona } from '../state/PersonaContext.jsx';
import { useDemo } from '../state/DemoContext.jsx';
import { PERSONAS } from '../domain.js';
import './shell.css';

const SIDEBAR_STORAGE_KEY = 'demo.sidebar';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Subjects', Icon: FiUsers },
  { to: '/dashboard', label: 'Dashboard', Icon: FiHome },
  { to: '/cases', label: 'Case Queue', Icon: FiUser },
  { to: '/alerts', label: 'CV Alerts', Icon: FiActivity },
  { to: '/providers', label: 'Data Providers', Icon: FiDatabase },
  { to: '/analytics', label: 'Analytics', Icon: FiBarChart2 },
];

export default function AppShell() {
  const { persona, setPersona } = usePersona();
  const { reset } = useDemo();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed');

  const toggleSidebar = () => {
    const next = !collapsed;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? 'collapsed' : 'expanded');
    setCollapsed(next);
  };

  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.target).get('q')?.trim();
    navigate(q ? `/cases?q=${encodeURIComponent(q)}` : '/cases');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-brand">
          <img className="app-header-seal" src={`${import.meta.env.BASE_URL}dcsa-seal.png`} alt="DCSA seal" />
          <div>
            <div className="app-header-title">Personnel Vetting</div>
            <div className="app-header-subtitle">Case management demo</div>
          </div>
        </div>
        <form className="app-header-search" onSubmit={onSearch} role="search">
          <FiSearch className="app-header-search-icon" aria-hidden="true" />
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
            <FiRotateCcw aria-hidden="true" /> Reset demo
          </button>
        </div>
      </header>
      <nav className={collapsed ? 'app-sidebar collapsed' : 'app-sidebar'}>
        <button type="button" className="sidebar-toggle" onClick={toggleSidebar}
          aria-label="Toggle sidebar">
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
        {NAV_ITEMS.map(({ to, end, label, Icon }) => (
          <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined}>
            <span className="sidebar-icon" aria-hidden="true"><Icon /></span>
            <span className="sidebar-label">{label}</span>
          </NavLink>
        ))}
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
