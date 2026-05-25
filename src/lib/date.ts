import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDaysISO(s: string, n: number): string {
  return format(addDays(parseISO(s), n), 'yyyy-MM-dd');
}

export function subDaysISO(s: string, n: number): string {
  return format(subDays(parseISO(s), n), 'yyyy-MM-dd');
}

export function diffDays(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(a), parseISO(b));
}

export function dayNumberFor(date: string, startDate: string): number {
  return diffDays(date, startDate) + 1;
}

export function weekNumberFor(date: string, startDate: string): number {
  const dn = dayNumberFor(date, startDate);
  return Math.max(1, Math.ceil(dn / 7));
}

export function totalDays(durationWeeks: number): number {
  return durationWeeks * 7;
}

export function isEndOfWeek(dayNumber: number): boolean {
  return dayNumber > 0 && dayNumber % 7 === 0;
}

export function formatNice(s: string): string {
  return format(parseISO(s), 'EEE, MMM d');
}

export function yesterdayISO(today: string): string {
  return subDaysISO(today, 1);
}
