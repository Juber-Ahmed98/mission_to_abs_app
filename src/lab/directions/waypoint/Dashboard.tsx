// Waypoint — composed Dashboard. Light-first, the mission as a place.
// Everything-visible density: the walk itself sits at the top of the screen,
// stage-keyed color says where you are, and the celebration register is the
// expressive one. The mid-lapse answer: camp was Day 41, the trail is still
// here — the gap is a dotted stretch already behind you, never a wall of red.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dumbbell, Flag, Moon, Tent, Utensils } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { LabFixture } from '../../fixtures';
import { XP } from '../../../lib/xp';
import { formatNice } from '../../../lib/date';
import MissionRing from './MissionRing';
import TodayRow from './TodayRow';
import LevelBadge from './LevelBadge';
import BottomNav from './BottomNav';
import WeightInput from './WeightInput';
import BottomSheet from './BottomSheet';
import XpToast, { type Toast } from './XpToast';
import UndoToast, { type UndoEntry } from './UndoToast';
import './waypoint.css';

type PillarState = 'success' | 'fail' | undefined;

const SPECKS = [
  { left: '38%', delay: 0 },
  { left: '46%', delay: 0.08 },
  { left: '54%', delay: 0.16 },
  { left: '62%', delay: 0.05 },
  { left: '42%', delay: 0.22 },
  { left: '58%', delay: 0.12 },
  { left: '50%', delay: 0.28 },
  { left: '66%', delay: 0.2 },
];

export default function Dashboard({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  const reduced = useReducedMotion();
  const todayEntry = f.days[f.today];

  const [diet, setDiet] = useState<PillarState>(todayEntry?.diet);
  const [exercise, setExercise] = useState<PillarState>(todayEntry?.exercise);
  const [rest, setRest] = useState(todayEntry?.rest === true);
  const [weight, setWeight] = useState<number | undefined>(todayEntry?.weight);
  const [toast, setToast] = useState<Toast | null>(null);
  const [undo, setUndo] = useState<UndoEntry | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(f.moment === 'levelUp');
  const [shieldSheetOpen, setShieldSheetOpen] = useState(false);
  const [shieldUsed, setShieldUsed] = useState(false);
  const [breakDismissed, setBreakDismissed] = useState(false);

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
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  };

  const showUndo = (label: string, fn: () => void) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({
      id: Date.now(),
      label,
      undo: () => {
        fn();
        setUndo(null);
      },
    });
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const confirmPillar = (which: 'diet' | 'exercise') => {
    const other = which === 'diet' ? exercise : diet;
    const set = which === 'diet' ? setDiet : setExercise;
    const label = which === 'diet' ? f.pillarLabels.diet : f.pillarLabels.exercise;
    set('success');
    const bonus = other === 'success' ? XP.perfectDayBonus : 0;
    fireToast(XP.diet + bonus, bonus > 0 ? 'Perfect day — flag planted' : undefined);
    showUndo(`${label} logged`, () => set(undefined));
  };

  const failPillar = (which: 'diet' | 'exercise') => {
    const set = which === 'diet' ? setDiet : setExercise;
    const label = which === 'diet' ? f.pillarLabels.diet : f.pillarLabels.exercise;
    set('fail');
    showUndo(`${label} marked rough ground`, () => set(undefined));
  };

  const perfect = diet === 'success' && exercise === 'success' && !rest;
  const isReentry = !!f.gap && f.gap.gapDays >= 2;
  const isBreak = !!f.gap && f.gap.gapDays === 1 && !breakDismissed && !shieldUsed;
  const todayLogged =
    rest || diet !== undefined || exercise !== undefined ? 'logged' : 'empty';

  const headline = useMemo(() => {
    if (f.id === 'day1')
      return { title: 'Trailhead.', sub: `${f.totalDays} days of country ahead. The first step is today's log.` };
    if (f.id === 'day104Eve')
      return { title: 'The summit is tomorrow.', sub: 'One camp left. Walk in like you walked the rest.' };
    return null;
  }, [f]);

  return (
    <div
      className={`dir-waypoint wp-stage-${f.stage?.index ?? 0} relative flex min-h-[760px] flex-col pb-0`}
    >
      {/* ---- header on faint contours ---- */}
      <div className="wp-contours">
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
              <Flag size={13} strokeWidth={2.25} style={{ color: 'var(--stage)' }} />
              {f.streak} days
            </span>
          )}
        </header>

        <div className="flex items-center justify-between px-5 pb-4 pt-3">
          <h1 className="tabular text-3xl font-bold leading-tight">Day {f.day}</h1>
          {f.stage && (
            <span
              className="rounded-pill px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
              style={{ background: 'var(--stage-soft)', color: 'var(--stage)' }}
            >
              {f.stage.name} · {f.stage.startDay}–{f.stage.endDay}
            </span>
          )}
        </div>
      </div>

      {/* ---- the walk, on the dashboard ---- */}
      <section className="wp-panel mx-4 px-4 pb-3 pt-2">
        <MissionRing
          day={f.day}
          totalDays={f.totalDays}
          days={f.days}
          startDate={f.startDate}
          todayStatus={todayLogged}
        />
        <div
          className="tabular mt-3 flex justify-between text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          <span>
            {f.day} of {f.totalDays} walked
          </span>
          <span>{f.totalDays - f.day} to the summit</span>
        </div>
      </section>

      {/* ---- the re-entry answer: back on the trail ---- */}
      {isReentry && f.gap && (
        <section className="wp-panel wp-pop mx-4 mt-4 px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill"
              style={{ background: 'var(--stage-soft)', color: 'var(--stage)' }}
            >
              <Tent size={18} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-bold">Back on the trail.</h2>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Camp was Day {f.gap.lastLoggedDay} — the dotted stretch is behind
                you now. You're standing in {f.stage?.name ?? 'the walk'} with{' '}
                {f.totalDays - f.day} days to the summit.
              </p>
              <p className="mt-2 text-sm font-medium">
                Today's log puts you back on the map.
              </p>
              <button
                type="button"
                className="mt-2 min-h-[40px] text-sm font-semibold underline-offset-4 hover:underline"
                style={{ color: 'var(--stage)' }}
              >
                Mark the missed stretch
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ---- streak break: pitch the shelter ---- */}
      {isBreak && f.gap && (
        <section className="wp-panel wp-pop mx-4 mt-4 px-5 py-4">
          <h2 className="text-base font-bold">A gap in yesterday's tracks.</h2>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {f.gap.streakBeforeGap} days walked without a break.{' '}
            {f.shieldsRemaining > 0
              ? 'One shelter left in the pack — pitched, it covers yesterday.'
              : 'No shelters left in the pack.'}
          </p>
          <div className="mt-3 flex gap-2">
            {f.shieldsRemaining > 0 && (
              <button
                type="button"
                onClick={() => setShieldSheetOpen(true)}
                className="h-11 flex-1 rounded-card text-sm font-bold"
                style={{ background: 'var(--stage)', color: 'var(--surface)' }}
              >
                Pitch the shelter
              </button>
            )}
            <button
              type="button"
              onClick={() => setBreakDismissed(true)}
              className="h-11 flex-1 rounded-card border text-sm font-medium"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Walk on
            </button>
          </div>
        </section>
      )}

      {shieldUsed && (
        <section className="wp-panel wp-pop mx-4 mt-4 px-4 py-3 text-sm">
          Shelter pitched over yesterday. The {f.gap?.streakBeforeGap}-day walk
          holds.
        </section>
      )}

      {headline && (
        <section className="mx-5 mt-4">
          <h2 className="text-lg font-bold">{headline.title}</h2>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            {headline.sub}
          </p>
        </section>
      )}

      {/* ---- perfect day: the flag ---- */}
      <AnimatePresence>
        {perfect && (
          <motion.section
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="wp-panel mx-4 mt-4 px-5 py-4"
            style={{ borderColor: 'color-mix(in srgb, var(--stage) 45%, transparent)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-pill"
                style={{ background: 'var(--stage)', color: 'var(--surface)' }}
              >
                <Flag size={19} strokeWidth={2.5} />
              </span>
              <div>
                <div className="text-sm font-bold">Flag planted — a perfect day.</div>
                <div className="tabular text-xs" style={{ color: 'var(--text-muted)' }}>
                  Both pillars · +{XP.diet + XP.exercise + XP.perfectDayBonus} XP
                  {f.streak >= 2 ? ` · ${f.streak}-day walk behind it` : ''}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ---- today ---- */}
      <section className="relative px-4 pt-6">
        <XpToast toast={toast} />
        <h2
          className="mb-2 px-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-subtle)' }}
        >
          Today's ground
        </h2>
        {rest ? (
          <div
            className="rounded-card border px-4 py-4 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--rest-bg)' }}
          >
            <div className="text-sm font-bold">Camp day.</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Resting is still being on the trail.
            </div>
            <button
              type="button"
              onClick={() => setRest(false)}
              className="mt-2 min-h-[36px] text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Break camp
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <TodayRow
                label={f.pillarLabels.diet}
                icon={<Utensils size={18} strokeWidth={1.75} />}
                xpReward={XP.diet}
                doneLabel={`+${XP.diet} XP`}
                status={diet}
                onSuccess={() => confirmPillar('diet')}
                onFail={() => failPillar('diet')}
                onClear={() => setDiet(undefined)}
              />
              <TodayRow
                label={f.pillarLabels.exercise}
                icon={<Dumbbell size={18} strokeWidth={1.75} />}
                xpReward={XP.exercise}
                doneLabel={`+${XP.exercise} XP`}
                status={exercise}
                onSuccess={() => confirmPillar('exercise')}
                onFail={() => failPillar('exercise')}
                onClear={() => setExercise(undefined)}
              />
            </div>
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setRest(true);
                  showUndo('Camp pitched for today', () => setRest(false));
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--text-subtle)' }}
              >
                <Moon size={12} strokeWidth={2} />
                Camp day
              </button>
            </div>
          </>
        )}
      </section>

      {/* ---- everything visible: the instruments ---- */}
      <section className="px-4 pt-5">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </section>

      <section className="px-4 pt-4">
        <h2
          className="mb-2 px-1 text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-subtle)' }}
        >
          Weight
        </h2>
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
        {f.lastWeight !== null && weight === undefined && (
          <p className="tabular mt-2 px-1 text-xs" style={{ color: 'var(--text-subtle)' }}>
            Last reading {f.lastWeight} {f.weightUnit} · heading for {f.goalWeight}
          </p>
        )}
      </section>

      <div
        className="px-5 pb-6 pt-7 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {isReentry
          ? 'The trail never left. Yesterday is closed; today is open.'
          : f.id === 'day104Eve'
            ? 'Sleep well. Tomorrow you crest.'
            : 'One stretch at a time is the whole way there.'}
      </div>

      <BottomNav />

      {/* ---- level-up: higher ground ---- */}
      <AnimatePresence>
        {levelUpOpen && (
          <motion.button
            type="button"
            aria-label="Dismiss level up"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.1 : 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => setLevelUpOpen(false)}
            className="wp-overlay-wash absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
          >
            {!reduced &&
              SPECKS.map((s, i) => (
                <span
                  key={i}
                  className="wp-speck"
                  style={{ left: s.left, top: '46%', animationDelay: `${s.delay}s` }}
                  aria-hidden
                />
              ))}
            <motion.div
              initial={reduced ? {} : { scale: 0.8, opacity: 0 }}
              animate={reduced ? {} : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-center"
            >
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill"
                style={{ background: 'var(--stage)', color: 'var(--surface)' }}
              >
                <Flag size={26} strokeWidth={2.5} />
              </span>
              <div
                className="mt-4 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--stage)' }}
              >
                Higher ground
              </div>
              <div className="tabular mt-1 text-6xl font-bold leading-none">
                {f.level.level}
              </div>
              <div className="mt-2 text-base" style={{ color: 'var(--text-muted)' }}>
                {f.tier}
              </div>
              <div className="mt-6 text-xs" style={{ color: 'var(--text-subtle)' }}>
                Tap anywhere to keep walking
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ---- shelter sheet ---- */}
      <BottomSheet open={shieldSheetOpen} onClose={() => setShieldSheetOpen(false)}>
        <div className="px-5 pb-5 pt-2">
          <div className="text-lg font-bold">Pitch the shelter over yesterday?</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Yesterday reads as a camp day. The {f.gap?.streakBeforeGap}-day walk
            holds. One shelter is in the pack.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShieldSheetOpen(false)}
              className="h-11 flex-1 rounded-card border text-sm font-medium"
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
                showUndo('Shelter pitched over yesterday', () => setShieldUsed(false));
              }}
              className="h-11 flex-1 rounded-card text-sm font-bold"
              style={{ background: 'var(--stage)', color: 'var(--surface)' }}
            >
              Pitch it
            </button>
          </div>
        </div>
      </BottomSheet>

      <UndoToast entry={undo} />
    </div>
  );
}
