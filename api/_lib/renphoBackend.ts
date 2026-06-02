// Backend selector for the Renpho sync.
//
// There are two reverse-engineered Renpho clouds, each with its own client:
//   • classic  — [renpho.ts](./renpho.ts):       renpho.qnclouds.com, RSA password
//   • health   — [renphoHealth.ts](./renphoHealth.ts): cloud.renpho.com, AES-128
// Both normalize to the *same* `Reading[]`, so the app-facing endpoint only ever
// sees one shape. This module picks which client to use and re-exports the shared
// contract + error classes, keeping `measurements.ts` agnostic to the split.
//
// Selection is the `RENPHO_BACKEND` env var: `health` (default — the current app)
// or `classic` (the legacy qnclouds account). Anything else falls back to health.

import { fetchReadings as fetchClassic } from './renpho.js';
import {
  fetchReadings as fetchHealth,
  type Reading,
  type RenphoCredentials,
  RenphoAuthError,
  RenphoUpstreamError,
} from './renphoHealth.js';

export { type Reading, type RenphoCredentials, RenphoAuthError, RenphoUpstreamError };

export type RenphoBackend = 'health' | 'classic';

// `classic` only when explicitly asked; default and any unknown value → health.
export function resolveBackend(raw = process.env.RENPHO_BACKEND): RenphoBackend {
  return raw?.trim().toLowerCase() === 'classic' ? 'classic' : 'health';
}

/**
 * The unified entry point used by the HTTP handler. Same signature and contract
 * as each underlying client's `fetchReadings`; it just routes to the configured
 * backend.
 */
export async function fetchReadings(
  creds: RenphoCredentials,
  sinceEpoch: number,
): Promise<Reading[]> {
  const fetchForBackend = resolveBackend() === 'classic' ? fetchClassic : fetchHealth;
  return fetchForBackend(creds, sinceEpoch);
}
