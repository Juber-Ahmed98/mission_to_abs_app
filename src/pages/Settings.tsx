import { useEffect, useRef, useState } from 'react';
import { useMission } from '../store/mission';
import { clearAllPhotos, getPhoto, savePhoto } from '../storage/photos';
import {
  formatBytes,
  getStorageEstimate,
  isPersisted,
  type StorageEstimate,
} from '../lib/storage';
import { DISMISS_KEY as INSTALL_DISMISS_KEY, SESSION_KEY as INSTALL_SESSION_KEY } from '../components/InstallBanner';
import type { Settings, ThemePreference, WeekPhoto } from '../types';

type ExportPayload = {
  version: number;
  settings: Settings;
  days: Record<string, unknown>;
  photos: (WeekPhoto & { base64?: string })[];
};

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

export default function SettingsPage() {
  const settings = useMission((s) => s.settings);
  const days = useMission((s) => s.days);
  const photos = useMission((s) => s.photos);
  const setSettings = useMission((s) => s.setSettings);
  const replaceAll = useMission((s) => s.replaceAll);
  const resetAll = useMission((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | 'reset' | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [persisted, setPersisted] = useState(false);

  const refreshStorage = async () => {
    const [est, pers] = await Promise.all([getStorageEstimate(), isPersisted()]);
    setStorage(est);
    setPersisted(pers);
  };

  useEffect(() => {
    refreshStorage();
  }, []);

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
      const payload: ExportPayload = { version: 2, settings, days, photos: photosOut };
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadJSON(payload, `mission-${today}.json`);
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
    if (!confirm('Replace all current data with this backup?')) return;
    setBusy('import');
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportPayload;
      if (!data?.settings || !data?.days || !Array.isArray(data.photos)) {
        alert('Invalid backup file.');
        return;
      }
      await clearAllPhotos();
      const photoMetas: WeekPhoto[] = [];
      for (const p of data.photos) {
        const { base64, ...meta } = p;
        if (base64) {
          const blob = await dataURLToBlob(base64);
          await savePhoto(meta.photoKey, blob);
        }
        photoMetas.push(meta);
      }
      replaceAll({
        settings: data.settings,
        days: data.days as never,
        photos: photoMetas,
        measurements: [],
      });
      alert('Backup restored.');
    } catch (err) {
      console.error(err);
      alert('Could not restore backup.');
    } finally {
      setBusy(null);
      refreshStorage();
    }
  };

  const onReset = async () => {
    if (!confirm('Erase all entries, photos, and settings? This cannot be undone.')) return;
    setBusy('reset');
    try {
      await clearAllPhotos();
      await useMission.persist.clearStorage();
      resetAll();
      localStorage.removeItem(INSTALL_DISMISS_KEY);
      localStorage.removeItem(INSTALL_SESSION_KEY);
      location.reload();
    } catch (err) {
      console.error(err);
      setBusy(null);
    }
  };

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
              onChange={(e) => setSettings({ startDate: e.target.value })}
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
              onChange={(v) => setSettings({ weightUnit: v })}
            />
          </Row>
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
            onClick={onReset}
            className="block h-12 w-full rounded-card border border-coral/40 bg-coral-soft px-4 text-left text-failed disabled:opacity-50"
          >
            {busy === 'reset' ? 'Resetting…' : 'Reset all data'}
          </button>
        </Section>

        <div className="pt-2 text-center text-xs text-text-subtle">
          Mission to Abs · {Object.keys(days).length} entries · {photos.length} photos
        </div>
      </div>
    </div>
  );
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
