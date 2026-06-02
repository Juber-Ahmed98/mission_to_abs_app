# `api/` — Renpho body-data sync proxy

A single **Vercel Function** that turns Renpho's private, reverse-engineered API
into one stable JSON contract the PWA consumes. It is the backend half of the
Renpho sync (Tier 1). The app stays fully usable with this backend **absent** —
sync is opt-in, and manual entry / CSV import (Tier 0) is the permanent floor.

## Endpoint

```
GET /api/renpho/measurements?since=<iso>
x-sync-token: <shared secret>
```

Returns:

```jsonc
{
  "syncedAt": "2026-06-01T08:00:00.000Z",
  "unit": "kg",
  "readings": [
    { "date": "2026-06-01", "ts": 1748764800, "weightKg": 82.4, "bodyFat": 18.7 }
    // newest first; bodyFat is null when the scale didn't capture it
  ]
}
```

`since` is an ISO date/datetime; readings on or after it are returned. Absent →
from the beginning (the client owns the window). `weightKg` is always kilograms;
the app converts to the user's unit at the merge boundary.

## Files

- `renpho/measurements.ts` — the HTTP handler: method + token gate, env-cred
  check, calls the backend selector, maps errors to clean status codes.
- `_lib/renphoBackend.ts` — picks the client per `RENPHO_BACKEND` and re-exports
  the shared `Reading` contract + error classes (so the handler is backend-agnostic).
- `_lib/renpho.ts` — the **classic** Renpho cloud client (`renpho.qnclouds.com`):
  login with an RSA-encrypted password, resolve the profile, list measurements.
  Owns the shared `Reading` / `RenphoCredentials` types and the error classes.
- `_lib/renphoHealth.ts` — the **Renpho Health** client (`cloud.renpho.com`):
  AES-128-ECB login + measurements, normalized to the *same* `Reading` contract.
- `_fixtures/measurements.sample.json` — a synthetic contract sample for mocking.

## Two Renpho backends (classic vs Renpho Health)

Renpho runs two unrelated clouds and an account lives on exactly one:

| `RENPHO_BACKEND` | Host | Auth | App |
| --- | --- | --- | --- |
| `health` *(default)* | `cloud.renpho.com` | AES-128-ECB | "Renpho Health" (current) |
| `classic` | `renpho.qnclouds.com` | RSA password | legacy Renpho app |

Both clients return the identical normalized `Reading[]`, so the endpoint,
`renphoClient.ts`, and `mergeBodyData` never see the difference. Symptom of the
wrong choice: valid credentials return **"email not registered"** → `502`. Flip
`RENPHO_BACKEND` and retry.

**On the embedded AES key:** the Renpho Health client hardcodes the app's fixed
16-byte AES-128 secret (`renphoHealth.ts`). Like the classic client's hardcoded
RSA *public* key, it ships inside every copy of the mobile app and is **not** a
per-user secret — it only wraps the transport. The account password is the only
secret and stays in the server env (it travels *inside* the AES blob, never in
the clear).

## Security / ops

- **Credentials live only in env vars**, never in the repo or the client. See
  [`.env.example`](../.env.example): `RENPHO_EMAIL`, `RENPHO_PASSWORD`,
  `RENPHO_SYNC_TOKEN`, optional `RENPHO_USER_ID`, optional `RENPHO_BACKEND`
  (`health` default / `classic`). Set them in the Vercel project (and
  `.env.local` for `vercel dev`). `.env*` is git-ignored.
- Same origin as the PWA, so no CORS allow-list — but the URL is public, so every
  request must carry the correct `x-sync-token` (checked in constant time) or
  gets a `401`.
- **Stateless**: stores nothing, fresh Renpho session per call. Personal data is
  returned with `Cache-Control: no-store`.
- A Renpho login/upstream failure returns `502` with a scrubbed error body.

## ESM gotcha (relative imports need `.js`)

The root `package.json` is `"type": "module"`, so Vercel ships these functions as
**native ESM** (each `.ts` compiled to its own `.js`, not bundled). Node's ESM
loader does **not** guess extensions, so every relative import must be written
with a `.js` extension — e.g. `import … from '../_lib/renpho.js'`, even though the
source is `renpho.ts` (TypeScript maps `.js` → the `.ts` source at compile time).
An extensionless relative import passes `tsc`/esbuild locally but crashes the
deployed function with `ERR_MODULE_NOT_FOUND` → `FUNCTION_INVOCATION_FAILED` on
every call. Built-ins (`node:crypto`) and type-only imports (`@vercel/node`) are
exempt.

## Longevity / ToS

This is an **unofficial** integration: Renpho publishes no public API, and these
endpoints can change or break without notice. For a single-user, personal /
portfolio build this is an accepted, well-understood risk — manual entry and CSV
import remain the floor, so the app never depends on it.
