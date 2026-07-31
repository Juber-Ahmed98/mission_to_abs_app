// The walk strip (DESIGN.md · Core components). No dial: the 105 days laid
// out as a walked route, colored by the stage they were walked in. Unrecorded
// days are a dotted stretch — visible, never scarlet. A pin stands at today,
// and the stage ruler below names the five countries.

import { MapPin } from 'lucide-react';
import type { DayEntry } from '../types';
import { addDaysISO } from '../lib/date';
import { dayStatus } from '../lib/dayStatus';
import { stagesFor } from '../lib/stage';

type Props = {
  day: number;
  totalDays: number;
  days: Record<string, DayEntry>;
  startDate: string;
  /** Live status for today, so the strip fills in as you log. */
  todayStatus?: 'logged' | 'empty';
};

const STAGE_VAR = ['--stage-0', '--stage-1', '--stage-2', '--stage-3', '--stage-4'];

export default function MissionRing({
  day,
  totalDays,
  days,
  startDate,
  todayStatus = 'empty',
}: Props) {
  const stages = stagesFor(totalDays);
  const stageOf = (d: number) => stages.find((s) => d >= s.startDay && d <= s.endDay);

  const segs = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const hue = `var(${STAGE_VAR[stageOf(d)?.index ?? 0]})`;
    const base = 'h-1.5 flex-1 rounded-sm';
    if (d > day) return { key: d, cls: `${base} bg-track`, style: {} };
    if (d === day) {
      return {
        key: d,
        cls: base,
        style: {
          background: todayStatus === 'logged' ? hue : 'var(--track)',
          outline: `2px solid ${hue}`,
          outlineOffset: '1px',
        } as React.CSSProperties,
      };
    }
    const status = dayStatus(days[addDaysISO(startDate, d - 1)]);
    if (status === 'missed')
      return {
        key: d,
        cls: 'h-0 flex-1 rounded-none border-b-2 border-dotted border-border-strong',
        style: {},
      };
    if (status === 'failed')
      return { key: d, cls: `${base} bg-border-strong`, style: {} };
    return { key: d, cls: base, style: { background: hue } as React.CSSProperties };
  });

  const pinLeft = `${((Math.max(0.5, day - 0.5)) / totalDays) * 100}%`;
  const remaining = Math.max(0, totalDays - day);

  return (
    <div className="w-full">
      {/* the pin */}
      <div className="relative h-6" aria-hidden>
        <div
          className="absolute flex -translate-x-1/2 flex-col items-center text-stage"
          style={{ left: pinLeft }}
        >
          <MapPin size={18} strokeWidth={2.25} fill="var(--stage-soft)" />
        </div>
      </div>

      <div
        className="flex h-2 items-center gap-px"
        role="img"
        aria-label={`Day ${day} of ${totalDays} on the trail`}
      >
        {segs.map((s) => (
          <span key={s.key} className={s.cls} style={s.style} />
        ))}
      </div>

      {/* stage ruler */}
      <div className="mt-2 flex" aria-hidden>
        {stages.map((s) => (
          <div
            key={s.index}
            className="flex-1 border-t-2 pt-1 text-center"
            style={{
              borderColor: `var(${STAGE_VAR[s.index]})`,
              marginRight: s.index < 4 ? 3 : 0,
            }}
          >
            <span
              className="text-2xs font-semibold uppercase tracking-wide"
              style={{
                color:
                  s.startDay <= day && day <= s.endDay
                    ? `var(${STAGE_VAR[s.index]})`
                    : 'var(--text-subtle)',
              }}
            >
              {s.name.slice(0, 4)}
            </span>
          </div>
        ))}
      </div>

      {/* caption row */}
      <div className="tabular mt-3 flex justify-between text-xs text-text-subtle">
        <span>
          {day} of {totalDays} walked
        </span>
        <span>{remaining > 0 ? `${remaining} to the summit` : 'The summit.'}</span>
      </div>
    </div>
  );
}
