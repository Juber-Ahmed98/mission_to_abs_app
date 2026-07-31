// Ember — composed Dashboard. Dark-first, tactile, warm. Focused density:
// one warm object at a time, the hearth first on a return.
//
// Fixture-driven and locally interactive: slides really slide, XP really
// counts up, undo really undoes — all in component state, nothing persisted.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dumbbell, Flame, Moon, Utensils } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { LabFixture } from '../../fixtures';
import { XP } from '../../../lib/xp';
import { formatNice } from '../../../lib/date';
import { EASE } from '../../../lib/motionTokens';
import MissionRing from './MissionRing';
import TodayRow from './TodayRow';
import LevelBadge from './LevelBadge';
import BottomNav from './BottomNav';
import WeightInput from './WeightInput';
import BottomSheet from './BottomSheet';
import XpToast, { type Toast } from './XpToast';
import UndoToast, { type UndoEntry } from './UndoToast';
import './ember.css';

type PillarState = 'success' | 'fail' | undefined;

export default function Dashboard({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  const reduced = useReducedMotion();
  const todayEntry = f.days[f.today];

  const [diet, setDiet] = useState<PillarState>(
    todayEntry?.diet === 'success' ? 'success' : todayEntry?.diet === 'fail' ? 'fail' : undefined,
  );
  const [exercise, setExercise] = useState<PillarState>(
    todayEntry?.exercise === 'success'
      ? 'success'
      : todayEntry?.exercise === 'fail'
        ? 'fail'
        : undefined,
  );
  const [rest, setRest] = useState(todayEntry?.rest === true);
  const [weight, setWeight] = useState<number | undefined>(todayEntry?.weight);
  const [toast, setToast] = useState<Toast | null>(null);
  const [undo, setUndo] = useState<UndoEntry | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(f.moment === 'levelUp');
  const [shieldSheetOpen, setShieldSheetOpen] = useState(false);
  const [shieldUsed, setShieldUsed] = useState(false);
  const [breakDismissed, setBreakDismissed] = useState(false);

  // Reset local state when the fixture switches.
  useEffect(() => {
    const e = f.days[f.today];
    setDiet(e?.diet);
    setExercise(e?.exercise);
    setRest(e?.rest === true);
    setWeight(e?.weight);
    setToast(null);
    setUndo(null);
    setLevelUpOpen(f.moment === 'levelUp');
    setShieldSheetOpen(false);
    setShieldUsed(false);
    setBreakDismissed(false);
  }, [f]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireToast = (amount: number, note?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), amount, note });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const showUndo = (label: string, fn: () => void) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const entry: UndoEntry = {
      id: Date.now(),
      label,
      undo: () => {
        fn();
        setUndo(null);
      },
    };
    setUndo(entry);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const perfect = diet === 'success' && exercise === 'success';
  const perfectArmed = f.moment === 'perfectDay' || perfect;

  const confirmPillar = (which: 'diet' | 'exercise') => {
    const other = which === 'diet' ? exercise : diet;
    const set = which === 'diet' ? setDiet : setExercise;
    const label = which === 'diet' ? f.pillarLabels.diet : f.pillarLabels.exercise;
    set('success');
    const bonus = other === 'success' ? XP.perfectDayBonus : 0;
    fireToast(XP.diet + bonus, bonus > 0 ? 'Perfect day' : undefined);
    showUndo(`${label} logged`, () => set(undefined));
  };

  const failPillar = (which: 'diet' | 'exercise') => {
    const set = which === 'diet' ? setDiet : setExercise;
    const label = which === 'diet' ? f.pillarLabels.diet : f.pillarLabels.exercise;
    set('fail');
    showUndo(`${label} marked failed`, () => set(undefined));
  };

  const clearPillar = (which: 'diet' | 'exercise') => {
    const set = which === 'diet' ? setDiet : setExercise;
    set(undefined);
  };

  const headline = useMemo(() => {
    if (f.id === 'day1') return { title: 'The fire is lit.', sub: `${f.totalDays} days ahead. Start with one slide.` };
    if (f.id === 'day104Eve') return { title: 'One day left.', sub: 'Tomorrow is Day 105.' };
    return null;
  }, [f]);

  const isReentry = !!f.gap && f.gap.gapDays >= 2;
  const isBreak = !!f.gap && f.gap.gapDays === 1 && !breakDismissed;

  return (
    <div className="dir-ember relative flex min-h-[760px] flex-col pb-3">
      <header className="flex items-center justify-between px-5 pt-6">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          {formatNice(f.today)}
        </span>
        {f.streak >= 2 && (
          <span
            className="tabular flex items-center gap-1.5 rounded-pill border px-3 py-1 text-sm"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
            }}
          >
            <Flame size={14} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            {f.streak} days
          </span>
        )}
      </header>

      <div className="px-5 pt-3">
        <h1 className="tabular text-3xl font-bold leading-tight">Day {f.day}</h1>
      </div>

      {/* ---- the re-entry answer: the hearth ---- */}
      {isReentry && f.gap && (
        <section className="em-hearth em-rise mx-5 mt-4 px-5 py-5">
          <h2 className="text-lg font-semibold">The light's kept on.</h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Last entry — Day {f.gap.lastLoggedDay}, {formatNice(f.gap.lastLoggedDate)}.{' '}
            {f.gap.gapDays} quiet days since, and {f.totalDays - f.day} still ahead of you.
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--text)' }}>
            Today counts the moment you slide.
          </p>
          <button
            type="button"
            className="mt-3 min-h-[44px] text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            Fill in the missing days
          </button>
        </section>
      )}

      {/* ---- streak break: the shield offer ---- */}
      {isBreak && f.gap && !shieldUsed && (
        <section className="em-hearth em-rise mx-5 mt-4 px-5 py-5">
          <h2 className="text-lg font-semibold">Yesterday went unlogged.</h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            A {f.gap.streakBeforeGap}-day run stands behind you.{' '}
            {f.shieldsRemaining > 0
              ? `One shield remains — it can hold the line.`
              : 'No shields remain.'}
          </p>
          <div className="mt-4 flex gap-2">
            {f.shieldsRemaining > 0 && (
              <button
                type="button"
                onClick={() => setShieldSheetOpen(true)}
                className="h-11 flex-1 rounded-pill text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--bg)' }}
              >
                Use the shield
              </button>
            )}
            <button
              type="button"
              onClick={() => setBreakDismissed(true)}
              className="h-11 flex-1 rounded-pill border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Let it stand
            </button>
          </div>
        </section>
      )}

      {shieldUsed && (
        <section className="em-medium em-rise mx-5 mt-4 px-4 py-3 text-sm">
          Shield spent. Yesterday stands as rest — the run holds at{' '}
          <span className="tabular font-semibold">{f.gap?.streakBeforeGap}</span>.
        </section>
      )}

      {headline && (
        <section className="mx-5 mt-4">
          <h2 className="text-lg font-semibold">{headline.title}</h2>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {headline.sub}
          </p>
        </section>
      )}

      <div className="flex justify-center pb-5 pt-6">
        <MissionRing day={f.day} totalDays={f.totalDays} />
      </div>

      <div className="relative px-5">
        <XpToast toast={toast} />
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </div>

      {/* ---- perfect day, medium register ---- */}
      <AnimatePresence>
        {perfectArmed && perfect && !rest && (
          <motion.section
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="em-medium mx-5 mt-4 px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-pill"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Flame size={18} strokeWidth={2} />
              </span>
              <div>
                <div className="text-sm font-semibold">Both pillars. A perfect day.</div>
                <div className="tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                  +{XP.diet + XP.exercise + XP.perfectDayBonus} XP banked
                  {f.streak >= 2 ? ` · the run reaches ${f.streak + 1} tomorrow` : ''}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---- today ---- */}
      <section className="px-5 pt-6">
        <h2
          className="mb-2 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-subtle)' }}
        >
          Today
        </h2>
        {rest ? (
          <div
            className="rounded-card border px-4 py-4 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--rest-bg)' }}
          >
            <div className="text-sm font-medium">Rest day.</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              The fire banks low. It doesn't go out.
            </div>
            <button
              type="button"
              onClick={() => setRest(false)}
              className="mt-2 min-h-[36px] text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              Undo rest
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              <TodayRow
                label={f.pillarLabels.diet}
                icon={<Utensils size={18} strokeWidth={1.75} />}
                xpReward={XP.diet}
                doneLabel={`Done · +${XP.diet} XP`}
                status={diet}
                onSuccess={() => confirmPillar('diet')}
                onFail={() => failPillar('diet')}
                onClear={() => clearPillar('diet')}
              />
              <TodayRow
                label={f.pillarLabels.exercise}
                icon={<Dumbbell size={18} strokeWidth={1.75} />}
                xpReward={XP.exercise}
                doneLabel={`Done · +${XP.exercise} XP`}
                status={exercise}
                onSuccess={() => confirmPillar('exercise')}
                onFail={() => failPillar('exercise')}
                onClear={() => clearPillar('exercise')}
              />
            </div>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setRest(true);
                  showUndo('Marked rest day', () => setRest(false));
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 text-xs"
                style={{ color: 'var(--text-subtle)' }}
              >
                <Moon size={12} strokeWidth={1.75} />
                Rest day
              </button>
            </div>
          </>
        )}
      </section>

      {/* ---- weight ---- */}
      <section className="px-5 pt-5">
        <h2
          className="mb-2 text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-subtle)' }}
        >
          Weight
        </h2>
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
        {f.lastWeight !== null && weight === undefined && (
          <p className="tabular mt-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
            Last recorded {f.lastWeight} {f.weightUnit} · goal {f.goalWeight}
          </p>
        )}
      </section>

      <div
        className="px-5 pb-6 pt-7 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {isReentry
          ? 'Yesterday is closed. Today is open.'
          : f.id === 'day104Eve'
            ? 'Bank the fire tonight. Walk out tomorrow.'
            : 'Small coals, kept warm, become the fire.'}
      </div>

      <BottomNav />

      {/* ---- level-up, heavy register ---- */}
      <AnimatePresence>
        {levelUpOpen && (
          <motion.button
            type="button"
            aria-label="Dismiss level up"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.1 : 0.35, ease: EASE }}
            onClick={() => setLevelUpOpen(false)}
            className="em-overlay-wash absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
          >
            <motion.div
              initial={reduced ? {} : { scale: 0.86, opacity: 0 }}
              animate={reduced ? {} : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="text-center"
            >
              <div
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: 'var(--accent)' }}
              >
                Level up
              </div>
              <div className="tabular mt-2 text-6xl font-bold leading-none">
                {f.level.level}
              </div>
              <div className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
                {f.tier}
              </div>
              <div className="mt-6 text-xs" style={{ color: 'var(--text-subtle)' }}>
                Tap anywhere to continue
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---- shield sheet ---- */}
      <BottomSheet open={shieldSheetOpen} onClose={() => setShieldSheetOpen(false)}>
        <div className="px-5 pb-5 pt-2">
          <div className="text-lg font-semibold">Use the shield on yesterday?</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Yesterday becomes a rest day. The {f.gap?.streakBeforeGap}-day run holds.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShieldSheetOpen(false)}
              className="h-11 flex-1 rounded-pill border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShieldSheetOpen(false);
                setShieldUsed(true);
                setBreakDismissed(true);
                showUndo('Shield used on yesterday', () => setShieldUsed(false));
              }}
              className="h-11 flex-1 rounded-pill text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Use shield
            </button>
          </div>
        </div>
      </BottomSheet>

      <UndoToast entry={undo} />
    </div>
  );
}
