# Update Phases — Renpho body-data sync

Each phase is independently shippable and ends with a single commit. Sequencing is
intentional: the local-first, zero-infra work lands first and de-risks everything after it
(see [update.md](update.md) for context and the tier map). `npm run typecheck` and
`npm run build` must pass at the end of every phase. The app must stay fully usable with the
backend **absent** at every phase.

> **Phase ↔ tier map:** Phases 1–2 = Tier 0 · Phases 3–4 = Tier 1 · Phase 5 = Tier 2 ·
> Phase 6 = Tier 3. Stop after any phase and the app is in a good state.
>
> **Status:** Phases 1–5 shipped ✅ (Tiers 0–2 complete). Phase 6 (Tier 3) deferred.
> ⚠️ The deployed sync (Phases 3–5) authenticates **classic Renpho** accounts only;
> **Renpho Health** accounts live on `cloud.renpho.com` and need Phase 7. CSV import
> (Phase 2) works for Renpho Health today.

---

## Phase 1 — Data model: body fat + provenance (Tier 0, no backend) — ✅ Shipped

**Goal** — body fat becomes a first-class metric, and every weight/body-fat value knows
whether it was typed or synced. This is the schema foundation for all later phases.

**Changes**
- [src/types.ts](src/types.ts) — `DayEntry` gains `bodyFat?: number`,
  `weightSource?: 'manual' | 'renpho'`, `bodyFatSource?: 'manual' | 'renpho'`.
- [src/store/mission.ts](src/store/mission.ts) — bump `version: 8 → 9`; add an
  `if (version < 9)` migration (no backfill needed — absent fields read as `undefined`).
  When `setDayEntry` is called from manual UI, stamp `weightSource: 'manual'` /
  `bodyFatSource: 'manual'`.
- [src/components/WeightInput.tsx](src/components/WeightInput.tsx) — clone into a
  `BodyFatInput` (suffix `%`, step `0.1`, sane 1–60 bounds).
- [src/components/DayEditor.tsx](src/components/DayEditor.tsx) — render the body-fat input
  under weight.
- [src/pages/Progress.tsx](src/pages/Progress.tsx) — optional second line/series for body
  fat on the existing chart.
- Export/import: bump the `ExportPayload` version in
  [src/pages/Settings.tsx](src/pages/Settings.tsx:34) so backups carry the new fields
  (they already serialize whole `DayEntry` objects, so this is mostly a version note +
  `isValidPayload` tolerance).

**Verification**
- `npm run typecheck` passes; existing v8 data migrates to v9 untouched.
- Enter a body-fat value on a day → persists, shows on Progress, survives reload.
- Export JSON → `bodyFat` / `*Source` present; re-import round-trips.

**Commit** — `Body data: add body-fat field + value provenance to DayEntry`

---

## Phase 2 — Manual Renpho export import (Tier 0, no backend) — ✅ Shipped

**Goal** — get real scale data into the app today, with zero server, and build the exact
merge logic the backend will reuse.

**Renpho CSV schema** (confirmed from a real export, `RENPHO Health-…csv`):
```
Date,Time,Weight(kg),BMI,Body Fat(%),Skeletal Muscle(%),Fat-Free Mass(kg),
Subcutaneous Fat(%),Visceral Fat,Body Water(%),Muscle Mass(kg),Bone Mass(kg),
Protein(%),BMR(kcal),Metabolic Age,Optimal Weight(kg),Target…,Body Type,Remarks
2025.12.26,08:23:40,74.30,26.3,26.1,47.6,...
```
- **Date** = `YYYY.MM.DD` (dot-separated) → parse to ISO `YYYY-MM-DD`.
- We read **only** `Weight(kg)` (col 2) and `Body Fat(%)` (col 4); ignore the rest. Treat
  `--` as empty for any cell.
- Rows are **newest-first**; a date can appear **twice** (e.g. `2025.11.02`) — dedupe to one
  reading per day using **`Time`** (keep the latest).

**Changes**
- New `src/lib/renphoCsv.ts` — parse the export → `{ date, weightKg, bodyFat }[]`, applying
  the date conversion, `--`→null, and same-day dedup above.
- New `src/lib/mergeBodyData.ts` — the **merge policy** (reused by every later phase):
  for each incoming reading, write into `days[date]` only if the existing value is empty or
  was itself `renpho`-sourced; **never overwrite a `manual` value**. Convert kg → the user's
  `weightUnit`.
- **Out-of-mission-window handling:** rows can predate the current mission `startDate` (the
  sample is all 2025, before a 2026 mission). Decision: **store them anyway** (they're valid
  `days` entries and future-proof), but the preview must **split the count** into
  "in current mission" vs "outside window (stored, not shown)" so the user isn't surprised
  that older rows don't appear on the Journey/Progress views.
- [src/pages/Settings.tsx](src/pages/Settings.tsx) — an "Import from Renpho export" action
  in the Data section with a preview/confirm sheet (mirror the existing import-preview at
  [Settings.tsx:546](src/pages/Settings.tsx:546)): "N days will be filled (K in this mission,
  J outside it), M skipped (manual)."

**Verification**
- Import the real `RENPHO Health-…csv` → 48 unique days parsed (the duplicate `2025.11.02`
  collapses to one), weight + body fat mapped, units converted, manual days untouched.
- Preview shows the in-window vs outside-window split correctly.
- Re-import the same file → idempotent (no double-writes, nothing clobbered).
- Bad/empty file → clean error, no state change.

**Commit** — `Body data: import weight + body fat from a Renpho export file`

---

## Phase 3 — Backend proxy scaffold (Tier 1) — ✅ Shipped

**Goal** — a deployed, secured endpoint that turns Renpho's private API into one clean JSON
contract. No app changes yet — this phase is testable on its own with `curl`.

**Changes** — a **Vercel Function in this same project** at `api/renpho/measurements.ts`
(TypeScript). Same project as the PWA = same origin, so there's no cross-origin CORS hop.
Runs on the Node runtime so `node:crypto` is available for the RSA step. (No Python: the
`renpho_api` logic is re-implemented in ~40 lines of TS — see
[update.md §5](update.md#5-recommendation--confirmed-decisions).)
- Implement the login flow with `node:crypto`: RSA-encrypt the password with Renpho's public
  key → `POST /api/v3/users/sign_in.json?app_id=Renpho` → capture `terminal_user_session_key`.
- Implement `GET /api/v2/measurements/list.json` (+ `scale_users/list_scale_user` to resolve
  `user_id`).
- Expose **one** app-facing endpoint: `GET /api/renpho/measurements?since=<iso>` returning the
  contract:
  ```jsonc
  {
    "syncedAt": "2026-06-01T08:00:00Z",
    "unit": "kg",
    "readings": [
      { "date": "2026-06-01", "ts": 1748764800, "weightKg": 82.4, "bodyFat": 18.7 }
      // ...one per reading since `since`, newest first
    ]
  }
  ```
- **Security/ops:** Renpho creds in **Vercel Environment Variables** only (`.env.local` for
  `vercel dev`, git-ignored; ship `.env.example`). The function is same-origin with the PWA so
  no CORS allow-list is needed, **but the URL is still publicly reachable** — gate it with a
  shared-secret header (also a Vercel env var) so it isn't open to the world. Sensible
  timeouts + structured error JSON.
- A captured sample response committed as a fixture for tests/mocking (creds scrubbed).
- `.gitignore` — confirm `.env*` is ignored before the first commit; `git grep` the email to
  prove no creds landed in the tree.

**Verification**
- `curl` with the right header returns normalized readings; without it → 401.
- Wrong-origin browser request → blocked by CORS.
- Renpho login failure → 502 with a clean error body, no secret leakage.
- No credentials anywhere in the committed tree (`git grep` the email/password).

**Commit** — `Renpho proxy: stateless serverless endpoint for normalized measurements`

**Deploy fix (2026-06-01):** the function crashed on Vercel with
`FUNCTION_INVOCATION_FAILED` (`ERR_MODULE_NOT_FOUND` on `../_lib/renpho`) until the
relative import was given an explicit `.js` extension — `package.json` is
`"type": "module"`, so Vercel ships the functions as native ESM and Node's loader
won't guess extensions. Rule documented in [api/README.md](api/README.md).

---

## Phase 4 — Client "Sync now" (Tier 1) — ✅ Shipped

**Goal** — the headline feature: one button pulls the latest weight + body fat into the app.

**Changes**
- [src/types.ts](src/types.ts) `Settings` — add `renphoSync?: { enabled: boolean;
  syncToken: string; lastSyncedAt: string | null }`. Migrate v9 → v10. The endpoint is the
  same-origin relative path `/api/renpho/measurements` (Vercel function from Phase 3), so no
  URL field is needed.
- **On the one client-side secret:** the *Renpho password* never touches the client (it's a
  server env var). The `syncToken` is the access gate for the public function URL — the owner
  pastes it **once** into Settings; it lives only in this device's local store (never in the
  repo or the shipped bundle) and is sent as the shared-secret header Phase 3 checks. For a
  single-user personal app this is the right trade.
- New `src/lib/renphoClient.ts` — `fetchMeasurements(since)` calls the contract with the token
  header; feed results through the **same** `mergeBodyData.ts` from Phase 2.
- [src/pages/Settings.tsx](src/pages/Settings.tsx) — a "Body-data sync" section: an
  enable toggle, a sync-token field, **Sync now** button, last-synced text, inline error on
  failure. Default off.
- Throttle + graceful failure: never block the UI, keep last-good data, surface a quiet
  message on error.

**Verification**
- With the proxy reachable: Sync now → today's weight + body fat appear, tagged `renpho`;
  a manually-typed day is left alone.
- Proxy unreachable/offline → friendly error, app stays fully usable, no data lost.
- Sync disabled / never configured → app identical to pre-feature behavior.

**Commit** — `Renpho sync: on-demand "Sync now" pulls latest weight + body fat`

---

## Phase 5 — Historical backfill + reconciliation (Tier 2) — *long scope* — ✅ Shipped

**Goal** — fill in every day since the mission start, so a week away still leaves a complete
history. This is the genuinely harder, defer-able work.

**Changes**
- Proxy: support full pagination via the `last_at` cursor (fetch *all* since a date).
- `src/lib/renphoClient.ts` — `fetchAllSince(startDate)` walking the cursor to completion.
- `src/lib/mergeBodyData.ts` — extend for bulk: multiple readings per day (deterministic
  pick — latest of day), multi-profile `user_id` selection, and a dry-run that returns a
  diff (`willFill`, `willUpdateSynced`, `willSkipManual`) for preview.
- [src/pages/Settings.tsx](src/pages/Settings.tsx) — a "Sync full history" action with a
  preview/confirm sheet showing the diff before writing.

**Verification**
- Clear a week of days, Sync history → all backfilled correctly; manual days preserved.
- Days with several readings resolve to one deterministically.
- A scale with two profiles imports only the selected user.
- Preview counts match what actually gets written.

**What landed** (notes vs. the plan above):
- **Pagination** ([api/_lib/renpho.ts](api/_lib/renpho.ts)) — `fetchReadings` now walks the
  `last_at` cursor to completion (`listAllMeasurements`), advancing by the newest `ts` each
  page, deduping by `ts`, and bounded by `MAX_PAGES`. The common case (a personal account's
  whole history in one response) stops after one round; the loop is a safety rail and never
  spins.
- **Deterministic latest-of-day** lives at the client boundary
  ([src/lib/renphoClient.ts](src/lib/renphoClient.ts) `toDailyReadings`), keeping the latest
  `ts` per date before anything reaches the merge — `RenphoReading` carries no timestamp, so
  resolving it here (mirroring the CSV importer) is the honest place. This also fixed a latent
  multi-reading-per-day bug on the Phase 4 "Sync now" path.
- **Diff** — `mergeBodyData` gained `willFill` / `willUpdateSynced` (per-day nature split)
  alongside the existing in/outside-window counts and `skippedManual` (= willSkipManual). The
  "Sync full history" sheet shows new-days-filled / refreshed / skipped, plus an
  outside-window note.
- **Multi-profile** — resolved server-side by the `RENPHO_USER_ID` env-var pin (the
  deliberate single-user choice from [update.md §4.1](update.md)); no profile-picker UI was
  added, by design. "Selected user" = the pinned profile.
- `fetchAllSince` is a thin named wrapper over the shared GET; the proxy returns the complete
  set for whatever `since` it's given, so on success the backfill also advances `lastSyncedAt`
  so a later "Sync now" only grabs newer days.

**Commit** — `Renpho sync: full historical backfill with merge preview`

---

## Phase 6 — Automatic sync (Tier 3) — *longest scope, biggest local-first departure* — ⏳ Deferred

**Goal** — hands-off sync, including days the app was never opened. Build only after Tier 2
proves out; this is the first phase that puts health data on a server.

**Changes**
- **Sync-on-open** (the easy half): on app launch, if `renphoSync.enabled` and last sync is
  stale, run `fetchAllSince(lastSyncedAt)` in the background, throttled. No new infra.
- **Truly hands-off** (the heavy half): a **server-side scheduled pull** (cron) into a small
  datastore, which the client reconciles on next open. This makes the backend *stateful* —
  decide hosting/datastore, encryption-at-rest, and retention deliberately. Gate behind an
  explicit opt-in; document the privacy trade in the README.
- (Do **not** rely on browser Periodic Background Sync — unsupported/unreliable on the
  Android-PWA target.)

**Verification**
- Open the app after days away → history is already complete without pressing Sync.
- (Hands-off) weigh in with the app closed; the scheduled pull captures it; next open shows it.
- Opting out / disabling stops all background and server activity; app reverts to manual-only.

**Commit(s)**
- `Renpho sync: auto-sync on app open`
- `Renpho sync: server-side scheduled pull (opt-in, stateful)`

---

## Phase 7 — Renpho Health backend variant (cloud.renpho.com) — ⏳ Planned

**Why** — the shipped proxy (Phases 3–5) speaks the *classic* Renpho API
(`renpho.qnclouds.com`, RSA, `app_id=Renpho`). The owner's account is on **Renpho
Health**, a separate backend — **`cloud.renpho.com`, AES-128-ECB** — that the classic
flow can't authenticate (it returns "email not registered" → 502). CSV import
(Phase 2) is the working fallback meanwhile, so this is additive, not a blocker.

**Changes**
- New server client beside [api/_lib/renpho.ts](api/_lib/renpho.ts) (e.g.
  `renphoHealth.ts`): the Renpho Health login + measurements against `cloud.renpho.com`
  with AES-128-ECB, normalized to the **same** `Reading` contract so the app-facing
  endpoint, `renphoClient.ts`, and `mergeBodyData` are all unchanged.
- Backend selection: an env flag (e.g. `RENPHO_BACKEND=health|classic`, default
  `health`), or try Health then fall back to classic. Keep one app-facing endpoint.
- Same env vars (`RENPHO_EMAIL` / `RENPHO_PASSWORD` / `RENPHO_SYNC_TOKEN`); document
  where the AES key comes from.

**References** — StartupBros/renpho-mcp-server (targets `cloud.renpho.com` / Renpho
Health), danvaneijck/renpho-api, RenphoGarminSync-CLI.

**Verification**
- `curl` with the owner's Renpho Health account returns normalized readings (no
  "email not registered"). CSV import still works unchanged. Classic accounts still
  work if the backend is selectable.

**Commit** — `Renpho sync: support the Renpho Health backend (cloud.renpho.com)`

---

## Cross-phase notes

- **Local-first invariant** — Phases 1–2 add no network at all. Phases 3–6 are opt-in; with
  sync off or the backend absent, the app is byte-for-byte the same offline app. This is the
  line that keeps the product honest about its *local-first* identity.
- **Schema bumps** — Phases 1 and 4 each bump the persisted store version (8→9, 9→10). Every
  migration must default new fields safely so existing users lose nothing (the pattern is in
  [src/store/mission.ts](src/store/mission.ts:200)).
- **Secrets** — Renpho credentials live only in the backend's secret store, never in the repo
  or client. `.env` is git-ignored; `.env.example` is committed. Verify with `git grep`.
- **One merge path** — `mergeBodyData.ts` (Phase 2) is the single source of truth for the
  manual-wins policy; the manual importer, Sync now, and backfill all flow through it.
- **Longevity / ToS** — the Renpho source is unofficial and can break; manual entry
  (Phases 1–2) is the permanent floor. Note the risk in the README for portfolio reviewers.
