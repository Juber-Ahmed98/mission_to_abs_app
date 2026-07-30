// Ember — the nine primitives in isolation, for the Gate 1 walk-through.

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
import './ember.css';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        className="mb-2 text-xs font-medium uppercase tracking-wider"
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
    <div className="dir-ember relative space-y-6 px-5 py-6">
      <Item label="MissionRing">
        <div className="flex justify-center">
          <MissionRing day={f.day} totalDays={f.totalDays} size={180} stroke={15} />
        </div>
      </Item>

      <Item label="SlideToConfirm">
        <SlideToConfirm
          label={f.pillarLabels.diet}
          icon={<Utensils size={18} strokeWidth={1.75} />}
          xpReward={XP.diet}
          doneLabel={`Done · +${XP.diet} XP`}
          confirmed={slid}
          onConfirm={() => setSlid(true)}
          onClear={() => setSlid(false)}
        />
      </Item>

      <Item label="TodayRow (with fail affordance)">
        <TodayRow
          label={f.pillarLabels.exercise}
          icon={<Dumbbell size={18} strokeWidth={1.75} />}
          xpReward={XP.exercise}
          doneLabel={`Done · +${XP.exercise} XP`}
          status={rowStatus}
          onSuccess={() => setRowStatus('success')}
          onFail={() => setRowStatus('fail')}
          onClear={() => setRowStatus(undefined)}
        />
      </Item>

      <Item label="LevelBadge">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </Item>

      <Item label="WeightInput">
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
      </Item>

      <Item label="XpToast">
        <div className="relative h-12">
          <XpToast toast={toast} />
          <button
            type="button"
            onClick={() => {
              setToast({ id: Date.now(), amount: XP.diet + XP.exercise + XP.perfectDayBonus, note: 'Perfect day' });
              setTimeout(() => setToast(null), 1800);
            }}
            className="h-10 rounded-pill border px-4 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Fire the toast
          </button>
        </div>
      </Item>

      <Item label="UndoToast">
        <div className="relative h-16">
          <UndoToast
            entry={{ id: 1, label: 'Exercise logged', undo: () => {} }}
          />
        </div>
      </Item>

      <Item label="BottomSheet">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="h-10 rounded-pill border px-4 text-sm font-medium"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Open the sheet
        </button>
      </Item>

      <Item label="BottomNav">
        <BottomNav />
      </Item>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-5 pb-6 pt-2">
          <div className="text-lg font-semibold">A warm sheet.</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Raised panel, soft light from below.
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
