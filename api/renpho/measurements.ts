// GET /api/renpho/measurements?since=<iso>
//
// The one app-facing endpoint of the Renpho sync. It turns Renpho's private,
// reverse-engineered API into a single stable contract the PWA consumes:
//
//   {
//     "syncedAt": "2026-06-01T08:00:00.000Z",
//     "unit": "kg",
//     "readings": [
//       { "date": "2026-06-01", "ts": 1748764800, "weightKg": 82.4, "bodyFat": 18.7 }
//     ]
//   }
//
// Stateless: it stores nothing and holds a fresh Renpho session per call. The
// Renpho credentials live only in this function's environment, never in the
// client. Same-origin with the PWA, so no CORS allow-list is needed — but the
// URL is still public, so every call must carry the shared-secret sync token.
//
// Env vars (Vercel Project Settings → Environment Variables; never committed):
//   RENPHO_EMAIL       — the Renpho account email
//   RENPHO_PASSWORD    — the Renpho account password (encrypted in transit only)
//   RENPHO_SYNC_TOKEN  — shared secret the client must send as `x-sync-token`
//   RENPHO_USER_ID     — optional: pin a specific scale profile

import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// NOTE: the `.js` extension is required. package.json is `"type": "module"`, so
// Vercel ships these functions as native ESM, and Node's ESM loader does not
// guess extensions on relative imports — extensionless here crashes the
// deployed function with ERR_MODULE_NOT_FOUND. TS maps `.js` → the `.ts` source.
import { fetchReadings, RenphoAuthError, RenphoUpstreamError } from '../_lib/renpho.js';

function firstHeader(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Constant-time token check; length-guarded so timingSafeEqual never throws.
function tokenMatches(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// `since` → epoch seconds. Accepts an ISO date or datetime; anything unparseable
// (or absent) means "from the beginning" (0), letting the client own the window.
function parseSince(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return 0;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Personal health data — never cache it anywhere.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const expectedToken = process.env.RENPHO_SYNC_TOKEN;
  if (!expectedToken) {
    // Misconfigured server — don't reveal which secret is missing.
    res.status(500).json({ error: 'Sync is not configured on the server.' });
    return;
  }
  if (!tokenMatches(firstHeader(req.headers['x-sync-token']), expectedToken)) {
    res.status(401).json({ error: 'Invalid or missing sync token.' });
    return;
  }

  const email = process.env.RENPHO_EMAIL;
  const password = process.env.RENPHO_PASSWORD;
  if (!email || !password) {
    res.status(500).json({ error: 'Sync is not configured on the server.' });
    return;
  }

  try {
    const readings = await fetchReadings(
      { email, password, userId: process.env.RENPHO_USER_ID || undefined },
      parseSince(req.query.since),
    );
    res.status(200).json({
      syncedAt: new Date().toISOString(),
      unit: 'kg',
      readings,
    });
  } catch (err) {
    // Map to clean, non-leaky bodies. Both auth and upstream failures are a 502
    // from the app's perspective: the proxy couldn't get a good answer from
    // Renpho. The detail strings are already scrubbed of any secret.
    if (err instanceof RenphoAuthError || err instanceof RenphoUpstreamError) {
      res.status(502).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Unexpected sync error.' });
  }
}
