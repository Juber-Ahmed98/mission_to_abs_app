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
  if (a.dayNumber > a.totalDays) return `The summit. Day ${a.totalDays}.`;
  if (a.dayNumber < 1) return 'The route is plotted.';

  if (a.dayNumber === 1 && !a.todayHasAny)
    return "Trailhead. The first mark is today's log.";
  if (a.dayNumber === a.totalDays) return 'The summit is today.';

  if (a.dayNumber === halfwayDay(a.totalDays)) return 'Halfway. Keep walking.';

  if (a.todayHasBoth) return 'Today is walked.';
  if (a.streak >= 2) return `Steady. ${a.streak} days walked.`;

  if (a.yesterdayStatus === 'failed' || a.yesterdayStatus === 'missed') {
    return 'Yesterday is closed. Today is open.';
  }
  if (!a.todayHasAny) return 'Today is open.';

  return 'One stretch at a time is the whole way there.';
}
