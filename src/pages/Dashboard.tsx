import { useEffect, useMemo, useRef, useState } from 'react';
import { Dumbbell, Scale, Utensils } from 'lucide-react';
import { useMission } from '../store/mission';
import {
  dayNumberFor,
  todayISO,
  totalDays,
  yesterdayISO,
} from '../lib/date';
import { dayStatus } from '../lib/dayStatus';
import { calcStreak } from '../lib/streak';
import { encouragement } from '../lib/encouragement';
import { XP, levelFromXp, tierName, totalXp } from '../lib/xp';
import MissionRing from '../components/MissionRing';
import LevelBadge from '../components/LevelBadge';
import SlideToConfirm from '../components/SlideToConfirm';
import XpToast, { type Toast } from '../components/XpToast';
import LevelUpOverlay from '../components/LevelUpOverlay';
import WeightInput from '../components/WeightInput';
import InstallBanner from '../components/InstallBanner';

export default function Dashboard() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const setDayEntry = useMission((s) => s.setDayEntry);

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

  const yesterdayStatus = useMemo(() => {
    const y = yesterdayISO(today);
    if (y < settings.startDate) return 'missed' as const;
    return dayStatus(days[y]);
  }, [days, today, settings.startDate]);

  const streak = useMemo(
    () => calcStreak(days, today, settings.startDate),
    [days, today, settings.startDate],
  );

  const xp = useMemo(() => totalXp(days, photos), [days, photos]);
  const info = useMemo(() => levelFromXp(xp), [xp]);
  const tier = tierName(info.level);

  const prevXpRef = useRef(xp);
  const prevLevelRef = useRef(info.level);
  const [toast, setToast] = useState<Toast | null>(null);
  const [levelUp, setLevelUp] = useState(false);

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

  const headerLine = isPreMission
    ? `Begins ${settings.startDate}`
    : isPostMission
      ? 'Mission complete'
      : `Day ${dayNum}`;

  return (
    <div className="pb-32" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="px-5 pt-8 pb-2">
        <div className="text-sm text-text-muted">Mission to Abs</div>
        <h1 className="mt-1 text-3xl font-bold tabular leading-tight">
          {headerLine}
        </h1>
      </header>

      <div className="flex justify-center pt-2 pb-6">
        <MissionRing day={dayNum} totalDays={total} />
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

      <InstallBanner />

      {canLogToday && (
        <section className="px-5 pt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
            Today
          </h2>
          <div className="space-y-2">
            <SlideToConfirm
              label="Diet"
              icon={<Utensils size={18} strokeWidth={1.75} />}
              doneLabel={`Done · +${XP.diet} XP`}
              confirmed={dietDone}
              onConfirm={() => setDayEntry(today, { diet: 'success' })}
            />
            <SlideToConfirm
              label="Exercise"
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              doneLabel={`Done · +${XP.exercise} XP`}
              confirmed={exerciseDone}
              onConfirm={() => setDayEntry(today, { exercise: 'success' })}
            />
          </div>
          {!todayHasBoth && (
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      'Mark today as missed? Diet and exercise will both be set to failed.',
                    )
                  ) {
                    setDayEntry(today, { diet: 'fail', exercise: 'fail' });
                  }
                }}
                className="text-xs text-text-subtle hover:text-text-muted"
              >
                Mark as missed
              </button>
            </div>
          )}
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
            onChange={(v) => setDayEntry(today, { weight: v })}
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
    </div>
  );
}
