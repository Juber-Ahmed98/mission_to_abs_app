// The altimeter (DESIGN.md · Level badge): elevation gained. The XP bar
// climbs in the current stage's hue; the level reads like an altitude marker.

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
    <div className="rounded-card border border-border bg-surface px-5 py-4 shadow-panel">
      <div className="flex items-baseline gap-2">
        <Mountain size={16} strokeWidth={2} className="self-center text-stage" />
        <span className="text-lg font-semibold tabular">Level {level}</span>
        <span className="text-text-muted">·</span>
        <span className="text-base text-text-muted">{tier}</span>
        <span className="tabular ml-auto text-xs text-text-subtle">
          {Math.round(pct * 100)}% climbed
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-track">
        <div
          className="h-full rounded-pill bg-stage transition-[width] duration-fill ease-apple"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted tabular">
        <span>
          {xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
        <span>{(xpToNext - xpInLevel).toLocaleString()} to the next marker</span>
      </div>
    </div>
  );
}
