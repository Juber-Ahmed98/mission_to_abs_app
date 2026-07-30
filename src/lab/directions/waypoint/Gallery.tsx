// Waypoint — the nine primitives in isolation, for the Gate 1 walk-through.

import { useState } from 'react';
import { Dumbbell, Utensils } from 'lucide-react';
import type { LabFixture } from '../../fixtures';
import { XP } from '../../../lib/xp';
import MissionRing from './MissionRing';
import SlideToConfirm from './SlideToConfirm';
import TodayRow from './TodayRow';
import LevelBadge from './LevelBadge';
import BottomNav from './BottomNav';
import WeightInput from './WeightInput';
import BottomSheet from './BottomSheet';
import XpToast, { type Toast } from './XpToast';
import UndoToast from './UndoToast';
import './waypoint.css';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="mb-2 text-xs font-bold uppercase tracking-wider"
        style={{ color: 'var(--text-subtle)' }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export default function Gallery({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  const [slid, setSlid] = useState(false);
  const [rowStatus, setRowStatus] = useState<'success' | 'fail' | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(f.lastWeight ?? undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  return (
    <div
      className={`dir-waypoint wp-stage-${f.stage?.index ?? 0} relative space-y-6 px-5 py-6`}
    >
      <Item label="MissionRing → the trail strip">
        <MissionRing
          day={f.day}
          totalDays={f.totalDays}
          days={f.days}
          startDate={f.startDate}
          todayStatus="empty"
        />
      </Item>

      <Item label="SlideToConfirm → a stretch to walk">
        <SlideToConfirm
          label={f.pillarLabels.diet}
          icon={<Utensils size={18} strokeWidth={1.75} />}
          xpReward={XP.diet}
          confirmed={slid}
          onConfirm={() => setSlid(true)}
          onClear={() => setSlid(false)}
        />
      </Item>

      <Item label="TodayRow (with rough-ground mark)">
        <TodayRow
          label={f.pillarLabels.exercise}
          icon={<Dumbbell size={18} strokeWidth={1.75} />}
          xpReward={XP.exercise}
          status={rowStatus}
          onSuccess={() => setRowStatus('success')}
          onFail={() => setRowStatus('fail')}
          onClear={() => setRowStatus(undefined)}
        />
      </Item>

      <Item label="LevelBadge → elevation gained">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </Item>

      <Item label="WeightInput → the reading">
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
      </Item>

      <Item label="XpToast → the flag chip">
        <div className="relative h-12">
          <XpToast toast={toast} />
          <button
            type="button"
            onClick={() => {
              setToast({
                id: Date.now(),
                amount: XP.diet + XP.exercise + XP.perfectDayBonus,
                note: 'Perfect day — flag planted',
              });
              setTimeout(() => setToast(null), 1700);
            }}
            className="h-10 rounded-card border px-4 text-sm font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Plant a flag
          </button>
        </div>
      </Item>

      <Item label="UndoToast → the legend chip">
        <div className="relative h-16">
          <UndoToast entry={{ id: 1, label: 'Exercise logged', undo: () => {} }} />
        </div>
      </Item>

      <Item label="BottomSheet → the map panel">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="h-10 rounded-card border px-4 text-sm font-semibold"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Open the panel
        </button>
      </Item>

      <Item label="BottomNav → the legend bar">
        <BottomNav />
      </Item>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-5 pb-6 pt-2">
          <div className="text-lg font-bold">A map panel.</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Slides up from the frame edge, stage-hued actions inside.
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
