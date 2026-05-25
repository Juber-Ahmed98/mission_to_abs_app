import type { DayStatus } from '../types';
import { halfwayDay } from './date';

export type EncouragementInput = {
  dayNumber: number;
  totalDays: number;
  streak: number;
  yesterdayStatus: DayStatus;
  todayHasBoth: boolean;
  todayHasAny: boolean;
};

export function encouragement(a: EncouragementInput): string {
  if (a.dayNumber > a.totalDays) return `Mission complete. Day ${a.totalDays}.`;
  if (a.dayNumber < 1) return 'Begin where you are.';

  if (a.dayNumber === 1 && !a.todayHasAny) return 'Begin where you are. Day 1.';
  if (a.dayNumber === a.totalDays) return 'Final day.';

  if (a.dayNumber === halfwayDay(a.totalDays)) return 'Halfway. Keep walking.';

  if (a.todayHasBoth) return 'Today is yours.';
  if (a.streak >= 2) return `Steady. ${a.streak} days.`;

  if (a.yesterdayStatus === 'failed' || a.yesterdayStatus === 'missed') {
    return 'Yesterday is closed. Today is open.';
  }
  if (!a.todayHasAny) return 'Today is open.';

  return 'Consistency over intensity.';
}
