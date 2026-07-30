// Waypoint fork of LevelBadge — elevation gained. The XP bar climbs in the
// current stage's hue; the level reads like an altitude marker.

import { Mountain } from 'lucide-react';

type Props = {
  level: number;
  tier: string;
  xpInLevel: number;
  xpToNext: number;
};

export default function LevelBadge({ level, tier, xpInLevel, xpToNext }: Props) {
  const pct = xpToNext === 0 ? 0 : Math.max(0, Math.min(1, xpInLevel / xpToNext));
  return (
    <div className="wp-panel px-5 py-4">
      <div className="flex items-baseline gap-2">
        <Mountain
          size={16}
          strokeWidth={2}
          className="self-center"
          style={{ color: 'var(--stage)' }}
        />
        <span className="tabular text-lg font-semibold">Level {level}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span className="text-base" style={{ color: 'var(--text-muted)' }}>
          {tier}
        </span>
        <span className="tabular ml-auto text-xs" style={{ color: 'var(--text-subtle)' }}>
          {Math.round(pct * 100)}% climbed
        </span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-pill"
        style={{ background: 'var(--wp-track)' }}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-500 ease-apple"
          style={{ width: `${pct * 100}%`, background: 'var(--stage)' }}
        />
      </div>
      <div
        className="tabular mt-2 flex items-center justify-between text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>
          {xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
        <span>{(xpToNext - xpInLevel).toLocaleString()} to the next marker</span>
      </div>
    </div>
  );
}
