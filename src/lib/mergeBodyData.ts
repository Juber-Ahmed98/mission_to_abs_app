import type { DayEntry } from '../types';
import type { RenphoReading } from './renphoCsv';

// One factor for the whole app (mirrors LB_PER_KG in Settings). Renpho always
// reports kilograms; we convert to the user's chosen unit at this boundary so
// everything downstream stays in the app's unit.
const LB_PER_KG = 2.20462;

export type MergeOptions = {
  weightUnit: 'kg' | 'lb';
  // Mission window (inclusive) — only used to bucket the preview counts into
  // "in this mission" vs "outside it". Out-of-window readings are still stored.
  startDate: string;
  endDate: string;
};

export type MergeResult = {
  days: Record<string, DayEntry>;
  // Days where at least one value was written (new or updating a prior synced
  // value), split by whether the day falls inside the current mission window.
  filledInWindow: number;
  filledOutsideWindow: number;
  // Days where every incoming value was blocked because a hand-owned value
  // already guards it (and nothing else on the day was written).
  skippedManual: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// A stored value is overwritable by a sync only if it's empty or was itself
// renpho-sourced. A present value with any other source — 'manual', or a
// legacy/undefined source from before provenance existed — is hand-owned and
// must never be clobbered.
function canOverwrite(value: number | undefined, source: DayEntry['weightSource']): boolean {
  return value === undefined || source === 'renpho';
}

/**
 * Merge Renpho readings into the day map under the manual-wins policy. Pure:
 * returns a new day map plus preview counts; the caller decides whether to
 * commit. This is the single merge path shared by the manual CSV import and
 * (later) the live sync, so re-running it is idempotent and never destructive.
 */
export function mergeBodyData(
  days: Record<string, DayEntry>,
  readings: RenphoReading[],
  opts: MergeOptions,
): MergeResult {
  const next: Record<string, DayEntry> = { ...days };
  let filledInWindow = 0;
  let filledOutsideWindow = 0;
  let skippedManual = 0;

  for (const r of readings) {
    const existing = next[r.date];
    const entry: DayEntry = existing ? { ...existing } : { date: r.date };
    let wrote = false;
    let blockedByManual = false;

    if (r.weightKg !== null) {
      const incoming =
        opts.weightUnit === 'lb' ? round1(r.weightKg * LB_PER_KG) : round1(r.weightKg);
      if (!canOverwrite(entry.weight, entry.weightSource)) {
        blockedByManual = true;
      } else if (entry.weight !== incoming || entry.weightSource !== 'renpho') {
        entry.weight = incoming;
        entry.weightSource = 'renpho';
        wrote = true;
      }
    }

    if (r.bodyFat !== null) {
      const incoming = round1(r.bodyFat);
      if (!canOverwrite(entry.bodyFat, entry.bodyFatSource)) {
        blockedByManual = true;
      } else if (entry.bodyFat !== incoming || entry.bodyFatSource !== 'renpho') {
        entry.bodyFat = incoming;
        entry.bodyFatSource = 'renpho';
        wrote = true;
      }
    }

    if (wrote) {
      next[r.date] = entry;
      if (r.date >= opts.startDate && r.date <= opts.endDate) filledInWindow += 1;
      else filledOutsideWindow += 1;
    } else if (blockedByManual) {
      skippedManual += 1;
    }
  }

  return { days: next, filledInWindow, filledOutsideWindow, skippedManual };
}
