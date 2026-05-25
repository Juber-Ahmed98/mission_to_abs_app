import type { DayEntry, DayStatus } from '../types';

export function dayStatus(entry: DayEntry | undefined): DayStatus {
  if (!entry) return 'missed';
  const d = entry.diet;
  const e = entry.exercise;
  if (!d && !e) return 'missed';
  const dWin = d === 'success';
  const eWin = e === 'success';
  if (dWin && eWin) return 'perfect';
  if (dWin || eWin) return 'partial';
  return 'failed';
}
