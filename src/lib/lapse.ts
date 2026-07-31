// The lapse boundary's shared derivation (DESIGN.md · The lapse boundary):
// "genuinely logged" always means dayStatus() on the entry, never key
// presence — the Dashboard auto-creates today's entry on mount, and empty
// entries read 'missed'. The Dashboard and the Journey both read the camp
// from here so the boundary has one source.

import { dayStatus } from './dayStatus';
import type { DayEntry } from '../types';

/** ISO date of the last genuinely-logged day strictly before today, or null
 * when the mission has no camp to return to yet. */
export function lastLoggedDate(
  days: Record<string, DayEntry>,
  today: string,
  startDate: string,
): string | null {
  let best: string | null = null;
  for (const date of Object.keys(days)) {
    if (date >= today || date < startDate) continue;
    if (dayStatus(days[date]) === 'missed') continue;
    if (best === null || date > best) best = date;
  }
  return best;
}
