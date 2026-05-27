import { Suspense, lazy, useEffect } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import UndoToast from './components/UndoToast';
import Dashboard from './pages/Dashboard';
import JourneyPage from './pages/Journey';
import OnboardingPage from './pages/Onboarding';
import { useMission } from './store/mission';
import { useApplyTheme } from './lib/theme';
import { requestPersistence } from './lib/storage';
import { bump } from './lib/analytics';
import { scheduleAll as scheduleAllReminders } from './lib/notifications';

const ProgressPage = lazy(() => import('./pages/Progress'));
const PhotosPage = lazy(() => import('./pages/Photos'));
const Compare = lazy(() => import('./pages/Compare'));
const SettingsPage = lazy(() => import('./pages/Settings'));

const SESSION_FLAG = 'mission.analytics.sessionSeen';

const PERSISTENCE_FLAG = 'mission.persistenceRequested';

function Shell() {
  const themePref = useMission((s) => s.settings.theme);
  const onboarded = useMission((s) => s.settings.onboarded);
  const dayCount = useMission((s) => Object.keys(s.days).length);
  const notifications = useMission((s) => s.settings.notifications);
  const setSettings = useMission((s) => s.setSettings);
  useApplyTheme(themePref);
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith('/compare') || pathname.startsWith('/onboarding');

  useEffect(() => {
    scheduleAllReminders(notifications);
  }, [notifications]);

  useEffect(() => {
    if (localStorage.getItem(PERSISTENCE_FLAG)) return;
    requestPersistence().finally(() => {
      localStorage.setItem(PERSISTENCE_FLAG, '1');
    });
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, '1');
    bump('sessionsOpened');
  }, []);

  // Existing-user migration: prior data exists but onboarded was defaulted false.
  // Auto-flip to onboarded and flag for the welcome-back banner.
  useEffect(() => {
    if (!onboarded && dayCount > 0) {
      setSettings({ onboarded: true });
      if (localStorage.getItem('mission.welcomeBackDismissed') !== '1') {
        localStorage.setItem('mission.welcomeBack', '1');
      }
    }
  }, [onboarded, dayCount, setSettings]);

  const onOnboarding = pathname.startsWith('/onboarding');
  const needsOnboarding = !onboarded && dayCount === 0 && !onOnboarding;

  return (
    <div className="min-h-dvh bg-bg text-text font-sans">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route
              path="/"
              element={
                needsOnboarding ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <Dashboard />
                )
              }
            />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/photos" element={<PhotosPage />} />
            <Route path="/compare/:a/:b" element={<Compare />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <UndoToast />
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
