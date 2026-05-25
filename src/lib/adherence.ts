import type { DayEntry } from '../types';

export type Adherence = {
  perfectDays: number;
  totalLogged: number;
  dietPct: number;
  exercisePct: number;
  restCount: number;
};

export function adherenceFor(
  days: Record<string, DayEntry>,
  startDate: string,
  today: string,
): Adherence {
  let perfectDays = 0;
  let totalLogged = 0;
  let dietWins = 0;
  let exerciseWins = 0;
  let restCount = 0;

  for (const date of Object.keys(days)) {
    if (date < startDate || date > today) continue;
    const e = days[date];
    if (!e) continue;
    const dDone = e.diet !== undefined;
    const eDone = e.exercise !== undefined;
    const rest = e.rest === true;
    if (!dDone && !eDone && !rest) continue;
    totalLogged += 1;
    if (rest) {
      restCount += 1;
      continue;
    }
    const dWin = e.diet === 'success';
    const eWin = e.exercise === 'success';
    if (dWin) dietWins += 1;
    if (eWin) exerciseWins += 1;
    if (dWin && eWin) perfectDays += 1;
  }

  const trackable = Math.max(0, totalLogged - restCount);
  const dietPct = trackable === 0 ? 0 : Math.round((dietWins / trackable) * 100);
  const exercisePct = trackable === 0 ? 0 : Math.round((exerciseWins / trackable) * 100);

  return { perfectDays, totalLogged, dietPct, exercisePct, restCount };
}
