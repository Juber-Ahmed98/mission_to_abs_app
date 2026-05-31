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
