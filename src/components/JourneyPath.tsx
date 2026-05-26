import { useMemo, type KeyboardEvent } from 'react';
import { stagesFor } from '../lib/stage';
import { dayStatus } from '../lib/dayStatus';
import type { DayEntry, DayStatus } from '../types';
import { addDaysISO } from '../lib/date';
import { useIsNarrow } from '../lib/viewport';

type Props = {
  startDate: string;
  totalDays: number;
  today: string;
  days: Record<string, DayEntry>;
  onSelect: (date: string) => void;
};

const DESKTOP_ROWS = 5;
const NARROW_PER_ROW = 7;
const NARROW_ROW_SPACING = 32;
const X_PAD = 22;
const Y_PAD = 32;
const VIEW_W = 360;
const DESKTOP_VIEW_H = 240;

type JourneyNode = {
  dayNum: number;
  date: string;
  x: number;
  y: number;
  row: number;
};

function statusGlyph(status: DayStatus): string | null {
  switch (status) {
    case 'perfect':
      return '✓';
    case 'partial':
      return '~';
    case 'failed':
      return '✗';
    case 'rest':
      return '☾';
    default:
      return null;
  }
}

function statusLabel(
  status: DayStatus | null,
  isFuture: boolean,
  isToday: boolean,
): string {
  if (isToday) return 'today';
  if (isFuture) return 'future';
  return status ?? 'missed';
}

export default function JourneyPath({
  startDate,
  totalDays,
  today,
  days,
  onSelect,
}: Props) {
  const isNarrow = useIsNarrow();
  const stages = useMemo(() => stagesFor(totalDays), [totalDays]);
  const rows = isNarrow
    ? Math.max(1, Math.ceil(totalDays / NARROW_PER_ROW))
    : DESKTOP_ROWS;
  const perRow = isNarrow
    ? NARROW_PER_ROW
    : Math.max(1, Math.ceil(totalDays / rows));
  const VIEW_H = isNarrow
    ? 2 * Y_PAD + Math.max(0, rows - 1) * NARROW_ROW_SPACING
    : DESKTOP_VIEW_H;
  const spacingX = perRow > 1 ? (VIEW_W - 2 * X_PAD) / (perRow - 1) : 0;
  const spacingY = rows > 1 ? (VIEW_H - 2 * Y_PAD) / (rows - 1) : 0;

  const nodes = useMemo<JourneyNode[]>(() => {
    const arr: JourneyNode[] = [];
    for (let i = 0; i < totalDays; i += 1) {
      const row = Math.floor(i / perRow);
      const colInRow = i % perRow;
      const reverse = row % 2 === 1;
      const col = reverse ? perRow - 1 - colInRow : colInRow;
      arr.push({
        dayNum: i + 1,
        date: addDaysISO(startDate, i),
        x: X_PAD + col * spacingX,
        y: Y_PAD + row * spacingY,
        row,
      });
    }
    return arr;
  }, [startDate, totalDays, perRow, spacingX, spacingY]);

  const todayIdx = useMemo(() => {
    if (nodes.length === 0) return -1;
    if (today < nodes[0].date) return -1;
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].date === today) return i;
      if (nodes[i].date > today) return i - 1;
    }
    return nodes.length - 1;
  }, [nodes, today]);

  const { pastPathD, futurePathD } = useMemo(() => {
    if (nodes.length === 0) return { pastPathD: '', futurePathD: '' };
    const pastParts: string[] = [];
    const futureParts: string[] = [];
    let pastStarted = false;

    const startPast = (n: JourneyNode) => {
      if (!pastStarted) {
        pastParts.push(`M ${n.x} ${n.y}`);
        pastStarted = true;
      }
    };
    const startFuture = (n: JourneyNode) => {
      if (futureParts.length === 0) {
        futureParts.push(`M ${n.x} ${n.y}`);
      }
    };

    for (let row = 0; row < rows; row += 1) {
      const rowStartIdx = row * perRow;
      const rowEndIdx = Math.min(totalDays - 1, (row + 1) * perRow - 1);
      if (rowStartIdx > totalDays - 1) break;
      const rowStartNode = nodes[rowStartIdx];
      const rowEndNode = nodes[rowEndIdx];
      const nextRowStartIdx = (row + 1) * perRow;
      const nextStart =
        nextRowStartIdx <= totalDays - 1 ? nodes[nextRowStartIdx] : null;

      let pivotStr = '';
      if (nextStart) {
        const reverse = row % 2 === 1;
        const bulgeDir = reverse ? -1 : 1;
        const bulgeMagnitude = spacingY * 0.6;
        const controlX = rowEndNode.x + bulgeDir * bulgeMagnitude;
        const controlY = (rowEndNode.y + nextStart.y) / 2;
        pivotStr = `Q ${controlX} ${controlY} ${nextStart.x} ${nextStart.y}`;
      }

      if (todayIdx >= rowEndIdx) {
        startPast(rowStartNode);
        pastParts.push(`L ${rowEndNode.x} ${rowEndNode.y}`);
        if (nextStart) {
          if (todayIdx >= nextRowStartIdx) {
            pastParts.push(pivotStr);
          } else {
            startFuture(rowEndNode);
            futureParts.push(pivotStr);
          }
        }
      } else if (todayIdx < rowStartIdx) {
        startFuture(rowStartNode);
        futureParts.push(`L ${rowEndNode.x} ${rowEndNode.y}`);
        if (pivotStr) futureParts.push(pivotStr);
      } else {
        const todayNode = nodes[todayIdx];
        if (todayIdx > rowStartIdx) {
          startPast(rowStartNode);
          pastParts.push(`L ${todayNode.x} ${todayNode.y}`);
        }
        startFuture(todayNode);
        futureParts.push(`L ${rowEndNode.x} ${rowEndNode.y}`);
        if (pivotStr) futureParts.push(pivotStr);
      }
    }

    return {
      pastPathD: pastParts.join(' '),
      futurePathD: futureParts.join(' '),
    };
  }, [nodes, perRow, rows, totalDays, spacingY, todayIdx]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block w-full"
        style={{ overflow: 'visible' }}
      >
        {futurePathD && (
          <path
            d={futurePathD}
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pastPathD && (
          <path
            d={pastPathD}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {stages.map((stage, i) => {
          const reverse = i % 2 === 1;
          const startNode = nodes[stage.startDay - 1];
          if (!startNode) return null;
          return (
            <text
              key={stage.index}
              x={reverse ? VIEW_W - X_PAD + 4 : X_PAD - 4}
              y={startNode.y - 14}
              textAnchor={reverse ? 'end' : 'start'}
              fill="var(--text-muted)"
              style={{
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {stage.name}
            </text>
          );
        })}

        {nodes.map((node) => {
          const isFuture = node.date > today;
          const isToday = node.date === today;
          const entry = days[node.date];
          const status = isFuture ? null : dayStatus(entry);
          const fill = isToday
            ? 'var(--tangerine)'
            : status === 'perfect'
              ? 'var(--lime)'
              : status === 'rest'
                ? 'var(--lemon)'
                : status === 'partial'
                  ? 'var(--tangerine)'
                  : status === 'failed'
                    ? 'var(--coral)'
                    : status === 'missed'
                      ? 'var(--missed)'
                      : 'transparent';
          const r = isToday ? 7 : isFuture ? 3.5 : status === 'missed' ? 4 : 5;
          const hitR = Math.max(22, r + 12);
          const showGlyph =
            !isFuture &&
            !isToday &&
            status !== null &&
            status !== 'missed' &&
            r >= 5;
          const glyph = showGlyph ? statusGlyph(status) : null;
          const hasNotes = !!entry?.notes?.trim();
          const ariaLabel = `Day ${node.dayNum}, ${statusLabel(status, isFuture, isToday)}`;
          const handleSelect = () => {
            if (!isFuture) onSelect(node.date);
          };
          const handleKey = (e: KeyboardEvent<SVGGElement>) => {
            if (isFuture) return;
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
              style={{
                cursor: isFuture ? 'default' : 'pointer',
                outline: 'none',
              }}
            >
              <title>{`Day ${node.dayNum}${isToday ? ' (today)' : ''}`}</title>
              {isToday && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={11}
                  fill="var(--tangerine)"
                  opacity={0.25}
                  className="animate-ring-pulse"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={isFuture ? 'transparent' : fill}
                stroke={isFuture ? 'var(--border-strong)' : 'none'}
                strokeWidth={1.5}
              />
              {glyph && (
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  opacity={0.85}
                  style={{
                    fontSize: 7,
                    fontWeight: 700,
                    pointerEvents: 'none',
                  }}
                >
                  {glyph}
                </text>
              )}
              {hasNotes && !isFuture && (
                <circle
                  cx={node.x + r * 0.75}
                  cy={node.y - r * 0.75}
                  r={1.5}
                  fill="var(--accent)"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r + 5}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
                className="opacity-0 group-focus-visible:opacity-100"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={hitR}
                fill="transparent"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
