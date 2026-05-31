import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Sparkles } from 'lucide-react';
import { useMission } from '../store/mission';
import { addDaysISO, totalDays } from '../lib/date';
import { adherenceFor } from '../lib/adherence';
import { longestStreak } from '../lib/streak';
import { totalXp } from '../lib/xp';
import MissionRing from './MissionRing';
import PhotoThumb from './PhotoThumb';
import BottomSheet from './BottomSheet';
import {
  buildMissionArchive,
  downloadMissionArchive,
} from '../lib/archive';
import { bump } from '../lib/analytics';

const CM_PER_INCH = 2.54;

export default function MissionCompleted() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const history = useMission((s) => s.history);
  const startNewMission = useMission((s) => s.startNewMission);
  const setSettings = useMission((s) => s.setSettings);

  const total = totalDays(settings.durationWeeks);
  const lastDay = addDaysISO(settings.startDate, total - 1);

  const adherence = useMemo(
    () => adherenceFor(days, settings.startDate, lastDay),
    [days, settings.startDate, lastDay],
  );

  const longest = useMemo(
    () => longestStreak(days, settings.startDate, lastDay),
    [days, settings.startDate, lastDay],
  );

  const xp = useMemo(
    () => totalXp(days, photos, measurements),
    [days, photos, measurements],
  );

  const weights = useMemo(() => {
    return Object.values(days)
      .filter(
        (d) =>
          typeof d.weight === 'number' &&
          d.date >= settings.startDate &&
          d.date <= lastDay,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [days, settings.startDate, lastDay]);

  const weightDelta =
    weights.length >= 2
      ? (weights[weights.length - 1].weight as number) -
        (weights[0].weight as number)
      : null;

  const waistList = useMemo(() => {
    return measurements
      .filter((m) => typeof m.waistCm === 'number')
      .slice()
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }, [measurements]);

  const waistDeltaCm =
    waistList.length >= 2
      ? (waistList[waistList.length - 1].waistCm as number) -
        (waistList[0].waistCm as number)
      : null;

  const waistDeltaDisplay =
    waistDeltaCm === null
      ? null
      : settings.waistUnit === 'in'
        ? waistDeltaCm / CM_PER_INCH
        : waistDeltaCm;

  const sortedPhotos = useMemo(
    () => photos.slice().sort((a, b) => a.weekNumber - b.weekNumber),
    [photos],
  );
  const firstPhoto = sortedPhotos[0];
  const lastPhoto =
    sortedPhotos.length > 1 ? sortedPhotos[sortedPhotos.length - 1] : undefined;

  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const archive = await buildMissionArchive({
        settings,
        days,
        measurements,
        photos,
        finalXp: xp,
      });
      downloadMissionArchive(archive);
      setSettings({ lastExportedAt: new Date().toISOString() });
    } finally {
      setExporting(false);
    }
  };

  const onConfirmNewMission = async () => {
    if (starting) return;
    setStarting(true);
    try {
      // The finished mission is kept in History (no forced download); the
      // "Export mission archive" button above remains for an off-device backup.
      bump('missionsCompleted');
      await startNewMission();
      setConfirmOpen(false);
    } finally {
      setStarting(false);
    }
  };

  const formatDelta = (n: number, decimals = 1): string => {
    if (n === 0) return decimals === 0 ? '0' : '0.0';
    const fixed = n.toFixed(decimals);
    return n > 0 ? `+${fixed}` : fixed;
  };

  const haveHeadline = weightDelta !== null || waistDeltaDisplay !== null;

  return (
    <div className="pb-32" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="px-5 pt-8 pb-2">
        <h1 className="text-3xl font-bold tracking-tight">Mission complete</h1>
        <div className="mt-1 text-sm text-text-muted">Day {total}.</div>
      </header>

      <div className="flex justify-center pt-4 pb-6">
        <MissionRing day={total} totalDays={total} />
      </div>

      {haveHeadline && (
        <section className="px-5 text-center">
          <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
            {weightDelta !== null && (
              <div
                className={[
                  'text-4xl font-bold tabular leading-none',
                  weightDelta < 0
                    ? 'text-success'
                    : weightDelta > 0
                      ? 'text-failed'
                      : 'text-text',
                ].join(' ')}
              >
                {formatDelta(weightDelta)}
                <span className="ml-1 text-xl font-normal text-text-muted">
                  {settings.weightUnit}
                </span>
              </div>
            )}
            {waistDeltaDisplay !== null && (
              <div
                className={[
                  'text-2xl font-semibold tabular leading-none',
                  waistDeltaDisplay < 0
                    ? 'text-success'
                    : waistDeltaDisplay > 0
                      ? 'text-failed'
                      : 'text-text-muted',
                ].join(' ')}
              >
                {formatDelta(waistDeltaDisplay)}
                <span className="ml-1 text-sm font-normal text-text-muted">
                  {settings.waistUnit} waist
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-6 mx-5 rounded-card border border-border bg-surface px-4 py-4">
        <div className="text-xs uppercase tracking-wider text-text-muted">Adherence</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <div className="text-5xl font-bold tabular leading-none text-text">
            {adherence.perfectDays}
          </div>
          <div className="text-sm text-text-muted tabular">
            / {total} perfect days
          </div>
        </div>
        <div className="mt-3 text-sm text-text-muted tabular">
          Diet {adherence.dietPct}% · Exercise {adherence.exercisePct}% · Longest streak {longest}
        </div>
      </section>

      {firstPhoto && (
        <section className="mt-6 px-5">
          <div className="text-xs uppercase tracking-wider text-text-muted">
            Then &amp; now
          </div>
          <div className="mt-2 flex items-stretch gap-3">
            <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-card border border-border bg-surface">
              <PhotoThumb
                photoKey={firstPhoto.photoKey}
                className="absolute inset-0 h-full w-full"
              />
              <div className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-2xs font-medium tracking-wide text-white">
                W{firstPhoto.weekNumber}
              </div>
            </div>
            {lastPhoto ? (
              <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-card border border-border bg-surface">
                <PhotoThumb
                  photoKey={lastPhoto.photoKey}
                  className="absolute inset-0 h-full w-full"
                />
                <div className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-2xs font-medium tracking-wide text-white">
                  W{lastPhoto.weekNumber}
                </div>
              </div>
            ) : (
              <div className="flex aspect-[3/4] flex-1 items-center justify-center rounded-card border border-dashed border-border text-xs text-text-muted">
                No final photo
              </div>
            )}
          </div>
          {lastPhoto && (
            <div className="mt-2 text-center">
              <Link
                to={`/compare/${firstPhoto.weekNumber}/${lastPhoto.weekNumber}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs text-text-muted hover:text-text"
              >
                Compare
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="mt-8 px-5 space-y-2">
        <button
          type="button"
          disabled={exporting}
          onClick={onExport}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-card border border-border bg-surface text-text disabled:opacity-60"
        >
          <Download size={16} strokeWidth={1.75} />
          {exporting ? 'Exporting…' : 'Export mission archive'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-card bg-accent text-white hover:bg-accent-hover"
        >
          <Sparkles size={16} strokeWidth={1.75} />
          Begin a new mission
        </button>
        {history.length > 0 && (
          <Link
            to="/history"
            className="block pt-1 text-center text-sm text-text-muted hover:text-text"
          >
            View past missions
          </Link>
        )}
      </section>

      <BottomSheet open={confirmOpen} onClose={() => (starting ? undefined : setConfirmOpen(false))}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">
            Archive this mission and start fresh?
          </div>
          <div className="mt-1 text-sm text-text-muted">
            This mission moves to your History. Your goals carry forward.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={starting}
              onClick={() => setConfirmOpen(false)}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={starting}
              onClick={onConfirmNewMission}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {starting ? 'Starting…' : 'Begin new'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
