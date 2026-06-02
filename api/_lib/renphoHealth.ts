// Reverse-engineered **Renpho Health** cloud client (server-side only).
//
// This is the sibling of [renpho.ts](./renpho.ts). That file speaks the *classic*
// Renpho cloud (`renpho.qnclouds.com`, RSA-encrypted password, `app_id=Renpho`).
// This file speaks **Renpho Health** — the current app — whose backend is a
// different host with a different scheme: `cloud.renpho.com`, **AES-128-ECB**.
// A classic login against a Renpho Health account fails with "email not
// registered", which is exactly why this variant exists (see Phase 7 in
// ../../updatePhases.md). The approach mirrors the community
// `StartupBros/renpho-mcp-server` / `RenphoGarminSync-CLI` projects.
//
// It is UNOFFICIAL and can break without notice; manual entry / CSV import
// (Tier 0) stays the floor.
//
// The contract is identical to the classic client: it returns the same
// normalized `Reading[]`, so the app-facing endpoint, `renphoClient.ts`, and
// `mergeBodyData` are all unchanged — only the backend differs. The error
// classes and the `Reading`/`RenphoCredentials` shapes are imported from
// renpho.ts, which owns the shared contract.
//
// Flow (every call is a stateless, fresh session):
//   1. POST renpho-aggregation/user/login    — AES-encrypt the *whole* login
//      body (password in plaintext inside the blob) → `token` + account `id`.
//   2. POST renpho-aggregation/device/count   — discover the scale "tables" and
//      the (very large) user ids they hold.
//   3. POST RenphoHealth/scale/queryAllMeasureDataList — page measurements per
//      table, then keep only the rows belonging to our user.
//
// Field facts (from the decrypted payload): `weight` is kilograms, `bodyfat` is
// a plain percent (optional), `timeStamp` is epoch seconds. Account / measurement
// ids (`id`, `bUserId`, `subUserId`) routinely exceed 2^53, so they are pulled
// out of the raw JSON as *strings* (regex) before JSON.parse can round them.

import crypto from 'node:crypto';
import { type Reading, type RenphoCredentials, RenphoAuthError, RenphoUpstreamError } from './renpho.js';

export { type Reading, type RenphoCredentials, RenphoAuthError, RenphoUpstreamError };

const API_BASE = 'https://cloud.renpho.com';

// The Renpho Health app's fixed client-side AES-128 secret (16 bytes). Like the
// classic RSA *public* key in renpho.ts, this is embedded in the shipped mobile
// app and is **not** a per-user secret — it's the symmetric key every client
// uses to wrap requests/unwrap responses. The user's password is the only secret
// and it lives solely in the server env (it travels *inside* the AES blob).
const AES_KEY = 'ed*wijdi$h6fe3ew';
// Encoded once as raw bytes. Using a Uint8Array (not a Buffer) sidesteps a
// @types/node CipherKey typing snag, matching the pattern in renpho.ts.
const AES_KEY_BYTES = new TextEncoder().encode(AES_KEY);

// Renpho Health signals success with this numeric code in the envelope.
const OK_CODE = 101;

const PAGE_SIZE = 200;
// Safety rail on pagination. A personal account's whole history is a handful of
// pages at most; this just bounds the loop if the upstream ever misbehaves.
const MAX_PAGES = 30;
const DEFAULT_TIMEOUT_MS = 15000;

type Session = { token: string; userId: string };
type ScaleTable = { tableName: string; userIds: string[]; count: number };

// AES-128-ECB, default PKCS#7 padding, base64 — exactly how the app wraps every
// request body and unwraps every response `data`. ECB takes no IV (null).
function encryptAes(plaintext: string): string {
  const cipher = crypto.createCipheriv('aes-128-ecb', AES_KEY_BYTES, null);
  return cipher.update(plaintext, 'utf8', 'base64') + cipher.final('base64');
}

// The no-body calls (device/count) still send one encrypted block. Encrypting
// zero input bytes (an empty string) yields exactly one PKCS#7 pad block — the
// same ciphertext the app produces by encrypting an empty buffer.
function encryptEmpty(): string {
  const cipher = crypto.createCipheriv('aes-128-ecb', AES_KEY_BYTES, null);
  return cipher.update('', 'utf8', 'base64') + cipher.final('base64');
}

function decryptAes(b64: string): string {
  const decipher = crypto.createDecipheriv('aes-128-ecb', AES_KEY_BYTES, null);
  return decipher.update(b64, 'base64', 'utf8') + decipher.final('utf8');
}

// Pull a numeric id out of the raw JSON as a string so values past 2^53 survive
// (JSON.parse would silently round them). First match / all matches variants.
function extractId(json: string, key: string): string | null {
  const m = json.match(new RegExp(`"${key}":(\\d+)`));
  return m ? m[1] : null;
}
function extractIds(json: string, key: string): string[] {
  return Array.from(json.matchAll(new RegExp(`"${key}":(\\d+)`, 'g')), (m) => m[1]);
}
function extractUserIdGroups(json: string): string[][] {
  return Array.from(
    json.matchAll(/"userIds":\[(\d+(?:,\d+)*)\]/g),
    (m) => m[1].split(','),
  );
}

function asNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

// Prefer a wall-clock datetime string when the row carries one (its date is the
// user's true calendar day); otherwise derive the day from the UTC epoch. We
// only trust a candidate that *looks* like a date, so an absent/odd field can
// never corrupt the date — it just falls back to the timestamp.
function readingDate(raw: Record<string, unknown>, ts: number): string {
  for (const key of ['localCreatedAt', 'local_created_at', 'createTime']) {
    const v = raw[key];
    if (typeof v === 'string') {
      const m = v.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
      if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    }
  }
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

async function fetchWithTimeout(
  path: string,
  body: unknown,
  session: Session | null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{ code: number; msg?: string; data?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // Authenticated calls echo the session token + account id; the app also
        // tags every request with its version + platform.
        ...(session ? { token: session.token, userId: session.userId } : {}),
        appVersion: '7.0.0',
        platform: 'android',
      },
      body: JSON.stringify(body),
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
    return (await res.json()) as { code: number; msg?: string; data?: string };
  } catch {
    throw new RenphoUpstreamError('Renpho returned a non-JSON response.');
  }
}

// POST an encrypted body to an authenticated endpoint and return the *raw*
// decrypted JSON string (callers regex-extract big ids before parsing).
async function postEncrypted(
  path: string,
  session: Session,
  requestBody: Record<string, unknown> | null,
  emptyBody = false,
): Promise<string> {
  const envelope = { encryptData: emptyBody ? encryptEmpty() : encryptAes(JSON.stringify(requestBody ?? {})) };
  const parsed = await fetchWithTimeout(path, envelope, session);
  if (parsed.code !== OK_CODE || !parsed.data) {
    throw new RenphoUpstreamError(`Renpho ${path} failed (${parsed.msg ?? `code ${parsed.code}`}).`);
  }
  return decryptAes(parsed.data);
}

// Step 1 — authenticate. The entire login object (password included) is wrapped
// in one AES blob; the response envelope carries the encrypted session payload.
async function login(creds: RenphoCredentials): Promise<Session> {
  const loginData = {
    questionnaire: {},
    login: {
      password: creds.password,
      areaCode: 'US',
      appRevision: '7.0.0',
      cellphoneType: 'mission-to-abs',
      systemType: '11',
      email: creds.email,
      platform: 'android',
    },
    bindingList: { deviceTypes: ['2'] },
  };
  const parsed = await fetchWithTimeout('renpho-aggregation/user/login', {
    encryptData: encryptAes(JSON.stringify(loginData)),
  }, null);
  if (parsed.code !== OK_CODE || !parsed.data) {
    // Bad email/password (or a classic-only account) lands here.
    throw new RenphoAuthError(`Renpho Health sign-in failed (${parsed.msg ?? `code ${parsed.code}`}).`);
  }
  const raw = decryptAes(parsed.data);
  const login = (JSON.parse(raw) as { login?: Record<string, unknown> }).login;
  const token = login && typeof login.token === 'string' ? login.token : '';
  if (!token) {
    throw new RenphoAuthError('Renpho Health sign-in returned no session token.');
  }
  const userId = extractId(raw, 'id') ?? (login && login.id != null ? String(login.id) : '');
  if (!userId) {
    throw new RenphoUpstreamError('Could not resolve a Renpho Health user id.');
  }
  return { token, userId };
}

// Step 2 — discover the scale "tables" and their member user ids. The user ids
// are huge, so take them from the raw JSON (regex), aligned to `scale[]` by index.
async function listScaleTables(session: Session): Promise<ScaleTable[]> {
  const raw = await postEncrypted('renpho-aggregation/device/count', session, null, true);
  const parsed = JSON.parse(raw) as { scale?: Array<{ tableName: string; count?: number }> };
  const scales = Array.isArray(parsed.scale) ? parsed.scale : [];
  const idGroups = extractUserIdGroups(raw);
  return scales.map((s, i) => ({
    tableName: s.tableName,
    count: typeof s.count === 'number' ? s.count : 0,
    userIds: idGroups[i] ?? [],
  }));
}

// One annotated raw row: keep the precise string ids alongside the parsed object.
type RawRow = Record<string, unknown> & {
  __id: string | null;
  __bUserId: string | null;
  __subUserId: string | null;
};

// Step 3 (one page) — list measurements for a table + user set.
async function listMeasurementPage(
  session: Session,
  table: ScaleTable,
  userIds: string[],
  pageNum: number,
): Promise<RawRow[]> {
  const raw = await postEncrypted('RenphoHealth/scale/queryAllMeasureDataList', session, {
    pageNum,
    pageSize: PAGE_SIZE,
    userIds,
    tableName: table.tableName,
  });
  const rows = JSON.parse(raw) as Array<Record<string, unknown>>;
  const ids = extractIds(raw, 'id');
  const bUserIds = extractIds(raw, 'bUserId');
  const subUserIds = extractIds(raw, 'subUserId');
  return rows.map((row, i) => ({
    ...row,
    __id: ids[i] ?? (row.id != null ? String(row.id) : null),
    __bUserId: bUserIds[i] ?? (row.bUserId != null ? String(row.bUserId) : null),
    __subUserId: subUserIds[i] ?? (row.subUserId != null ? String(row.subUserId) : null),
  }));
}

// Page a table to completion (or until a short page / the safety cap). A personal
// account fits in the first page, so this almost always stops after one round.
async function listAllForTable(session: Session, table: ScaleTable): Promise<RawRow[]> {
  const collected: RawRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await listMeasurementPage(session, table, table.userIds, page);
    collected.push(...batch);
    if (batch.length < PAGE_SIZE) break; // last (partial) page reached
  }
  return collected;
}

// Keep only the rows that belong to our user. An explicit profile pin
// (RENPHO_USER_ID → creds.userId) wins; otherwise prefer the rows bound to the
// login account, then fall back to the dominant scale-user group (the common
// single-profile scale collapses to "all rows").
function selectForUser(rows: RawRow[], session: Session, pinnedId?: string): RawRow[] {
  const target = pinnedId?.trim() || session.userId;
  const bound = rows.filter((r) => r.__bUserId === target || r.__subUserId === target);
  if (bound.length > 0 || pinnedId) return bound;

  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.__subUserId ?? r.__bUserId;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = -1;
  for (const [key, n] of counts) {
    if (n > bestN) {
      best = key;
      bestN = n;
    }
  }
  return best === null ? rows : rows.filter((r) => (r.__subUserId ?? r.__bUserId) === best);
}

// Map one raw Renpho Health row to the normalized contract, or null if it has no
// usable weight. Body fat of 0/missing → null (a failed impedance read, not 0%).
function normalizeReading(raw: RawRow): Reading | null {
  const ts = asNumber(raw.timeStamp);
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

/**
 * The one entry point — mirrors classic `fetchReadings`. Log in, discover the
 * scale tables, page every measurement, keep our user's rows, and return *all*
 * normalized readings on or after `sinceEpoch` (epoch seconds), newest first.
 * Stateless. Throws RenphoAuthError / RenphoUpstreamError.
 */
export async function fetchReadings(
  creds: RenphoCredentials,
  sinceEpoch: number,
): Promise<Reading[]> {
  const floor = Math.max(0, Math.floor(sinceEpoch));
  const session = await login(creds);

  const tables = await listScaleTables(session);
  if (tables.length === 0) {
    throw new RenphoUpstreamError('No Renpho Health scale found on this account.');
  }

  const allRows: RawRow[] = [];
  for (const table of tables) {
    allRows.push(...(await listAllForTable(session, table)));
  }

  const selected = selectForUser(allRows, session, creds.userId);

  // Dedupe by measurement id (fall back to ts when an id is missing), drop rows
  // below the floor, and return newest-first to match the contract.
  const byKey = new Map<string, Reading>();
  for (const row of selected) {
    const reading = normalizeReading(row);
    if (!reading || reading.ts < floor) continue;
    const key = row.__id ?? `ts:${reading.ts}`;
    if (!byKey.has(key)) byKey.set(key, reading);
  }
  return Array.from(byKey.values()).sort((a, b) => b.ts - a.ts);
}
