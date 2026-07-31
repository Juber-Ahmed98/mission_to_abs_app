// The Dashboard's celebration brain: the level-up watcher and every overlay /
// panel trigger, out of the page component. Heavy moments queue — at most one
// on screen, stage crossing outranks level-up, and a re-entry open defers any
// pending heavy to the next open (DESIGN.md · precedence).

import { useEffect, useRef, useState } from 'react';
import { stageForDay, type Stage } from '../../lib/stage';
import type { DayStatus } from '../../types';

type Args = {
  canLogToday: boolean;
  today: string;
  dayNum: number;
  total: number;
  level: number;
  todayStatus: DayStatus;
  yesterday: string;
  /** ≥ 2 unlogged days since the last genuinely-logged day (the boundary rule). */
  isLapse: boolean;
  /** Exactly 1 unlogged day, with a streak ≥ 2 standing before it. */
  isBreak: boolean;
  /** ISO date of the last genuinely-logged day — the camp. */
  lastLogged: string | null;
};

export function useCelebrations(a: Args) {
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [stagePending, setStagePending] = useState<Stage | null>(null);
  const [reentryOpen, setReentryOpen] = useState(false);
  const [streakBreakOpen, setStreakBreakOpen] = useState(false);
  const [perfectDayOpen, setPerfectDayOpen] = useState(false);

  // Level-up fires on the log that crosses the threshold.
  const prevLevelRef = useRef(a.level);
  useEffect(() => {
    if (a.level > prevLevelRef.current) setLevelUpPending(true);
    prevLevelRef.current = a.level;
  }, [a.level]);

  // Re-entry — the flagship. Fires once per return: the flag is keyed by the
  // camp day, so a new lapse (a new last-logged day) re-arms it and a reload
  // never re-fires. mission.reentry.* joins the load-bearing once-flag family.
  // Declared before the stage effect so the deferral ref is set first on mount.
  const reentryFiredRef = useRef(false);
  useEffect(() => {
    if (!a.canLogToday || !a.isLapse || !a.lastLogged) return;
    const key = `mission.reentry.${a.lastLogged}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    reentryFiredRef.current = true;
    setReentryOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.canLogToday]);

  // "Today's log puts you back on the map" — the panel stands down once
  // today's status leaves 'missed'.
  useEffect(() => {
    if (reentryOpen && a.todayStatus !== 'missed') setReentryOpen(false);
  }, [reentryOpen, a.todayStatus]);

  // Stage crossing — fires on first open at or after the crossing day, once
  // per stage. The mission.stageShown.* key name is load-bearing for shipped
  // installs. On a re-entry open the takeover is deferred: the once-flag stays
  // unconsumed so a later open can still fire it. Stages the walk has already
  // passed through settle silently — the takeover belongs to the country
  // you're standing in, never the ones behind you.
  useEffect(() => {
    if (!a.canLogToday || reentryFiredRef.current) return;
    const stage = stageForDay(a.dayNum, a.total);
    if (!stage || stage.index === 0) return;
    for (let i = 1; i < stage.index; i += 1) {
      localStorage.setItem(`mission.stageShown.${i}`, '1');
    }
    const key = `mission.stageShown.${stage.index}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setStagePending(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.canLogToday, a.dayNum, a.total]);

  // The summit (moment 8): completing day 105's log — any honest mark counts —
  // fires the heavy overlay in Reveal gold, once. The flag carries the date so
  // a startDate time-travel or a new mission re-arms it.
  const [summitPending, setSummitPending] = useState(false);
  const isSummitLogged =
    a.canLogToday && a.dayNum === a.total && a.todayStatus !== 'missed';
  useEffect(() => {
    if (!isSummitLogged) return;
    const key = `mission.summit.${a.today}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setSummitPending(true);
  }, [isSummitLogged, a.today]);

  // Streak break — exactly 1 unlogged day per the boundary rule; a longer gap
  // routes to re-entry instead (the v2 yesterday-only check never fired for a
  // real lapse). The mission.streakBreak.* key name is load-bearing.
  useEffect(() => {
    if (!a.canLogToday || !a.isBreak) return;
    const key = `mission.streakBreak.${a.yesterday}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setStreakBreakOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.canLogToday]);

  // Perfect day — medium register, once per mission day. The flag carries the
  // day number as well as the date so a startDate time-travel re-arms it
  // (a new Day N is a new day), and a future mission can't collide with a
  // flag from this one.
  const isPerfect = a.todayStatus === 'perfect';
  useEffect(() => {
    if (!a.canLogToday || !isPerfect) {
      setPerfectDayOpen(false);
      return;
    }
    const key = `mission.perfectDay.${a.today}.${a.dayNum}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setPerfectDayOpen(true);
  }, [a.canLogToday, isPerfect, a.today, a.dayNum]);

  // At most one heavy moment on screen; the summit outranks a stage crossing,
  // a stage crossing outranks a level-up. The pending one fires after dismissal.
  const heavy: 'summit' | 'stage' | 'levelUp' | null = summitPending
    ? 'summit'
    : stagePending
      ? 'stage'
      : levelUpPending
        ? 'levelUp'
        : null;
  const dismissHeavy = () => {
    if (summitPending) setSummitPending(false);
    else if (stagePending) setStagePending(null);
    else setLevelUpPending(false);
  };

  return {
    heavy,
    stage: stagePending,
    dismissHeavy,
    reentryOpen,
    streakBreakOpen,
    closeStreakBreak: () => setStreakBreakOpen(false),
    perfectDayOpen,
  };
}
