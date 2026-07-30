// Ledger fork of LevelBadge — a typographic line, not a card. The XP bar
// becomes a ruled underline; the tier reads like a chapter heading.

type Props = {
  level: number;
  tier: string;
  xpInLevel: number;
  xpToNext: number;
};

export default function LevelBadge({ level, tier, xpInLevel, xpToNext }: Props) {
  const pct = xpToNext === 0 ? 0 : Math.max(0, Math.min(1, xpInLevel / xpToNext));
  return (
    <div className="ld-rule-t ld-rule-b py-3.5">
      <div className="flex items-baseline justify-between">
        <span className="ld-caps" style={{ color: 'var(--text-muted)' }}>
          Level {level} — {tier}
        </span>
        <span className="tabular text-xs" style={{ color: 'var(--text-subtle)' }}>
          {xpInLevel.toLocaleString()} / {xpToNext.toLocaleString()} XP
        </span>
      </div>
      <div className="relative mt-2.5 h-px" style={{ background: 'var(--border)' }}>
        <div
          className="absolute left-0 top-0 h-[2px] -translate-y-[0.5px] transition-[width] duration-500 ease-apple"
          style={{ width: `${pct * 100}%`, background: 'var(--text)' }}
        />
      </div>
    </div>
  );
}
