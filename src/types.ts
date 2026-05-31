export type DietState = 'success' | 'fail';
export type ExerciseState = 'success' | 'fail';

export type DayEntry = {
  date: string;
  weight?: number;
  diet?: DietState;
  exercise?: ExerciseState;
  rest?: boolean;
  notes?: string;
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
