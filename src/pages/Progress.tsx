import { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useMission } from '../store/mission';
import { dayNumberFor } from '../lib/date';

type Point = { day: number; weight: number; ma?: number };

export default function ProgressPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const [showMA, setShowMA] = useState(false);

  const series = useMemo<Point[]>(() => {
    const sorted = Object.values(days)
      .filter((d) => typeof d.weight === 'number')
      .sort((a, b) => a.date.localeCompare(b.date));
    const out = sorted.map((d) => ({
      day: dayNumberFor(d.date, settings.startDate),
      weight: d.weight as number,
    }));
    return out.map((p, i) => {
      const windowPts = out.slice(Math.max(0, i - 6), i + 1);
      const ma = windowPts.reduce((s, x) => s + x.weight, 0) / windowPts.length;
      return { ...p, ma };
    });
  }, [days, settings.startDate]);

  const delta = series.length > 0 ? series[series.length - 1].weight - series[0].weight : 0;
  const deltaStr = delta === 0 ? '0.0' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
  const losing = delta < 0;

  const weekDelta = useMemo(() => {
    if (series.length < 2) return null;
    const last = series[series.length - 1];
    let sevenAgo: Point | null = null;
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (series[i].day <= last.day - 7) {
        sevenAgo = series[i];
        break;
      }
    }
    if (!sevenAgo) return null;
    return last.weight - sevenAgo.weight;
  }, [series]);

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="pt-8 pb-1">
        <div className="text-sm text-text-muted">Progress</div>
      </header>

      {series.length < 2 ? (
        <div className="mt-16 text-center text-sm text-text-muted">
          Log weight to see trend.
        </div>
      ) : (
        <>
          <div className="mt-1">
            <div className="text-sm text-text-muted">vs. start</div>
            <div
              className={[
                'mt-1 text-4xl font-bold tabular leading-none',
                losing ? 'text-success' : delta > 0 ? 'text-failed' : 'text-text',
              ].join(' ')}
            >
              {deltaStr}
              <span className="ml-1 text-xl font-normal text-text-muted">
                {settings.weightUnit}
              </span>
            </div>
            {weekDelta !== null && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">
                {weekDelta < 0 ? (
                  <ArrowDown size={12} strokeWidth={2} className="text-success" />
                ) : weekDelta > 0 ? (
                  <ArrowUp size={12} strokeWidth={2} className="text-failed" />
                ) : (
                  <Minus size={12} strokeWidth={2} />
                )}
                <span className="tabular">
                  {Math.abs(weekDelta).toFixed(1)} {settings.weightUnit} this week
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-card border border-border bg-surface p-3 pl-1 pt-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={32}
                    domain={[
                      (min: number) => Math.floor(min - 0.5),
                      (max: number) => Math.ceil(max + 0.5),
                    ]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text)',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--text-muted)' }}
                    formatter={(v: number) => `${v.toFixed(1)} ${settings.weightUnit}`}
                    labelFormatter={(d) => `Day ${d}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--tangerine)"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: 'var(--tangerine)', strokeWidth: 0 }}
                    activeDot={{ r: 4.5, fill: 'var(--tangerine)' }}
                    isAnimationActive={false}
                  />
                  {showMA && (
                    <Line
                      type="monotone"
                      dataKey="ma"
                      stroke="var(--lemon)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMA((v) => !v)}
            className="mt-3 flex items-center gap-2 text-sm text-text-muted"
          >
            <span
              className={[
                'inline-block h-4 w-4 rounded-sm border transition-colors',
                showMA ? 'border-accent bg-accent' : 'border-border-strong',
              ].join(' ')}
            />
            7-day moving average
          </button>
        </>
      )}
    </div>
  );
}
