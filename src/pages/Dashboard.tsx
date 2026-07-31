import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Download, Moon, Percent, Scale, Settings as SettingsIcon, Shield, Tent, Utensils, X } from 'lucide-react';
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
import { stageForDay, type Stage } from '../lib/stage';
import { XP, levelFromXp, tierName, totalXp } from '../lib/xp';
import MissionRing from '../components/MissionRing';
import MissionCompleted from '../components/MissionCompleted';
import LevelBadge from '../components/LevelBadge';
import TodayRow from '../components/TodayRow';
import XpToast, { type Toast } from '../components/XpToast';
import LevelUpOverlay from '../components/LevelUpOverlay';
import StageOverlay from '../components/StageOverlay';
import MomentPanel from '../components/MomentPanel';
import BottomSheet from '../components/BottomSheet';
import WeightInput from '../components/WeightInput';
import BodyFatInput from '../components/BodyFatInput';
import InstallBanner, { useInstallPrompt } from '../components/InstallBanner';
import ReminderBanner, { useInAppReminder } from '../components/ReminderBanner';
import { showUndo } from '../components/UndoToast';
import { bump } from '../lib/analytics';
import type { DayEntry } from '../types';

const QUICK_LOG_CUTOFF_HOUR = 11;
const BACKUP_NUDGE_THRESHOLD_DAYS = 30;
const BACKUP_NUDGE_MIN_ENTRIES = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function Dashboard() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const setSettings = useMission((s) => s.setSettings);

  const { canInstall, install: promptInstall, dismiss: dismissInstall } =
    useInstallPrompt();
  const { reminder, dismiss: dismissReminder } = useInAppReminder();

  const dietLabel = settings.pillarLabels.diet;
  const exerciseLabel = settings.pillarLabels.exercise;

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
  const [stageOverlay, setStageOverlay] = useState<Stage | null>(null);
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
    setStageOverlay(stage);
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
    showUndo('Shelter pitched over yesterday', () => {
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
    const dayBefore = days[date];
    const prev = dayBefore?.[pillar];
    if (prev === next) return;
    const wasEmpty =
      !dayBefore ||
      (dayBefore.diet === undefined &&
        dayBefore.exercise === undefined &&
        dayBefore.rest !== true);
    setDayEntry(date, { [pillar]: next } as Partial<DayEntry>);
    if (wasEmpty && next !== undefined) bump('daysLogged');
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

  const onBodyFatChange = (v: number | undefined) => {
    const prev = days[today]?.bodyFat;
    if (prev === v) return;
    setDayEntry(today, { bodyFat: v });
    const label = v === undefined ? 'Cleared body fat' : `Logged ${v}% body fat`;
    showUndo(label, () => {
      setDayEntry(today, { bodyFat: prev });
    });
  };

  const pillarHandlers = (pillar: 'diet' | 'exercise', date: string, name: string) => ({
    onSuccess: () => setPillar(date, pillar, 'success', `Undid ${name} ✓`),
    onFail: () => setPillar(date, pillar, 'fail', `Undid ${name} ✗`),
    onClear: () => setPillar(date, pillar, undefined, `Restored ${name}`),
  });

  const toggleRestToday = () => {
    const prev = days[today];
    const wasRest = prev?.rest === true;
    if (wasRest) {
      setDayEntry(today, { rest: undefined });
      showUndo('Cleared rest day', () => {
        setDayEntry(today, {
          rest: prev?.rest,
          diet: prev?.diet,
          exercise: prev?.exercise,
        });
      });
    } else {
      const wasEmpty =
        !prev ||
        (prev.diet === undefined &&
          prev.exercise === undefined &&
          prev.rest !== true);
      setDayEntry(today, { rest: true, diet: undefined, exercise: undefined });
      if (wasEmpty) bump('daysLogged');
      showUndo('Marked rest day', () => {
        setDayEntry(today, {
          rest: prev?.rest,
          diet: prev?.diet,
          exercise: prev?.exercise,
        });
      });
    }
  };

  const daysUntilStart = isPreMission ? 1 - rawDay : 0;

  const backupNudge = useMemo(() => {
    const entries = Object.keys(days).length;
    if (settings.lastExportedAt === null) {
      if (entries < BACKUP_NUDGE_MIN_ENTRIES) return null;
      return { label: 'Never backed up.' };
    }
    const ms = Date.now() - new Date(settings.lastExportedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const daysSince = Math.floor(ms / MS_PER_DAY);
    if (daysSince < BACKUP_NUDGE_THRESHOLD_DAYS) return null;
    return { label: `Backed up ${daysSince} days ago.` };
  }, [days, settings.lastExportedAt]);

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

  const todayLoggedStatus =
    dayStatus(entry) === 'missed' ? ('empty' as const) : ('logged' as const);

  const showStreakPill = canLogToday && streak >= 2;
  const showShieldPill = showStreakPill && shieldsAvailable;
  const isHalfwayDay = canLogToday && dayNum === halfwayDay(total);

  // At most one secondary banner shows, by precedence, so the daily logging UI
  // stays above the fold instead of being pushed down by a stack of banners.
  const activeBanner:
    | 'welcomeBack'
    | 'quickLog'
    | 'halfway'
    | 'backup'
    | 'reminder'
    | 'install'
    | null = welcomeBack
    ? 'welcomeBack'
    : showQuickLogYesterday
      ? 'quickLog'
      : isHalfwayDay
        ? 'halfway'
        : backupNudge
          ? 'backup'
          : reminder
            ? 'reminder'
            : canInstall
              ? 'install'
              : null;

  if (isPostMission) {
    return <MissionCompleted />;
  }

  return (
    <div className="pb-32" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {activeBanner === 'reminder' && reminder && (
        <ReminderBanner reminder={reminder} onDismiss={dismissReminder} />
      )}
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
                className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-sm text-text-muted hover:text-accent hover:border-accent/40 transition-colors duration-150 ease-apple"
              >
                <Shield size={14} strokeWidth={1.75} />
                <span className="tabular">{settings.streakShieldsRemaining}</span>
              </button>
            )}
          </div>
        )}
      </header>

      {isPreMission && (
        <div className="px-5 pt-2 pb-2 text-center">
          <div className="text-xl font-semibold text-text">
            {daysUntilStart === 0
              ? 'Begins today'
              : `Begins in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}`}
          </div>
          <div className="mt-1 text-sm text-text-muted">
            {formatNice(settings.startDate)}
          </div>
        </div>
      )}

      <section className="mx-5 mt-2 mb-5 rounded-card border border-border bg-surface px-4 pb-3 pt-2 shadow-panel">
        <MissionRing
          day={dayNum}
          totalDays={total}
          days={days}
          startDate={settings.startDate}
          todayStatus={todayLoggedStatus}
        />
      </section>

      {streakBreakOpen && (
        <div className="mx-5 mb-5">
          <MomentPanel
            icon={<Tent size={18} strokeWidth={2} />}
            title="A gap in yesterday's tracks."
            actions={[
              ...(canUseShieldOnYesterday
                ? [
                    {
                      label: 'Pitch the shelter',
                      onClick: () => setShieldSheetOpen(true),
                      primary: true,
                    },
                  ]
                : []),
              { label: 'Walk on', onClick: () => setStreakBreakOpen(false) },
            ]}
          >
            {priorStreak} days walked without a break.{' '}
            {canUseShieldOnYesterday
              ? 'One shelter left in the pack — pitched, it covers yesterday.'
              : 'No shelters left in the pack.'}
          </MomentPanel>
        </div>
      )}

      <div className="relative px-5">
        <XpToast toast={toast} />
        <LevelBadge
          level={info.level}
          tier={tier}
          xpInLevel={info.xpInLevel}
          xpToNext={info.xpToNext}
        />
      </div>

      {activeBanner === 'welcomeBack' && (
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
              label={dietLabel}
              icon={<Utensils size={18} strokeWidth={1.75} />}
              xpReward={XP.diet}
              status={undefined}
              onSuccess={() => {}}
              onFail={() => {}}
              onClear={() => {}}
            />
            <TodayRow
              label={exerciseLabel}
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

      {activeBanner === 'backup' && backupNudge && (
        <Link
          to="/settings"
          className="mx-5 mt-4 flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm hover:border-accent/40"
        >
          <span className="flex items-center gap-2 text-text-muted">
            <Download size={14} strokeWidth={1.75} />
            {backupNudge.label}
          </span>
          <span className="text-accent">Export</span>
        </Link>
      )}

      {activeBanner === 'install' && (
        <InstallBanner onInstall={promptInstall} onDismiss={dismissInstall} />
      )}

      {activeBanner === 'halfway' && (
        <section className="mx-5 mt-4 rounded-card border border-accent/30 bg-accent-soft px-4 py-3 text-center">
          <div className="text-sm font-medium text-text">Halfway.</div>
          <div className="text-xs text-text-muted">Keep walking.</div>
        </section>
      )}

      {activeBanner === 'quickLog' && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Yesterday — log
          </h2>
          <div className="space-y-2">
            <TodayRow
              label={dietLabel}
              icon={<Utensils size={18} strokeWidth={1.75} />}
              xpReward={XP.diet}
              doneLabel={`+${XP.diet} XP`}
              status={yesterdayEntry?.diet}
              {...pillarHandlers('diet', yesterday, dietLabel)}
            />
            <TodayRow
              label={exerciseLabel}
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              xpReward={XP.exercise}
              doneLabel={`+${XP.exercise} XP`}
              status={yesterdayEntry?.exercise}
              {...pillarHandlers('exercise', yesterday, exerciseLabel)}
            />
          </div>
        </section>
      )}

      {canLogToday && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Today
          </h2>
          {entry?.rest ? (
            <div className="rounded-card border border-rest/30 bg-rest-bg px-4 py-4 text-center">
              <div className="text-sm font-medium text-text">Rest day.</div>
              <div className="text-xs text-text-muted">Rest is part of the work.</div>
              <button
                type="button"
                onClick={toggleRestToday}
                className="mt-2 text-xs text-text-muted hover:text-text"
              >
                Undo rest
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <TodayRow
                  label={dietLabel}
                  icon={<Utensils size={18} strokeWidth={1.75} />}
                  xpReward={XP.diet}
                  doneLabel={`+${XP.diet} XP`}
                  status={entry?.diet}
                  {...pillarHandlers('diet', today, dietLabel)}
                />
                <TodayRow
                  label={exerciseLabel}
                  icon={<Dumbbell size={18} strokeWidth={1.75} />}
                  xpReward={XP.exercise}
                  doneLabel={`+${XP.exercise} XP`}
                  status={entry?.exercise}
                  {...pillarHandlers('exercise', today, exerciseLabel)}
                />
              </div>
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={toggleRestToday}
                  className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text"
                >
                  <Moon size={12} strokeWidth={1.75} />
                  Rest day
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {canLogToday && (
        <section className="space-y-5 px-5 pt-5">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
              <Scale size={12} strokeWidth={1.75} />
              Weight
            </h2>
            <WeightInput
              value={entry?.weight}
              unit={settings.weightUnit}
              onChange={onWeightChange}
            />
          </div>
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
              <Percent size={12} strokeWidth={1.75} />
              Body fat
            </h2>
            <BodyFatInput value={entry?.bodyFat} onChange={onBodyFatChange} />
          </div>
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

      <StageOverlay
        open={!!stageOverlay}
        stage={stageOverlay}
        onDismiss={() => setStageOverlay(null)}
      />

      <BottomSheet open={shieldSheetOpen} onClose={() => setShieldSheetOpen(false)}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-bold">Pitch the shelter over yesterday?</div>
          <div className="mt-1 text-sm text-text-muted">
            {formatNice(yesterday)} reads as a camp day.
            {priorStreak >= 2 ? ` The ${priorStreak}-day walk holds.` : ''}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShieldSheetOpen(false)}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-sm font-medium text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={useShieldOnYesterday}
              className="h-11 flex-1 rounded-card bg-stage text-sm font-bold text-surface"
            >
              Pitch it
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
