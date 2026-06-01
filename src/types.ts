export type DietState = 'success' | 'fail';
export type ExerciseState = 'success' | 'fail';

// Where a numeric value came from: typed by hand, or pulled from the Renpho
// scale (manual import or sync). Used by the merge policy so a hand-typed value
// is never clobbered by a synced one. Absent = legacy/unknown, treated as manual.
export type ValueSource = 'manual' | 'renpho';

export type DayEntry = {
  date: string;
  weight?: number;
  bodyFat?: number;
  diet?: DietState;
  exercise?: ExerciseState;
  rest?: boolean;
  notes?: string;
  weightSource?: ValueSource;
  bodyFatSource?: ValueSource;
};

export type WeekPhoto = {
  weekNumber: number;
  date: string;
  photoKey: string;
};

export type WeekMeasurement = {
  weekNumber: number;
  date: string;
  waistCm?: number;
};

export type ThemePreference = 'light' | 'dark' | 'system';

// Opt-in Renpho body-data sync. Off and empty by default — the app behaves
// exactly as it does with no backend until the owner enables it and pastes the
// shared-secret token (the access gate for the proxy's public URL). The Renpho
// password never lives here; it stays a server env var.
export type RenphoSyncSettings = {
  enabled: boolean;
  syncToken: string;
  lastSyncedAt: string | null;
};

export type Settings = {
  startDate: string;
  durationWeeks: number;
  weightUnit: 'kg' | 'lb';
  waistUnit: 'cm' | 'in';
  // Display-only names for the two daily pillars. The underlying DayEntry keys
  // stay `diet`/`exercise`; only the rendered labels are configurable.
  pillarLabels: { diet: string; exercise: string };
  theme: ThemePreference;
  goalWeight?: number;
  goalWaistCm?: number;
  onboarded: boolean;
  streakShieldsRemaining: number;
  lastExportedAt: string | null;
  analyticsEnabled: boolean;
  notifications: {
    morning: boolean;
    evening: boolean;
  };
  renphoSync: RenphoSyncSettings;
};

export type DayStatus = 'perfect' | 'partial' | 'failed' | 'missed' | 'rest';

// A completed mission, retained in-app when the user begins a new one. Holds the
// full record (so it renders read-only later) plus precomputed summary stats so
// the History list doesn't recompute. Photos stay in IndexedDB under their keys.
export type ArchivedMission = {
  id: string;
  archivedAt: string;
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements: WeekMeasurement[];
  photos: WeekPhoto[];
  finalXp: number;
  stats: {
    perfectDays: number;
    longestStreak: number;
    // Delta is in the archived mission's own weightUnit; waist delta is in cm.
    weightDelta?: number;
    waistDeltaCm?: number;
  };
};
