// The Dashboard's celebration brain: the level-up watcher and every overlay /
// panel trigger, out of the page component. Heavy moments queue — at most one
// on screen, stage crossing outranks level-up (DESIGN.md · precedence).

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
  yesterdayBroke: boolean;
  priorStreak: number;
};

export function useCelebrations(a: Args) {
  const [levelUpPending, setLevelUpPending] = useState(false);
  const [stagePending, setStagePending] = useState<Stage | null>(null);
  const [streakBreakOpen, setStreakBreakOpen] = useState(false);
  const [perfectDayOpen, setPerfectDayOpen] = useState(false);

  // Level-up fires on the log that crosses the threshold.
  const prevLevelRef = useRef(a.level);
  useEffect(() => {
    if (a.level > prevLevelRef.current) setLevelUpPending(true);
    prevLevelRef.current = a.level;
  }, [a.level]);

  // Stage crossing — exact-day trigger; "at or after" lands in Phase 9.
  // The mission.stageShown.* key name is load-bearing for shipped installs.
  useEffect(() => {
    if (!a.canLogToday) return;
    const stage = stageForDay(a.dayNum, a.total);
    if (!stage || stage.index === 0 || a.dayNum !== stage.startDay) return;
    const key = `mission.stageShown.${stage.index}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setStagePending(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.canLogToday, a.dayNum, a.total]);

  // Streak break — yesterday-only detection; the real lapse boundary is
  // Phase 8's fix. The mission.streakBreak.* key name is load-bearing.
  useEffect(() => {
    if (!a.canLogToday || !a.yesterdayBroke || a.priorStreak < 2) return;
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

  const heavy: 'stage' | 'levelUp' | null = stagePending
    ? 'stage'
    : levelUpPending
      ? 'levelUp'
      : null;
  const dismissHeavy = () => {
    if (stagePending) setStagePending(null);
    else setLevelUpPending(false);
  };

  return {
    heavy,
    stage: stagePending,
    dismissHeavy,
    streakBreakOpen,
    closeStreakBreak: () => setStreakBreakOpen(false),
    perfectDayOpen,
  };
}
