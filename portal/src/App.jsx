import { HashRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider, useSession } from './state/SessionContext.jsx';
import { PersonaProvider } from './state/PersonaContext.jsx';
import { DemoProvider } from './state/DemoContext.jsx';
import AppShell from './layouts/AppShell.jsx';
import SignIn from './pages/SignIn.jsx';
import SubjectsHome from './pages/SubjectsHome.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CaseQueue from './pages/CaseQueue.jsx';
import CaseDetail from './pages/case/CaseDetail.jsx';
import CVAlerts from './pages/CVAlerts.jsx';
import DataProviders from './pages/DataProviders.jsx';
import ProviderDetail from './pages/ProviderDetail.jsx';
import Analytics from './pages/Analytics.jsx';
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';
import './pages/pages.css';

function Gate() {
  const { signedIn } = useSession();
  if (!signedIn) return <SignIn />;
  return (
    <PersonaProvider>
      <DemoProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<SubjectsHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<CaseQueue />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/alerts" element={<CVAlerts />} />
              <Route path="/providers" element={<DataProviders />} />
              <Route path="/providers/:id" element={<ProviderDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </DemoProvider>
    </PersonaProvider>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}
