import { Award } from 'lucide-react';

type Props = {
  level: number;
  tier: string;
  xpInLevel: number;
  xpToNext: number;
};

export default function LevelBadge({ level, tier, xpInLevel, xpToNext }: Props) {
  const pct = xpToNext === 0 ? 0 : Math.max(0, Math.min(1, xpInLevel / xpToNext));
  return (
    <div className="rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex items-baseline gap-2">
        <Award size={16} strokeWidth={1.75} className="self-center text-accent" />
        <span className="text-lg font-semibold tabular">Level {level}</span>
        <span className="text-text-muted">·</span>
        <span className="text-base text-text-muted">{tier}</span>
      </div>
      <div className="mt-3 h-1 rounded-pill bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-pill bg-accent transition-[width] duration-500 ease-apple"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-muted tabular">
        <span>{xpInLevel} / {xpToNext} XP</span>
        <span>{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}
