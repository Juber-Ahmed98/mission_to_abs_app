import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMission } from '../store/mission';
import Toggle from './Toggle';
import WeightInput from './WeightInput';

type Props = {
  date: string;
  showNotes?: boolean;
};

export default function DayEditor({ date, showNotes = true }: Props) {
  const entry = useMission((s) => s.days[date]);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const unit = useMission((s) => s.settings.weightUnit);
  const [notesOpen, setNotesOpen] = useState(!!entry?.notes);

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
