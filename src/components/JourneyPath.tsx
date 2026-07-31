// The Journey map (DESIGN.md · Journey page): the mission as an actual route —
// a serpentine trail, 7 days per row, through five stage-colored bands of
// country. Solid stretches where days were walked, a literal dotted stretch
// where the record stops (visible, never scarlet), a faint plotted line ahead.
// Camp flags open each band, the summit flies at the last day, a pin stands at
// today, and during a lapse the last-logged day wears the dashed camp ring.

import { useMemo, type KeyboardEvent } from 'react';
import { stagesFor } from '../lib/stage';
import { dayStatus } from '../lib/dayStatus';
import type { DayEntry, DayStatus } from '../types';
import { addDaysISO } from '../lib/date';

type Props = {
  startDate: string;
  totalDays: number;
  today: string;
  days: Record<string, DayEntry>;
  onSelect: (date: string) => void;
  /** Last genuinely-logged day during a lapse — wears the dashed camp ring. */
  campDate?: string | null;
  /** Where the pin stands. Defaults to today; pre-mission passes day 1 so the
   * pin waits at the trailhead. */
  pinDate?: string;
};

const PER_ROW = 7;
const X_PAD = 24;
const VIEW_W = 360;
const ROW_SPACING = 34;
/** Extra breathing room above each stage's first row — the band boundary. */
const STAGE_GAP = 26;
const Y_TOP = 34;
const Y_BOTTOM = 26;
/** ≥44px CSS at the 375px reference frame (the SVG scales with its panel). */
const HIT_R = 25;

const STAGE_VAR = ['--stage-0', '--stage-1', '--stage-2', '--stage-3', '--stage-4'];
const STAGE_SOFT_VAR = [
  '--stage-0-soft',
  '--stage-1-soft',
  '--stage-2-soft',
  '--stage-3-soft',
  '--stage-4-soft',
];

type TrailNode = {
  dayNum: number;
  date: string;
  x: number;
  y: number;
  row: number;
};

/** How the trail reads a day's status (DESIGN.md · Day status logic). */
export function trailWord(status: DayStatus): string {
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

export default function JourneyPath({
  startDate,
  totalDays,
  today,
  days,
  onSelect,
  campDate = null,
  pinDate,
}: Props) {
  const pin = pinDate ?? today;
  const stages = useMemo(() => stagesFor(totalDays), [totalDays]);
  const stageIndexOfDay = (d: number) =>
    stages.find((s) => d >= s.startDay && d <= s.endDay)?.index ?? stages.length - 1;
  const hueOf = (d: number) => `var(${STAGE_VAR[stageIndexOfDay(d)]})`;

  // ---- geometry: serpentine rows, a band gap where a new stage begins ----
  const rows = Math.max(1, Math.ceil(totalDays / PER_ROW));
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
    for (let i = 0; i < totalDays; i += 1) {
      const row = Math.floor(i / PER_ROW);
      const colInRow = i % PER_ROW;
      const col = row % 2 === 1 ? PER_ROW - 1 - colInRow : colInRow;
      arr.push({
        dayNum: i + 1,
        date: addDaysISO(startDate, i),
        x: X_PAD + col * spacingX,
        y: ys[row],
        row,
      });
    }
    return { nodes: arr, rowYs: ys, viewH: ys[rows - 1] + Y_BOTTOM };
  }, [startDate, totalDays, rows, spacingX, stages]);

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
    for (let d = 2; d <= totalDays; d += 1) {
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
  }, [nodes, totalDays]);

  const currentStageIdx = stageIndexOfDay(
    Math.max(1, Math.min(totalDays, nodes.filter((n) => n.date <= today).length)),
  );
  const summitNode = nodes[totalDays - 1];
  const summitDir = summitNode.x > VIEW_W / 2 ? -1 : 1;

  return (
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
          opacity={s.index === currentStageIdx ? 0.6 : 0.35}
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
        if (date > today)
          return (
            <path
              key={d}
              d={path}
              fill="none"
              stroke="var(--track)"
              strokeWidth={2}
              strokeDasharray="4 6"
            />
          );
        const status = dayStatus(days[date]);
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
        const isPin = node.date === pin;
        const interactive = node.date <= today;
        const status = interactive ? dayStatus(days[node.date]) : null;
        const hue = hueOf(node.dayNum);
        const isCamp = !!campDate && node.date === campDate;

        // Ahead: a faint plotted dot, not a control.
        if (!interactive && !isPin)
          return (
            <circle
              key={node.date}
              cx={node.x}
              cy={node.y}
              r={2}
              fill="var(--track)"
            />
          );

        const mark = isPin ? (
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
        );

        // The pre-mission pin waits at the trailhead but isn't a control yet.
        if (!interactive)
          return (
            <g key={node.date} aria-hidden>
              {mark}
            </g>
          );

        const ariaLabel = `Day ${node.dayNum}, ${
          isPin ? 'today' : trailWord(status ?? 'missed')
        }`;
        const handleSelect = () => onSelect(node.date);
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
            <title>{`Day ${node.dayNum}${isPin ? ' (today)' : ''}`}</title>

            {/* the last logged day before a lapse — camp, marked on the map */}
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

            {mark}

            <circle
              cx={node.x}
              cy={node.y}
              r={isPin ? 12 : 7}
              fill="none"
              stroke="var(--stage)"
              strokeWidth={2}
              className="opacity-0 group-focus-visible:opacity-100"
              style={{ pointerEvents: 'none' }}
            />
            <circle cx={node.x} cy={node.y} r={HIT_R} fill="transparent" />
          </g>
        );
      })}
    </svg>
  );
}
