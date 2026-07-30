// Ember fork of MissionRing — the day counter as a warm dial. Thicker arc,
// ember gradient, a soft drop-glow, and a live coal at the progress tip.

type Props = {
  day: number;
  totalDays: number;
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
};

export default function MissionRing({
  day,
  totalDays,
  size = 208,
  stroke = 17,
  center,
}: Props) {
  const clampedDay = Math.max(0, Math.min(totalDays, day));
  const progress = totalDays === 0 ? 0 : clampedDay / totalDays;
  const c = size / 2;
  const radius = c - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const angle = 2 * Math.PI * progress;
  const dotX = c + radius * Math.sin(angle);
  const dotY = c - radius * Math.cos(angle);
  const remaining = Math.max(0, totalDays - clampedDay);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className={progress > 0 ? 'em-ring-glow' : undefined}
      >
        <defs>
          <linearGradient id="emRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-hover)" />
          </linearGradient>
        </defs>
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke="var(--em-ring-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke="url(#emRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: 'stroke-dashoffset 700ms var(--ease-apple)' }}
        />
      </svg>

      {progress > 0 && progress < 1 && (
        <span
          aria-hidden
          className="absolute block rounded-full"
          style={{
            width: 12,
            height: 12,
            left: dotX - 6,
            top: dotY - 6,
            background: 'var(--accent-hover)',
            boxShadow: '0 0 12px var(--em-glow-strong), 0 0 4px var(--accent)',
          }}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        {center ?? (
          <>
            <div className="tabular text-[3.4rem] font-bold leading-none tracking-tight">
              {clampedDay}
            </div>
            <div className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              of {totalDays} · {remaining} ahead
            </div>
          </>
        )}
      </div>
    </div>
  );
}
