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
  check, calls the client, maps errors to clean status codes.
- `_lib/renpho.ts` — the reverse-engineered Renpho cloud client (login with an
  RSA-encrypted password, resolve the profile, list measurements, normalize).
- `_fixtures/measurements.sample.json` — a synthetic contract sample for mocking.

## Security / ops

- **Credentials live only in env vars**, never in the repo or the client. See
  [`.env.example`](../.env.example): `RENPHO_EMAIL`, `RENPHO_PASSWORD`,
  `RENPHO_SYNC_TOKEN`, optional `RENPHO_USER_ID`. Set them in the Vercel project
  (and `.env.local` for `vercel dev`). `.env*` is git-ignored.
- Same origin as the PWA, so no CORS allow-list — but the URL is public, so every
  request must carry the correct `x-sync-token` (checked in constant time) or
  gets a `401`.
- **Stateless**: stores nothing, fresh Renpho session per call. Personal data is
  returned with `Cache-Control: no-store`.
- A Renpho login/upstream failure returns `502` with a scrubbed error body.

## Longevity / ToS

This is an **unofficial** integration: Renpho publishes no public API, and these
endpoints can change or break without notice. For a single-user, personal /
portfolio build this is an accepted, well-understood risk — manual entry and CSV
import remain the floor, so the app never depends on it.
