import type { DayEntry } from '../types';
import { subDaysISO } from './date';

export function calcStreak(
  days: Record<string, DayEntry>,
  today: string,
  startDate: string,
): number {
  let streak = 0;
  let cursor = subDaysISO(today, 1);
  while (cursor >= startDate) {
    const e = days[cursor];
    if (e?.diet === 'success' && e?.exercise === 'success') {
      streak += 1;
      cursor = subDaysISO(cursor, 1);
    } else {
      break;
    }
  }
  return streak;
}
