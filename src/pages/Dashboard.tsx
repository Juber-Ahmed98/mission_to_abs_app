import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Scale, Settings as SettingsIcon, Shield, Utensils, X } from 'lucide-react';
import { useMission } from '../store/mission';
import {
  dayNumberFor,
  formatNice,
  halfwayDay,
  todayISO,
  totalDays,
  yesterdayISO,
} from '../lib/date';
import { dayStatus } from '../lib/dayStatus';
import { calcStreak } from '../lib/streak';
import { encouragement } from '../lib/encouragement';
import { stageForDay } from '../lib/stage';
import { XP, levelFromXp, tierName, totalXp } from '../lib/xp';
import MissionRing from '../components/MissionRing';
import LevelBadge from '../components/LevelBadge';
import TodayRow from '../components/TodayRow';
import XpToast, { type Toast } from '../components/XpToast';
import LevelUpOverlay from '../components/LevelUpOverlay';
import StreakBreakOverlay from '../components/StreakBreakOverlay';
import StageOverlay from '../components/StageOverlay';
import BottomSheet from '../components/BottomSheet';
import WeightInput from '../components/WeightInput';
import InstallBanner from '../components/InstallBanner';
import { showUndo } from '../components/UndoToast';
import type { DayEntry } from '../types';

const QUICK_LOG_CUTOFF_HOUR = 11;

export default function Dashboard() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const setSettings = useMission((s) => s.setSettings);

  const today = todayISO();
  const total = totalDays(settings.durationWeeks);
  const rawDay = dayNumberFor(today, settings.startDate);
  const dayNum = Math.max(0, Math.min(total, rawDay));
  const isPreMission = rawDay < 1;
  const isPostMission = rawDay > total;
  const canLogToday = !isPreMission && !isPostMission;

  const entry = days[today];
  const dietDone = entry?.diet === 'success';
  const exerciseDone = entry?.exercise === 'success';
  const todayHasBoth = dietDone && exerciseDone;
  const todayHasAny =
    !!entry &&
    (entry.diet !== undefined ||
      entry.exercise !== undefined ||
      entry.weight !== undefined);

  const yesterday = yesterdayISO(today);
  const yesterdayEntry = days[yesterday];
  const yesterdayInMission = yesterday >= settings.startDate && rawDay > 1;
  const showQuickLogYesterday =
    canLogToday &&
    yesterdayInMission &&
    new Date().getHours() < QUICK_LOG_CUTOFF_HOUR &&
    (yesterdayEntry?.diet === undefined || yesterdayEntry?.exercise === undefined);

  const yesterdayStatus = useMemo(() => {
    if (yesterday < settings.startDate) return 'missed' as const;
    return dayStatus(yesterdayEntry);
  }, [yesterdayEntry, yesterday, settings.startDate]);

  const streak = useMemo(
    () => calcStreak(days, today, settings.startDate),
    [days, today, settings.startDate],
  );

  const priorStreak = useMemo(
    () => calcStreak(days, yesterday, settings.startDate),
    [days, yesterday, settings.startDate],
  );

  const shieldsAvailable = settings.streakShieldsRemaining > 0;
  const yesterdayBroke =
    yesterdayInMission &&
    yesterdayEntry?.rest !== true &&
    (yesterdayStatus === 'failed' || yesterdayStatus === 'missed');
  const canUseShieldOnYesterday = shieldsAvailable && yesterdayInMission;

  const xp = useMemo(
    () => totalXp(days, photos, measurements),
    [days, photos, measurements],
  );
  const info = useMemo(() => levelFromXp(xp), [xp]);
  const tier = tierName(info.level);

  const prevXpRef = useRef(xp);
  const prevLevelRef = useRef(info.level);
  const [toast, setToast] = useState<Toast | null>(null);
  const [levelUp, setLevelUp] = useState(false);
  const [streakBreakOpen, setStreakBreakOpen] = useState(false);
  const [stageOverlay, setStageOverlay] = useState<
    { index: number; name: string } | null
  >(null);
  const [shieldSheetOpen, setShieldSheetOpen] = useState(false);

  useEffect(() => {
    const delta = xp - prevXpRef.current;
    if (delta > 0) {
      const includesPerfectBonus = delta >= XP.diet + XP.exercise + XP.perfectDayBonus;
      setToast({
        id: Date.now(),
        amount: delta,
        note: includesPerfectBonus ? 'Perfect day' : undefined,
      });
      const timer = setTimeout(() => setToast(null), 1700);
      prevXpRef.current = xp;
      return () => clearTimeout(timer);
    }
    prevXpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    if (info.level > prevLevelRef.current) setLevelUp(true);
    prevLevelRef.current = info.level;
  }, [info.level]);

  useEffect(() => {
    if (!canLogToday) return;
    if (days[today]) return;
    setDayEntry(today, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLogToday, today, setDayEntry]);

  useEffect(() => {
    if (!canLogToday) return;
    if (!yesterdayBroke) return;
    if (priorStreak < 2) return;
    const key = `mission.streakBreak.${yesterday}`;
    if (localStorage.getItem(key) === '1') return;
    setStreakBreakOpen(true);
    localStorage.setItem(key, '1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLogToday]);

  useEffect(() => {
    if (!canLogToday) return;
    const stage = stageForDay(dayNum, total);
    if (!stage) return;
    if (stage.index === 0) return;
    if (dayNum !== stage.startDay) return;
    const key = `mission.stageShown.${stage.index}`;
    if (localStorage.getItem(key) === '1') return;
    setStageOverlay({ index: stage.index, name: stage.name });
    localStorage.setItem(key, '1');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLogToday, dayNum, total]);

  const useShieldOnYesterday = () => {
    if (!shieldsAvailable || !yesterdayInMission) return;
    const prevEntry = days[yesterday];
    const prevShields = settings.streakShieldsRemaining;
    setDayEntry(yesterday, { rest: true, diet: undefined, exercise: undefined });
    setSettings({ streakShieldsRemaining: prevShields - 1 });
    setShieldSheetOpen(false);
    setStreakBreakOpen(false);
    showUndo('Shield used on yesterday', () => {
      setDayEntry(yesterday, {
        rest: prevEntry?.rest,
        diet: prevEntry?.diet,
        exercise: prevEntry?.exercise,
      });
      setSettings({ streakShieldsRemaining: prevShields });
    });
  };

  const setPillar = (
    date: string,
    pillar: 'diet' | 'exercise',
    next: 'success' | 'fail' | undefined,
    undoLabel: string,
  ) => {
    const prev = days[date]?.[pillar];
    if (prev === next) return;
    setDayEntry(date, { [pillar]: next } as Partial<DayEntry>);
    showUndo(undoLabel, () => {
      setDayEntry(date, { [pillar]: prev } as Partial<DayEntry>);
    });
  };

  const onWeightChange = (v: number | undefined) => {
    const prev = days[today]?.weight;
    if (prev === v) return;
    setDayEntry(today, { weight: v });
    const label = v === undefined ? 'Cleared weight' : `Logged ${v} ${settings.weightUnit}`;
    showUndo(label, () => {
      setDayEntry(today, { weight: prev });
    });
  };

  const pillarHandlers = (pillar: 'diet' | 'exercise', date: string, name: string) => ({
    onSuccess: () => setPillar(date, pillar, 'success', `Undid ${name} ✓`),
    onFail: () => setPillar(date, pillar, 'fail', `Undid ${name} ✗`),
    onClear: () => setPillar(date, pillar, undefined, `Restored ${name}`),
  });

  const daysUntilStart = isPreMission ? 1 - rawDay : 0;

  const [welcomeBackDismissed, setWelcomeBackDismissed] = useState(false);
  const welcomeBack =
    !welcomeBackDismissed && localStorage.getItem('mission.welcomeBack') === '1';
  const dismissWelcomeBack = () => {
    localStorage.removeItem('mission.welcomeBack');
    localStorage.setItem('mission.welcomeBackDismissed', '1');
    setWelcomeBackDismissed(true);
  };

  const headerLine = isPreMission
    ? `Begins ${formatNice(settings.startDate)}`
    : isPostMission
      ? 'Mission complete'
      : `Day ${dayNum}`;

  const preMissionCenter = (
    <>
      <div className="text-xl font-semibold text-text">
        {daysUntilStart === 0
          ? 'Begins today'
          : `Begins in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`}
      </div>
      <div className="mt-1 text-sm text-text-muted">
        {formatNice(settings.startDate)}
      </div>
    </>
  );

  const showStreakPill = canLogToday && streak >= 2;
  const showShieldPill = showStreakPill && shieldsAvailable;
  const isHalfwayDay = canLogToday && dayNum === halfwayDay(total);

  return (
    <div className="pb-32" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="px-5 pt-8 pb-2 flex items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tabular leading-tight">
          {headerLine}
        </h1>
        {(showStreakPill || showShieldPill) && (
          <div className="flex items-center gap-2 pb-1">
            {showStreakPill && (
              <span className="text-sm tabular text-text-muted">
                {streak} days
              </span>
            )}
            {showShieldPill && (
              <button
                type="button"
                onClick={() => setShieldSheetOpen(true)}
                aria-label="Use streak shield"
                className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2 py-1 text-xs text-text-muted hover:text-accent hover:border-accent/40 transition-colors duration-150 ease-apple"
              >
                <Shield size={12} strokeWidth={1.75} />
                <span className="tabular">{settings.streakShieldsRemaining}</span>
              </button>
            )}
          </div>
        )}
      </header>

      <div className="flex justify-center pt-2 pb-6">
        <MissionRing
          day={dayNum}
          totalDays={total}
          centerOverride={isPreMission ? preMissionCenter : undefined}
        />
      </div>

      <div className="relative px-5">
        <XpToast toast={toast} />
        <LevelBadge
          level={info.level}
          tier={tier}
          xpInLevel={info.xpInLevel}
          xpToNext={info.xpToNext}
        />
      </div>

      {welcomeBack && (
        <section className="mx-5 mt-4 flex items-center gap-3 rounded-card border border-accent/30 bg-accent-soft p-3">
          <div className="flex-1">
            <div className="text-sm text-text">Welcome back.</div>
            <Link
              to="/settings"
              className="text-xs text-accent hover:text-accent-hover"
            >
              Set your goals?
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissWelcomeBack}
            aria-label="Dismiss"
            className="text-text-muted"
          >
            <X size={18} />
          </button>
        </section>
      )}

      {isPreMission && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Your daily log
          </h2>
          <div className="space-y-2 opacity-50 pointer-events-none">
            <TodayRow
              label="Diet"
              icon={<Utensils size={18} strokeWidth={1.75} />}
              xpReward={XP.diet}
              status={undefined}
              onSuccess={() => {}}
              onFail={() => {}}
              onClear={() => {}}
            />
            <TodayRow
              label="Exercise"
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              xpReward={XP.exercise}
              status={undefined}
              onSuccess={() => {}}
              onFail={() => {}}
              onClear={() => {}}
            />
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
            >
              <SettingsIcon size={14} strokeWidth={1.75} />
              Open Settings
            </Link>
          </div>
        </section>
      )}

      <InstallBanner />

      {isHalfwayDay && (
        <section className="mx-5 mt-4 rounded-card border border-accent/30 bg-accent-soft px-4 py-3 text-center">
          <div className="text-sm font-medium text-text">Halfway.</div>
          <div className="text-xs text-text-muted">Keep walking.</div>
        </section>
      )}

      {showQuickLogYesterday && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Yesterday — log
          </h2>
          <div className="space-y-2">
            <TodayRow
              label="Diet"
              icon={<Utensils size={18} strokeWidth={1.75} />}
              xpReward={XP.diet}
              doneLabel={`Done · +${XP.diet} XP`}
              status={yesterdayEntry?.diet}
              {...pillarHandlers('diet', yesterday, 'Diet')}
            />
            <TodayRow
              label="Exercise"
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              xpReward={XP.exercise}
              doneLabel={`Done · +${XP.exercise} XP`}
              status={yesterdayEntry?.exercise}
              {...pillarHandlers('exercise', yesterday, 'Exercise')}
            />
          </div>
        </section>
      )}

      {canLogToday && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Today
          </h2>
          <div className="space-y-2">
            <TodayRow
              label="Diet"
              icon={<Utensils size={18} strokeWidth={1.75} />}
              xpReward={XP.diet}
              doneLabel={`Done · +${XP.diet} XP`}
              status={entry?.diet}
              {...pillarHandlers('diet', today, 'Diet')}
            />
            <TodayRow
              label="Exercise"
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              xpReward={XP.exercise}
              doneLabel={`Done · +${XP.exercise} XP`}
              status={entry?.exercise}
              {...pillarHandlers('exercise', today, 'Exercise')}
            />
          </div>
        </section>
      )}

      {canLogToday && (
        <section className="px-5 pt-5">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
            <Scale size={12} strokeWidth={1.75} />
            Weight
          </h2>
          <WeightInput
            value={entry?.weight}
            unit={settings.weightUnit}
            onChange={onWeightChange}
          />
        </section>
      )}

      <div className="px-5 pt-6 text-center text-sm text-text-muted">
        {encouragement({
          dayNumber: rawDay,
          totalDays: total,
          streak,
          yesterdayStatus,
          todayHasBoth,
          todayHasAny,
        })}
      </div>

      <LevelUpOverlay
        open={levelUp}
        level={info.level}
        tier={tier}
        onDismiss={() => setLevelUp(false)}
      />

      <StreakBreakOverlay
        open={streakBreakOpen}
        brokenAt={priorStreak}
        shieldAvailable={canUseShieldOnYesterday}
        onUseShield={useShieldOnYesterday}
        onDismiss={() => setStreakBreakOpen(false)}
      />

      <StageOverlay
        open={!!stageOverlay}
        stageIndex={stageOverlay?.index ?? 0}
        stageName={stageOverlay?.name ?? ''}
        onDismiss={() => setStageOverlay(null)}
      />

      <BottomSheet open={shieldSheetOpen} onClose={() => setShieldSheetOpen(false)}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">
            Use shield on yesterday?
          </div>
          <div className="mt-1 text-sm text-text-muted">
            Marks {formatNice(yesterday)} as a rest day. Keeps your streak alive.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShieldSheetOpen(false)}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={useShieldOnYesterday}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover"
            >
              Use shield
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
