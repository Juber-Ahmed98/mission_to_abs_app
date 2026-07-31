// The day editor (Journey map panel's body). Backfills are never silent
// (DESIGN.md · moment 2): every confirm — pillar, camp day, weight, waist —
// carries the undo pill, and the app-level XP watcher fires the toast.

import { useState } from 'react';
import { ChevronDown, Moon } from 'lucide-react';
import { useMission } from '../store/mission';
import { dayNumberFor, isEndOfWeek, weekNumberFor } from '../lib/date';
import { XP } from '../lib/xp';
import { bump } from '../lib/analytics';
import Toggle from './Toggle';
import WeightInput from './WeightInput';
import BodyFatInput from './BodyFatInput';
import WaistInput from './WaistInput';
import { showUndo } from './UndoToast';
import type { DayEntry } from '../types';

type Props = {
  date: string;
  showNotes?: boolean;
};

const isEmptyEntry = (e: DayEntry | undefined) =>
  !e || (e.diet === undefined && e.exercise === undefined && e.rest !== true);

export default function DayEditor({ date, showNotes = true }: Props) {
  const entry = useMission((s) => s.days[date]);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const settings = useMission((s) => s.settings);
  const measurements = useMission((s) => s.measurements);
  const setMeasurement = useMission((s) => s.setMeasurement);
  const removeMeasurement = useMission((s) => s.removeMeasurement);
  const unit = settings.weightUnit;
  const [notesOpen, setNotesOpen] = useState(!!entry?.notes);

  const dayNum = dayNumberFor(date, settings.startDate);
  const totalMissionDays = settings.durationWeeks * 7;
  const isWithinMission = dayNum >= 1 && dayNum <= totalMissionDays;
  const showWaist = isWithinMission && isEndOfWeek(dayNum);
  const weekNum = showWaist ? weekNumberFor(date, settings.startDate) : 0;
  const currentMeasurement = showWaist
    ? measurements.find((m) => m.weekNumber === weekNum)
    : undefined;

  const setPillar = (pillar: 'diet' | 'exercise', v: DayEntry['diet']) => {
    const prev = entry;
    const prevVal = prev?.[pillar];
    const label = settings.pillarLabels[pillar];
    // Setting a pillar clears camp; the undo restores both.
    setDayEntry(date, { [pillar]: v, rest: undefined } as Partial<DayEntry>);
    if (isEmptyEntry(prev) && v !== undefined) bump('daysLogged');
    const undoLabel =
      v === 'success'
        ? `${label} logged`
        : v === 'fail'
          ? `${label} marked rough ground`
          : `${label} cleared`;
    showUndo(undoLabel, () => {
      setDayEntry(date, { [pillar]: prevVal, rest: prev?.rest } as Partial<DayEntry>);
    });
  };

  const isRest = entry?.rest === true;
  const toggleCamp = () => {
    const prev = entry;
    const revert = () => {
      setDayEntry(date, {
        rest: prev?.rest,
        diet: prev?.diet,
        exercise: prev?.exercise,
      });
    };
    if (isRest) {
      setDayEntry(date, { rest: undefined });
      showUndo('Broke camp', revert);
    } else {
      setDayEntry(date, { rest: true, diet: undefined, exercise: undefined });
      if (isEmptyEntry(prev)) bump('daysLogged');
      showUndo('Camp day marked', revert);
    }
  };

  const onWeightChange = (v: number | undefined) => {
    const prev = entry?.weight;
    if (prev === v) return;
    setDayEntry(date, { weight: v });
    showUndo(v === undefined ? 'Cleared weight' : `Logged ${v} ${unit}`, () => {
      setDayEntry(date, { weight: prev });
    });
  };

  const onBodyFatChange = (v: number | undefined) => {
    const prev = entry?.bodyFat;
    if (prev === v) return;
    setDayEntry(date, { bodyFat: v });
    showUndo(v === undefined ? 'Cleared body fat' : `Logged ${v}% body fat`, () => {
      setDayEntry(date, { bodyFat: prev });
    });
  };

  const onWaistChange = (next: number | undefined) => {
    if (!showWaist) return;
    const prevMeasurement = currentMeasurement;
    const prev = prevMeasurement?.waistCm;
    if (prev === next) return;
    if (next === undefined) {
      removeMeasurement(weekNum);
    } else {
      setMeasurement({ weekNumber: weekNum, date, waistCm: next });
    }
    showUndo(next === undefined ? 'Cleared waist' : 'Logged waist', () => {
      if (prevMeasurement) setMeasurement(prevMeasurement);
      else removeMeasurement(weekNum);
    });
  };

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="space-y-3">
        <Toggle
          label={settings.pillarLabels.diet}
          value={entry?.diet}
          onChange={(v) => setPillar('diet', v)}
        />
        <Toggle
          label={settings.pillarLabels.exercise}
          value={entry?.exercise}
          onChange={(v) => setPillar('exercise', v)}
        />
        <div className="flex items-center justify-between">
          <span className="text-base text-text">Camp day</span>
          <button
            type="button"
            aria-label="Toggle camp day"
            aria-pressed={isRest}
            onClick={toggleCamp}
            className={[
              'flex h-11 w-11 items-center justify-center rounded-pill border transition-colors duration-150 ease-apple',
              isRest
                ? 'border-rest-40 bg-rest-bg text-rest'
                : 'border-border bg-surface-2 text-text-muted',
            ].join(' ')}
          >
            <Moon size={20} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-text-muted">Weight</div>
        <WeightInput value={entry?.weight} unit={unit} onChange={onWeightChange} />
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-text-muted">Body fat</div>
        <BodyFatInput value={entry?.bodyFat} onChange={onBodyFatChange} />
      </div>
      {showWaist && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider text-text-muted">
            <span>Week {weekNum} waist</span>
            {!currentMeasurement && (
              <span className="text-text-subtle">+{XP.waist} XP</span>
            )}
          </div>
          <WaistInput
            valueCm={currentMeasurement?.waistCm}
            unit={settings.waistUnit}
            onChangeCm={onWaistChange}
          />
        </div>
      )}
      {showNotes && (
        <div>
          <button
            type="button"
            onClick={() => setNotesOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted"
          >
            Notes
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ease-apple ${notesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {notesOpen && (
            <textarea
              value={entry?.notes ?? ''}
              onChange={(e) => setDayEntry(date, { notes: e.target.value })}
              rows={3}
              placeholder=""
              className="mt-2 w-full resize-none rounded-card border border-border bg-surface p-3 text-base text-text outline-none"
            />
          )}
        </div>
      )}
    </div>
  );
}
