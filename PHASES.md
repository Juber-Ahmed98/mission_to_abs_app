# Mission to Abs — Build Phases

> Execution plan. Work phases in order; each one ends in a usable slice. For product spec, tokens, and data shapes, see [DESIGN.md](DESIGN.md).

**Ordering principle**: simplicity > clarity > consistency > aesthetics > nice-to-haves. Each phase should leave the app in a runnable state — never half-broken between phases.

---

## Phase 1 — Foundation: project, storage, settings

**Goal**: scaffolding stands up, persistence layer works end-to-end, settings page is real.

**Tasks**
1. `npm create vite@latest` — React + TypeScript template.
2. Install runtime deps: `zustand`, `idb-keyval`, `recharts`, `lucide-react`, `framer-motion`, `date-fns`, `react-router-dom`.
3. Install dev deps: `tailwindcss`, `postcss`, `autoprefixer`, `vite-plugin-pwa`.
4. Configure Tailwind: dark mode `class`, base font stack, design tokens from [DESIGN.md](DESIGN.md) exposed as CSS variables in `src/index.css`.
5. Set `<html class="dark">` and base `body` background to `--bg`.
6. Define types in `src/types.ts`: `DayEntry`, `WeekPhoto`, `Settings`.
7. Build `src/store/mission.ts` — Zustand store with localStorage persistence for `settings`, `days`, `photos` (metadata only).
8. Build `src/storage/photos.ts` — thin `idb-keyval` wrapper: `savePhoto(key, blob)`, `getPhoto(key)`, `deletePhoto(key)`, `clearAll()`.
9. Set up hash router with 5 stub routes: `/`, `/calendar`, `/progress`, `/photos`, `/settings`.
10. Build `Settings` page: start date (date input), duration (number, default 15), weight unit (kg/lb segmented control). Writes go through the store.

**Done when**
- `npm run dev` opens an empty themed app with 5 working routes.
- Settings save, reload survives, types compile clean.
- Manually calling `savePhoto`/`getPhoto` in devtools round-trips a Blob.

---

## Phase 2 — Dashboard and daily loop

**Goal**: the core daily ritual works. Log diet, exercise, weight in under 10 seconds.

**Tasks**
1. `BottomNav` component — sticky, 5 items with `lucide-react` icons, ≥ 44px touch targets, thumb-zone height.
2. `Dashboard` layout: top header (week N / day N / completion %), today card, encouragement line, 15-week progress bar.
3. `Toggle` component for diet ✓/✗ and exercise ✓/✗. Three states: unset, success, fail. Updates store immediately.
4. Weight input — numeric keypad on mobile, unit label from settings, debounced write.
5. Day status function in `src/lib/dayStatus.ts` — pure function returning `'perfect' | 'partial' | 'failed' | 'missed'` from a `DayEntry`.
6. Streak function in `src/lib/streak.ts` — walks backward from yesterday, counts consecutive both-success days.
7. Encouragement rule engine in `src/lib/encouragement.ts` — returns a string given `{ dayNumber, streak, yesterdayStatus, weekNumber, isFinalWeek, isWeekEndAndPerfect }`. Use the table from [DESIGN.md](DESIGN.md).
8. Wire encouragement line into dashboard.

**Done when**
- Toggling diet/exercise persists across reload.
- Weight input writes correctly typed numbers.
- Encouragement line changes in response to state (test by editing store directly).
- Completion % and week/day counters reflect `settings.startDate`.

---

## Phase 3 — Calendar heatmap

**Goal**: see the whole mission at a glance; edit any day.

**Tasks**
1. `Calendar` page: CSS grid, 15 columns × 7 rows (or rotated for portrait — pick what fits 412px width without horizontal scroll).
2. Render each cell colored by day status using design tokens (`--success`, `--partial`, `--failed`, `--missed`).
3. Today: outlined ring in `--accent`, fill colored by current status.
4. Future days: `--missed` at reduced opacity.
5. `BottomSheet` component — slide up from bottom with Framer Motion (200ms, Apple easing). Tap backdrop or drag down to dismiss.
6. Day editor inside sheet: diet toggle, exercise toggle, weight input, expandable notes section (hidden behind a small chevron).
7. Tap any past or current cell → open sheet pre-filled with that day's entry; future cells are inert.
8. Save writes back to store; closing the sheet without changes is a no-op.

**Done when**
- Heatmap colors match the entries you've logged.
- Tapping cells opens the editor and edits persist.
- No horizontal scroll at 412×915.

---

## Phase 4 — Weight chart

**Goal**: trend visible at a glance.

**Tasks**
1. `Progress` page layout: headline number (current − start delta with unit), chart card, MA toggle below chart.
2. Build weight series from `mission.days` — skip days with no weight (do not interpolate).
3. Recharts `LineChart` with `--accent` stroke, no grid, minimal axes, dots only on entries.
4. 7-day moving average toggle — when on, render second line at `--text-muted` opacity.
5. Empty state when < 2 weight entries: muted line "Log weight to see trend."
6. X-axis: day number (1..durationWeeks×7), Y-axis: tight range around min/max with padding.

**Done when**
- Chart renders with real entries.
- MA toggle works without flicker.
- Delta updates as you log new weights.

---

## Phase 5 — Photos with compare slider

**Goal**: weekly photo capture and side-by-side comparison.

**Tasks**
1. `Photos` page: grid of weekly slots, one per `1..durationWeeks`. Filled slots show thumbnail from IndexedDB; empty slots show week number on a `--surface` card.
2. Current week slot has a camera/upload button — `<input type="file" accept="image/*" capture="environment">`.
3. On select: resize to max 1600px long edge (canvas downscale) to keep storage sane, save Blob to IndexedDB via `savePhoto`, push `WeekPhoto` metadata to store.
4. Thumbnail component: reads Blob from IndexedDB, creates object URL, revokes on unmount.
5. Selection mode: tap a thumbnail to select; selecting a second one navigates to compare view.
6. `Compare` view: two photos stacked, draggable vertical divider exposing left/right halves. Use a `pointermove` handler with a CSS `clip-path` on the top image.
7. Back button returns to grid and clears selection.

**Done when**
- Photo capture saves and renders thumbnail.
- Reload preserves photos.
- Compare slider drags smoothly on touch and mouse.
- Storage doesn't bloat — 15 photos should fit comfortably under a few MB.

---

## Phase 6 — PWA, export, reset

**Goal**: fully offline, installable, with data portability.

**Tasks**
1. Configure `vite-plugin-pwa`: manifest (name, short name, theme color `--bg`, display `standalone`, icons 192/512), generated service worker with offline fallback.
2. Add icons to `public/` — start with a solid black square with a small accent dot if you don't have assets yet.
3. Install prompt: subtle banner on dashboard after 2nd session, dismissable, never re-shown.
4. Settings → Export JSON: serialize `settings` + `days` + photos (each photo as `{ ...meta, base64: <data url> }`); download as `mission-YYYYMMDD.json`.
5. Settings → Import JSON: file picker, validate shape, decode base64 photos back to Blobs into IndexedDB, replace store state. Confirm before overwriting existing data.
6. Settings → Reset: confirm dialog → `localStorage.clear()` for `mission.*` keys + `idb-keyval` `clear()` on the photo store + reload.
7. Lighthouse audit: installable, no console errors, > 90 perf.

**Done when**
- Disable network, hard reload, app still works and shows existing data.
- Install on Android home screen, open offline, full functionality.
- Export → wipe → import round-trips entries and photos identically.
- All boxes in DESIGN.md "Acceptance criteria" are checked.

---

## After phase 6

Anything not on this list is out of scope unless explicitly added later. Resist mid-build feature creep — the discipline of the app should match the discipline of building it.
