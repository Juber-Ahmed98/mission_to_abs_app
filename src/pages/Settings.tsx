import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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
import Segmented from '../components/SegmentedControl';
import WeeksInput from '../components/WeeksInput';
import { addDaysISO, formatNice, subDaysISO, todayISO, totalDays } from '../lib/date';
import { parseRenphoCsv, type RenphoReading } from '../lib/renphoCsv';
import { mergeBodyData } from '../lib/mergeBodyData';
import { fetchAllSince, fetchMeasurements, SyncError } from '../lib/renphoClient';
import {
  readAnalytics,
  resetAnalytics as clearAnalytics,
} from '../lib/analytics';
import {
  cancelAll as cancelAllReminders,
  getPermission,
  isTriggerSupported,
  requestPermission,
} from '../lib/notifications';
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
  const history = useMission((s) => s.history);
  const setSettings = useMission((s) => s.setSettings);
  const replaceAll = useMission((s) => s.replaceAll);
  const resetAll = useMission((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<
    'export' | 'import' | 'reset' | 'renpho' | 'sync' | 'backfill' | null
  >(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [persisted, setPersisted] = useState(false);

  const [resetSheetOpen, setResetSheetOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [importPreview, setImportPreview] = useState<ExportPayload | null>(null);
  const [renphoPreview, setRenphoPreview] = useState<{
    readings: RenphoReading[];
    filledInWindow: number;
    filledOutsideWindow: number;
    skippedManual: number;
  } | null>(null);
  const [backfillPreview, setBackfillPreview] = useState<{
    readings: RenphoReading[];
    syncedAt: string;
    willFill: number;
    willUpdateSynced: number;
    skippedManual: number;
    filledInWindow: number;
    filledOutsideWindow: number;
  } | null>(null);
  const [pendingWeightUnit, setPendingWeightUnit] = useState<'kg' | 'lb' | null>(null);
  const [reminderHint, setReminderHint] = useState<string | null>(null);
  const triggerSupported = useMemo(() => isTriggerSupported(), []);

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
        // v6 — DayEntry now carries bodyFat + weight/bodyFat provenance. Whole
        // DayEntry objects are serialized, so the new fields round-trip for
        // free; isValidPayload is version-agnostic, so older backups still load.
        version: 6,
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

  // Mission window (inclusive) — used to bucket the import preview into days
  // inside this mission vs. older readings that get stored but not shown.
  const missionEnd = useMemo(
    () => addDaysISO(settings.startDate, totalDays(settings.durationWeeks) - 1),
    [settings.startDate, settings.durationWeeks],
  );

  const onRenphoImportClick = () => {
    csvRef.current?.click();
  };

  const onRenphoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const readings = parseRenphoCsv(text);
      if (readings.length === 0) {
        alert('No weight or body-fat readings found in that file.');
        return;
      }
      const result = mergeBodyData(days, readings, {
        weightUnit: settings.weightUnit,
        startDate: settings.startDate,
        endDate: missionEnd,
      });
      setRenphoPreview({
        readings,
        filledInWindow: result.filledInWindow,
        filledOutsideWindow: result.filledOutsideWindow,
        skippedManual: result.skippedManual,
      });
    } catch (err) {
      console.error(err);
      alert('Could not read that Renpho export.');
    }
  };

  const cancelRenphoImport = () => {
    if (busy === 'renpho') return;
    setRenphoPreview(null);
  };

  const commitRenphoImport = () => {
    if (!renphoPreview) return;
    setBusy('renpho');
    try {
      // Recompute against the freshest day map so nothing typed between preview
      // and confirm is lost; merge stays idempotent and manual-safe.
      const latest = useMission.getState().days;
      const result = mergeBodyData(latest, renphoPreview.readings, {
        weightUnit: settings.weightUnit,
        startDate: settings.startDate,
        endDate: missionEnd,
      });
      useMission.setState(() => ({ days: result.days }));
      setRenphoPreview(null);
    } finally {
      setBusy(null);
      refreshStorage();
    }
  };

  const setRenphoEnabled = (v: 'off' | 'on') => {
    const enabled = v === 'on';
    if (enabled === settings.renphoSync.enabled) return;
    setSyncError(null);
    setSyncMsg(null);
    setSettings({ renphoSync: { ...settings.renphoSync, enabled } });
  };

  const setRenphoToken = (token: string) => {
    setSyncError(null);
    setSettings({ renphoSync: { ...settings.renphoSync, syncToken: token.trim() } });
  };

  const onSyncNow = async () => {
    const { syncToken, lastSyncedAt } = settings.renphoSync;
    if (!syncToken) {
      setSyncError('Add your sync token first.');
      return;
    }
    setBusy('sync');
    setSyncError(null);
    setSyncMsg(null);
    try {
      // Incremental: re-fetch from the last sync's day (idempotent merge makes
      // re-grabbing that day harmless), or a 30-day look-back on first sync.
      const since = lastSyncedAt ? lastSyncedAt.slice(0, 10) : subDaysISO(todayISO(), 30);
      const { readings, syncedAt } = await fetchMeasurements(since, syncToken);
      // Merge against the freshest day map through the same manual-wins path the
      // CSV importer uses, so nothing typed by hand is ever clobbered.
      const latest = useMission.getState().days;
      const result = mergeBodyData(latest, readings, {
        weightUnit: settings.weightUnit,
        startDate: settings.startDate,
        endDate: missionEnd,
      });
      const filled = result.filledInWindow + result.filledOutsideWindow;
      useMission.setState(() => ({ days: result.days }));
      setSettings({ renphoSync: { ...settings.renphoSync, lastSyncedAt: syncedAt } });
      setSyncMsg(
        filled > 0
          ? `Synced — ${filled} ${filled === 1 ? 'day' : 'days'} updated.`
          : 'Already up to date.',
      );
    } catch (err) {
      // Graceful failure: surface a quiet message, keep all local data intact.
      setSyncError(err instanceof SyncError ? err.message : 'Sync failed. Try again.');
    } finally {
      setBusy(null);
      refreshStorage();
    }
  };

  // Tier 2 — pull the full history since the mission start and preview the diff
  // before writing. Same manual-wins merge path; the only difference from "Sync
  // now" is the look-back (the whole mission, not a recent window) and the
  // confirm step.
  const onSyncHistory = async () => {
    const { syncToken } = settings.renphoSync;
    if (!syncToken) {
      setSyncError('Add your sync token first.');
      return;
    }
    setBusy('backfill');
    setSyncError(null);
    setSyncMsg(null);
    try {
      const { readings, syncedAt } = await fetchAllSince(settings.startDate, syncToken);
      const result = mergeBodyData(days, readings, {
        weightUnit: settings.weightUnit,
        startDate: settings.startDate,
        endDate: missionEnd,
      });
      setBackfillPreview({
        readings,
        syncedAt,
        willFill: result.willFill,
        willUpdateSynced: result.willUpdateSynced,
        skippedManual: result.skippedManual,
        filledInWindow: result.filledInWindow,
        filledOutsideWindow: result.filledOutsideWindow,
      });
    } catch (err) {
      setSyncError(err instanceof SyncError ? err.message : 'Sync failed. Try again.');
    } finally {
      setBusy(null);
    }
  };

  const cancelBackfill = () => {
    if (busy === 'backfill') return;
    setBackfillPreview(null);
  };

  const commitBackfill = () => {
    if (!backfillPreview) return;
    setBusy('backfill');
    try {
      // Recompute against the freshest day map so nothing typed between preview
      // and confirm is lost; the merge stays idempotent and manual-safe.
      const latest = useMission.getState().days;
      const result = mergeBodyData(latest, backfillPreview.readings, {
        weightUnit: settings.weightUnit,
        startDate: settings.startDate,
        endDate: missionEnd,
      });
      const filled = result.willFill + result.willUpdateSynced;
      useMission.setState(() => ({ days: result.days }));
      // Advance the sync cursor so a later "Sync now" only grabs newer days.
      setSettings({ renphoSync: { ...settings.renphoSync, lastSyncedAt: backfillPreview.syncedAt } });
      setBackfillPreview(null);
      setSyncMsg(
        filled > 0
          ? `History synced — ${filled} ${filled === 1 ? 'day' : 'days'} updated.`
          : 'History already complete.',
      );
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

  const setReminderToggle = async (
    kind: 'morning' | 'evening',
    v: 'off' | 'on',
  ) => {
    const next = v === 'on';
    const current = settings.notifications[kind];
    if (next === current) return;

    if (!next) {
      const updated = { ...settings.notifications, [kind]: false };
      setSettings({ notifications: updated });
      if (!updated.morning && !updated.evening) {
        await cancelAllReminders();
      }
      setReminderHint(null);
      return;
    }

    if (triggerSupported) {
      let perm = getPermission();
      if (perm === 'default') {
        perm = await requestPermission();
      }
      if (perm !== 'granted') {
        setReminderHint('Permission denied. Enable notifications in browser settings.');
        return;
      }
    }
    setReminderHint(null);
    const updated = { ...settings.notifications, [kind]: true };
    setSettings({ notifications: updated });
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

  const renphoFilled = renphoPreview
    ? renphoPreview.filledInWindow + renphoPreview.filledOutsideWindow
    : 0;

  const backfillTotal = backfillPreview
    ? backfillPreview.willFill + backfillPreview.willUpdateSynced
    : 0;

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
            <WeeksInput
              value={settings.durationWeeks}
              onChange={(n) => setSettings({ durationWeeks: n })}
            />
          </Row>
        </Section>

        <Section title="Pillars">
          <Row label="Pillar 1">
            <PillarLabelInput
              value={settings.pillarLabels.diet}
              fallback="Diet"
              onChange={(v) =>
                setSettings({
                  pillarLabels: { ...settings.pillarLabels, diet: v },
                })
              }
            />
          </Row>
          <Row label="Pillar 2">
            <PillarLabelInput
              value={settings.pillarLabels.exercise}
              fallback="Exercise"
              onChange={(v) =>
                setSettings({
                  pillarLabels: { ...settings.pillarLabels, exercise: v },
                })
              }
            />
          </Row>
          <div className="px-1 text-xs text-text-subtle">
            Rename your two daily pillars. Only the labels change — your history
            stays intact.
          </div>
        </Section>

        <Section title="Reminders">
          <Row label="Morning quote — 7:00 AM">
            <Segmented<'off' | 'on'>
              options={['off', 'on']}
              value={settings.notifications.morning ? 'on' : 'off'}
              onChange={(v) => setReminderToggle('morning', v)}
            />
          </Row>
          <Row label="Evening reflection — 8:00 PM">
            <Segmented<'off' | 'on'>
              options={['off', 'on']}
              value={settings.notifications.evening ? 'on' : 'off'}
              onChange={(v) => setReminderToggle('evening', v)}
            />
          </Row>
          {!triggerSupported && (
            <div className="px-1 text-xs text-text-subtle">
              On this device, reminders show when you open the app.
            </div>
          )}
          {reminderHint && (
            <div className="px-1 text-xs text-failed">{reminderHint}</div>
          )}
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
          <Link
            to="/history"
            className="flex h-12 w-full items-center justify-between rounded-card border border-border bg-surface px-4 text-text hover:border-accent/40"
          >
            <span>Past missions</span>
            <span className="flex items-center gap-1 text-sm tabular text-text-muted">
              {history.length}
              <ChevronRight size={16} strokeWidth={1.75} />
            </span>
          </Link>
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
          <button
            type="button"
            disabled={busy !== null}
            onClick={onRenphoImportClick}
            className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
          >
            {busy === 'renpho' ? 'Importing…' : 'Import from Renpho export'}
          </button>
          <div className="px-1 text-xs text-text-subtle">
            Reads weight + body fat from the CSV the Renpho app exports. Values
            you typed by hand are never overwritten.
          </div>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onRenphoFile}
            className="hidden"
          />
        </Section>

        <Section title="Body-data sync">
          <Row label="Sync from Renpho">
            <Segmented<'off' | 'on'>
              options={['off', 'on']}
              value={settings.renphoSync.enabled ? 'on' : 'off'}
              onChange={setRenphoEnabled}
            />
          </Row>
          {settings.renphoSync.enabled ? (
            <>
              <div className="rounded-card border border-border bg-surface px-4 py-3">
                <label htmlFor="renpho-token" className="block text-sm text-text">
                  Sync token
                </label>
                <input
                  id="renpho-token"
                  type="password"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={settings.renphoSync.syncToken}
                  onChange={(e) => setRenphoToken(e.target.value)}
                  placeholder="Paste your sync token"
                  className="mt-2 block h-11 w-full rounded-card border border-border bg-surface-2 px-3 text-sm text-text outline-none"
                />
                <div className="mt-2 text-xs text-text-subtle">
                  The one-time secret that authorizes this device. Your Renpho
                  password is never stored here.
                </div>
              </div>
              <button
                type="button"
                disabled={busy !== null || !settings.renphoSync.syncToken}
                onClick={onSyncNow}
                className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
              >
                {busy === 'sync' ? 'Syncing…' : 'Sync now'}
              </button>
              <button
                type="button"
                disabled={busy !== null || !settings.renphoSync.syncToken}
                onClick={onSyncHistory}
                className="block h-12 w-full rounded-card border border-border bg-surface px-4 text-left text-text disabled:opacity-50"
              >
                {busy === 'backfill' ? 'Checking…' : 'Sync full history'}
              </button>
              {settings.renphoSync.lastSyncedAt && (
                <div className="px-1 text-xs text-text-subtle">
                  Last synced {formatRelative(settings.renphoSync.lastSyncedAt)}.
                </div>
              )}
              {syncMsg && <div className="px-1 text-xs text-text-muted">{syncMsg}</div>}
              {syncError && <div className="px-1 text-xs text-failed">{syncError}</div>}
              <div className="px-1 text-xs text-text-subtle">
                Sync now pulls your latest weigh-in; Sync full history backfills
                every day since the mission start. Values you typed by hand are
                never overwritten.
              </div>
            </>
          ) : (
            <div className="px-1 text-xs text-text-subtle">
              Off by default. Turn on to pull weight + body fat from your Renpho
              scale on demand. The app works fully without it.
            </div>
          )}
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

      <BottomSheet open={renphoPreview !== null} onClose={cancelRenphoImport}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">Import Renpho data?</div>
          <div className="mt-1 text-sm text-text-muted">
            {renphoPreview?.readings.length ?? 0} daily{' '}
            {(renphoPreview?.readings.length ?? 0) === 1 ? 'reading' : 'readings'} read
            from the file.
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text">Days filled</span>
              <span className="tabular text-text">{renphoFilled}</span>
            </div>
            <div className="flex items-center justify-between pl-3 text-xs text-text-muted">
              <span>In this mission</span>
              <span className="tabular">{renphoPreview?.filledInWindow ?? 0}</span>
            </div>
            <div className="flex items-center justify-between pl-3 text-xs text-text-muted">
              <span>Outside it (stored, not shown)</span>
              <span className="tabular">{renphoPreview?.filledOutsideWindow ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">Skipped — entered by hand</span>
              <span className="tabular text-text">{renphoPreview?.skippedManual ?? 0}</span>
            </div>
          </div>
          {renphoFilled === 0 && (
            <div className="mt-3 text-xs text-text-subtle">
              Nothing new to import — everything in this file is already up to date.
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={busy === 'renpho'}
              onClick={cancelRenphoImport}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy === 'renpho' || renphoFilled === 0}
              onClick={commitRenphoImport}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {busy === 'renpho' ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={backfillPreview !== null} onClose={cancelBackfill}>
        <div className="px-5 pt-2 pb-5">
          <div className="text-lg font-semibold tracking-tight">Sync full history?</div>
          <div className="mt-1 text-sm text-text-muted">
            {backfillPreview?.readings.length ?? 0} daily{' '}
            {(backfillPreview?.readings.length ?? 0) === 1 ? 'reading' : 'readings'} since{' '}
            {formatNice(settings.startDate)}.
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text">New days filled</span>
              <span className="tabular text-text">{backfillPreview?.willFill ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">Refreshed — already synced</span>
              <span className="tabular text-text">{backfillPreview?.willUpdateSynced ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text">Skipped — entered by hand</span>
              <span className="tabular text-text">{backfillPreview?.skippedManual ?? 0}</span>
            </div>
          </div>
          {(backfillPreview?.filledOutsideWindow ?? 0) > 0 && (
            <div className="mt-3 text-xs text-text-subtle">
              {backfillPreview?.filledOutsideWindow} of these fall outside the current
              mission — stored, but not shown on Journey or Progress.
            </div>
          )}
          {backfillTotal === 0 && (
            <div className="mt-3 text-xs text-text-subtle">
              Nothing to backfill — your history is already complete.
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={busy === 'backfill'}
              onClick={cancelBackfill}
              className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy === 'backfill' || backfillTotal === 0}
              onClick={commitBackfill}
              className="h-11 flex-1 rounded-card bg-accent text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {busy === 'backfill' ? 'Syncing…' : 'Sync'}
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

const PILLAR_MAX = 16;

// Debounced text input for a pillar label (mirrors WeeksInput): trims, caps
// length, and falls back to the default name when emptied.
function PillarLabelInput({
  value,
  fallback,
  onChange,
}: {
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => {
      const trimmed = local.trim().slice(0, PILLAR_MAX);
      if (trimmed && trimmed !== value) onChangeRef.current(trimmed);
    }, 350);
    return () => clearTimeout(id);
  }, [local, value]);

  return (
    <input
      type="text"
      value={local}
      maxLength={PILLAR_MAX}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const trimmed = local.trim().slice(0, PILLAR_MAX);
        if (!trimmed) {
          setLocal(fallback);
          onChangeRef.current(fallback);
        } else {
          setLocal(trimmed);
          if (trimmed !== value) onChangeRef.current(trimmed);
        }
      }}
      className="h-10 w-40 rounded-card border border-border bg-surface-2 px-3 text-right text-sm text-text outline-none"
    />
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
