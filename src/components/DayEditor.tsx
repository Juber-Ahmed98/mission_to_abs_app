import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMission } from '../store/mission';
import { dayNumberFor, isEndOfWeek, weekNumberFor } from '../lib/date';
import { XP } from '../lib/xp';
import Toggle from './Toggle';
import WeightInput from './WeightInput';
import WaistInput from './WaistInput';

type Props = {
  date: string;
  showNotes?: boolean;
};

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

  const onWaistChange = (next: number | undefined) => {
    if (!showWaist) return;
    const prev = currentMeasurement?.waistCm;
    if (prev === next) return;
    if (next === undefined) {
      removeMeasurement(weekNum);
    } else {
      setMeasurement({ weekNumber: weekNum, date, waistCm: next });
    }
  };

  return (
    <div className="space-y-5 px-5 py-4">
      <div className="space-y-3">
        <Toggle
          label="Diet"
          value={entry?.diet}
          onChange={(v) => setDayEntry(date, { diet: v })}
        />
        <Toggle
          label="Exercise"
          value={entry?.exercise}
          onChange={(v) => setDayEntry(date, { exercise: v })}
        />
      </div>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wider text-text-muted">Weight</div>
        <WeightInput
          value={entry?.weight}
          unit={unit}
          onChange={(v) => setDayEntry(date, { weight: v })}
        />
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
