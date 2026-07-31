// The shared-primitives gallery — Phase 6 turned the lab into the permanent
// verification harness: every restyled *production* primitive rendered here
// against the fixture states, in both themes, at 375px. Unlike the direction
// forks under directions/, these are the real components from src/components.

import { useEffect, useRef, useState } from 'react';
import { Dumbbell, Flag, Tent, Utensils } from 'lucide-react';
import type { LabFixture } from './fixtures';
import { XP } from '../lib/xp';
import MissionRing from '../components/MissionRing';
import SlideToConfirm from '../components/SlideToConfirm';
import TodayRow from '../components/TodayRow';
import LevelBadge from '../components/LevelBadge';
import BottomNav from '../components/BottomNav';
import WeightInput from '../components/WeightInput';
import WaistInput from '../components/WaistInput';
import BodyFatInput from '../components/BodyFatInput';
import BottomSheet from '../components/BottomSheet';
import SegmentedControl from '../components/SegmentedControl';
import MomentPanel from '../components/MomentPanel';
import LevelUpOverlay from '../components/LevelUpOverlay';
import StageOverlay from '../components/StageOverlay';
import XpToast, { type Toast } from '../components/XpToast';
// The app shell already renders the UndoToast singleton; the gallery only
// needs to trigger it.
import { clearUndo, showUndo } from '../components/UndoToast';

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-text-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}

export default function SharedGallery({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  const [slid, setSlid] = useState(false);
  const [rowStatus, setRowStatus] = useState<'success' | 'fail' | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(f.lastWeight ?? undefined);
  const [waistCm, setWaistCm] = useState<number | undefined>(undefined);
  const [bodyFat, setBodyFat] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The undo toast is a module-level singleton — clear it when the gallery
  // unmounts so a demo entry doesn't linger over the app.
  useEffect(() => clearUndo, []);

  useEffect(() => {
    setSlid(false);
    setRowStatus(undefined);
    setWeight(f.lastWeight ?? undefined);
    setToast(null);
  }, [f]);

  const fireToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({
      id: Date.now(),
      amount: XP.diet + XP.exercise + XP.perfectDayBonus,
      note: 'Perfect day — flag planted',
    });
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  };

  const triggerButton =
    'h-10 rounded-card border border-border px-4 text-sm font-semibold text-text-muted';

  return (
    <div className={`stage-${f.stage?.index ?? 0} space-y-6 bg-bg px-5 py-6`}>
      <Item label="MissionRing → the walk strip">
        <div className="rounded-card border border-border bg-surface px-4 pb-3 pt-2 shadow-panel">
          <MissionRing
            day={f.day}
            totalDays={f.totalDays}
            days={f.days}
            startDate={f.startDate}
            todayStatus="empty"
          />
        </div>
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

      <Item label="MomentPanel → medium register (streak break)">
        <MomentPanel
          icon={<Tent size={18} strokeWidth={2} />}
          title="A gap in yesterday's tracks."
          actions={[
            { label: 'Pitch the shelter', onClick: () => setSheetOpen(true), primary: true },
            { label: 'Walk on', onClick: () => {} },
          ]}
        >
          {f.gap?.streakBeforeGap ?? 8} days walked without a break. One shelter
          left in the pack — pitched, it covers yesterday.
        </MomentPanel>
      </Item>

      <Item label="MomentPanel → medium register (perfect day)">
        <MomentPanel
          icon={<Flag size={19} strokeWidth={2.5} />}
          iconTone="solid"
          title="Flag planted — a perfect day."
        >
          <span className="tabular">
            Both pillars · +{XP.diet + XP.exercise + XP.perfectDayBonus} XP
            {f.streak >= 2 ? ` · ${f.streak}-day walk behind it` : ''}
          </span>
        </MomentPanel>
      </Item>

      <Item label="LevelBadge → the altimeter">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </Item>

      <Item label="Weight / waist / body-fat readings">
        <div className="space-y-2">
          <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
          <WaistInput valueCm={waistCm} unit="cm" onChangeCm={setWaistCm} />
          <BodyFatInput value={bodyFat} onChange={setBodyFat} />
        </div>
      </Item>

      <Item label="SegmentedControl">
        <SegmentedControl
          options={['kg', 'lb'] as const}
          value={unit}
          onChange={setUnit}
        />
      </Item>

      <Item label="Registers on demand">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={fireToast} className={triggerButton}>
            Light · XP toast
          </button>
          <button
            type="button"
            onClick={() => showUndo('Exercise logged', () => {})}
            className={triggerButton}
          >
            Undo pill
          </button>
          <button
            type="button"
            onClick={() => setLevelUpOpen(true)}
            className={triggerButton}
          >
            Heavy · level-up
          </button>
          <button
            type="button"
            onClick={() => setStageOpen(true)}
            className={triggerButton}
          >
            Heavy · stage crossing
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={triggerButton}
          >
            Bottom sheet
          </button>
        </div>
        <div className="relative mt-2 h-12">
          <XpToast toast={toast} />
        </div>
      </Item>

      <Item label="BottomNav → the map legend">
        {/* transform creates a containing block so the fixed nav stays in frame */}
        <div
          className="relative h-[70px] overflow-hidden rounded-card border border-border"
          style={{ transform: 'translateZ(0)' }}
        >
          <BottomNav />
        </div>
      </Item>

      <LevelUpOverlay
        open={levelUpOpen}
        level={f.level.level}
        tier={f.tier}
        onDismiss={() => setLevelUpOpen(false)}
      />

      <StageOverlay
        open={stageOpen}
        stage={f.stage}
        onDismiss={() => setStageOpen(false)}
      />

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="px-5 pb-5 pt-2">
          <div className="text-lg font-bold">Pitch the shelter over yesterday?</div>
          <div className="mt-1 text-sm text-text-muted">
            Yesterday reads as a camp day. The{' '}
            {f.gap?.streakBeforeGap ?? 8}-day walk holds.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-sm font-medium text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="h-11 flex-1 rounded-card bg-stage text-sm font-bold text-surface"
            >
              Pitch it
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
