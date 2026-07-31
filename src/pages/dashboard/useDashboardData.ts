// Every scalar the Dashboard composes from: store reads, day math, streaks,
// XP. Also owns the mount effect that auto-creates today's entry — which is
// why "logged" always derives from dayStatus(), never key presence.

import { useEffect, useMemo } from 'react';
import { useMission } from '../../store/mission';
import {
  dayNumberFor,
  diffDays,
  halfwayDay,
  todayISO,
  totalDays,
  yesterdayISO,
} from '../../lib/date';
import { dayStatus } from '../../lib/dayStatus';
import { calcStreak } from '../../lib/streak';
import { stageForDay } from '../../lib/stage';
import { levelFromXp, tierName, totalXp } from '../../lib/xp';

const QUICK_LOG_CUTOFF_HOUR = 11;

export function useDashboardData() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const setDayEntry = useMission((s) => s.setDayEntry);

  const today = todayISO();
  const total = totalDays(settings.durationWeeks);
  const rawDay = dayNumberFor(today, settings.startDate);
  const dayNum = Math.max(0, Math.min(total, rawDay));
  const isPreMission = rawDay < 1;
  const isPostMission = rawDay > total;
  const canLogToday = !isPreMission && !isPostMission;

  const entry = days[today];
  const todayStatus = dayStatus(entry);
  const todayHasAny =
    !!entry &&
    (entry.diet !== undefined ||
      entry.exercise !== undefined ||
      entry.weight !== undefined);

  const yesterday = yesterdayISO(today);
  const yesterdayEntry = days[yesterday];
  const yesterdayInMission = yesterday >= settings.startDate && rawDay > 1;
  const yesterdayStatus =
    yesterday < settings.startDate ? ('missed' as const) : dayStatus(yesterdayEntry);

  // The lapse boundary (DESIGN.md): the gap is counted back from the last
  // genuinely-logged day — dayStatus() over entries, never key presence (the
  // mount effect below auto-creates today, and empty entries read 'missed').
  const lastLogged = useMemo(() => {
    let best: string | null = null;
    for (const date of Object.keys(days)) {
      if (date >= today || date < settings.startDate) continue;
      if (dayStatus(days[date]) === 'missed') continue;
      if (best === null || date > best) best = date;
    }
    return best;
  }, [days, today, settings.startDate]);

  const streak = useMemo(
    () => calcStreak(days, today, settings.startDate),
    [days, today, settings.startDate],
  );
  const priorStreak = useMemo(
    () => calcStreak(days, yesterday, settings.startDate),
    [days, yesterday, settings.startDate],
  );

  // ≥ 2 unlogged days = a lapse (the re-entry treatment); exactly 1 = a streak
  // break (the shelter offer). Mutually exclusive on any open. A mission with
  // no logged day yet has no camp to return to — neither treatment fires.
  const gapDays = lastLogged === null ? null : diffDays(today, lastLogged) - 1;
  const isLapse = canLogToday && gapDays !== null && gapDays >= 2;
  const isBreak = canLogToday && gapDays === 1 && priorStreak >= 2;

  const xp = useMemo(
    () => totalXp(days, photos, measurements),
    [days, photos, measurements],
  );
  const info = useMemo(() => levelFromXp(xp), [xp]);
  const tier = tierName(info.level);

  const shieldsAvailable = settings.streakShieldsRemaining > 0;
  const canUseShelter = shieldsAvailable && yesterdayInMission;

  useEffect(() => {
    if (!canLogToday || days[today]) return;
    setDayEntry(today, {});
  }, [canLogToday, today, days, setDayEntry]);

  const showQuickLogYesterday =
    canLogToday &&
    yesterdayInMission &&
    new Date().getHours() < QUICK_LOG_CUTOFF_HOUR &&
    (yesterdayEntry?.diet === undefined || yesterdayEntry?.exercise === undefined);

  return {
    settings,
    days,
    today,
    total,
    rawDay,
    dayNum,
    isPreMission,
    isPostMission,
    canLogToday,
    todayStatus,
    todayHasAny,
    yesterday,
    yesterdayStatus,
    lastLogged,
    campDayNum: lastLogged ? dayNumberFor(lastLogged, settings.startDate) : 0,
    isLapse,
    isBreak,
    streak,
    priorStreak,
    info,
    tier,
    shieldsAvailable,
    canUseShelter,
    showQuickLogYesterday,
    isHalfwayDay: canLogToday && dayNum === halfwayDay(total),
    stage: stageForDay(Math.max(1, dayNum), total),
  };
}
