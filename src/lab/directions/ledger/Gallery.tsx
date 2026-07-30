// Ledger — the nine primitives in isolation, for the Gate 1 walk-through.

import { useState } from 'react';
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
import './ledger.css';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="ld-caps mb-2" style={{ color: 'var(--text-subtle)' }}>
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
    <div className="dir-ledger relative space-y-7 px-6 py-6">
      <Item label="MissionRing → the measure">
        <MissionRing day={f.day} totalDays={f.totalDays} />
      </Item>

      <Item label="SlideToConfirm → the pen stroke">
        <SlideToConfirm
          label={f.pillarLabels.diet}
          xpReward={XP.diet}
          confirmed={slid}
          onConfirm={() => setSlid(true)}
          onClear={() => setSlid(false)}
        />
      </Item>

      <Item label="TodayRow (with the ✕ of equal weight)">
        <TodayRow
          label={f.pillarLabels.exercise}
          xpReward={XP.exercise}
          status={rowStatus}
          onSuccess={() => setRowStatus('success')}
          onFail={() => setRowStatus('fail')}
          onClear={() => setRowStatus(undefined)}
        />
      </Item>

      <Item label="LevelBadge → the chapter line">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </Item>

      <Item label="WeightInput → the entry line">
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
      </Item>

      <Item label="XpToast → the marginal note">
        <div className="relative h-10">
          <XpToast toast={toast} />
          <button
            type="button"
            onClick={() => {
              setToast({
                id: Date.now(),
                amount: XP.diet + XP.exercise + XP.perfectDayBonus,
                note: 'a perfect day, recorded',
              });
              setTimeout(() => setToast(null), 1800);
            }}
            className="ld-caps min-h-[40px] underline underline-offset-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Note in the margin
          </button>
        </div>
      </Item>

      <Item label="UndoToast → the amendment">
        <div className="relative h-16">
          <UndoToast entry={{ id: 1, label: 'Exercise marked', undo: () => {} }} />
        </div>
      </Item>

      <Item label="BottomSheet → the footnote">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="ld-caps min-h-[40px] underline underline-offset-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Open the footnote
        </button>
      </Item>

      <Item label="BottomNav → the running footer">
        <BottomNav />
      </Item>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-6 pb-6 pt-5">
          <div className="ld-serif text-lg">A footnote.</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Paper under a double rule. No shadow, no chrome.
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
