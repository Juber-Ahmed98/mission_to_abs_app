// Client for the Renpho sync proxy (the Vercel Function in api/renpho).
//
// This is the only place the PWA talks to the backend. It calls the one
// contracted endpoint with the shared-secret token, then maps the normalized
// response into the exact `RenphoReading` shape the CSV importer produces — so
// synced data flows through the *same* `mergeBodyData` manual-wins merge path.
//
// The Renpho password never touches the client; only the user-pasted sync token
// (the access gate for the public URL) is sent, as the `x-sync-token` header.

import { format } from 'date-fns';
import type { RenphoReading } from './renphoCsv';

const ENDPOINT = '/api/renpho/measurements';

// The proxy's JSON contract (see api/renpho/measurements.ts).
type ContractReading = {
  date: string;
  ts: number;
  weightKg: number;
  bodyFat: number | null;
};
type Contract = {
  syncedAt: string;
  unit: string;
  readings: ContractReading[];
};

export type SyncResult = {
  readings: RenphoReading[];
  syncedAt: string;
};

// A user-facing, already-friendly message — safe to render verbatim. Keeps the
// caller from having to interpret HTTP status codes.
export class SyncError extends Error {}

// Render an epoch-seconds instant as the *device-local* calendar day. The proxy's
// `date` is derived server-side from Renpho's own wall-clock field, whose timezone
// we don't control — it sits ahead of the user's, which tips an evening weigh-in
// onto the following calendar day (the reading then lands one day late on the
// home screen and one day ahead on the chart). `ts` is a true UTC epoch, so
// formatting it here yields the day the user actually stood on the scale — the
// same local "today" that `todayISO` and the Dashboard key on. Falls back to the
// server's date only when no usable timestamp is present.
function localDateFromTs(ts: number, fallback: string): string {
  if (!Number.isFinite(ts) || ts <= 0) return fallback;
  return format(new Date(ts * 1000), 'yyyy-MM-dd');
}

// Collapse the contract's per-measurement rows to one reading per calendar day,
// keeping the latest `ts` for that day (the deterministic "latest of day" pick).
// The proxy can return several measurements for a single day; merging both would
// let an older one clobber the newer, so we resolve it here at the boundary —
// the same shape the CSV importer produces — before anything reaches the merge.
function toDailyReadings(rows: ContractReading[]): RenphoReading[] {
  const byDate = new Map<string, { ts: number; reading: RenphoReading }>();
  for (const r of rows) {
    if (!r || typeof r.date !== 'string') continue;
    const ts = typeof r.ts === 'number' ? r.ts : 0;
    const date = localDateFromTs(ts, r.date);
    const reading: RenphoReading = {
      date,
      weightKg: typeof r.weightKg === 'number' ? r.weightKg : null,
      bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : null,
    };
    const prev = byDate.get(date);
    if (!prev || ts > prev.ts) byDate.set(date, { ts, reading });
  }
  return Array.from(byDate.values()).map((v) => v.reading);
}

// The shared GET: hit the one endpoint with the sync-token header, map every
// failure to a friendly SyncError, and return daily readings + the server's
// sync timestamp. `since` is an ISO date (or null for "everything the server
// offers"). On any throw the caller leaves all local data untouched.
async function pull(since: string | null, token: string): Promise<SyncResult> {
  if (!token) throw new SyncError('Add your sync token first.');

  const url = since ? `${ENDPOINT}?since=${encodeURIComponent(since)}` : ENDPOINT;

  let res: Response;
  try {
    res = await fetch(url, { headers: { 'x-sync-token': token } });
  } catch {
    throw new SyncError('Could not reach the sync server. Check your connection.');
  }

  if (res.status === 401) {
    throw new SyncError('Sync token was rejected. Check it in Settings.');
  }
  if (!res.ok) {
    throw new SyncError(await errorDetail(res));
  }

  let data: Contract;
  try {
    data = (await res.json()) as Contract;
  } catch {
    throw new SyncError('Sync returned an unreadable response.');
  }

  return {
    readings: toDailyReadings(data.readings ?? []),
    syncedAt: data.syncedAt ?? new Date().toISOString(),
  };
}

/**
 * Pull recent readings on or after `since` (an ISO date, or null for everything
 * the server offers). Used by the on-demand "Sync now" with a short look-back.
 */
export function fetchMeasurements(since: string | null, token: string): Promise<SyncResult> {
  return pull(since, token);
}

/**
 * Pull the *full* history on or after `startDate` for the historical backfill.
 * The proxy paginates the Renpho cursor to completion server-side, so this is a
 * single request that returns every day since the mission start.
 */
export function fetchAllSince(startDate: string, token: string): Promise<SyncResult> {
  return pull(startDate, token);
}

// Pull a clean message out of the proxy's `{ error }` body when present.
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown };
    if (typeof body.error === 'string' && body.error) return body.error;
  } catch {
    // fall through
  }
  return `Sync failed (HTTP ${res.status}).`;
}
