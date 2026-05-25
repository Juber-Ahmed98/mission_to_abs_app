import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import JourneyPage from './pages/Journey';
import ProgressPage from './pages/Progress';
import PhotosPage from './pages/Photos';
import Compare from './pages/Compare';
import SettingsPage from './pages/Settings';
import { useMission } from './store/mission';
import { useApplyTheme } from './lib/theme';
import { requestPersistence } from './lib/storage';

const PERSISTENCE_FLAG = 'mission.persistenceRequested';

function Shell() {
  const themePref = useMission((s) => s.settings.theme);
  useApplyTheme(themePref);
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/compare');

  useEffect(() => {
    if (localStorage.getItem(PERSISTENCE_FLAG)) return;
    requestPersistence().finally(() => {
      localStorage.setItem(PERSISTENCE_FLAG, '1');
    });
  }, []);
  return (
    <div className="min-h-dvh bg-bg text-text font-sans">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="/compare/:a/:b" element={<Compare />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
