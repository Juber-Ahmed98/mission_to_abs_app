// Waypoint fork of the Journey page — Phase 3, the page the direction lives
// or dies on. The 105 days as an actual route: a serpentine trail through
// five stage-colored bands of country. Solid trail where days were logged,
// a dotted stretch where the record stops (visible, never scarlet), a faint
// plotted line ahead. Camp flags mark each stage's start, the summit flies
// at day 105, and a pin stands at today. Tapping a day opens the map panel;
// marking a missed stretch draws it onto the map — locally interactive with
// undo, zero store or localStorage writes.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { LabFixture } from '../../fixtures';
import type { DayStatus } from '../../../types';
import { addDaysISO, dayNumberFor, formatNice } from '../../../lib/date';
import { dayStatus } from '../../../lib/dayStatus';
import { stagesFor } from '../../../lib/stage';
import { XP, xpForDay } from '../../../lib/xp';
import BottomNav from './BottomNav';
import BottomSheet from './BottomSheet';
import XpToast, { type Toast } from './XpToast';
import UndoToast, { type UndoEntry } from './UndoToast';
import './waypoint.css';

const PER_ROW = 7;
const X_PAD = 24;
const VIEW_W = 360;
const ROW_SPACING = 34;
/** Extra breathing room above each stage's first row — the band boundary. */
const STAGE_GAP = 26;
const Y_TOP = 34;
const Y_BOTTOM = 26;

const STAGE_VAR = ['--wp-s0', '--wp-s1', '--wp-s2', '--wp-s3', '--wp-s4'];
const STAGE_SOFT_VAR = [
  '--wp-s0-soft',
  '--wp-s1-soft',
  '--wp-s2-soft',
  '--wp-s3-soft',
  '--wp-s4-soft',
];

type MarkKind = 'perfect' | 'fail' | 'rest';

type TrailNode = {
  dayNum: number;
  date: string;
  x: number;
  y: number;
  row: number;
};

function trailWord(status: DayStatus): string {
  switch (status) {
    case 'perfect':
      return 'walked, both pillars';
    case 'partial':
      return 'walked, one pillar';
    case 'failed':
      return 'rough ground';
    case 'rest':
      return 'camp day';
    default:
      return 'unrecorded';
  }
}

export default function Journey({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  const [selected, setSelected] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, MarkKind>>({});
  const [toast, setToast] = useState<Toast | null>(null);
  const [undo, setUndo] = useState<UndoEntry | null>(null);

  useEffect(() => {
    setSelected(null);
    setOverrides({});
    setToast(null);
    setUndo(null);
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

  const stages = useMemo(() => stagesFor(f.totalDays), [f.totalDays]);
  const stageIndexOfDay = (d: number) =>
    stages.find((s) => d >= s.startDay && d <= s.endDay)?.index ?? 0;
  const hueOf = (d: number) => `var(${STAGE_VAR[stageIndexOfDay(d)]})`;

  const statusOf = (date: string): DayStatus => {
    const o = overrides[date];
    if (o === 'perfect') return 'perfect';
    if (o === 'fail') return 'failed';
    if (o === 'rest') return 'rest';
    return dayStatus(f.days[date]);
  };

  // ---- geometry: serpentine rows, a band gap where a new stage begins ----
  const rows = Math.max(1, Math.ceil(f.totalDays / PER_ROW));
  const spacingX = (VIEW_W - 2 * X_PAD) / (PER_ROW - 1);

  const { nodes, rowYs, viewH } = useMemo(() => {
    const stageOfRow = (row: number) => {
      const firstDay = row * PER_ROW + 1;
      return (
        stages.find((s) => firstDay >= s.startDay && firstDay <= s.endDay)
          ?.index ?? stages.length - 1
      );
    };
    const ys: number[] = [];
    for (let r = 0; r < rows; r += 1) {
      ys.push(Y_TOP + r * ROW_SPACING + stageOfRow(r) * STAGE_GAP);
    }
    const arr: TrailNode[] = [];
    for (let i = 0; i < f.totalDays; i += 1) {
      const row = Math.floor(i / PER_ROW);
      const colInRow = i % PER_ROW;
      const col = row % 2 === 1 ? PER_ROW - 1 - colInRow : colInRow;
      arr.push({
        dayNum: i + 1,
        date: addDaysISO(f.startDate, i),
        x: X_PAD + col * spacingX,
        y: ys[row],
        row,
      });
    }
    return { nodes: arr, rowYs: ys, viewH: ys[rows - 1] + Y_BOTTOM };
  }, [f.startDate, f.totalDays, rows, spacingX, stages]);

  const bands = useMemo(
    () =>
      stages.map((s) => {
        const firstRow = Math.floor((s.startDay - 1) / PER_ROW);
        const lastRow = Math.floor((s.endDay - 1) / PER_ROW);
        const top = rowYs[firstRow] - 26;
        return {
          stage: s,
          top,
          height: rowYs[lastRow] + 16 - top,
          side: firstRow % 2 === 1 ? ('right' as const) : ('left' as const),
        };
      }),
    [stages, rowYs],
  );

  /** One path per day walked into — so each stretch can be solid, dotted, or
   * plotted-ahead independently, and the lapse reads as a literal dotted
   * stretch of trail. */
  const segs = useMemo(() => {
    const list: { d: number; date: string; path: string }[] = [];
    for (let d = 2; d <= f.totalDays; d += 1) {
      const a = nodes[d - 2];
      const b = nodes[d - 1];
      let path: string;
      if (a.row === b.row) {
        path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      } else {
        const dy = b.y - a.y;
        const bulgeDir = a.row % 2 === 1 ? -1 : 1;
        const cx = a.x + bulgeDir * dy * 0.55;
        path = `M ${a.x} ${a.y} Q ${cx} ${(a.y + b.y) / 2} ${b.x} ${b.y}`;
      }
      list.push({ d, date: b.date, path });
    }
    return list;
  }, [nodes, f.totalDays]);

  const summitNode = nodes[f.totalDays - 1];
  const summitDir = summitNode.x > VIEW_W / 2 ? -1 : 1;

  const context = useMemo(() => {
    if (f.gap && f.gap.gapDays >= 2)
      return `Camp was Day ${f.gap.lastLoggedDay} — the dotted stretch is behind you, ${f.totalDays - f.day} days to the summit.`;
    if (f.id === 'day1')
      return "Trailhead. The whole route is plotted; the first mark is today's log.";
    if (f.id === 'day104Eve') return 'One camp left. The summit is tomorrow.';
    return `Stage ${(f.stage?.index ?? 0) + 1} of ${stages.length} · ${f.stage?.name ?? ''} country · ${f.totalDays - f.day} days to the summit.`;
  }, [f, stages.length]);

  const mark = (date: string, kind: MarkKind) => {
    const dayNum = Math.max(1, dayNumberFor(date, f.startDate));
    setOverrides((o) => ({ ...o, [date]: kind }));
    setSelected(null);
    if (kind === 'perfect')
      fireToast(XP.diet + XP.exercise + XP.perfectDayBonus, 'Stretch drawn in');
    if (kind === 'rest') fireToast(XP.rest);
    const verb =
      kind === 'perfect'
        ? 'marked walked'
        : kind === 'rest'
          ? 'marked a camp day'
          : 'marked rough ground';
    showUndo(`Day ${dayNum} ${verb}`, () =>
      setOverrides((o) => {
        const next = { ...o };
        delete next[date];
        return next;
      }),
    );
  };

  /** Facts for the map panel, honoring lab-local marks. */
  const entryFacts = (date: string) => {
    const o = overrides[date];
    if (o === 'perfect')
      return {
        diet: 'success' as const,
        exercise: 'success' as const,
        rest: false,
        weight: undefined,
        xp: XP.diet + XP.exercise + XP.perfectDayBonus,
      };
    if (o === 'fail')
      return {
        diet: 'fail' as const,
        exercise: 'fail' as const,
        rest: false,
        weight: undefined,
        xp: 0,
      };
    if (o === 'rest')
      return { diet: undefined, exercise: undefined, rest: true, weight: undefined, xp: XP.rest };
    const e = f.days[date];
    return {
      diet: e?.diet,
      exercise: e?.exercise,
      rest: e?.rest === true,
      weight: e?.weight,
      xp: xpForDay(e),
    };
  };

  return (
    <div
      className={`dir-waypoint wp-stage-${f.stage?.index ?? 0} relative flex min-h-[760px] flex-col`}
    >
      {/* ---- header on faint contours ---- */}
      <div className="wp-contours">
        <header className="px-5 pb-4 pt-6">
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Journey
          </div>
          <div className="mt-1 flex items-center justify-between">
            <h1 className="tabular text-3xl font-bold leading-tight">
              {f.totalDays} days
            </h1>
            {f.stage && (
              <span
                className="rounded-pill px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                style={{ background: 'var(--stage-soft)', color: 'var(--stage)' }}
              >
                {f.stage.name} · {f.stage.startDay}–{f.stage.endDay}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {context}
          </p>
        </header>
      </div>

      {/* ---- the map ---- */}
      <section className="relative mx-4">
        <XpToast toast={toast} />
        <div className="wp-panel px-1.5 py-2">
          <svg
            viewBox={`0 0 ${VIEW_W} ${viewH}`}
            className="block w-full"
            style={{ overflow: 'visible' }}
          >
            {/* stage bands — the five countries */}
            {bands.map(({ stage: s, top, height }) => (
              <rect
                key={s.index}
                x={6}
                y={top}
                width={VIEW_W - 12}
                height={height}
                rx={14}
                fill={`var(${STAGE_SOFT_VAR[s.index]})`}
                opacity={s.index === f.stage?.index ? 0.6 : 0.35}
              />
            ))}

            {/* camp flags + stage names at each band's start */}
            {bands.map(({ stage: s, top, side }) => {
              const inward = side === 'right' ? -1 : 1;
              const poleX = side === 'right' ? VIEW_W - 16 : 16;
              const baseY = top + 19;
              const hue = `var(${STAGE_VAR[s.index]})`;
              return (
                <g key={s.index} aria-hidden>
                  <line
                    x1={poleX}
                    y1={baseY}
                    x2={poleX}
                    y2={baseY - 12}
                    stroke={hue}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${poleX} ${baseY - 12} L ${poleX + inward * 7} ${baseY - 9.5} L ${poleX} ${baseY - 7} Z`}
                    fill={hue}
                  />
                  <text
                    x={poleX + inward * 11}
                    y={baseY - 2}
                    textAnchor={side === 'right' ? 'end' : 'start'}
                    fill={hue}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.name} · {s.startDay}–{s.endDay}
                  </text>
                </g>
              );
            })}

            {/* the trail, stretch by stretch */}
            {segs.map(({ d, date, path }) => {
              if (d > f.day)
                return (
                  <path
                    key={d}
                    d={path}
                    fill="none"
                    stroke="var(--wp-track)"
                    strokeWidth={2}
                    strokeDasharray="4 6"
                  />
                );
              const status = statusOf(date);
              if (status === 'missed')
                return (
                  <path
                    key={d}
                    d={path}
                    fill="none"
                    stroke="var(--border-strong)"
                    strokeWidth={2.25}
                    strokeDasharray="0.1 7"
                    strokeLinecap="round"
                  />
                );
              return (
                <path
                  key={d}
                  d={path}
                  fill="none"
                  stroke={status === 'failed' ? 'var(--border-strong)' : hueOf(d)}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* summit flag at the last day */}
            <g aria-hidden>
              <line
                x1={summitNode.x}
                y1={summitNode.y - 3}
                x2={summitNode.x}
                y2={summitNode.y - 16}
                stroke={`var(${STAGE_VAR[stages.length - 1]})`}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <path
                d={`M ${summitNode.x} ${summitNode.y - 16} L ${summitNode.x + summitDir * 9} ${summitNode.y - 12.5} L ${summitNode.x} ${summitNode.y - 9} Z`}
                fill={`var(${STAGE_VAR[stages.length - 1]})`}
              />
            </g>

            {/* the days */}
            {nodes.map((node) => {
              const isFuture = node.dayNum > f.day;
              const isToday = node.dayNum === f.day;
              const status = isFuture ? null : statusOf(node.date);
              const hue = hueOf(node.dayNum);
              const isCamp =
                !!f.gap && f.gap.gapDays >= 2 && node.dayNum === f.gap.lastLoggedDay;

              if (isFuture && !isToday)
                return (
                  <circle
                    key={node.date}
                    cx={node.x}
                    cy={node.y}
                    r={2}
                    fill="var(--wp-track)"
                  />
                );

              const ariaLabel = `Day ${node.dayNum}, ${
                isToday ? 'today' : trailWord(status ?? 'missed')
              }`;
              const handleSelect = () => setSelected(node.date);
              const handleKey = (e: KeyboardEvent<SVGGElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect();
                }
              };

              return (
                <g
                  key={node.date}
                  role="button"
                  tabIndex={0}
                  aria-label={ariaLabel}
                  onClick={handleSelect}
                  onKeyDown={handleKey}
                  className="group focus:outline-none"
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  <title>{`Day ${node.dayNum}${isToday ? ' (today)' : ''}`}</title>

                  {/* the last logged day before a lapse — camp */}
                  {isCamp && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={8.5}
                      fill="none"
                      stroke={hue}
                      strokeWidth={1.25}
                      strokeDasharray="2.5 3"
                    />
                  )}

                  {isToday ? (
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={10}
                        fill="var(--stage)"
                        opacity={0.25}
                        className="animate-ring-pulse"
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                      />
                      <g transform={`translate(${node.x}, ${node.y})`}>
                        <path
                          d="M 0 1.5 C -4.6 -3.2 -7 -6.4 -7 -9.6 A 7 7 0 1 1 7 -9.6 C 7 -6.4 4.6 -3.2 0 1.5 Z"
                          fill="var(--stage)"
                          stroke="var(--surface)"
                          strokeWidth={1}
                        />
                        <circle cy={-9.6} r={2.4} fill="var(--surface)" />
                      </g>
                    </>
                  ) : status === 'rest' ? (
                    <path
                      d={`M ${node.x - 5.5} ${node.y + 3.5} L ${node.x} ${node.y - 5} L ${node.x + 5.5} ${node.y + 3.5} Z`}
                      fill={`var(${STAGE_SOFT_VAR[stageIndexOfDay(node.dayNum)]})`}
                      stroke={hue}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                    />
                  ) : status === 'missed' ? (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={2}
                      fill="none"
                      stroke="var(--border-strong)"
                      strokeWidth={1.25}
                    />
                  ) : (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={status === 'failed' ? 4 : 4.5}
                      fill={status === 'failed' ? 'var(--border-strong)' : hue}
                      opacity={status === 'partial' ? 0.55 : 1}
                    />
                  )}

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.dayNum === f.day ? 12 : 7}
                    fill="none"
                    stroke="var(--stage)"
                    strokeWidth={2}
                    className="opacity-0 group-focus-visible:opacity-100"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle cx={node.x} cy={node.y} r={16} fill="transparent" />
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* ---- legend, in route texture ---- */}
      <section
        className="mx-5 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <LegendItem label="Walked">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--stage)" strokeWidth={3} strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Unrecorded">
          <line x1={2} y1={5} x2={17} y2={5} stroke="var(--border-strong)" strokeWidth={2.25} strokeDasharray="0.1 5.5" strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Rough ground">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--border-strong)" strokeWidth={3} strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Camp">
          <path d="M 4 8.5 L 9 1.5 L 14 8.5 Z" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth={1.5} strokeLinejoin="round" />
        </LegendItem>
        <LegendItem label="Ahead">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--wp-track)" strokeWidth={2.5} strokeDasharray="4 4" />
        </LegendItem>
        <LegendItem label="You">
          <circle cx={9} cy={5} r={4} fill="var(--stage)" />
          <circle cx={9} cy={5} r={1.6} fill="var(--surface)" />
        </LegendItem>
      </section>

      <div
        className="px-5 pb-6 pt-6 text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {f.gap && f.gap.gapDays >= 2
          ? 'Every unrecorded stretch can still be drawn in. The route never left the map.'
          : 'The map fills in one stretch at a time.'}
      </div>

      <BottomNav active={1} />

      {/* ---- the map panel: one day, up close ---- */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected &&
          (() => {
            const dNum = Math.max(1, dayNumberFor(selected, f.startDate));
            const st = statusOf(selected);
            const sIdx = stageIndexOfDay(dNum);
            const facts = entryFacts(selected);
            const isToday = selected === f.today;
            const pillarWord = (p: 'success' | 'fail' | undefined) =>
              p === 'success' ? 'walked' : p === 'fail' ? 'rough' : '—';
            return (
              <div className="px-5 pb-5 pt-2">
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatNice(selected)}
                  {isToday ? ' · today' : ''}
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <div className="tabular text-lg font-bold">Day {dNum}</div>
                  <span
                    className="rounded-pill px-2.5 py-1 text-2xs font-bold uppercase tracking-wide"
                    style={{
                      background: `var(${STAGE_SOFT_VAR[sIdx]})`,
                      color: `var(${STAGE_VAR[sIdx]})`,
                    }}
                  >
                    {stages[sIdx].name}
                  </span>
                </div>

                {st === 'missed' ? (
                  <>
                    <p
                      className="mt-3 text-sm leading-relaxed"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      This stretch is unrecorded — the trail was under your feet
                      either way. Mark it as it was.
                    </p>
                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => mark(selected, 'perfect')}
                        className="flex h-11 items-center justify-between rounded-card px-4 text-sm font-bold"
                        style={{ background: 'var(--stage)', color: 'var(--surface)' }}
                      >
                        <span>Walked it — both pillars</span>
                        <span className="tabular text-xs font-bold opacity-80">
                          +{XP.diet + XP.exercise + XP.perfectDayBonus} XP
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(selected, 'rest')}
                        className="flex h-11 items-center justify-between rounded-card border px-4 text-sm font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <span>Camp day</span>
                        <span
                          className="tabular text-xs font-semibold"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          +{XP.rest} XP
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(selected, 'fail')}
                        className="flex h-11 items-center justify-between rounded-card border px-4 text-sm font-medium"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      >
                        <span>Rough ground</span>
                      </button>
                    </div>
                    <p className="mt-3 text-xs" style={{ color: 'var(--text-subtle)' }}>
                      Rough ground marks as easily as a walked day — the map stays
                      honest either way.
                    </p>
                  </>
                ) : (
                  <div className="mt-3">
                    <FactRow label="Trail reads" value={trailWord(st)} />
                    {facts.rest ? (
                      <p
                        className="py-2 text-sm leading-relaxed"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Camp pitched — resting is still being on the trail.
                      </p>
                    ) : (
                      <>
                        <FactRow label={f.pillarLabels.diet} value={pillarWord(facts.diet)} />
                        <FactRow
                          label={f.pillarLabels.exercise}
                          value={pillarWord(facts.exercise)}
                        />
                      </>
                    )}
                    {typeof facts.weight === 'number' && (
                      <FactRow
                        label="Weight reading"
                        value={`${facts.weight} ${f.weightUnit}`}
                      />
                    )}
                    <FactRow label="XP" value={`+${facts.xp}`} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-5 h-11 w-full rounded-card text-sm font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                >
                  Done
                </button>
              </div>
            );
          })()}
      </BottomSheet>

      <UndoToast entry={undo} />
    </div>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width={18} height={10} viewBox="0 0 18 10" aria-hidden>
        {children}
      </svg>
      {label}
    </span>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <span style={{ color: 'var(--text-subtle)' }}>{label}</span>
      <span className="tabular text-right font-medium">{value}</span>
    </div>
  );
}
