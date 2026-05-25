import { useState } from 'react';
import { useMission } from '../store/mission';
import {
  dayNumberFor,
  formatNice,
  todayISO,
  totalDays,
} from '../lib/date';
import { stagesFor, stageForDay } from '../lib/stage';
import JourneyPath from '../components/JourneyPath';
import BottomSheet from '../components/BottomSheet';
import DayEditor from '../components/DayEditor';

export default function JourneyPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const [selected, setSelected] = useState<string | null>(null);
  const today = todayISO();
  const total = totalDays(settings.durationWeeks);
  const rawDay = dayNumberFor(today, settings.startDate);
  const dayNum = Math.max(1, Math.min(total, rawDay));
  const currentStage = stageForDay(dayNum, total);
  const stages = stagesFor(total);

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="pt-8 pb-3">
        <div className="text-sm text-text-muted">Journey</div>
        <div className="mt-1 text-3xl font-bold tracking-tight tabular">
          {settings.durationWeeks} weeks
        </div>
        {currentStage && (
          <div className="mt-1 text-sm text-text-muted">
            Stage {currentStage.index + 1} of {stages.length} · {currentStage.name}
          </div>
        )}
      </header>

      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <JourneyPath
          startDate={settings.startDate}
          totalDays={total}
          today={today}
          days={days}
          onSelect={setSelected}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
        <Legend dotClass="bg-lime" label="Perfect" />
        <Legend dotClass="bg-tangerine" label="Partial / Today" />
        <Legend dotClass="bg-coral" label="Failed" />
        <Legend dotClass="bg-missed" label="Missed" />
        <Legend dotClass="border border-border-strong" label="Future" />
      </div>

      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <div className="px-5 pt-2 pb-1">
              <div className="text-xs text-text-muted">{formatNice(selected)}</div>
              <div className="text-lg font-semibold tracking-tight tabular">
                Day {Math.max(1, dayNumberFor(selected, settings.startDate))}
              </div>
            </div>
            <DayEditor date={selected} />
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelected(null)}
                className="h-11 w-full rounded-card bg-surface-2 text-text"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function Legend({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}
