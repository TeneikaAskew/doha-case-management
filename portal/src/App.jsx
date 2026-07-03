import { HashRouter, Routes, Route } from 'react-router-dom';
import { PersonaProvider } from './state/PersonaContext.jsx';
import { DemoProvider } from './state/DemoContext.jsx';
import AppShell from './layouts/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CaseQueue from './pages/CaseQueue.jsx';
import CaseDetail from './pages/case/CaseDetail.jsx';
import CVAlerts from './pages/CVAlerts.jsx';
import DataProviders from './pages/DataProviders.jsx';
import Analytics from './pages/Analytics.jsx';
import NotFound from './pages/NotFound.jsx';
import './pages/pages.css';

export default function App() {
  return (
    <PersonaProvider>
      <DemoProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cases" element={<CaseQueue />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/alerts" element={<CVAlerts />} />
              <Route path="/providers" element={<DataProviders />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </DemoProvider>
    </PersonaProvider>
  );
}
