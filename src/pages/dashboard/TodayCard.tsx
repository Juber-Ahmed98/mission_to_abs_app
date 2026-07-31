// Today's ground (DESIGN.md · daily loop): the pillar rows, the camp-day
// action, and quick-log yesterday. Every confirm carries the undo pill; the
// global XP watcher fires the toast, so the handlers only write and offer undo.

import { Dumbbell, Moon, Settings as SettingsIcon, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMission } from '../../store/mission';
import TodayRow from '../../components/TodayRow';
import { showUndo } from '../../components/UndoToast';
import { XP } from '../../lib/xp';
import { bump } from '../../lib/analytics';
import type { DayEntry } from '../../types';

type Props = {
  today: string;
  yesterday: string;
  isPreMission: boolean;
  canLogToday: boolean;
  showQuickLogYesterday: boolean;
};

const isEmptyEntry = (e: DayEntry | undefined) =>
  !e || (e.diet === undefined && e.exercise === undefined && e.rest !== true);

export default function TodayCard(p: Props) {
  const days = useMission((s) => s.days);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const pillarLabels = useMission((s) => s.settings.pillarLabels);

  const entry = days[p.today];
  const yesterdayEntry = days[p.yesterday];
  const dietLabel = pillarLabels.diet;
  const exerciseLabel = pillarLabels.exercise;

  const setPillar = (
    date: string,
    pillar: 'diet' | 'exercise',
    next: 'success' | 'fail' | undefined,
    undoLabel: string,
  ) => {
    const dayBefore = days[date];
    const prev = dayBefore?.[pillar];
    if (prev === next) return;
    setDayEntry(date, { [pillar]: next } as Partial<DayEntry>);
    if (isEmptyEntry(dayBefore) && next !== undefined) bump('daysLogged');
    showUndo(undoLabel, () => {
      setDayEntry(date, { [pillar]: prev } as Partial<DayEntry>);
    });
  };

  const pillarHandlers = (pillar: 'diet' | 'exercise', date: string, name: string) => ({
    onSuccess: () => setPillar(date, pillar, 'success', `${name} logged`),
    onFail: () => setPillar(date, pillar, 'fail', `${name} marked rough ground`),
    onClear: () => setPillar(date, pillar, undefined, `${name} cleared`),
  });

  const toggleCamp = () => {
    const prev = entry;
    const revert = () => {
      setDayEntry(p.today, {
        rest: prev?.rest,
        diet: prev?.diet,
        exercise: prev?.exercise,
      });
    };
    if (prev?.rest === true) {
      setDayEntry(p.today, { rest: undefined });
      showUndo('Broke camp', revert);
    } else {
      setDayEntry(p.today, { rest: true, diet: undefined, exercise: undefined });
      if (isEmptyEntry(prev)) bump('daysLogged');
      showUndo('Camp day marked', revert);
    }
  };

  if (p.isPreMission) {
    return (
      <section className="px-5 pt-6">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
          Your daily log
        </h2>
        <div className="pointer-events-none space-y-2 opacity-50">
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
    );
  }

  if (!p.canLogToday) return null;

  return (
    <>
      {p.showQuickLogYesterday && (
        <section className="px-5 pt-1">
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
              {...pillarHandlers('diet', p.yesterday, dietLabel)}
            />
            <TodayRow
              label={exerciseLabel}
              icon={<Dumbbell size={18} strokeWidth={1.75} />}
              xpReward={XP.exercise}
              doneLabel={`+${XP.exercise} XP`}
              status={yesterdayEntry?.exercise}
              {...pillarHandlers('exercise', p.yesterday, exerciseLabel)}
            />
          </div>
        </section>
      )}

      <section className="px-5 pt-5">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-text-muted">
          Today's ground
        </h2>
        {entry?.rest ? (
          <div className="rounded-card border border-rest-30 bg-rest-bg px-4 py-4 text-center">
            <div className="text-sm font-medium text-text">Camp day.</div>
            <div className="text-xs text-text-muted">
              Resting is still being on the trail.
            </div>
            <button
              type="button"
              onClick={toggleCamp}
              className="mt-2 text-xs text-text-muted hover:text-text"
            >
              Break camp
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
                {...pillarHandlers('diet', p.today, dietLabel)}
              />
              <TodayRow
                label={exerciseLabel}
                icon={<Dumbbell size={18} strokeWidth={1.75} />}
                xpReward={XP.exercise}
                doneLabel={`+${XP.exercise} XP`}
                status={entry?.exercise}
                {...pillarHandlers('exercise', p.today, exerciseLabel)}
              />
            </div>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={toggleCamp}
                className="inline-flex min-h-11 items-center gap-1.5 px-3 text-xs text-text-muted hover:text-text"
              >
                <Moon size={12} strokeWidth={1.75} />
                Camp day
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
