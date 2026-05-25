import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Ruler } from 'lucide-react';
import { useMission } from '../store/mission';
import { savePhoto, deletePhoto } from '../storage/photos';
import { todayISO, weekNumberFor } from '../lib/date';
import { resizeImage } from '../lib/image';
import { XP } from '../lib/xp';
import PhotoThumb from '../components/PhotoThumb';
import XpToast, { type Toast } from '../components/XpToast';
import WaistInput from '../components/WaistInput';
import { showUndo } from '../components/UndoToast';

export default function PhotosPage() {
  const navigate = useNavigate();
  const settings = useMission((s) => s.settings);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const addPhoto = useMission((s) => s.addPhoto);
  const removePhoto = useMission((s) => s.removePhoto);
  const setMeasurement = useMission((s) => s.setMeasurement);
  const removeMeasurement = useMission((s) => s.removeMeasurement);

  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const today = todayISO();
  const currentWeek = Math.max(
    1,
    Math.min(settings.durationWeeks, weekNumberFor(today, settings.startDate)),
  );
  const slots = Array.from({ length: settings.durationWeeks }, (_, i) => i + 1);

  const findPhoto = (week: number) => photos.find((p) => p.weekNumber === week);

  const openPicker = (week: number) => {
    setUploadingWeek(week);
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploadingWeek == null) return;
    const week = uploadingWeek;
    setBusy(true);
    try {
      const existing = findPhoto(week);
      const isNew = !existing;
      if (existing) await deletePhoto(existing.photoKey);
      const blob = await resizeImage(file, 1600);
      const key = `week-${week}-${Date.now()}`;
      await savePhoto(key, blob);
      addPhoto({ weekNumber: week, date: today, photoKey: key });
      if (isNew) {
        setToast({ id: Date.now(), amount: XP.photo });
        setTimeout(() => setToast(null), 1700);
      }
      showUndo(`Logged week ${week} photo`, async () => {
        await deletePhoto(key);
        removePhoto(week);
      });
    } finally {
      setBusy(false);
      setUploadingWeek(null);
    }
  };

  const tapSlot = (week: number) => {
    const has = !!findPhoto(week);
    if (!has) {
      if (week <= currentWeek) openPicker(week);
      return;
    }
    setSelected((prev) => {
      if (prev.includes(week)) return prev.filter((w) => w !== week);
      const next = [...prev, week];
      if (next.length === 2) {
        const [a, b] = next.sort((x, y) => x - y);
        navigate(`/compare/${a}/${b}`);
        return [];
      }
      return next;
    });
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

  const longPressDelete = async (week: number) => {
    const existing = findPhoto(week);
    if (!existing) return;
    if (!confirm(`Delete photo for week ${week}?`)) return;
    await deletePhoto(existing.photoKey);
    removePhoto(week);
    setSelected((prev) => prev.filter((w) => w !== week));
  };

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="pt-8 pb-2 flex items-end justify-between">
        <div>
          <div className="text-sm text-text-muted">Photos</div>
          <div className="mt-1 text-3xl font-bold tracking-tight">Weekly</div>
        </div>
        {selected.length === 1 && (
          <div className="text-xs text-text-muted">Tap another to compare</div>
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
          const isSelected = selected.includes(week);
          const isCurrent = week === currentWeek;
          const isLocked = !photo && week > currentWeek;
          return (
            <button
              key={week}
              disabled={isLocked}
              aria-label={photo ? `Week ${week}, logged` : `Week ${week}, empty`}
              onClick={() => tapSlot(week)}
              onContextMenu={(e) => {
                e.preventDefault();
                longPressDelete(week);
              }}
              className={[
                'relative aspect-[3/4] overflow-hidden rounded-card border bg-surface',
                isSelected ? 'border-accent ring-2 ring-accent' : 'border-border',
                isCurrent && !photo ? 'border-accent border-dashed' : '',
                isCurrent && photo ? 'border-accent' : '',
                isLocked ? 'opacity-40' : 'active:opacity-80',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {photo ? (
                <PhotoThumb photoKey={photo.photoKey} className="absolute inset-0 h-full w-full" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted">
                  {isCurrent && !busy && <Camera size={20} strokeWidth={1.75} />}
                  {isCurrent && busy && <div className="text-xs">Saving…</div>}
                </div>
              )}
              <div className="absolute left-2 top-2 rounded-md bg-black/45 px-1.5 py-0.5 text-2xs font-medium tracking-wide text-white">
                W{week}
              </div>
            </button>
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
    </div>
  );
}
