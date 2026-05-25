import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, GitCompareArrows, Ruler } from 'lucide-react';
import { useMission } from '../store/mission';
import { savePhoto, deletePhoto } from '../storage/photos';
import { todayISO, weekNumberFor } from '../lib/date';
import { resizeImage } from '../lib/image';
import { XP } from '../lib/xp';
import PhotoThumb from '../components/PhotoThumb';
import XpToast, { type Toast } from '../components/XpToast';
import WaistInput from '../components/WaistInput';
import { showUndo } from '../components/UndoToast';
import PhotoActionSheet from '../components/PhotoActionSheet';
import PhotoViewer from '../components/PhotoViewer';

export default function PhotosPage() {
  const navigate = useNavigate();
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const addPhoto = useMission((s) => s.addPhoto);
  const removePhoto = useMission((s) => s.removePhoto);
  const setMeasurement = useMission((s) => s.setMeasurement);
  const removeMeasurement = useMission((s) => s.removeMeasurement);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);
  const [uploadIsReplace, setUploadIsReplace] = useState(false);
  const [busyWeek, setBusyWeek] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [sheetWeek, setSheetWeek] = useState<number | null>(null);
  const [viewerWeek, setViewerWeek] = useState<number | null>(null);

  const today = todayISO();
  const currentWeek = Math.max(
    1,
    Math.min(settings.durationWeeks, weekNumberFor(today, settings.startDate)),
  );
  const slots = Array.from({ length: settings.durationWeeks }, (_, i) => i + 1);

  const findPhoto = (week: number) => photos.find((p) => p.weekNumber === week);
  const filledWeeks = photos.map((p) => p.weekNumber).sort((a, b) => a - b);
  const latestFilledWeek = filledWeeks.length ? filledWeeks[filledWeeks.length - 1] : null;

  const formatWeight = (n: number) =>
    `${n.toFixed(1).replace(/\.0$/, '')} ${settings.weightUnit}`;

  const openPicker = (week: number, isReplace: boolean) => {
    setUploadingWeek(week);
    setUploadIsReplace(isReplace);
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploadingWeek == null) return;
    const week = uploadingWeek;
    const isReplace = uploadIsReplace;
    setBusyWeek(week);
    try {
      const existing = findPhoto(week);
      const isNew = !existing;
      if (existing) await deletePhoto(existing.photoKey);
      const blob = await resizeImage(file, 1600);
      const key = `week-${week}-${Date.now()}`;
      await savePhoto(key, blob);
      addPhoto({ weekNumber: week, date: today, photoKey: key });
      if (isNew && !isReplace) {
        setToast({ id: Date.now(), amount: XP.photo });
        setTimeout(() => setToast(null), 1700);
      }
      const undoLabel = isReplace
        ? `Replaced week ${week} photo`
        : `Logged week ${week} photo`;
      showUndo(undoLabel, async () => {
        await deletePhoto(key);
        removePhoto(week);
      });
    } finally {
      setBusyWeek(null);
      setUploadingWeek(null);
      setUploadIsReplace(false);
    }
  };

  const handleSlotTap = (week: number) => {
    if (busyWeek === week) return;
    const photo = findPhoto(week);
    if (photo) {
      setSheetWeek(week);
      return;
    }
    if (week <= currentWeek) openPicker(week, false);
  };

  const handleDeleteFromSheet = async (week: number) => {
    const existing = findPhoto(week);
    if (!existing) return;
    await deletePhoto(existing.photoKey);
    removePhoto(week);
    setSheetWeek(null);
  };

  const currentMeasurement = measurements.find((m) => m.weekNumber === currentWeek);
  const isCurrentInMission = currentWeek >= 1 && currentWeek <= settings.durationWeeks;

  const onWaistChange = (next: number | undefined) => {
    if (!isCurrentInMission) return;
    const prev = currentMeasurement?.waistCm;
    if (prev === next) return;
    const wasNew = prev === undefined;
    if (next === undefined) {
      removeMeasurement(currentWeek);
    } else {
      setMeasurement({ weekNumber: currentWeek, date: today, waistCm: next });
    }
    if (wasNew && next !== undefined) {
      setToast({ id: Date.now(), amount: XP.waist });
      setTimeout(() => setToast(null), 1700);
    }
    const label =
      next === undefined
        ? `Cleared week ${currentWeek} waist`
        : `Logged week ${currentWeek} waist`;
    showUndo(label, () => {
      if (prev === undefined) {
        removeMeasurement(currentWeek);
      } else {
        setMeasurement({
          weekNumber: currentWeek,
          date: currentMeasurement?.date ?? today,
          waistCm: prev,
        });
      }
    });
  };

  const startCompareWithCurrent = () => {
    if (latestFilledWeek == null) return;
    setSheetWeek(latestFilledWeek);
  };

  const sheetPhoto = sheetWeek != null ? findPhoto(sheetWeek) : null;

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="pt-8 pb-2 flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-text-muted">Photos</div>
          <div className="mt-1 text-3xl font-bold tracking-tight">Weekly</div>
        </div>
        {latestFilledWeek != null && filledWeeks.length >= 2 && (
          <button
            type="button"
            onClick={startCompareWithCurrent}
            className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs text-text hover:border-accent/40 hover:text-accent transition-colors duration-150 ease-apple"
          >
            <GitCompareArrows size={14} strokeWidth={1.75} />
            Compare with current
          </button>
        )}
      </header>

      <div className="relative">
        <XpToast toast={toast} />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        {slots.map((week) => {
          const photo = findPhoto(week);
          const isCurrent = week === currentWeek;
          const isLocked = !photo && week > currentWeek;
          const isBusy = busyWeek === week;
          const weight = photo ? days[photo.date]?.weight : undefined;
          return (
            <div key={week} className="flex flex-col">
              <button
                disabled={isLocked || isBusy}
                aria-label={photo ? `Week ${week}, logged` : `Week ${week}, empty`}
                onClick={() => handleSlotTap(week)}
                className={[
                  'relative aspect-[3/4] overflow-hidden rounded-card border bg-surface',
                  isCurrent && !photo ? 'border-accent border-dashed' : '',
                  isCurrent && photo ? 'border-accent' : '',
                  !isCurrent ? 'border-border' : '',
                  isLocked ? 'opacity-40' : '',
                  !isLocked && !isBusy ? 'active:opacity-80' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {photo && !isBusy && (
                  <PhotoThumb
                    photoKey={photo.photoKey}
                    className="absolute inset-0 h-full w-full"
                  />
                )}
                {isBusy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-2 animate-slot-shimmer">
                    <div className="text-xs text-text-muted">Saving…</div>
                  </div>
                )}
                {!photo && !isBusy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                    {isCurrent && <Camera size={20} strokeWidth={1.75} />}
                  </div>
                )}
                <div className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-2xs font-medium tracking-wide text-white">
                  W{week}
                </div>
              </button>
              {photo && weight !== undefined && (
                <div className="mt-1 text-center text-2xs tabular text-text-muted">
                  {formatWeight(weight)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isCurrentInMission && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
            <Ruler size={12} strokeWidth={1.75} />
            Week {currentWeek} waist
          </h2>
          <WaistInput
            valueCm={currentMeasurement?.waistCm}
            unit={settings.waistUnit}
            onChangeCm={onWaistChange}
          />
          {!currentMeasurement && (
            <div className="mt-2 text-xs text-text-muted">
              +{XP.waist} XP for logging this week.
            </div>
          )}
        </section>
      )}

      <PhotoActionSheet
        open={sheetWeek != null}
        week={sheetWeek}
        photoKey={sheetPhoto?.photoKey ?? null}
        filledWeeks={filledWeeks}
        onClose={() => setSheetWeek(null)}
        onView={(week) => setViewerWeek(week)}
        onReplace={(week) => openPicker(week, true)}
        onCompare={(a, b) => navigate(`/compare/${a}/${b}`)}
        onDelete={handleDeleteFromSheet}
      />

      <PhotoViewer
        open={viewerWeek != null}
        week={viewerWeek}
        photoKey={viewerWeek != null ? findPhoto(viewerWeek)?.photoKey ?? null : null}
        onClose={() => setViewerWeek(null)}
      />
    </div>
  );
}
