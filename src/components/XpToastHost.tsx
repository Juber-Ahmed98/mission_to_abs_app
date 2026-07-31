// One light-register watcher for the whole app (DESIGN.md · registers: every
// XP grant speaks through the toast, live logs and backfills alike). Diffs the
// store's XP total so a DayEditor backfill on the Journey, a photo upload, or
// a shelter spend all fire the same toast with zero per-callsite wiring.

import { useEffect, useRef, useState } from 'react';
import { useMission } from '../store/mission';
import { dayStatus } from '../lib/dayStatus';
import { totalXp } from '../lib/xp';
import XpToast, { type Toast } from './XpToast';
import type { DayEntry } from '../types';

const TOAST_LIFETIME_MS = 1700;

// A backup import replaces the whole day record at once — that XP jump is
// restored history, not a grant, so the import path mutes the next diff.
let suppressNext = false;
export function suppressNextXpToast() {
  suppressNext = true;
}

export default function XpToastHost() {
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const [toast, setToast] = useState<Toast | null>(null);

  const xp = totalXp(days, photos, measurements);
  const prevXpRef = useRef(xp);
  const prevDaysRef = useRef<Record<string, DayEntry>>(days);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevXp = prevXpRef.current;
    const prevDays = prevDaysRef.current;
    prevXpRef.current = xp;
    prevDaysRef.current = days;
    const delta = xp - prevXp;
    if (suppressNext) {
      suppressNext = false;
      return;
    }
    if (delta <= 0) return;
    // The note rides along when a changed day just crossed into 'perfect' —
    // exact for live second-pillar logs and one-shot backfills alike.
    const crossedPerfect = Object.keys(days).some((date) => {
      const next = days[date];
      const prev = prevDays[date];
      return (
        next !== prev &&
        dayStatus(next) === 'perfect' &&
        dayStatus(prev) !== 'perfect'
      );
    });
    setToast({
      id: Date.now(),
      amount: delta,
      note: crossedPerfect ? 'Perfect day — flag planted' : undefined,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), TOAST_LIFETIME_MS);
  }, [xp, days]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40"
      style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
    >
      <XpToast toast={toast} />
    </div>
  );
}
