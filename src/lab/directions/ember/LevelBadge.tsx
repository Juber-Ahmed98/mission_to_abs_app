// Ember fork of LevelBadge — the XP bar as a fuse: warm fill, lit tip.

import { Flame } from 'lucide-react';

type Props = {
  level: number;
  tier: string;
  xpInLevel: number;
  xpToNext: number;
};

export default function LevelBadge({ level, tier, xpInLevel, xpToNext }: Props) {
  const pct = xpToNext === 0 ? 0 : Math.max(0, Math.min(1, xpInLevel / xpToNext));
  return (
    <div
      className="rounded-card border px-5 py-4"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--em-shadow)',
      }}
    >
      <div className="flex items-baseline gap-2">
        <Flame
          size={16}
          strokeWidth={1.75}
          className="self-center"
          style={{ color: 'var(--accent)' }}
        />
        <span className="tabular text-lg font-semibold">Level {level}</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span className="text-base" style={{ color: 'var(--text-muted)' }}>
          {tier}
        </span>
        <span
          className="tabular ml-auto text-xs"
          style={{ color: 'var(--text-subtle)' }}
        >
          {xpToNext - xpInLevel} XP to next
        </span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-pill"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          className="relative h-full rounded-pill transition-[width] duration-500 ease-apple"
          style={{
            width: `${pct * 100}%`,
            background: 'linear-gradient(90deg, var(--accent-soft), var(--accent))',
            boxShadow: '0 0 10px var(--em-glow-strong)',
          }}
        />
      </div>
      <div
        className="tabular mt-2 flex items-center justify-between text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>
          {xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}
