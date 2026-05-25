import { useMemo } from 'react';
import { stagesFor } from '../lib/stage';
import { dayStatus } from '../lib/dayStatus';
import type { DayEntry } from '../types';
import { addDaysISO } from '../lib/date';

type Props = {
  startDate: string;
  totalDays: number;
  today: string;
  days: Record<string, DayEntry>;
  onSelect: (date: string) => void;
};

const ROWS = 5;
const X_PAD = 22;
const Y_PAD = 32;
const VIEW_W = 360;
const VIEW_H = 240;

type Node = {
  dayNum: number;
  date: string;
  x: number;
  y: number;
  row: number;
};

export default function JourneyPath({
  startDate,
  totalDays,
  today,
  days,
  onSelect,
}: Props) {
  const stages = useMemo(() => stagesFor(totalDays), [totalDays]);
  const perRow = Math.max(1, Math.ceil(totalDays / ROWS));
  const spacingX = perRow > 1 ? (VIEW_W - 2 * X_PAD) / (perRow - 1) : 0;
  const spacingY = ROWS > 1 ? (VIEW_H - 2 * Y_PAD) / (ROWS - 1) : 0;

  const nodes = useMemo<Node[]>(() => {
    const arr: Node[] = [];
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

  const pathD = useMemo(() => {
    if (nodes.length === 0) return '';
    const parts: string[] = [];
    for (let row = 0; row < ROWS; row += 1) {
      const startIdx = row * perRow;
      const endIdx = Math.min(totalDays - 1, (row + 1) * perRow - 1);
      if (startIdx > totalDays - 1) break;
      const startNode = nodes[startIdx];
      const endNode = nodes[endIdx];
      if (row === 0) parts.push(`M ${startNode.x} ${startNode.y}`);
      parts.push(`L ${endNode.x} ${endNode.y}`);
      const nextStartIdx = (row + 1) * perRow;
      if (nextStartIdx <= totalDays - 1) {
        const next = nodes[nextStartIdx];
        parts.push(`L ${next.x} ${next.y}`);
      }
    }
    return parts.join(' ');
  }, [nodes, perRow, totalDays]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="block w-full"
        style={{ overflow: 'visible' }}
      >
        <path
          d={pathD}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

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
              fill="var(--text-subtle)"
              style={{
                fontSize: 9,
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
              : status === 'partial'
                ? 'var(--tangerine)'
                : status === 'failed'
                  ? 'var(--coral)'
                  : status === 'missed'
                    ? 'var(--missed)'
                    : 'transparent';
          const r = isToday ? 7 : isFuture ? 3.5 : status === 'missed' ? 4 : 5;

          return (
            <g key={node.date}>
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
              <circle
                cx={node.x}
                cy={node.y}
                r={Math.max(10, r + 6)}
                fill="transparent"
                style={{ cursor: isFuture ? 'default' : 'pointer' }}
                onClick={() => {
                  if (!isFuture) onSelect(node.date);
                }}
              >
                <title>{`Day ${node.dayNum}${isToday ? ' (today)' : ''}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
