import type { DayStatus } from '../types';

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

  const half = Math.floor(a.totalDays / 2);
  if (a.dayNumber === half) return 'Halfway. Keep walking.';

  if (a.todayHasBoth) return 'Today is yours.';
  if (a.streak >= 12) return `Steady. ${a.streak} days.`;
  if (a.streak >= 5) return 'Consistency compounds.';
  if (a.streak >= 2) return `Steady. ${a.streak} days.`;

  if (a.yesterdayStatus === 'failed' || a.yesterdayStatus === 'missed') {
    return 'Yesterday is closed. Today is open.';
  }
  if (!a.todayHasAny) return 'Today is open.';

  return 'Consistency over intensity.';
}
