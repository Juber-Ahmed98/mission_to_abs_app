// The Journey page (DESIGN.md · Journey page — the map): the page the
// direction lives on, per the Gate-2-pinned render. Lapse-aware header and
// footer, the serpentine map in one panel, a route-texture legend, and the
// map panel sheet — view facts for logged days, the three equal-weight marks
// for unrecorded ones (honest toasts + undo, per the backfill spec), with the
// full day record one door away.

import { useState } from 'react';
import { useMission } from '../store/mission';
import {
  dayNumberFor,
  diffDays,
  formatNice,
  todayISO,
  totalDays,
} from '../lib/date';
import { dayStatus } from '../lib/dayStatus';
import { lastLoggedDate } from '../lib/lapse';
import { stagesFor, stageForDay } from '../lib/stage';
import { XP, xpForDay } from '../lib/xp';
import { bump } from '../lib/analytics';
import JourneyPath, { trailWord } from '../components/JourneyPath';
import BottomSheet from '../components/BottomSheet';
import ContourLines from '../components/ContourLines';
import DayEditor from '../components/DayEditor';
import { showUndo } from '../components/UndoToast';

const STAGE_VAR = ['--stage-0', '--stage-1', '--stage-2', '--stage-3', '--stage-4'];
const STAGE_SOFT_VAR = [
  '--stage-0-soft',
  '--stage-1-soft',
  '--stage-2-soft',
  '--stage-3-soft',
  '--stage-4-soft',
];

type MarkKind = 'walked' | 'camp' | 'rough';

export default function JourneyPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const setDayEntry = useMission((s) => s.setDayEntry);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const today = todayISO();
  const total = totalDays(settings.durationWeeks);
  const rawDay = dayNumberFor(today, settings.startDate);
  const dayNum = Math.max(1, Math.min(total, rawDay));
  const isPreMission = rawDay < 1;
  const isPostMission = rawDay > total;
  const stage = stageForDay(dayNum, total);
  const stages = stagesFor(total);

  // The lapse boundary, same camp the Dashboard reads (lib/lapse).
  const lastLogged = lastLoggedDate(days, today, settings.startDate);
  const gapDays = lastLogged === null ? null : diffDays(today, lastLogged) - 1;
  const isLapse =
    !isPreMission && !isPostMission && gapDays !== null && gapDays >= 2;
  const campDayNum = lastLogged
    ? Math.max(1, dayNumberFor(lastLogged, settings.startDate))
    : 0;

  const context = isPreMission
    ? `Begins in ${1 - rawDay} ${1 - rawDay === 1 ? 'day' : 'days'}.`
    : isPostMission
      ? 'The route is walked — trailhead to summit.'
      : isLapse
        ? `Camp was Day ${campDayNum} — the dotted stretch is behind you, ${total - dayNum} days to the summit.`
        : dayNum === total
          ? 'The summit is today.'
          : dayNum === total - 1
            ? 'One camp left. The summit is tomorrow.'
            : dayNum === 1 && dayStatus(days[today]) === 'missed'
              ? "Trailhead. The whole route is plotted; the first mark is today's log."
              : `Stage ${(stage?.index ?? 0) + 1} of ${stages.length} · ${stage?.name ?? ''} country · ${total - dayNum} days to the summit.`;

  const openDay = (date: string) => {
    setEditing(false);
    setSelected(date);
  };

  // The three equal-weight marks (DESIGN.md · the map panel). Writes go
  // through the store, so the app-level XP watcher fires the toast; the undo
  // pill restores the exact prior record.
  const mark = (date: string, kind: MarkKind) => {
    const prev = days[date];
    const prevState = { diet: prev?.diet, exercise: prev?.exercise, rest: prev?.rest };
    const wasEmpty = dayStatus(prev) === 'missed';
    const dNum = Math.max(1, dayNumberFor(date, settings.startDate));
    if (kind === 'walked')
      setDayEntry(date, { diet: 'success', exercise: 'success', rest: undefined });
    else if (kind === 'camp')
      setDayEntry(date, { rest: true, diet: undefined, exercise: undefined });
    else setDayEntry(date, { diet: 'fail', exercise: 'fail', rest: undefined });
    if (wasEmpty) bump('daysLogged');
    const verb =
      kind === 'walked'
        ? 'marked walked'
        : kind === 'camp'
          ? 'marked a camp day'
          : 'marked rough ground';
    showUndo(`Day ${dNum} ${verb}`, () => setDayEntry(date, prevState));
    setSelected(null);
  };

  return (
    <div className="pb-28" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* ---- header on faint contours ---- */}
      <header className="relative overflow-hidden px-5 pb-4 pt-7">
        <ContourLines />
        <div className="relative">
          <div className="text-sm font-medium text-text-muted">Journey</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="tabular text-3xl font-bold leading-tight tracking-tight">
              {total} days
            </h1>
            {stage && (
              <span className="tabular rounded-pill bg-stage-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-stage">
                {stage.name} · {stage.startDay}–{stage.endDay}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{context}</p>
        </div>
      </header>

      {/* ---- the map ---- */}
      <section className="mx-4">
        <div className="rounded-card border border-border bg-surface px-1.5 py-2 shadow-panel">
          <JourneyPath
            startDate={settings.startDate}
            totalDays={total}
            today={today}
            days={days}
            onSelect={openDay}
            campDate={isLapse ? lastLogged : null}
            pinDate={isPreMission ? settings.startDate : today}
          />
        </div>
      </section>

      {/* ---- legend, in route texture ---- */}
      <section className="mx-5 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
        <LegendItem label="Walked">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--stage)" strokeWidth={3} strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Unrecorded">
          <line x1={2} y1={5} x2={17} y2={5} stroke="var(--border-strong)" strokeWidth={2.25} strokeDasharray="0.1 5.5" strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Rough ground">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--border-strong)" strokeWidth={3} strokeLinecap="round" />
        </LegendItem>
        <LegendItem label="Camp">
          <path d="M 4 8.5 L 9 1.5 L 14 8.5 Z" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth={1.5} strokeLinejoin="round" />
        </LegendItem>
        <LegendItem label="Ahead">
          <line x1={1} y1={5} x2={17} y2={5} stroke="var(--track)" strokeWidth={2.5} strokeDasharray="4 4" />
        </LegendItem>
        <LegendItem label="You">
          <circle cx={9} cy={5} r={4} fill="var(--stage)" />
          <circle cx={9} cy={5} r={1.6} fill="var(--surface)" />
        </LegendItem>
      </section>

      <div className="px-5 pb-6 pt-6 text-center text-sm text-text-muted">
        {isLapse
          ? 'Every unrecorded stretch can still be drawn in. The route never left the map.'
          : 'The map fills in one stretch at a time.'}
      </div>

      {/* ---- the map panel: one day, up close ---- */}
      <BottomSheet open={!!selected} onClose={() => setSelected(null)}>
        {selected &&
          (() => {
            const dNum = Math.max(1, dayNumberFor(selected, settings.startDate));
            const entry = days[selected];
            const st = dayStatus(entry);
            const sIdx = stageForDay(Math.min(dNum, total), total)?.index ?? 0;
            const isToday = selected === today;
            const pillarWord = (p: 'success' | 'fail' | undefined) =>
              p === 'success' ? 'walked' : p === 'fail' ? 'rough' : '—';
            return (
              <div className="px-5 pb-5 pt-2">
                <div className="text-xs text-text-muted">
                  {formatNice(selected)}
                  {isToday ? ' · today' : ''}
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <div className="tabular text-lg font-bold">Day {dNum}</div>
                  <span
                    className="rounded-pill px-2.5 py-1 text-2xs font-bold uppercase tracking-wide"
                    style={{
                      background: `var(${STAGE_SOFT_VAR[sIdx]})`,
                      color: `var(${STAGE_VAR[sIdx]})`,
                    }}
                  >
                    {stages[sIdx].name}
                  </span>
                </div>

                {editing ? (
                  <div className="-mx-5">
                    <DayEditor date={selected} />
                  </div>
                ) : st === 'missed' ? (
                  <>
                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                      This stretch is unrecorded — the trail was under your feet
                      either way. Mark it as it was.
                    </p>
                    <div className="mt-4 grid gap-2">
                      <button
                        type="button"
                        onClick={() => mark(selected, 'walked')}
                        className="flex h-11 items-center justify-between rounded-card bg-stage px-4 text-sm font-bold text-surface"
                      >
                        <span>Walked it — both pillars</span>
                        <span className="tabular text-xs font-bold opacity-80">
                          +{XP.diet + XP.exercise + XP.perfectDayBonus} XP
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(selected, 'camp')}
                        className="flex h-11 items-center justify-between rounded-card border border-border px-4 text-sm font-medium text-text"
                      >
                        <span>Camp day</span>
                        <span className="tabular text-xs font-semibold text-text-muted">
                          +{XP.rest} XP
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(selected, 'rough')}
                        className="flex h-11 items-center justify-between rounded-card border border-border px-4 text-sm font-medium text-text"
                      >
                        <span>Rough ground</span>
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-text-subtle">
                      Rough ground marks as easily as a walked day — the map stays
                      honest either way.
                    </p>
                  </>
                ) : (
                  <div className="mt-3">
                    <FactRow label="Trail reads" value={trailWord(st)} />
                    {entry?.rest === true ? (
                      <p className="py-2 text-sm leading-relaxed text-text-muted">
                        Camp pitched — resting is still being on the trail.
                      </p>
                    ) : (
                      <>
                        <FactRow
                          label={settings.pillarLabels.diet}
                          value={pillarWord(entry?.diet)}
                        />
                        <FactRow
                          label={settings.pillarLabels.exercise}
                          value={pillarWord(entry?.exercise)}
                        />
                      </>
                    )}
                    {typeof entry?.weight === 'number' && (
                      <FactRow
                        label="Weight reading"
                        value={`${entry.weight} ${settings.weightUnit}`}
                      />
                    )}
                    <FactRow label="XP" value={`+${xpForDay(entry)}`} />
                  </div>
                )}

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-stage underline-offset-4 hover:underline"
                  >
                    Open the full record
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-2 h-11 w-full rounded-card bg-surface-2 text-sm font-medium text-text"
                >
                  Done
                </button>
              </div>
            );
          })()}
      </BottomSheet>
    </div>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width={18} height={10} viewBox="0 0 18 10" aria-hidden>
        {children}
      </svg>
      {label}
    </span>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-text-subtle">{label}</span>
      <span className="tabular text-right font-medium">{value}</span>
    </div>
  );
}
