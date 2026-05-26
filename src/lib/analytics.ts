import { useMission } from '../store/mission';

const KEY = 'mission.analytics';

export type AnalyticsCounters = {
  sessionsOpened: number;
  daysLogged: number;
  photosUploaded: number;
  measurementsLogged: number;
  undosUsed: number;
  missionsCompleted: number;
};

const ZERO: AnalyticsCounters = {
  sessionsOpened: 0,
  daysLogged: 0,
  photosUploaded: 0,
  measurementsLogged: 0,
  undosUsed: 0,
  missionsCompleted: 0,
};

export function readAnalytics(): AnalyticsCounters {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...ZERO };
    const parsed = JSON.parse(raw) as Partial<AnalyticsCounters>;
    return { ...ZERO, ...parsed };
  } catch {
    return { ...ZERO };
  }
}

function writeAnalytics(counters: AnalyticsCounters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(counters));
  } catch {
    // storage may be denied or full; counters silently drop
  }
}

function isEnabled(): boolean {
  try {
    return useMission.getState().settings.analyticsEnabled === true;
  } catch {
    return false;
  }
}

export function bump(key: keyof AnalyticsCounters, by = 1) {
  if (!isEnabled()) return;
  const cur = readAnalytics();
  cur[key] = (cur[key] ?? 0) + by;
  writeAnalytics(cur);
}

export function resetAnalytics() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
