// Ledger — composed Dashboard. Light-first, type-led, no citrus. Document
// density: the Dashboard is today's page of the logbook, and the recent
// ledger lines are visible on it. The mid-lapse answer is structural — the
// twenty unlogged days collapse into a single "unwritten" line, because in
// a book, blank space is just blank space.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LabFixture } from '../../fixtures';
import type { DayEntry } from '../../../types';
import { XP } from '../../../lib/xp';
import { dayStatus } from '../../../lib/dayStatus';
import { addDaysISO, formatNice } from '../../../lib/date';
import MissionRing from './MissionRing';
import TodayRow from './TodayRow';
import LevelBadge from './LevelBadge';
import BottomNav from './BottomNav';
import WeightInput from './WeightInput';
import BottomSheet from './BottomSheet';
import XpToast, { type Toast } from './XpToast';
import UndoToast, { type UndoEntry } from './UndoToast';
import './ledger.css';

type PillarState = 'success' | 'fail' | undefined;

type Row =
  | { kind: 'day'; day: number; date: string; entry: DayEntry | undefined }
  | { kind: 'lapse'; from: number; to: number; count: number };

function markFor(v: 'success' | 'fail' | undefined, rest: boolean): string {
  if (rest) return '—';
  if (v === 'success') return '✓';
  if (v === 'fail') return '✕';
  return '·';
}

export default function Dashboard({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
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
    toastTimer.current = setTimeout(() => setToast(null), 1800);
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
    fireToast(XP.diet + bonus, bonus > 0 ? 'a perfect day, recorded' : 'recorded');
    showUndo(`${label} marked`, () => set(undefined));
  };

  const failPillar = (which: 'diet' | 'exercise') => {
    const set = which === 'diet' ? setDiet : setExercise;
    const label = which === 'diet' ? f.pillarLabels.diet : f.pillarLabels.exercise;
    set('fail');
    showUndo(`${label} marked ✕`, () => set(undefined));
  };

  const dateOf = (day: number) => addDaysISO(f.startDate, day - 1);

  const rows = useMemo<Row[]>(() => {
    const dayRow = (d: number): Row => ({
      kind: 'day',
      day: d,
      date: dateOf(d),
      entry: f.days[dateOf(d)],
    });
    if (f.gap && f.gap.gapDays >= 2) {
      const out: Row[] = [];
      for (let d = Math.max(1, f.gap.lastLoggedDay - 2); d <= f.gap.lastLoggedDay; d += 1) {
        out.push(dayRow(d));
      }
      out.push({
        kind: 'lapse',
        from: f.gap.lastLoggedDay + 1,
        to: f.day - 1,
        count: f.gap.gapDays,
      });
      return out;
    }
    const out: Row[] = [];
    for (let d = Math.max(1, f.day - 5); d < f.day; d += 1) out.push(dayRow(d));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);

  const perfect = diet === 'success' && exercise === 'success' && !rest;
  const isReentry = !!f.gap && f.gap.gapDays >= 2;
  const isBreak = !!f.gap && f.gap.gapDays === 1 && !breakDismissed && !shieldUsed;

  return (
    <div className="dir-ledger relative flex min-h-[760px] flex-col px-6 pb-2 pt-6">
      {/* ---- masthead ---- */}
      <header>
        <div className="ld-caps flex justify-between" style={{ color: 'var(--text-subtle)' }}>
          <span>Mission to Abs</span>
          <span className="tabular">No. {f.day}</span>
        </div>
        <div className="ld-rule-double mt-2" />
        <div className="mt-4 flex items-baseline justify-between">
          <h1 className="ld-serif text-[2rem] leading-tight">Day {f.day}</h1>
          {f.streak >= 2 && (
            <span className="tabular text-sm" style={{ color: 'var(--text-muted)' }}>
              {f.streak} days running
            </span>
          )}
        </div>
        <div className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {formatNice(f.today)}
          {f.stage ? ` · ${f.stage.name}` : ''}
          {' · '}week {Math.ceil(f.day / 7)}
        </div>
      </header>

      {/* ---- level-up, in-flow typographic ---- */}
      {levelUpOpen && (
        <section className="ld-settle mt-5">
          <div className="ld-rule-double" />
          <div className="py-4 text-center">
            <div className="ld-caps" style={{ color: 'var(--accent)' }}>
              Level up
            </div>
            <div className="ld-serif mt-1.5 text-3xl">
              Level {f.level.level} — {f.tier}
            </div>
            <button
              type="button"
              onClick={() => setLevelUpOpen(false)}
              className="ld-caps mt-3 min-h-[36px] underline underline-offset-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Noted
            </button>
          </div>
          <div className="ld-rule-double" />
        </section>
      )}

      {/* ---- the re-entry answer: the unwritten line ---- */}
      {isReentry && f.gap && (
        <section className="ld-settle mt-5">
          <h2 className="ld-serif text-xl">
            Days {f.gap.lastLoggedDay + 1}–{f.day - 1} — unwritten.
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {f.gap.gapDays} days between entries. The book doesn't mind; it stays
            open. Today is the next line, and the line is short — one mark, then
            another.
          </p>
          <button
            type="button"
            className="ld-caps mt-2.5 min-h-[40px] underline underline-offset-4"
            style={{ color: 'var(--accent)' }}
          >
            Amend earlier entries
          </button>
        </section>
      )}

      {/* ---- streak break: the footnote ---- */}
      {isBreak && f.gap && (
        <section className="ld-settle ld-rule-t mt-5 pt-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
            Yesterday — Day {f.day - 1} — went unmarked. A{' '}
            <span className="tabular">{f.gap.streakBeforeGap}</span>-day run stands
            in the book.
            {f.shieldsRemaining > 0 && ' One shield remains; spent, it writes rest into the blank.'}
          </p>
          <div className="mt-3 flex gap-4">
            {f.shieldsRemaining > 0 && (
              <button
                type="button"
                onClick={() => setShieldSheetOpen(true)}
                className="ld-caps min-h-[40px] underline underline-offset-4"
                style={{ color: 'var(--accent)' }}
              >
                Spend the shield
              </button>
            )}
            <button
              type="button"
              onClick={() => setBreakDismissed(true)}
              className="ld-caps min-h-[40px]"
              style={{ color: 'var(--text-subtle)' }}
            >
              Leave the blank
            </button>
          </div>
        </section>
      )}

      {shieldUsed && (
        <p className="ld-settle mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Shield spent. Day {f.day - 1} reads rest; the run holds at{' '}
          <span className="tabular">{f.gap?.streakBeforeGap}</span>.
        </p>
      )}

      {f.id === 'day1' && (
        <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          A new book. {f.totalDays} lines to write, two marks to a line.
        </p>
      )}
      {f.id === 'day104Eve' && (
        <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          One line remains after today. Tomorrow the book closes on its first
          mission.
        </p>
      )}

      {/* ---- the ledger ---- */}
      <section className="mt-6">
        <div
          className="ld-line ld-caps !border-b-0 pb-1"
          style={{ color: 'var(--text-subtle)' }}
        >
          <span>No.</span>
          <span>Date</span>
          <span className="text-center">D</span>
          <span className="text-center">E</span>
          <span className="text-right">{f.weightUnit}</span>
        </div>
        <div className="ld-rule-t">
          {rows.map((row) =>
            row.kind === 'lapse' ? (
              <div
                key={`lapse-${row.from}`}
                className="ld-line"
                style={{ color: 'var(--text-subtle)' }}
              >
                <span className="tabular text-sm">
                  {row.from}–{row.to}
                </span>
                <span className="text-sm">unwritten · {row.count} days</span>
                <span className="ld-mark">·</span>
                <span className="ld-mark">·</span>
                <span />
              </div>
            ) : (
              <div key={row.day} className="ld-line">
                <span className="tabular text-sm" style={{ color: 'var(--text-muted)' }}>
                  {row.day}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {formatNice(row.date)}
                  {dayStatus(row.entry) === 'missed' && (
                    <span style={{ color: 'var(--text-subtle)' }}> · unwritten</span>
                  )}
                </span>
                <span className="ld-mark">
                  {markFor(row.entry?.diet, row.entry?.rest === true)}
                </span>
                <span className="ld-mark">
                  {markFor(row.entry?.exercise, row.entry?.rest === true)}
                </span>
                <span className="tabular text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                  {typeof row.entry?.weight === 'number' ? row.entry.weight : ''}
                </span>
              </div>
            ),
          )}
          {/* today's open line — fills in live as the strokes land */}
          <div className="ld-line ld-open">
            <span className="tabular text-sm font-medium">{f.day}</span>
            <span className="text-sm font-medium">today</span>
            <span className="ld-mark">{markFor(diet, rest)}</span>
            <span className="ld-mark">{markFor(exercise, rest)}</span>
            <span className="tabular text-right text-sm">
              {typeof weight === 'number' ? weight : ''}
            </span>
          </div>
        </div>
      </section>

      {/* ---- today's strokes ---- */}
      <section className="relative mt-6">
        <XpToast toast={toast} />
        <h2 className="ld-caps mb-2" style={{ color: 'var(--text-subtle)' }}>
          Today's marks
        </h2>
        {rest ? (
          <div className="ld-rule-t ld-rule-b py-4 text-center">
            <div className="ld-serif text-base">Rest day.</div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              Rest is part of the work.
            </div>
            <button
              type="button"
              onClick={() => setRest(false)}
              className="ld-caps mt-2 min-h-[36px]"
              style={{ color: 'var(--text-subtle)' }}
            >
              Undo rest
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <TodayRow
                label={f.pillarLabels.diet}
                xpReward={XP.diet}
                doneLabel="Marked"
                status={diet}
                onSuccess={() => confirmPillar('diet')}
                onFail={() => failPillar('diet')}
                onClear={() => setDiet(undefined)}
              />
              <TodayRow
                label={f.pillarLabels.exercise}
                xpReward={XP.exercise}
                doneLabel="Marked"
                status={exercise}
                onSuccess={() => confirmPillar('exercise')}
                onFail={() => failPillar('exercise')}
                onClear={() => setExercise(undefined)}
              />
            </div>
            <div className="mt-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setRest(true);
                  showUndo('Rest written into today', () => setRest(false));
                }}
                className="ld-caps min-h-[36px]"
                style={{ color: 'var(--text-subtle)' }}
              >
                Write rest instead
              </button>
            </div>
          </>
        )}
        {perfect && (
          <p className="ld-settle mt-3 text-sm" style={{ color: 'var(--text)' }}>
            <span className="ld-serif" aria-hidden>
              ※{' '}
            </span>
            Both marks today — a perfect day.{' '}
            <span className="tabular" style={{ color: 'var(--text-muted)' }}>
              +{XP.diet + XP.exercise + XP.perfectDayBonus} XP recorded.
            </span>
          </p>
        )}
      </section>

      {/* ---- the measure ---- */}
      <section className="mt-7">
        <MissionRing day={f.day} totalDays={f.totalDays} />
      </section>

      <section className="mt-6">
        <LevelBadge
          level={f.level.level}
          tier={f.tier}
          xpInLevel={f.level.xpInLevel}
          xpToNext={f.level.xpToNext}
        />
      </section>

      {/* ---- weight ---- */}
      <section className="mt-6">
        <h2 className="ld-caps mb-2" style={{ color: 'var(--text-subtle)' }}>
          Weight
        </h2>
        <WeightInput value={weight} unit={f.weightUnit} onChange={setWeight} />
        {f.lastWeight !== null && weight === undefined && (
          <p className="tabular mt-1.5 text-xs" style={{ color: 'var(--text-subtle)' }}>
            last entry {f.lastWeight} {f.weightUnit} · goal {f.goalWeight}
          </p>
        )}
      </section>

      <p
        className="ld-serif px-4 pb-6 pt-8 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        Yesterday is closed. Today is open.
      </p>

      <BottomNav />

      {/* ---- shield footnote sheet ---- */}
      <BottomSheet open={shieldSheetOpen} onClose={() => setShieldSheetOpen(false)}>
        <div className="px-6 pb-6 pt-5">
          <div className="ld-serif text-lg">Spend the shield on yesterday?</div>
          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Day {f.day - 1} will read rest. The {f.gap?.streakBeforeGap}-day run
            holds.
          </div>
          <div className="mt-5 flex gap-4">
            <button
              type="button"
              onClick={() => {
                setShieldSheetOpen(false);
                setShieldUsed(true);
                setBreakDismissed(true);
                showUndo('Shield spent on yesterday', () => setShieldUsed(false));
              }}
              className="ld-caps min-h-[44px] underline underline-offset-4"
              style={{ color: 'var(--accent)' }}
            >
              Spend it
            </button>
            <button
              type="button"
              onClick={() => setShieldSheetOpen(false)}
              className="ld-caps min-h-[44px]"
              style={{ color: 'var(--text-subtle)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </BottomSheet>

      <UndoToast entry={undo} />
    </div>
  );
}
