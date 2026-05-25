import type { DayEntry, WeekMeasurement, WeekPhoto } from '../types';

export const XP = {
  diet: 30,
  exercise: 30,
  perfectDayBonus: 40,
  photo: 50,
  waist: 20,
  rest: 30,
} as const;

export function xpForDay(entry: DayEntry | undefined): number {
  if (!entry) return 0;
  if (entry.rest === true) return XP.rest;
  let total = 0;
  if (entry.diet === 'success') total += XP.diet;
  if (entry.exercise === 'success') total += XP.exercise;
  if (entry.diet === 'success' && entry.exercise === 'success') total += XP.perfectDayBonus;
  return total;
}

export function totalXp(
  days: Record<string, DayEntry>,
  photos: WeekPhoto[],
  measurements: WeekMeasurement[] = [],
): number {
  let total = photos.length * XP.photo;
  const measuredWeeks = measurements.filter((m) => typeof m.waistCm === 'number').length;
  total += measuredWeeks * XP.waist;
  for (const date of Object.keys(days)) {
    total += xpForDay(days[date]);
  }
  return total;
}

export function xpToReachNextLevel(level: number): number {
  return 500 + (Math.max(1, level) - 1) * 100;
}

export type LevelInfo = {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  percent: number;
};

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let accumulated = 0;
  while (level < 999) {
    const needed = xpToReachNextLevel(level);
    if (accumulated + needed > xp) break;
    accumulated += needed;
    level += 1;
  }
  const xpInLevel = xp - accumulated;
  const xpToNext = xpToReachNextLevel(level);
  return {
    level,
    xpInLevel,
    xpToNext,
    percent: xpToNext === 0 ? 0 : Math.max(0, Math.min(1, xpInLevel / xpToNext)),
  };
}

const TIER_NAMES = ['Beginner', 'Steady', 'Disciplined', 'Grounded', 'Unshakeable'] as const;
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function roman(n: number): string {
  if (n < ROMAN.length) return ROMAN[n];
  return String(n);
}

export function tierName(level: number): string {
  const clamped = Math.max(1, level);
  if (clamped < 20) {
    const index = Math.min(3, Math.floor((clamped - 1) / 5));
    return TIER_NAMES[index];
  }
  const cycle = Math.floor((clamped - 20) / 5) + 1;
  if (cycle === 1) return TIER_NAMES[4];
  return `${TIER_NAMES[4]} ${roman(cycle)}`;
}
