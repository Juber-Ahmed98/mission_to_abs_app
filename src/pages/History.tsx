import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, GitCompareArrows, Trash2 } from 'lucide-react';
import { useMission } from '../store/mission';
import type { ArchivedMission } from '../types';
import { addDaysISO, formatNice, totalDays } from '../lib/date';
import { adherenceFor } from '../lib/adherence';
import PhotoThumb from '../components/PhotoThumb';
import BottomSheet from '../components/BottomSheet';
import ContourLines from '../components/ContourLines';

const CM_PER_INCH = 2.54;

function lastDayOf(m: ArchivedMission): string {
  return addDaysISO(m.settings.startDate, totalDays(m.settings.durationWeeks) - 1);
}

function sortedPhotosOf(m: ArchivedMission) {
  return m.photos.slice().sort((a, b) => a.weekNumber - b.weekNumber);
}

function formatDelta(n: number, decimals = 1): string {
  const fixed = Math.abs(n).toFixed(decimals);
  if (n === 0) return decimals === 0 ? '0' : '0.0';
  return n > 0 ? `+${fixed}` : `-${fixed}`;
}

export default function HistoryPage() {
  const history = useMission((s) => s.history);
  const currentPhotos = useMission((s) => s.photos);
  const deleteArchivedMission = useMission((s) => s.deleteArchivedMission);
  const navigate = useNavigate();

  // Earliest and latest photo across the whole journey (every mission + the one
  // in progress), so the user can see day-1-ever vs. today in one tap.
  const journey = useMemo(() => {
    const all = [...history.flatMap((m) => m.photos), ...currentPhotos]
      .slice()
      .sort((x, y) => x.date.localeCompare(y.date) || x.weekNumber - y.weekNumber);
    const first = all[0];
    const last = all[all.length - 1];
    if (!first || !last || first.photoKey === last.photoKey) return null;
    return { first, last };
  }, [history, currentPhotos]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArchivedMission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selected = useMemo(
    () => history.find((m) => m.id === selectedId) ?? null,
    [history, selectedId],
  );

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteArchivedMission(pendingDelete.id);
      if (selectedId === pendingDelete.id) setSelectedId(null);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="relative -mx-5 overflow-hidden px-5 pt-7 pb-4">
        <ContourLines />
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-3 inline-flex h-11 w-11 items-center justify-center rounded-pill text-text-muted hover:text-text"
          >
            <ChevronLeft size={22} strokeWidth={1.75} />
          </button>
          <div>
            <div className="text-sm font-medium text-text-muted">History</div>
            <div className="text-3xl font-bold tracking-tight">Past missions</div>
          </div>
        </div>
      </header>

      {journey && (
        <Link
          to={`/compare/${journey.first.photoKey}/${journey.last.photoKey}`}
          className="mb-3 flex min-h-[44px] items-center gap-2 rounded-card border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-text shadow-panel hover:border-accent/50"
        >
          <GitCompareArrows size={16} strokeWidth={1.75} className="text-accent" />
          <span className="flex-1">Compare your first &amp; latest photo</span>
          <ChevronLeft size={16} className="rotate-180 text-text-muted" />
        </Link>
      )}

      {history.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-border px-4 py-10 text-center text-sm text-text-muted">
          No past missions yet. When you complete a mission and begin a new one,
          the finished one is kept here.
        </div>
      ) : (
        <ul className="space-y-2">
          {history.map((m) => (
            <MissionRow
              key={m.id}
              mission={m}
              onOpen={() => setSelectedId(m.id)}
              onDelete={() => setPendingDelete(m)}
            />
          ))}
        </ul>
      )}

      <BottomSheet open={selected !== null} onClose={() => setSelectedId(null)}>
        {selected && <MissionSummary mission={selected} />}
      </BottomSheet>

      <BottomSheet
        open={pendingDelete !== null}
        onClose={() => (deleting ? undefined : setPendingDelete(null))}
      >
        {pendingDelete && (
          <div className="px-5 pt-2 pb-5">
            <div className="text-lg font-semibold tracking-tight">
              Delete this mission?
            </div>
            <div className="mt-1 text-sm text-text-muted">
              Removes the {formatNice(pendingDelete.settings.startDate)} mission and
              its photos from this device. This can&rsquo;t be undone.
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="h-11 flex-1 rounded-card bg-failed font-medium text-surface disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function MissionRow({
  mission,
  onOpen,
  onDelete,
}: {
  mission: ArchivedMission;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const photos = sortedPhotosOf(mission);
  const firstPhoto = photos[0];
  const lastPhoto = photos.length > 1 ? photos[photos.length - 1] : undefined;
  const total = totalDays(mission.settings.durationWeeks);

  const { weightDelta, waistDeltaCm } = mission.stats;
  const waistDeltaDisplay =
    waistDeltaCm === undefined
      ? undefined
      : mission.settings.waistUnit === 'in'
        ? waistDeltaCm / CM_PER_INCH
        : waistDeltaCm;

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 pr-12 text-left shadow-panel hover:border-accent/40"
      >
        <div className="flex shrink-0 gap-1">
          <Thumb photoKey={firstPhoto?.photoKey} />
          <Thumb photoKey={lastPhoto?.photoKey} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">
            {formatNice(mission.settings.startDate)} – {formatNice(lastDayOf(mission))}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm tabular">
            {weightDelta !== undefined && (
              <span className={deltaColor(weightDelta)}>
                {formatDelta(weightDelta)} {mission.settings.weightUnit}
              </span>
            )}
            {waistDeltaDisplay !== undefined && (
              <span className={deltaColor(waistDeltaDisplay)}>
                {formatDelta(waistDeltaDisplay)} {mission.settings.waistUnit} waist
              </span>
            )}
            {weightDelta === undefined && waistDeltaDisplay === undefined && (
              <span className="text-text-muted">
                {mission.stats.perfectDays} / {total} perfect days
              </span>
            )}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete mission"
        className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-pill text-text-subtle hover:text-failed"
      >
        <Trash2 size={16} strokeWidth={1.75} />
      </button>
    </li>
  );
}

function Thumb({ photoKey }: { photoKey?: string }) {
  if (!photoKey) {
    return (
      <div className="h-14 w-11 rounded-md border border-dashed border-border bg-surface-2" />
    );
  }
  return (
    <div className="relative h-14 w-11 overflow-hidden rounded-md border border-border bg-surface-2">
      <PhotoThumb photoKey={photoKey} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function deltaColor(n: number): string {
  if (n < 0) return 'text-success';
  if (n > 0) return 'text-failed';
  return 'text-text-muted';
}

function MissionSummary({ mission }: { mission: ArchivedMission }) {
  const total = totalDays(mission.settings.durationWeeks);
  const lastDay = lastDayOf(mission);
  const photos = sortedPhotosOf(mission);
  const firstPhoto = photos[0];
  const lastPhoto = photos.length > 1 ? photos[photos.length - 1] : undefined;
  const labels = mission.settings.pillarLabels;

  const adherence = useMemo(
    () => adherenceFor(mission.days, mission.settings.startDate, lastDay),
    [mission.days, mission.settings.startDate, lastDay],
  );

  const { weightDelta, waistDeltaCm, longestStreak } = mission.stats;
  const waistDeltaDisplay =
    waistDeltaCm === undefined
      ? undefined
      : mission.settings.waistUnit === 'in'
        ? waistDeltaCm / CM_PER_INCH
        : waistDeltaCm;

  return (
    <div className="px-5 pt-2 pb-6">
      <div className="text-xs text-text-muted">
        {formatNice(mission.settings.startDate)} – {formatNice(lastDay)}
      </div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">
        {mission.settings.durationWeeks} weeks · Day {total}
      </div>

      {(weightDelta !== undefined || waistDeltaDisplay !== undefined) && (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {weightDelta !== undefined && (
            <div className={`text-4xl font-bold tabular leading-none ${deltaColor(weightDelta)}`}>
              {formatDelta(weightDelta)}
              <span className="ml-1 text-xl font-normal text-text-muted">
                {mission.settings.weightUnit}
              </span>
            </div>
          )}
          {waistDeltaDisplay !== undefined && (
            <div className={`text-2xl font-semibold tabular leading-none ${deltaColor(waistDeltaDisplay)}`}>
              {formatDelta(waistDeltaDisplay)}
              <span className="ml-1 text-sm font-normal text-text-muted">
                {mission.settings.waistUnit} waist
              </span>
            </div>
          )}
        </div>
      )}

      <section className="mt-5 rounded-card border border-border bg-surface px-4 py-4 shadow-panel">
        <div className="text-xs uppercase tracking-wider text-text-muted">Adherence</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <div className="text-4xl font-bold tabular leading-none text-text">
            {mission.stats.perfectDays}
          </div>
          <div className="text-sm text-text-muted tabular">/ {total} perfect days</div>
        </div>
        <div className="mt-2 text-sm text-text-muted tabular">
          {labels.diet} {adherence.dietPct}% · {labels.exercise} {adherence.exercisePct}% ·
          Longest streak {longestStreak}
        </div>
        <div className="mt-1 text-xs text-text-subtle tabular">
          {mission.finalXp.toLocaleString()} XP earned
        </div>
      </section>

      {firstPhoto && (
        <section className="mt-5">
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
          {firstPhoto && lastPhoto && (
            <div className="mt-2 text-center">
              <Link
                to={`/compare/${firstPhoto.photoKey}/${lastPhoto.photoKey}`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-border bg-surface px-4 text-xs font-medium text-text-muted hover:text-text"
              >
                Compare then &amp; now
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
