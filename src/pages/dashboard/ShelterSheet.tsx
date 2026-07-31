// The shelter confirm (DESIGN.md · moment 5): spending is a two-step —
// explicit, never automatic, and undoable. Pitched, it covers yesterday
// as a camp day and the walk holds.

import { useMission } from '../../store/mission';
import BottomSheet from '../../components/BottomSheet';
import { showUndo } from '../../components/UndoToast';
import { formatNice } from '../../lib/date';

type Props = {
  open: boolean;
  onClose: () => void;
  yesterday: string;
  priorStreak: number;
  canSpend: boolean;
  /** Called after a successful spend (closes the streak-break panel). */
  onSpent: () => void;
};

export default function ShelterSheet(p: Props) {
  const days = useMission((s) => s.days);
  const shieldsRemaining = useMission((s) => s.settings.streakShieldsRemaining);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const setSettings = useMission((s) => s.setSettings);

  const pitch = () => {
    if (!p.canSpend || shieldsRemaining <= 0) return;
    const prevEntry = days[p.yesterday];
    const prevShields = shieldsRemaining;
    setDayEntry(p.yesterday, { rest: true, diet: undefined, exercise: undefined });
    setSettings({ streakShieldsRemaining: prevShields - 1 });
    p.onClose();
    p.onSpent();
    showUndo('Shelter pitched over yesterday', () => {
      setDayEntry(p.yesterday, {
        rest: prevEntry?.rest,
        diet: prevEntry?.diet,
        exercise: prevEntry?.exercise,
      });
      setSettings({ streakShieldsRemaining: prevShields });
    });
  };

  return (
    <BottomSheet open={p.open} onClose={p.onClose}>
      <div className="px-5 pb-5 pt-2">
        <div className="text-lg font-bold">Pitch the shelter over yesterday?</div>
        <div className="mt-1 text-sm text-text-muted">
          {formatNice(p.yesterday)} reads as a camp day.
          {p.priorStreak >= 2 ? ` The ${p.priorStreak}-day walk holds.` : ''}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={p.onClose}
            className="h-11 flex-1 rounded-card border border-border bg-surface text-sm font-medium text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={pitch}
            className="h-11 flex-1 rounded-card bg-stage text-sm font-bold text-surface"
          >
            Pitch it
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
