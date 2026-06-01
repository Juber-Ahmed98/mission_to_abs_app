# Update — Renpho body-data sync (weight + body fat)

Pull weight and body-fat % from the Renpho smart scale into Mission to Abs, so the
numbers you take each morning land in the app without re-typing them. The phased
breakdown is in [updatePhases.md](updatePhases.md).

**This is the first feature that introduces a backend.** Every prior decision kept the
app *local-first, no backend* (see the archived [polish-pillars-history](archive/polish-pillars-history/update.md)
docs and the product-direction notes). That invariant is **not** being thrown out — it
is being *preserved as the default*. The Renpho sync is a fully **optional, opt-in**
companion: with it switched off (or never configured), the app behaves exactly as it
does today — offline, no accounts, no network. The backend is a thin, stateless proxy
that only runs when you press "Sync." The app stays a *witness, not a coach*: we import
two numbers; we add zero fitness advice.

---

## 1. The thing you need to know first: there is no official Renpho API

Renpho does not publish a public API. The "renpho_api" you're referring to is a
community, **reverse-engineered** client (the PyPI [`renpho-api`](https://pypi.org/project/renpho-api/)
package, the Home Assistant `hass_renpho` integrations, and similar) that mimics what
the Renpho phone app does behind the scenes. Concretely, those projects talk to Renpho's
cloud (`renpho.qnclouds.com`):

| Step | Call | Notes |
|---|---|---|
| **Login** | `POST /api/v3/users/sign_in.json?app_id=Renpho` | Body: your email + your password **RSA-encrypted** with a hardcoded public key, base64'd. Returns a `terminal_user_session_key` (the session token) and your profile. |
| **List scale users** | `GET /api/v3/scale_users/list_scale_user` | A Renpho scale can hold several profiles; each has a `user_id`. You pick yours. |
| **Measurements** | `GET /api/v2/measurements/list.json` | Pass the session key + `user_id` + a `last_at` cursor. Returns an array of readings. |

Each reading carries ~15 metrics. The two you care about are in every reading:
**`weight`** (kilograms) and **`bodyfat`** (percent) — alongside BMI, body water, muscle
mass, bone mass, BMR, visceral fat, protein, etc., if you ever want more.

**What this means for you (the honest version):**

- **It's unofficial.** Renpho can change these endpoints or the encryption at any time and
  the integration breaks with no warning. Treat it as best-effort, and always keep manual
  entry working as the fallback. (This is why Tier 0 below ships *first*.)
- **It needs your Renpho login.** The flow authenticates with your real Renpho email +
  password. Where that credential lives is the single most important design decision —
  covered in §4.
- **A browser cannot call it directly.** Three hard blockers:
  1. **CORS** — `qnclouds.com` won't return the headers a browser requires for a
     cross-origin request, so a `fetch()` from the PWA is rejected before it starts.
  2. **Secrets** — doing login in the browser means your Renpho password sits in
     client-side JavaScript / localStorage, readable by anything. Unacceptable.
  3. **Brittleness** — the RSA step and the private endpoints are fiddly and shift; you
     want that logic in one server file you can patch, not shipped to every client.

  → Hence a small **backend proxy**. You already intuited this — it's the right call.

---

## 2. The shape of the solution

```
 Renpho scale ──Bluetooth──► Renpho phone app ──► Renpho cloud (qnclouds.com)
                                                          │
                                                          │  (reverse-engineered calls)
                                                          ▼
                                          ┌──────────────────────────────┐
                                          │  Thin backend proxy (ours)    │
                                          │  • holds the Renpho creds     │
                                          │  • logs in, fetches readings  │
                                          │  • normalizes to clean JSON   │
                                          │  • CORS-allows only our app   │
                                          └──────────────┬───────────────┘
                                                         │  GET /api/renpho/measurements
                                                         ▼
                                       Mission to Abs PWA  ──►  writes weight + bodyFat
                                       ("Sync" in Settings)      into DayEntry by date
```

The PWA never sees Renpho directly. It calls **our** endpoint, which returns a stable,
documented JSON contract (§3). That decoupling is the most important architectural move:
if Renpho changes, we fix the proxy and the app is untouched; and we could later swap the
*source* (e.g. Google Fit, a manual file) behind the same contract without the app caring.

### Source options, ranked by friction (so you can choose with eyes open)

| Route | What it is | Friction | Verdict |
|---|---|---|---|
| **A. Reverse-engineered Renpho cloud** (recommended) | Proxy logs into qnclouds.com as above | Medium build, ongoing maintenance risk | **Primary.** Only route that delivers weight + body fat + full history + backfill from the scale alone. |
| **B. Health-platform bridge** (Google Fit / Apple Health / Health Connect) | Renpho *officially* mirrors data into these; read from there instead | High, and shrinking | **Hedge, not now.** Google is sunsetting the Fit REST API; Apple Health and Android Health Connect have **no** web-readable cloud API (they need a native app). Note it as a future fallback if Route A dies. |
| **C. Manual file import** (no backend) | Export from the Renpho app, import the file | Lowest | **Ship first as Tier 0.** Fully local-first, zero infra, and it builds the exact data model + merge logic every other route reuses. |

---

## 3. Scope tiers

You asked for explicit tiers so you can ship the core value fast and defer the heavy
"syncing" work. Here they are, smallest first. The phase-by-phase build order is in
[updatePhases.md](updatePhases.md).

### Tier 0 — Data model + manual import · **LOW friction · do this first · no backend** · ✅ Shipped

The foundation. Nothing else can store a body-fat number or merge a synced value until
this exists, and it's useful on its own.

- Add **`bodyFat?: number`** and a provenance flag **`weightSource?: 'manual' | 'renpho'`**
  (and `bodyFatSource?`) to [`DayEntry`](src/types.ts); bump the store **v8 → v9** with a
  migration (the pattern is already in [src/store/mission.ts](src/store/mission.ts:200)).
- Surface body fat in the UI next to weight (a `BodyFatInput` mirroring
  [src/components/WeightInput.tsx](src/components/WeightInput.tsx); show it in
  [DayEditor](src/components/DayEditor.tsx) and the [Progress](src/pages/Progress.tsx) chart).
- A **"Import from Renpho export"** action in [Settings](src/pages/Settings.tsx) that reads
  the CSV the Renpho app can export and maps rows → days, tagging them `renpho`.

**Delivers:** body fat is now a first-class metric, and you can already get scale data in
(manually) with no server. **Effort:** ~1–2 sessions.

### Tier 1 — Backend proxy + "Sync now" button · **MEDIUM friction · the core goal** · ✅ Shipped

The feature you want soonest: press a button, today's weight + body fat appear.

- Stand up the thin proxy (§2) as a serverless function. One endpoint:
  `GET /api/renpho/measurements?since=<iso>` → returns the normalized contract.
- A **"Body-data sync"** section in [Settings](src/pages/Settings.tsx): a **Sync now**
  button + last-synced status. It calls the proxy, takes the most recent reading(s), and
  writes `weight` + `bodyFat` into the matching day(s), tagged `renpho`, **without
  overwriting a value you typed by hand** (merge policy in §4).

**Delivers:** the headline use case — scale → app on demand. **Effort:** ~2–3 sessions
(most of it standing up + securing the proxy the first time).

### Tier 2 — Historical backfill + reconciliation · **LONGER scope · defer** · ✅ Shipped

This is the *"even on days I forgot to open the app, fill them in so everything matches"*
feature. It's genuinely more work because it's about *merging two histories correctly*.

- Fetch **all** readings since the mission start date (cursor-paginated), not just the latest.
- Reconcile into `days`: dedupe, decide which reading represents a day when there are
  several (latest of the day, or first-of-morning), convert units, and respect the
  manual-wins merge policy per day.
- Handle **multiple scale profiles** (pick your `user_id`) and a confirm/preview step
  before writing (mirror the existing import-preview sheet in
  [Settings](src/pages/Settings.tsx:546)).

**Delivers:** open the app after a week away and your weight/body-fat history is complete.
**Effort:** ~2–4 sessions. **Labeled long-scope — not a blocker for Tier 1.**

### Tier 3 — Automatic / hands-off sync · **LONGEST scope · biggest departure · defer** · ⏳ Not started

The *"I weighed in but never opened the app, yet it's still there"* dream.

- **Sync-on-open:** the app auto-syncs (throttled) when launched — easy once Tier 1+2 exist.
- **Truly hands-off** (data captured while the app is closed) requires a **server-side
  scheduled pull** into a small datastore, which the app then reconciles on next open. That
  is the largest step away from local-first: it means the backend *stores your health data*,
  not just proxies it — with the privacy, hosting, and persistence concerns that follow.

**Delivers:** zero-touch sync. **Effort:** high. **Labeled longest-scope — revisit only
after Tier 2 proves out.** Note: browser "Periodic Background Sync" exists but is
unreliable/unsupported on most targets, so the credible path is the server cron, not the SW.

---

## 4. Cross-cutting decisions you'd otherwise miss

Since you said this is new territory — these are the things that bite people, in priority
order:

1. **Credential security (the #1 thing).** Never put your Renpho password in the browser.
   The proxy holds it. For a **single-user, personal build** (which this is), the simplest
   safe option is a server **environment variable / secret** — your creds live only in the
   host's secret store, never in the repo, never in client code. (Multi-user would need
   per-user encrypted-at-rest storage + a login of our own — a different, much bigger app.
   Recommendation: **stay single-user**.) Add `.env*` to `.gitignore`; commit a `.env.example`.
   One subtlety since the proxy lives on a public URL: it would happily return *your* data to
   anyone who finds it, so gate it with a **shared-secret token** you paste into the app once
   (stored on your device, never in the shipped bundle). Details in Phase 4.

2. **Provenance + merge policy.** Tag every value `manual` or `renpho`. Rule of thumb:
   **a value you typed by hand always wins** over a synced one for the same day; a sync only
   fills empties or updates prior-synced values. This makes re-syncing idempotent and
   non-destructive — you can press Sync 100×, nothing you typed is ever clobbered.

3. **Units.** Renpho returns **kg**; the app supports kg *and* lb
   ([weightUnit](src/types.ts:27)). Convert at the proxy/import boundary and store in the
   app's current unit (reuse the `LB_PER_KG` factor already in
   [Settings](src/pages/Settings.tsx:42)). Body fat is unitless %.

4. **Dates & multiple readings.** Renpho timestamps are epoch (UTC). Map each to a **local
   ISO date** (the app keys days by `YYYY-MM-DD`). If a day has several readings, pick one
   deterministically (recommend: **latest of that day**) and ignore the rest.

5. **Hosting — decided: Vercel.** The app already deploys on Vercel, so the proxy is just a
   **Vercel Function** under `/api` in the same project (e.g. `api/renpho/measurements.ts`) —
   no separate host, no extra CORS hop (the function and the PWA share an origin). Renpho
   creds go in **Vercel project Environment Variables**, never in the repo. The proxy is
   stateless in Tiers 1–2 (it stores nothing) — cheap and low-risk on the free tier.

6. **Graceful degradation.** Sync failures (Renpho down, endpoint changed, offline) must
   **never** break the app. Show a quiet error, keep the last good data, and leave manual
   entry fully working. The app must be 100% usable with the backend entirely absent.

7. **Longevity & ToS.** This is an unofficial integration; it can break and it's arguably
   against Renpho's terms for redistribution. For a personal/portfolio build that's an
   acceptable, well-understood risk — *as long as* manual entry (Tier 0) is always the floor.
   Document the risk in the README so a portfolio reviewer sees you understood it.

8. **Privacy.** Body metrics are sensitive. In Tiers 1–2 nothing is stored server-side, so
   exposure is minimal. Tier 3 changes that — don't add server storage until you've decided
   it's worth it.

9. **Testing.** Mock the Renpho responses (capture one real payload, replay it) so you can
   build and test the proxy + merge logic without hitting the live API or committing creds.

---

## 5. Recommendation & confirmed decisions

**Recommended path:** ship **Tier 0 now** (real value, zero infra, de-risks everything),
then **Tier 1** (the core button), and treat **Tier 2 / Tier 3** as clearly-separate later
work. Stay **single-user** and keep the proxy **stateless** until Tier 3 forces the issue.

The three questions that gated Tier 1 are now answered:

- **Hosting → Vercel** (already in use). The proxy is a same-project Vercel Function under
  `/api`; creds live in Vercel env vars. See §4.5.
- **Language → TypeScript.** Worth clearing up the Python confusion directly: the public
  `renpho_api` packages *are* Python, but that's just the language those authors chose. The
  actual integration is nothing more than **HTTPS requests + one RSA-encrypt step**, and
  Node/TypeScript do both natively (built-in `crypto` for the RSA, `fetch` for the calls).
  We **re-implement** the ~40 lines of login/measurement logic in TypeScript rather than
  import the Python library — so the whole stack stays one language on Vercel. (Vercel *can*
  run Python functions if we ever wanted to literally use the library, but that adds a second
  runtime and dependency surface for no real gain here.)
- **Export format → confirmed** from the real export `RENPHO Health-…csv`. Schema captured in
  [updatePhases.md](updatePhases.md) Phase 2. Key facts: columns are
  `Date,Time,Weight(kg),BMI,Body Fat(%),…`; **date is `YYYY.MM.DD`** (dot-separated);
  weight is **kg**; body fat is a plain percent; rows are **newest-first**; and the file can
  contain **two readings for the same day** (the importer must pick one). The sample is from
  **last year (Oct–Dec 2025)** — *before* the current mission window — which is itself a case
  the importer must handle (see Phase 2).

**Scope note — only two metrics, on purpose.** The export (and the API) expose ~13 more
fields — BMI, skeletal muscle, visceral fat, body water, BMR, metabolic age, etc. We
deliberately import **only weight + body fat** to honor the *witness, not a coach* philosophy
and keep the daily loop minimal. Adding more later is a cheap, additive change (extra optional
`DayEntry` fields) if it's ever wanted — no rework of the sync pipeline.

---

## Why this order

Tier 0 first because it's local-first, ships value immediately, and forces us to get the
data model and merge rules right — which *every* later tier depends on. Tier 1 next because
it's the actual goal (scale → app) and the smallest backend that delivers it. Tiers 2 and 3
are deferred precisely because they're where the cost lives — historical reconciliation and,
worst of all, server-side storage of health data. Each phase in
[updatePhases.md](updatePhases.md) is independently shippable and ends in one focused commit;
`npm run typecheck` and `npm run build` pass at every phase boundary.
