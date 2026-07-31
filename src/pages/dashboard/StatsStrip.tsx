// The altimeter and the readings (DESIGN.md · Dashboard layout): level badge,
// weight, body fat. Reading changes carry the undo pill like any confirm.

import { Percent, Scale } from 'lucide-react';
import { useMission } from '../../store/mission';
import LevelBadge from '../../components/LevelBadge';
import WeightInput from '../../components/WeightInput';
import BodyFatInput from '../../components/BodyFatInput';
import { showUndo } from '../../components/UndoToast';

type Props = {
  today: string;
  canLogToday: boolean;
  level: number;
  tier: string;
  xpInLevel: number;
  xpToNext: number;
};

export default function StatsStrip(p: Props) {
  const days = useMission((s) => s.days);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const weightUnit = useMission((s) => s.settings.weightUnit);
  const entry = days[p.today];

  const onWeightChange = (v: number | undefined) => {
    const prev = entry?.weight;
    if (prev === v) return;
    setDayEntry(p.today, { weight: v });
    const label = v === undefined ? 'Cleared weight' : `Logged ${v} ${weightUnit}`;
    showUndo(label, () => {
      setDayEntry(p.today, { weight: prev });
    });
  };

  const onBodyFatChange = (v: number | undefined) => {
    const prev = entry?.bodyFat;
    if (prev === v) return;
    setDayEntry(p.today, { bodyFat: v });
    const label = v === undefined ? 'Cleared body fat' : `Logged ${v}% body fat`;
    showUndo(label, () => {
      setDayEntry(p.today, { bodyFat: prev });
    });
  };

  return (
    <>
      <div className="px-5 pt-5">
        <LevelBadge
          level={p.level}
          tier={p.tier}
          xpInLevel={p.xpInLevel}
          xpToNext={p.xpToNext}
        />
      </div>

      {p.canLogToday && (
        <section className="space-y-5 px-5 pt-5">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
              <Scale size={12} strokeWidth={1.75} />
              Weight
            </h2>
            <WeightInput
              value={entry?.weight}
              unit={weightUnit}
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
    </>
  );
}
