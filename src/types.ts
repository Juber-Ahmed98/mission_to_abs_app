export type DietState = 'success' | 'fail';
export type ExerciseState = 'success' | 'fail';

export type DayEntry = {
  date: string;
  weight?: number;
  diet?: DietState;
  exercise?: ExerciseState;
  notes?: string;
};

export type WeekPhoto = {
  weekNumber: number;
  date: string;
  photoKey: string;
};

export type ThemePreference = 'light' | 'dark' | 'system';

export type Settings = {
  startDate: string;
  durationWeeks: number;
  weightUnit: 'kg' | 'lb';
  theme: ThemePreference;
};

export type DayStatus = 'perfect' | 'partial' | 'failed' | 'missed';
