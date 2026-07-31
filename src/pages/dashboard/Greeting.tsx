// First open of the day (DESIGN.md · moment 1): ambient chrome, never a
// takeover. The header knows the date, the walk so far (streak flag), Day N,
// and the stage you're standing in; faint contour lines sit behind it. One
// morning line surfaces while today is still unrecorded.

import { Flag, Shield } from 'lucide-react';
import { formatNice } from '../../lib/date';
import { getMorningQuote } from '../../lib/quotes';
import type { Stage } from '../../lib/stage';
import ContourLines from '../../components/ContourLines';

type Props = {
  today: string;
  dayNum: number;
  stage: Stage | null;
  streak: number;
  isPreMission: boolean;
  daysUntilStart: number;
  startDate: string;
  /** dayStatus()-derived — key presence is meaningless (the mount effect auto-creates today). */
  nothingLoggedYet: boolean;
  showShield: boolean;
  shieldCount: number;
  onShield: () => void;
};

export default function Greeting(p: Props) {
  return (
    <header className="relative overflow-hidden px-5 pb-3 pt-7">
      <ContourLines />
      <div className="relative flex min-h-6 items-center justify-between gap-3">
        <span className="text-sm text-text-muted">{formatNice(p.today)}</span>
        <span className="flex items-center gap-2">
          {!p.isPreMission && p.streak >= 2 && (
            <span className="tabular flex items-center gap-1 text-sm font-semibold text-stage">
              <Flag size={13} strokeWidth={2.5} />
              {p.streak} days
            </span>
          )}
          {p.showShield && (
            <button
              type="button"
              onClick={p.onShield}
              aria-label="Use streak shield"
              className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-pill border border-border bg-surface px-3 text-sm text-text-muted transition-colors duration-150 ease-apple hover:border-accent/40 hover:text-accent"
            >
              <Shield size={14} strokeWidth={1.75} />
              <span className="tabular">{p.shieldCount}</span>
            </button>
          )}
        </span>
      </div>

      {p.isPreMission ? (
        <div className="relative mt-1">
          <h1 className="text-3xl font-bold leading-tight">
            Begins in {p.daysUntilStart} {p.daysUntilStart === 1 ? 'day' : 'days'}
          </h1>
          <div className="mt-1 text-sm text-text-muted">
            {formatNice(p.startDate)}
          </div>
        </div>
      ) : (
        <div className="relative mt-1 flex items-center justify-between gap-3">
          <h1 className="tabular text-3xl font-bold leading-tight">
            Day {p.dayNum}
          </h1>
          {p.stage && (
            <span className="tabular rounded-pill bg-stage-soft px-2.5 py-1 text-2xs font-bold uppercase tracking-wide text-stage">
              {p.stage.name} · {p.stage.startDay}–{p.stage.endDay}
            </span>
          )}
        </div>
      )}

      {!p.isPreMission && p.nothingLoggedYet && (
        <p className="relative mt-1.5 text-sm text-text-muted">
          {getMorningQuote(p.today)}
        </p>
      )}
    </header>
  );
}
