type Props = {
  day: number;
  totalDays: number;
  size?: number;
  stroke?: number;
};

export default function MissionRing({ day, totalDays, size = 180, stroke = 14 }: Props) {
  const clampedDay = Math.max(0, Math.min(totalDays, day));
  const progress = totalDays === 0 ? 0 : clampedDay / totalDays;
  const center = size / 2;
  const radius = center - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const angle = 2 * Math.PI * progress;
  const dotX = center + radius * Math.sin(angle);
  const dotY = center - radius * Math.cos(angle);
  const remaining = Math.max(0, totalDays - clampedDay);
  const percent = Math.round(progress * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--tangerine)" />
            <stop offset="100%" stopColor="var(--lemon)" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 600ms var(--ease-apple)' }}
        />
      </svg>

      {progress > 0 && progress < 1 && (
        <>
          <span
            aria-hidden
            className="absolute block rounded-full bg-tangerine opacity-50 animate-ring-pulse"
            style={{ width: 14, height: 14, left: dotX - 7, top: dotY - 7 }}
          />
          <span
            aria-hidden
            className="absolute block rounded-full bg-tangerine"
            style={{ width: 10, height: 10, left: dotX - 5, top: dotY - 5 }}
          />
        </>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-sm text-text-muted tabular">{percent}%</div>
        <div className="mt-1 text-5xl font-bold tabular leading-none">
          {clampedDay}
        </div>
        <div className="mt-2 text-sm text-text-muted tabular">
          {remaining > 0 ? `${remaining} days to go` : `Day ${totalDays}`}
        </div>
      </div>
    </div>
  );
}
