// Ledger fork of MissionRing — no circle. The measure: serif numerals over a
// ruled progress line with a tick at every week boundary. The mission as a
// line being written, not a dial being filled.

type Props = {
  day: number;
  totalDays: number;
  center?: React.ReactNode;
};

export default function MissionRing({ day, totalDays, center }: Props) {
  const clampedDay = Math.max(0, Math.min(totalDays, day));
  const progress = totalDays === 0 ? 0 : clampedDay / totalDays;
  const remaining = Math.max(0, totalDays - clampedDay);
  const weeks = Math.floor(totalDays / 7);

  return (
    <div className="w-full">
      {center ?? (
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="ld-serif tabular text-[3rem] leading-none">
              {clampedDay}
            </span>
            <span className="ld-serif text-lg" style={{ color: 'var(--text-muted)' }}>
              of {totalDays}
            </span>
          </div>
          <span className="tabular text-sm" style={{ color: 'var(--text-muted)' }}>
            {remaining > 0 ? `${remaining} remain` : 'complete'}
          </span>
        </div>
      )}

      <div className="relative mt-4 h-2.5" aria-hidden>
        {/* the baseline */}
        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: 'var(--border-strong)' }}
        />
        {/* the written stretch */}
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2"
          style={{
            width: `${progress * 100}%`,
            background: 'var(--text)',
            transition: 'width 600ms var(--ease-apple)',
          }}
        />
        {/* week ticks */}
        {Array.from({ length: weeks - 1 }, (_, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2"
            style={{
              left: `${(((i + 1) * 7) / totalDays) * 100}%`,
              background: 'var(--border-strong)',
            }}
          />
        ))}
        {/* the nib — where the pen rests */}
        {progress > 0 && progress < 1 && (
          <span
            className="absolute top-1/2 h-2.5 w-[3px] -translate-y-1/2"
            style={{
              left: `calc(${progress * 100}% - 1px)`,
              background: 'var(--accent)',
            }}
          />
        )}
      </div>
      <div
        className="ld-caps mt-2 flex justify-between"
        style={{ color: 'var(--text-subtle)' }}
      >
        <span>Week {Math.min(weeks, Math.ceil(clampedDay / 7))}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}
