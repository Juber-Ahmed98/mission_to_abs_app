// Waypoint fork of MissionRing — the trail strip. No dial: 105 days laid out
// as a walked route, colored by the stage they were walked in. Missed days
// are a dotted stretch — visible, never scarlet. A pin stands at today.

import { MapPin } from 'lucide-react';
import type { DayEntry } from '../../../types';
import { addDaysISO } from '../../../lib/date';
import { dayStatus } from '../../../lib/dayStatus';
import { stagesFor } from '../../../lib/stage';

type Props = {
  day: number;
  totalDays: number;
  days: Record<string, DayEntry>;
  startDate: string;
  /** Live status override for today, so the strip fills in as you log. */
  todayStatus?: 'logged' | 'empty';
};

const STAGE_VAR = ['--wp-s0', '--wp-s1', '--wp-s2', '--wp-s3', '--wp-s4'];

export default function MissionRing({
  day,
  totalDays,
  days,
  startDate,
  todayStatus,
}: Props) {
  const stages = stagesFor(totalDays);
  const stageOf = (d: number) => stages.find((s) => d >= s.startDay && d <= s.endDay);

  const segs = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const stage = stageOf(d);
    const hue = `var(${STAGE_VAR[stage?.index ?? 0]})`;
    if (d > day) return { key: d, cls: 'wp-seg wp-seg-future', style: {} };
    if (d === day) {
      const logged = todayStatus === 'logged';
      return {
        key: d,
        cls: 'wp-seg',
        style: {
          background: logged ? hue : 'var(--wp-track)',
          outline: `2px solid ${hue}`,
          outlineOffset: '1px',
        } as React.CSSProperties,
      };
    }
    const status = dayStatus(days[addDaysISO(startDate, d - 1)]);
    if (status === 'missed') return { key: d, cls: 'wp-seg wp-seg-missed', style: {} };
    if (status === 'failed')
      return {
        key: d,
        cls: 'wp-seg',
        style: { background: 'var(--border-strong)' } as React.CSSProperties,
      };
    return { key: d, cls: 'wp-seg', style: { background: hue } as React.CSSProperties };
  });

  const pinLeft = `${((day - 0.5) / totalDays) * 100}%`;

  return (
    <div className="w-full">
      {/* the pin */}
      <div className="relative h-6" aria-hidden>
        <div
          className="absolute flex -translate-x-1/2 flex-col items-center"
          style={{ left: pinLeft, color: 'var(--stage)' }}
        >
          <MapPin size={18} strokeWidth={2.25} fill="var(--stage-soft)" />
        </div>
      </div>

      <div
        className="wp-trail"
        role="img"
        aria-label={`Day ${day} of ${totalDays} on the trail`}
      >
        {segs.map((s) => (
          <span key={s.key} className={s.cls} style={s.style} />
        ))}
      </div>

      {/* stage bands */}
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
    </div>
  );
}
