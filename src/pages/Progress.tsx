import { useMemo, useState } from 'react';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { useMission } from '../store/mission';
import { dayNumberFor, todayISO, totalDays } from '../lib/date';
import { adherenceFor } from '../lib/adherence';
import ContourLines from '../components/ContourLines';

type WeightPoint = { day: number; weight: number; ma?: number; trend?: number };
type WaistPoint = { day: number; waistCm: number };
type BodyFatPoint = { day: number; bodyFat: number };

const CM_PER_INCH = 2.54;

function fitLine(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const meanY = sy / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const yhat = slope * p.x + intercept;
    ssRes += (p.y - yhat) ** 2;
    ssTot += (p.y - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

export default function ProgressPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const measurements = useMission((s) => s.measurements);
  const [showMA, setShowMA] = useState(false);
  const [showProjection, setShowProjection] = useState(false);

  const today = todayISO();
  const missionTotal = totalDays(settings.durationWeeks);

  const series = useMemo<WeightPoint[]>(() => {
    const sorted = Object.values(days)
      .filter((d) => typeof d.weight === 'number')
      .sort((a, b) => a.date.localeCompare(b.date));
    // Synced history can run earlier than the mission start (day 1); we keep
    // those days stored but clip the chart — and every stat derived from it
    // (vs.-start delta, moving average, projection) — to the mission window.
    const base = sorted
      .map((d) => ({
        day: dayNumberFor(d.date, settings.startDate),
        weight: d.weight as number,
      }))
      .filter((p) => p.day >= 1);
    return base.map((p, i) => {
      const windowPts = base.slice(Math.max(0, i - 6), i + 1);
      const ma = windowPts.reduce((s, x) => s + x.weight, 0) / windowPts.length;
      return { ...p, ma };
    });
  }, [days, settings.startDate]);

  const waistSeries = useMemo<WaistPoint[]>(() => {
    return measurements
      .filter((m) => typeof m.waistCm === 'number')
      .map((m) => ({
        day: dayNumberFor(m.date, settings.startDate),
        waistCm: m.waistCm as number,
      }))
      .filter((p) => p.day >= 1)
      .sort((a, b) => a.day - b.day);
  }, [measurements, settings.startDate]);

  const bodyFatSeries = useMemo<BodyFatPoint[]>(() => {
    return Object.values(days)
      .filter((d) => typeof d.bodyFat === 'number')
      .map((d) => ({
        day: dayNumberFor(d.date, settings.startDate),
        bodyFat: d.bodyFat as number,
      }))
      .filter((p) => p.day >= 1)
      .sort((a, b) => a.day - b.day);
  }, [days, settings.startDate]);

  const lastWeight = series.length > 0 ? series[series.length - 1].weight : null;
  const firstWeight = series.length > 0 ? series[0].weight : null;
  const weightDelta = lastWeight !== null && firstWeight !== null ? lastWeight - firstWeight : 0;
  const weightDeltaStr =
    weightDelta === 0 ? '0.0' : weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : weightDelta.toFixed(1);

  const lastWaist = waistSeries.length > 0 ? waistSeries[waistSeries.length - 1].waistCm : null;
  const firstWaist = waistSeries.length > 0 ? waistSeries[0].waistCm : null;
  const waistDeltaCm = lastWaist !== null && firstWaist !== null ? lastWaist - firstWaist : 0;
  const displayWaistDelta =
    settings.waistUnit === 'in' ? waistDeltaCm / CM_PER_INCH : waistDeltaCm;
  const waistDeltaStr =
    displayWaistDelta === 0
      ? '0'
      : displayWaistDelta > 0
        ? `+${displayWaistDelta.toFixed(1)}`
        : displayWaistDelta.toFixed(1);

  const weekDelta = useMemo(() => {
    if (series.length < 2) return null;
    const last = series[series.length - 1];
    let sevenAgo: WeightPoint | null = null;
    for (let i = series.length - 1; i >= 0; i -= 1) {
      if (series[i].day <= last.day - 7) {
        sevenAgo = series[i];
        break;
      }
    }
    if (!sevenAgo) return null;
    return last.weight - sevenAgo.weight;
  }, [series]);

  const projection = useMemo(() => {
    if (series.length < 3) return null;
    const lastDay = series[series.length - 1].day;
    const recent = series.filter((p) => p.day >= lastDay - 14);
    if (recent.length < 3) return null;
    const fit = fitLine(recent.map((p) => ({ x: p.day, y: p.weight })));
    if (!fit) return null;
    const endDay = missionTotal;
    if (endDay <= lastDay) return null;
    const endWeight = fit.slope * endDay + fit.intercept;
    const noisy = fit.r2 < 0.3;
    return { fit, endDay, endWeight, noisy, lastDay };
  }, [series, missionTotal]);

  const chartData = useMemo<WeightPoint[]>(() => {
    if (!showProjection || !projection) return series;
    const out: WeightPoint[] = series.map((p) => ({ ...p, trend: undefined }));
    const lastIdx = out.length - 1;
    if (lastIdx >= 0) out[lastIdx] = { ...out[lastIdx], trend: out[lastIdx].weight };
    const { fit, endDay, lastDay } = projection;
    const stride = Math.max(1, Math.round((endDay - lastDay) / 8));
    for (let d = lastDay + stride; d <= endDay; d += stride) {
      out.push({ day: d, weight: NaN as unknown as number, trend: fit.slope * d + fit.intercept });
    }
    if (out[out.length - 1]?.day !== endDay) {
      out.push({ day: endDay, weight: NaN as unknown as number, trend: fit.slope * endDay + fit.intercept });
    }
    return out;
  }, [series, showProjection, projection]);

  const adherence = useMemo(
    () => adherenceFor(days, settings.startDate, today),
    [days, settings.startDate, today],
  );

  const losing = weightDelta < 0;
  const losingWaist = waistDeltaCm < 0;

  const hasWeight = series.length > 0;
  const hasWaist = waistSeries.length > 0;
  const hasBodyFat = bodyFatSeries.length > 0;

  return (
    <div className="pb-28" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ---- header on faint contours, like the Journey's ---- */}
      <header className="relative overflow-hidden px-5 pb-4 pt-7">
        <ContourLines />
        <div className="relative">
          <div className="text-sm font-medium text-text-muted">Progress</div>
          {hasWeight ? (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1
                  className={[
                    'tabular text-3xl font-bold leading-tight tracking-tight',
                    losing ? 'text-success' : weightDelta > 0 ? 'text-failed' : 'text-text',
                  ].join(' ')}
                >
                  {weightDeltaStr}
                  <span className="ml-1.5 text-lg font-normal text-text-muted">
                    {settings.weightUnit}
                  </span>
                </h1>
                {hasWaist && (
                  <div
                    className={[
                      'text-xl font-semibold tabular leading-none',
                      losingWaist ? 'text-success' : waistDeltaCm > 0 ? 'text-failed' : 'text-text-muted',
                    ].join(' ')}
                  >
                    {waistDeltaStr}
                    <span className="ml-1 text-sm font-normal text-text-muted">
                      {settings.waistUnit} waist
                    </span>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                {series.length < 2
                  ? 'Two readings draw the first line.'
                  : 'vs. the start of the walk'}
              </p>
              {weekDelta !== null && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">
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
            </>
          ) : (
            <>
              <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight">
                No readings yet
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                Two readings draw the first line.
              </p>
            </>
          )}
        </div>
      </header>

      {hasWeight && (
        <div className="px-5">
          <section className="mt-1 rounded-card border border-border bg-surface px-4 py-4 shadow-panel">
            <div className="text-xs uppercase tracking-wider text-text-muted">Adherence</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <div className="text-4xl font-bold tabular leading-none text-text">
                {adherence.perfectDays}
              </div>
              <div className="text-sm text-text-muted tabular">
                / {adherence.totalLogged} perfect days
              </div>
            </div>
            <div className="mt-2 text-sm text-text-muted tabular">
              {settings.pillarLabels.diet} {adherence.dietPct}% ·{' '}
              {settings.pillarLabels.exercise} {adherence.exercisePct}% · Rest{' '}
              {adherence.restCount} {adherence.restCount === 1 ? 'day' : 'days'}
            </div>
          </section>

          <div className="mt-6 rounded-card border border-border bg-surface p-3 pl-1 pt-5 shadow-panel">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                  <XAxis
                    dataKey="day"
                    type="number"
                    domain={[1, showProjection && projection ? projection.endDay : 'dataMax']}
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
                    formatter={(v: number, name) => {
                      if (!Number.isFinite(v)) return ['—', String(name)];
                      return [`${v.toFixed(1)} ${settings.weightUnit}`, String(name)];
                    }}
                    labelFormatter={(d) => `Day ${d}`}
                  />
                  {settings.goalWeight !== undefined && (
                    <ReferenceLine
                      y={settings.goalWeight}
                      stroke="var(--border-strong)"
                      strokeWidth={1.5}
                      strokeDasharray="6 5"
                      label={{
                        value: `Goal ${settings.goalWeight} ${settings.weightUnit}`,
                        position: 'insideTopRight',
                        fill: 'var(--text-subtle)',
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight"
                    stroke="var(--stage)"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: 'var(--stage)', strokeWidth: 0 }}
                    activeDot={{ r: 4.5, fill: 'var(--stage)' }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                  {showMA && (
                    <Line
                      type="monotone"
                      dataKey="ma"
                      name="7-day avg"
                      stroke="var(--stage)"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {showProjection && projection && (
                    <Line
                      type="linear"
                      dataKey="trend"
                      name="Projection"
                      stroke="var(--text-muted)"
                      strokeWidth={1.25}
                      strokeDasharray="3 4"
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-2 flex flex-col">
            <button
              type="button"
              onClick={() => setShowMA((v) => !v)}
              className="flex min-h-[44px] items-center gap-2 text-sm text-text-muted"
            >
              <span
                className={[
                  'inline-block h-4 w-4 rounded-sm border transition-colors',
                  showMA ? 'border-accent bg-accent' : 'border-border-strong',
                ].join(' ')}
              />
              7-day moving average
            </button>
            <button
              type="button"
              onClick={() => setShowProjection((v) => !v)}
              className="flex min-h-[44px] items-center gap-2 text-sm text-text-muted"
            >
              <span
                className={[
                  'inline-block h-4 w-4 rounded-sm border transition-colors',
                  showProjection ? 'border-accent bg-accent' : 'border-border-strong',
                ].join(' ')}
              />
              Show projection
            </button>
            {showProjection && projection && (
              <div className="text-xs text-text-muted tabular">
                {projection.noisy
                  ? 'Pace unclear — more readings settle the line.'
                  : `On pace for ${projection.endWeight.toFixed(1)} ${settings.weightUnit}.`}
              </div>
            )}
          </div>

          {hasWaist && (
            <section className="mt-8">
              <div className="text-xs uppercase tracking-wider text-text-muted">
                Waist
              </div>
              <div className="mt-2 rounded-card border border-border bg-surface p-3 pl-1 pt-4 shadow-panel">
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={waistSeries.map((p) => ({
                        day: p.day,
                        waist:
                          settings.waistUnit === 'in'
                            ? Math.round((p.waistCm / CM_PER_INCH) * 10) / 10
                            : Math.round(p.waistCm * 10) / 10,
                      }))}
                      margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                    >
                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={[1, 'dataMax']}
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
                        formatter={(v: number) => `${v.toFixed(1)} ${settings.waistUnit}`}
                        labelFormatter={(d) => `Day ${d}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="waist"
                        stroke="var(--rest)"
                        strokeWidth={2}
                        dot={{ r: 2, fill: 'var(--rest)', strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: 'var(--rest)' }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}

          {hasBodyFat && (
            <section className="mt-8">
              <div className="text-xs uppercase tracking-wider text-text-muted">
                Body fat
              </div>
              <div className="mt-2 rounded-card border border-border bg-surface p-3 pl-1 pt-4 shadow-panel">
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bodyFatSeries}
                      margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                    >
                      <XAxis
                        dataKey="day"
                        type="number"
                        domain={[1, 'dataMax']}
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
                        formatter={(v: number) => `${v.toFixed(1)} %`}
                        labelFormatter={(d) => `Day ${d}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        stroke="var(--success)"
                        strokeWidth={2}
                        dot={{ r: 2, fill: 'var(--success)', strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: 'var(--success)' }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
