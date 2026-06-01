// Client for the Renpho sync proxy (the Vercel Function in api/renpho).
//
// This is the only place the PWA talks to the backend. It calls the one
// contracted endpoint with the shared-secret token, then maps the normalized
// response into the exact `RenphoReading` shape the CSV importer produces — so
// synced data flows through the *same* `mergeBodyData` manual-wins merge path.
//
// The Renpho password never touches the client; only the user-pasted sync token
// (the access gate for the public URL) is sent, as the `x-sync-token` header.

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

/**
 * Pull readings from the proxy. `since` is an ISO date (or null for "everything
 * the server offers"); only readings on or after it are returned. Throws
 * SyncError with a friendly message on any failure — the caller shows it inline
 * and leaves all local data untouched.
 */
export async function fetchMeasurements(
  since: string | null,
  token: string,
): Promise<SyncResult> {
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

  const readings: RenphoReading[] = (data.readings ?? []).map((r) => ({
    date: r.date,
    weightKg: typeof r.weightKg === 'number' ? r.weightKg : null,
    bodyFat: typeof r.bodyFat === 'number' ? r.bodyFat : null,
  }));

  return { readings, syncedAt: data.syncedAt ?? new Date().toISOString() };
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
