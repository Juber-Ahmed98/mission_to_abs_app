import { useEffect, useMemo, useRef, useState } from 'react';
import { useMission } from '../store/mission';
import { clearAllPhotos, getPhoto, savePhoto } from '../storage/photos';
import {
  formatBytes,
  getStorageEstimate,
  isPersisted,
  type StorageEstimate,
} from '../lib/storage';
import { DISMISS_KEY as INSTALL_DISMISS_KEY, SESSION_KEY as INSTALL_SESSION_KEY } from '../components/InstallBanner';
import BottomSheet from '../components/BottomSheet';
import { formatNice } from '../lib/date';
import {
  readAnalytics,
  resetAnalytics as clearAnalytics,
} from '../lib/analytics';
import type {
  DayEntry,
  Settings,
  ThemePreference,
  WeekMeasurement,
  WeekPhoto,
} from '../types';

type ExportPayload = {
  version: number;
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements?: WeekMeasurement[];
  photos: (WeekPhoto & { base64?: string })[];
};

const KG_PER_LB = 1 / 2.20462;
const LB_PER_KG = 2.20462;

function downloadJSON(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Read failed'));
    r.readAsDataURL(blob);
  });
}

async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const res = await fetch(dataURL);
  return res.blob();
}

function isValidPayload(data: unknown): data is ExportPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.settings === 'object' &&
    d.settings !== null &&
    typeof d.days === 'object' &&
    d.days !== null &&
    Array.isArray(d.photos)
  );
}

export default function SettingsPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const setSettings = useMission((s) => s.setSettings);
  const replaceAll = useMission((s) => s.replaceAll);
  const resetAll = useMission((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | 'reset' | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [persisted, setPersisted] = useState(false);

  const [resetSheetOpen, setResetSheetOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [importPreview, setImportPreview] = useState<ExportPayload | null>(null);
  const [pendingWeightUnit, setPendingWeightUnit] = useState<'kg' | 'lb' | null>(null);

  const refreshStorage = async () => {
    const [est, pers] = await Promise.all([getStorageEstimate(), isPersisted()]);
    setStorage(est);
    setPersisted(pers);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  const weightCount = useMemo(
    () => Object.values(days).filter((d) => typeof d.weight === 'number').length,
    [days],
  );

  const onExport = async () => {
    setBusy('export');
    try {
      const photosOut = await Promise.all(
        photos.map(async (p) => {
          const blob = await getPhoto(p.photoKey);
          if (!blob) return { ...p } as WeekPhoto & { base64?: string };
          const b64 = await blobToDataURL(blob);
          return { ...p, base64: b64 };
        }),
      );
      const payload: ExportPayload = {
        version: 5,
        settings,
        days,
        measurements,
        photos: photosOut,
      };
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadJSON(payload, `mission-${today}.json`);
      setSettings({ lastExportedAt: new Date().toISOString() });
    } finally {
      setBusy(null);
      refreshStorage();
    }
  };

  const onImportClick = () => {
    fileRef.current?.click();
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!isValidPayload(data)) {
        alert('Invalid backup file.');
        return;
      }
      setImportPreview(data);
    } catch (err) {
      console.error(err);
      alert('Could not read backup file.');
    }
  };

  const cancelImport = () => {
    if (busy === 'import') return;
    setImportPreview(null);
  };

  const commitImport = async () => {
    if (!importPreview) return;
    setBusy('import');
    try {
      await clearAllPhotos();
      const photoMetas: WeekPhoto[] = [];
      for (const p of importPreview.photos) {
        const { base64, ...meta } = p;
        if (base64) {
          const blob = await dataURLToBlob(base64);
          await savePhoto(meta.photoKey, blob);
        }
        photoMetas.push(meta);
      }
      replaceAll({
        settings: importPreview.settings,
        days: importPreview.days,
        photos: photoMetas,
        measurements: importPreview.measurements ?? [],
      });
      setImportPreview(null);
      alert('Backup restored.');
    } catch (err) {
      console.error(err);
      alert('Could not restore backup.');
    } finally {
      setBusy(null);
      refreshStorage();
    }
  };

  const openResetSheet = () => {
    setResetInput('');
    setResetSheetOpen(true);
  };

  const closeResetSheet = () => {
    if (busy === 'reset') return;
    setResetSheetOpen(false);
    setResetInput('');
  };

  const confirmReset = async () => {
    if (resetInput !== 'RESET') return;
    setBusy('reset');
    try {
      await clearAllPhotos();
      await useMission.persist.clearStorage();
      resetAll();
      clearAnalytics();
      localStorage.removeItem(INSTALL_DISMISS_KEY);
      localStorage.removeItem(INSTALL_SESSION_KEY);
      location.reload();
    } catch (err) {
      console.error(err);
      setBusy(null);
    }
  };

  const onExportAnalytics = () => {
    const counters = readAnalytics();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadJSON(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        counters,
      },
      `mission-analytics-${today}.json`,
    );
  };

  const setAnalyticsEnabled = (v: 'off' | 'on') => {
    const next = v === 'on';
    if (next === settings.analyticsEnabled) return;
    setSettings({ analyticsEnabled: next });
    if (!next) clearAnalytics();
  };

  const requestWeightUnitChange = (next: 'kg' | 'lb') => {
    if (next === settings.weightUnit) return;
    if (weightCount === 0 && settings.goalWeight === undefined) {
      setSettings({ weightUnit: next });
      return;
    }
    setPendingWeightUnit(next);
  };

  const cancelWeightUnitChange = () => setPendingWeightUnit(null);

  const confirmWeightUnitChange = () => {
    if (!pendingWeightUnit) return;
    const from = settings.weightUnit;
    const to = pendingWeightUnit;
    const factor = from === 'kg' && to === 'lb' ? LB_PER_KG : KG_PER_LB;
    const nextDays: Record<string, DayEntry> = {};
    for (const [date, d] of Object.entries(days)) {
      nextDays[date] =
        typeof d.weight === 'number'
          ? { ...d, weight: Math.round(d.weight * factor * 10) / 10 }
          : d;
    }
    useMission.setState((s) => ({
      days: nextDays,
      settings: {
        ...s.settings,
        weightUnit: to,
        ...(typeof s.settings.goalWeight === 'number'
          ? { goalWeight: Math.round(s.settings.goalWeight * factor * 10) / 10 }
          : {}),
      },
    }));
    setPendingWeightUnit(null);
  };

  const importEntries = importPreview ? Object.keys(importPreview.days).length : 0;
  const importPhotos = importPreview?.photos.length ?? 0;
  const importMeasurements = importPreview?.measurements?.length ?? 0;
  const importStart = importPreview?.settings?.startDate;

  return (
    <div className="pb-28 px-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <header className="pt-8 pb-5">
        <div className="text-sm text-text-muted">Settings</div>
        <div className="mt-1 text-3xl font-bold tracking-tight">Mission</div>
      </header>

      <div className="space-y-6">
        <Section title="Schedule">
          <Row label="Start date">
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => {
                if (e.target.value) setSettings({ startDate: e.target.value });
              }}
              className="h-10 rounded-card border border-border bg-surface-2 px-3 text-sm text-text outline-none"
            />
          </Row>
          <Row label="Duration">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={52}
                value={settings.durationWeeks}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n) && n > 0) setSettings({ durationWeeks: n });
                }}
                className="h-10 w-20 rounded-card border border-border bg-surface-2 px-3 text-right text-sm tabular text-text outline-none"
              />
              <span className="text-sm text-text-muted">weeks</span>
            </div>
          </Row>
        </Section>

        <Section title="Appearance">
          <Row label="Theme">
            <Segmented<ThemePreference>
              options={['light', 'dark', 'system']}
              value={settings.theme}
              onChange={(v) => setSettings({ theme: v })}
            />
          </Row>
          <Row label="Weight">
            <Segmented<'kg' | 'lb'>
              options={['kg', 'lb']}
              value={settings.weightUnit}
              onChange={requestWeightUnitChange}
            />
          </Row>
          <Row label="Waist">
            <Segmented<'cm' | 'in'>
              options={['cm', 'in']}
              value={settings.waistUnit}
              onChange={(v) => setSettings({ waistUnit: v })}
            />
          </Row>
        </Section>

        <Section title="Analytics">
          <Row label="Local analytics">
            <Segmented<'off' | 'on'>
              options={['off', 'on']}
              value={settings.analyticsEnabled ? 'on' : 'off'}
              onChange={setAnalyticsEnabled}
            />
          </Row>
          <div className="px-1 text-xs text-text-subtle">
            Counts only — never leaves device. Turning off clears stored counts.
          </div>
          <button
            type="button"
            disabled={!settings.analyticsEnabled}
            onClick={onExportAnalytics}
            className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
          >
            Export analytics
          </button>
        </Section>

        <Section title="Data">
          <StorageRow estimate={storage} persisted={persisted} />
          <button
            type="button"
            disabled={busy !== null}
            onClick={onExport}
            className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
          >
            {busy === 'export' ? 'Exporting…' : 'Export JSON'}
          </button>
          {settings.lastExportedAt && (
            <div className="px-1 text-xs text-text-subtle">
              Last export {formatRelative(settings.lastExportedAt)}.
            </div>
          )}
          <button
            type="button"
            disabled={busy !== null}
            onClick={onImportClick}
            className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
          >
            {busy === 'import' ? 'Importing…' : 'Import JSON'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
            className="hidden"
          />
        </Section>

        <Section title="Danger">
          <button
            type="button"
            disabled={busy !== null}
            onClick={openResetSheet}
            className="block h-12 w-full rounded-card border border-coral/40 bg-coral-soft px-4 text-left text-failed disabled:opacity-50"
          >
            {busy === 'reset' ? 'Resetting…' : 'Reset all data'}
          </button>
        </Section>

        <div className="pt-2 text-center text-xs text-text-subtle">
          Mission to Abs · {Object.keys(days).length} entries · {photos.length} photos
        </div>
      </div>

      <BottomSheet open={resetSheetOpen} onClose={closeResetSheet}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">Erase everything?</div>
          <div className="mt-1 text-sm text-text-muted">
            Wipes settings, daily entries, photos, and measurements. Type{' '}
            <span className="font-semibold text-text">RESET</span> to confirm.
          </div>
          <input
            type="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            value={resetInput}
            onChange={(e) => setResetInput(e.target.value)}
            placeholder="RESET"
            className="mt-4 block h-12 w-full rounded-card border border-border bg-surface-2 px-3 text-base tracking-widest tabular text-text outline-none"
          />
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={busy === 'reset'}
              onClick={closeResetSheet}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={resetInput !== 'RESET' || busy === 'reset'}
              onClick={confirmReset}
              className="h-11 flex-1 rounded-card bg-coral text-white disabled:opacity-50"
            >
              {busy === 'reset' ? 'Erasing…' : 'Erase'}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={importPreview !== null} onClose={cancelImport}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">Restore backup?</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-card border border-border bg-surface px-3 py-3">
              <div className="text-xs uppercase tracking-wider text-text-muted">Backup</div>
              <div className="mt-2 space-y-0.5 tabular text-text">
                <div>{importEntries} entries</div>
                <div>{importPhotos} photos</div>
                <div>{importMeasurements} measurements</div>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Start {importStart ? formatNice(importStart) : '—'}
              </div>
            </div>
            <div className="rounded-card border border-border bg-surface px-3 py-3">
              <div className="text-xs uppercase tracking-wider text-text-muted">Current</div>
              <div className="mt-2 space-y-0.5 tabular text-text">
                <div>{Object.keys(days).length} entries</div>
                <div>{photos.length} photos</div>
                <div>{measurements.length} measurements</div>
              </div>
              <div className="mt-2 text-xs text-text-muted">
                Start {formatNice(settings.startDate)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-failed">
            Replace overwrites all current data.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={busy === 'import'}
              onClick={cancelImport}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy === 'import'}
              onClick={commitImport}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {busy === 'import' ? 'Restoring…' : 'Replace'}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={pendingWeightUnit !== null} onClose={cancelWeightUnitChange}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">
            Convert weights to {pendingWeightUnit}?
          </div>
          <div className="mt-1 text-sm text-text-muted">
            {weightCount} stored {weightCount === 1 ? 'weight' : 'weights'}
            {typeof settings.goalWeight === 'number' ? ' and your goal' : ''} will be
            converted from {settings.weightUnit} to {pendingWeightUnit}.
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={cancelWeightUnitChange}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmWeightUnitChange}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover"
            >
              Convert
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return formatNice(iso.slice(0, 10));
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  return `${months} months ago`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-1 pb-2 text-xs uppercase tracking-wider text-text-muted">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function StorageRow({
  estimate,
  persisted,
}: {
  estimate: StorageEstimate | null;
  persisted: boolean;
}) {
  if (!estimate || estimate.quotaBytes === 0) {
    return (
      <div className="rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-muted">
        Storage usage unavailable
      </div>
    );
  }
  const pct = estimate.percent;
  const warn = pct >= 80;
  const critical = pct >= 95;
  const border = critical ? 'border-coral/60' : warn ? 'border-coral/40' : 'border-border';
  const textColor = warn ? 'text-failed' : 'text-text';
  return (
    <div className={`rounded-card border ${border} bg-surface px-4 py-3`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-sm ${textColor}`}>Storage</span>
        <span className={`text-sm tabular ${textColor}`}>
          {formatBytes(estimate.usageBytes)} / {formatBytes(estimate.quotaBytes)} ·{' '}
          {pct < 0.1 ? '<0.1' : pct.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1 text-xs text-text-subtle">
        {persisted ? 'Protected from eviction' : 'Not protected — may be cleared under storage pressure'}
      </div>
      {warn && (
        <div className="mt-1 text-xs text-failed">
          Export a backup soon — storage is filling up.
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-between rounded-card border border-border bg-surface px-4">
      <span className="text-text">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-pill border border-border bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={[
            'h-8 min-w-[44px] rounded-pill px-3 text-sm font-medium transition-colors duration-150 ease-apple',
            value === opt
              ? 'bg-bg text-text shadow-sm'
              : 'text-text-muted',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
