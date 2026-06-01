// Reverse-engineered Renpho cloud client (server-side only).
//
// Renpho publishes no official API. This re-implements, in ~TypeScript, the same
// private calls the Renpho phone app makes against `renpho.qnclouds.com` — the
// approach used by the community `renpho-api` / `hass-renpho` projects. It is
// UNOFFICIAL and can break without notice; manual entry (Tier 0) stays the floor.
//
// It runs only on the backend (a Vercel Function) so the Renpho credentials and
// this logic never reach the browser. The single client-facing contract is the
// normalized `Reading[]` returned by `fetchReadings`.
//
// Flow:
//   1. POST sign_in.json  — password RSA-encrypted with Renpho's public key →
//      `terminal_user_session_key` (session token) + the account `id`.
//   2. GET  list_scale_user — resolve which profile's `user_id` to read.
//   3. GET  measurements/list.json — readings since a cursor (`last_at`).
//
// Field facts (from the live payload / community models): `weight` is kilograms,
// `bodyfat` is a plain percent (optional), `time_stamp` is epoch seconds (UTC),
// and `local_created_at` is the wall-clock time at weigh-in — the most faithful
// source for "which calendar day was this".

import crypto from 'node:crypto';

// Renpho's hardcoded RSA-1024 *public* key (safe to embed — it only encrypts).
// The app encrypts the password with PKCS#1 v1.5 padding and base64s the result,
// which is why the ciphertext rotates on every login despite the same password.
const RENPHO_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+25I2upukpfQ7rIaaTZtVE744
u2zV+HaagrUhDOTq8fMVf9yFQvEZh2/HKxFudUxP0dXUa8F6X4XmWumHdQnum3zm
Jr04fz2b2WCcN0ta/rbF2nYAnMVAk2OJVZAMudOiMWhcxV1nNJiKgTNNr13de0EQ
IiOL2CUBzu+HmIfUbQIDAQAB
-----END PUBLIC KEY-----`;

const SIGN_IN_URL = 'https://renpho.qnclouds.com/api/v3/users/sign_in.json?app_id=Renpho';
const SCALE_USERS_URL = 'https://renpho.qnclouds.com/api/v3/scale_users/list_scale_user';
const MEASUREMENTS_URL = 'https://renpho.qnclouds.com/api/v2/measurements/list.json';

// The Renpho app identifies itself with this UA; some edge nodes are picky.
const USER_AGENT = 'Renpho/2.1.0 (iPhone; iOS 14.4; Scale/2.1.0; en-US)';
const DEFAULT_TIMEOUT_MS = 15000;

export type RenphoCredentials = {
  email: string;
  password: string;
  // Optional profile override; otherwise resolved from the scale's user list,
  // falling back to the account id from the login response.
  userId?: string;
};

// The single normalized shape the rest of the system consumes. Mirrors the CSV
// importer's reading so both feed the exact same merge path downstream.
export type Reading = {
  date: string; // local ISO YYYY-MM-DD (the weigh-in day)
  ts: number; // epoch seconds (UTC), for deterministic ordering / dedupe
  weightKg: number;
  bodyFat: number | null;
};

// Distinguish "their fault / config" (auth, bad creds) from "upstream hiccup"
// so the handler can map each to a sensible HTTP status without leaking detail.
export class RenphoAuthError extends Error {}
export class RenphoUpstreamError extends Error {}

// Encrypt the password exactly as the app does: RSA / PKCS#1 v1.5, base64.
export function encryptPassword(password: string): string {
  return crypto
    .publicEncrypt(
      { key: RENPHO_PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      new TextEncoder().encode(password),
    )
    .toString('base64');
}

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    throw new RenphoUpstreamError(aborted ? 'Renpho request timed out.' : 'Renpho unreachable.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new RenphoUpstreamError(`Renpho returned HTTP ${res.status}.`);
  }
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    throw new RenphoUpstreamError('Renpho returned a non-JSON response.');
  }
}

function isOk(parsed: Record<string, unknown>): boolean {
  return parsed.status_code === '20000' && parsed.status_message === 'ok';
}

// Step 1 — authenticate, returning the session token + the account id.
async function signIn(creds: RenphoCredentials): Promise<{ token: string; accountId: string }> {
  const body = JSON.stringify({
    secure_flag: '1',
    email: creds.email,
    password: encryptPassword(creds.password),
  });
  const parsed = await fetchJson(SIGN_IN_URL, { method: 'POST', body });

  const token = parsed.terminal_user_session_key;
  if (!isOk(parsed) || typeof token !== 'string' || token === '') {
    // Renpho signals bad email/password via status_message; surface as auth.
    const msg = typeof parsed.status_message === 'string' ? parsed.status_message : 'unknown';
    throw new RenphoAuthError(`Renpho sign-in failed (${msg}).`);
  }
  const accountId = parsed.id;
  return { token, accountId: accountId == null ? '' : String(accountId) };
}

// Step 2 — pick the profile to read. Explicit override wins; otherwise the first
// scale profile; otherwise the login account id. Failure here is non-fatal — we
// fall back to the account id so a single-profile scale still works.
async function resolveUserId(
  token: string,
  accountId: string,
  configuredId?: string,
): Promise<string> {
  if (configuredId) return configuredId;
  try {
    const url = `${SCALE_USERS_URL}?locale=en&app_id=Renpho&terminal_user_session_key=${encodeURIComponent(token)}`;
    const parsed = await fetchJson(url, { method: 'GET' });
    const users = parsed.scale_users;
    if (Array.isArray(users) && users.length > 0) {
      const id = (users[0] as Record<string, unknown>).user_id;
      if (id != null && String(id) !== '') return String(id);
    }
  } catch {
    // Ignore — fall through to the account id below.
  }
  return accountId;
}

// `local_created_at` is wall-clock at weigh-in ("2025-12-26 08:23:40"); its date
// is exactly the user's calendar day. Fall back to the epoch (UTC) if absent.
function readingDate(raw: Record<string, unknown>, ts: number): string {
  const local = raw.local_created_at;
  if (typeof local === 'string') {
    const m = local.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    }
  }
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function asNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

// Map one raw Renpho measurement to the normalized contract, or null if it has
// no usable weight (a body-fat-only or empty row is dropped). Body fat of 0 or
// missing → null (a failed impedance read, not a real 0%).
function normalizeReading(raw: Record<string, unknown>): Reading | null {
  const ts = asNumber(raw.time_stamp);
  const weightKg = asNumber(raw.weight);
  if (ts === null || weightKg === null || weightKg <= 0) return null;
  const bf = asNumber(raw.bodyfat);
  return {
    date: readingDate(raw, ts),
    ts,
    weightKg,
    bodyFat: bf !== null && bf > 0 ? bf : null,
  };
}

// Step 3 — list measurements newer than `lastAt` (epoch seconds). Renpho returns
// them under `last_ary`; we accept `measurements` too for resilience.
async function listMeasurements(
  token: string,
  userId: string,
  lastAt: number,
): Promise<Reading[]> {
  const url =
    `${MEASUREMENTS_URL}?user_id=${encodeURIComponent(userId)}` +
    `&last_at=${lastAt}&locale=en&app_id=Renpho` +
    `&terminal_user_session_key=${encodeURIComponent(token)}`;
  const parsed = await fetchJson(url, { method: 'GET' });
  if (parsed.status_code !== '20000') {
    const msg = typeof parsed.status_message === 'string' ? parsed.status_message : 'unknown';
    throw new RenphoUpstreamError(`Renpho measurements error (${msg}).`);
  }
  const rawList = (Array.isArray(parsed.last_ary) && parsed.last_ary) ||
    (Array.isArray(parsed.measurements) && parsed.measurements) ||
    [];
  const readings: Reading[] = [];
  for (const item of rawList as unknown[]) {
    if (item && typeof item === 'object') {
      const r = normalizeReading(item as Record<string, unknown>);
      if (r) readings.push(r);
    }
  }
  // Newest first, matching the contract and the CSV importer's expectations.
  return readings.sort((a, b) => b.ts - a.ts);
}

/**
 * The one entry point: log in, resolve the profile, and return normalized
 * readings on or after `sinceEpoch` (epoch seconds), newest first. Stateless —
 * a fresh session per call. Throws RenphoAuthError / RenphoUpstreamError.
 */
export async function fetchReadings(
  creds: RenphoCredentials,
  sinceEpoch: number,
): Promise<Reading[]> {
  const { token, accountId } = await signIn(creds);
  const userId = await resolveUserId(token, accountId, creds.userId);
  if (!userId) {
    throw new RenphoUpstreamError('Could not resolve a Renpho user id.');
  }
  return listMeasurements(token, userId, Math.max(0, Math.floor(sinceEpoch)));
}
