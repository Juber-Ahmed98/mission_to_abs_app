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
  theme: ThemePreference;
  goalWeight?: number;
  goalWaistCm?: number;
  onboarded: boolean;
  streakShieldsRemaining: number;
  lastExportedAt: string | null;
  analyticsEnabled: boolean;
};

export type DayStatus = 'perfect' | 'partial' | 'failed' | 'missed' | 'rest';
