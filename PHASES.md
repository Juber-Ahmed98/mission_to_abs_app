# Mission to Abs — v2 Build Phases (historical)

> Execution plan for the v2 design. v1 (the original 6 phases) is shipped, and
> so is everything below. **This document is history**: the v3 Waypoint redesign
> ([DESIGN.md](DESIGN.md), built via [updatePhases.md](updatePhases.md)) has
> since superseded several acceptance criteria in place. Where this plan and the
> shipped app disagree, the v3 contract wins. The notable supersessions:
>
> - **Citrus tokens are gone.** `--coral` (Phase 2's ✗ hover), the "lemon"
>   rest-day and waist-sparkline colors (Phases 5–6), and the `--accent-soft`
>   goal ghost line are retired — statuses speak the terrain tokens
>   (`--failed`, `--rest`, stage hues) and the goal ghost is `--border-strong`
>   dashed.
> - **StreakBreakOverlay (Phase 4) no longer exists.** Streak break is a
>   medium-register in-flow panel with a two-step shelter confirm; detection
>   keys off the lapse boundary (exactly 1 unlogged day — a longer gap routes
>   to the re-entry moment). Nothing auto-dismisses at 2s anymore; heavy
>   overlays are tap-to-dismiss only.
> - **Streak copy** is `Steady. N days walked.` (Phase 1's `Steady. N days.`
>   was re-voiced onto the trail lexicon in the v3 voice pass).
> - **The mission ring is the walk strip** — Phase 4's ring-center cleanup
>   criteria no longer apply; the Dashboard renders the 105-segment trail
>   strip.
> - **The Journey is the serpentine stage-band map** — Phase 8's S-curve,
>   glyph-in-node, and past-path-gradient criteria are superseded by the v3
>   Journey spec (route texture is the status channel; 44px targets and real
>   focusable days survive).
> - **`Use shield on yesterday?` is now the shelter language** — two-step
>   confirm, undoable, introduced during onboarding.
> - The completion screen carries the career line (UI-only derivation) and
>   missions archive **in-app** to `/history`; the export remains the base64
>   file.

**Ordering principle**: highest leverage first. Each phase ends in a usable slice — never half-broken between phases. Phases are grouped so a Claude Code session can finish one phase end-to-end without thrashing across unrelated files.

**Working with Claude Code**: hand off one phase at a time. Each phase's "Done when" is the acceptance test — Claude should run `npm run typecheck` and `npm run build` before declaring done.

---

## Phase 1 — Quick wins batch

**Goal**: clear the underbrush. Bug fixes and 1-line polish that don't fit into a feature theme. Builds momentum and removes noise before bigger phases land.

**Why this is first**: highest leverage-to-effort ratio in the codebase right now. Several items here (encouragement bug, ISO date, mark-as-missed) are real defects. Doing them upfront means later phases don't have to work around them.

**Tasks**
1. Fix the streak-copy dropout for days 5–11 in [src/lib/encouragement.ts](src/lib/encouragement.ts) — collapse the ≥2/≥5/≥12 branches into a single `if (streak >= 2) return \`Steady. ${streak} days.\``.
2. Format the pre-mission header date with `formatNice` in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — replace raw `settings.startDate`.
3. Drop the redundant `Mission to Abs` mini-header at the top of [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — keep only `Day N`.
4. Convert the entire type scale in [tailwind.config.js](tailwind.config.js) from `px` to `rem` per the new DESIGN.md typography table.
5. Fix `Mark as missed` in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) to preserve any existing `success` — only set `fail` on pillars that are currently empty.
6. Add a subtle `+30 XP` hint on the right edge of each SlideToConfirm track at rest (xs, `--text-subtle`) in [src/components/SlideToConfirm.tsx](src/components/SlideToConfirm.tsx) — preview the reward.
7. Pre-create today's entry on Dashboard mount so the Journey today node always renders (write `setDayEntry(today, {})` if the entry doesn't exist).
8. Add a top-level React error boundary as `src/components/ErrorBoundary.tsx`, wrap `<Routes>` in [src/App.tsx](src/App.tsx). On error: full-screen card with `Reload` + `Export current data` buttons (see DESIGN.md "Error handling").
9. Add `aria-label` to photo grid buttons in [src/pages/Photos.tsx](src/pages/Photos.tsx): `Week N, logged` or `Week N, empty`.

**Done when**
- `npm run typecheck` and `npm run build` both green.
- Streak copy shows `Steady. N days.` for any `N >= 2`.
- Dashboard pre-mission header reads e.g. `Begins Sun, Jun 14`, not `2026-06-14`.
- Logging diet ✓ then tapping `Mark as missed` leaves diet as ✓ and only sets exercise to fail.
- Throwing an error inside any route renders the error boundary card instead of a blank screen.

---

## Phase 2 — Failure path + daily-loop refinement

**Goal**: make honest logging easy. Slide fires only on release; every pillar can be marked fail in one tap from the Dashboard; every action is undoable; yesterday is reachable in one tap from Dashboard.

**Why this is second**: the daily loop is the only feature used every day. Bugs here cost the most. Currently the loop is asymmetric (slide for ✓, hunt for ✗) and irreversible — fixing it unlocks honest data, which makes Phase 5's stats meaningful.

**Tasks**
1. [src/components/SlideToConfirm.tsx](src/components/SlideToConfirm.tsx):
   - Move the `if (pct >= THRESHOLD) fire()` check from `onPointerMove` to `onPointerUp`.
   - On release below threshold, snap back to 0 (already does this).
   - Add `role="slider"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={1}` for accessibility.
2. Add a per-row `✗` button in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) Today section, 44px target, `--text-subtle` → `--coral` on hover/focus. Tapping it sets that pillar to `fail` without touching the other; tapping again clears back to empty.
3. Build a single `Undo` toast component (new `src/components/UndoToast.tsx`) and a tiny imperative API (e.g. a Zustand sub-store or a context with `showUndo(label, undoFn)`) so any action site can register an undo. Toast lives 5s, bottom-right above nav, single-slot (replaced if a new action lands).
4. Wire `Undo` into:
   - Diet/Exercise confirm and fail
   - Weight log (debounced — only show undo on first commit, not every keystroke)
   - Photo upload
   - Waist log (added in Phase 5; stub for now)
5. Add a "Quick-log yesterday" row that appears above today's rows when (a) yesterday is unlogged and (b) current local time is before 11:00. Hide once yesterday is logged or after 11:00. Uses the same per-row affordance as today.
6. Remove the old `Mark as missed` link (now redundant with the per-row ✗).

**Done when**
- Aggressive flick that passes 0.8 and returns to 0 before release does NOT log success.
- Tapping ✗ on Diet leaves Exercise untouched.
- Confirming Diet shows `Undid Diet ✓` toast; tapping Undo reverses the action and updates the journey.
- A second action while the toast is up replaces the toast with the new action's undo.
- Quick-log yesterday row appears at 7am if yesterday wasn't logged, disappears at 11am or once logged.

---

## Phase 3 — Onboarding flow + pre-mission state + goals (schema v3)

**Goal**: every new user gets a real first-run experience; the data model gains `onboarded`, goals, waist unit, streak shields, and migrates cleanly.

**Why this is third**: the onboarding gap is the biggest UX hole, but it depends on schema fields that need to land in one transaction. Doing the schema bump and the onboarding screens together avoids two migrations.

**Tasks**
1. **Schema v3** in [src/types.ts](src/types.ts) and [src/store/mission.ts](src/store/mission.ts):
   - Add to `Settings`: `onboarded: boolean`, `goalWeight?: number`, `goalWaistCm?: number`, `waistUnit: 'cm' | 'in'`, `streakShieldsRemaining: number`.
   - Add an empty `measurements: WeekMeasurement[]` array to the store (used by Phase 5).
   - Add `WeekMeasurement` type to types.ts.
   - Bump persist `version` to 3. Write `migrate` from v2: default `onboarded: false`, `streakShieldsRemaining: 1`, `waistUnit: 'cm'`, `measurements: []`.
2. **Route guard** in [src/App.tsx](src/App.tsx): wrap `<Routes>` in a guard that, if `!settings.onboarded` and pathname is not `/onboarding`, redirects to `/onboarding`. Existing users (migrated, `onboarded: false`) get a Dashboard banner instead — see step 5.
3. **New page**: `src/pages/Onboarding.tsx`. Three swipeable screens per DESIGN.md "Onboarding flow":
   - Screen 1: value prop + commitment + three feature lines + `Begin` CTA.
   - Screen 2: schedule (start date, duration), goals (weight, waist), unit segments.
   - Screen 3: baseline (today's weight, today's photo, today's waist). Photo and waist optional.
   - `Skip baseline` link on screen 3, `Set goals later` on screen 2.
   - On finish or skip, write `setSettings({ onboarded: true })` and navigate to `/`.
4. **Pre-mission Dashboard state** in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx):
   - When `rawDay < 1`: render countdown ring (0%, muted, no pulse), center text `Begins in 4 days` + `Sun, Jun 14`, a non-interactive preview card showing the Today rows in faded state, and a small `Open Settings` link.
5. **Existing-user soft banner**: if `onboarded === false` AND the store has any entries from before v3 (heuristic: `Object.keys(days).length > 0`), set `onboarded: true` automatically and instead show a one-shot dismissable banner on Dashboard: `Welcome back. Set your goals?` → links to a slimmed Settings entry point. Track dismissal in a new `localStorage` key.

**Done when**
- Fresh install lands on `/onboarding` and cannot leave until completed or skipped.
- After completing onboarding, the Dashboard shows the user's chosen start date, weight unit, and (if entered) goal weight stored.
- Pre-mission Dashboard shows the countdown layout, never raw ISO.
- An upgrade from v2 (existing data) lands on the Dashboard with the welcome-back banner, not the onboarding flow.
- Store version is 3; migration tested by manually editing localStorage from v2 shape.

---

## Phase 4 — Streak surface + dashboard polish + stage transitions

**Goal**: make the streak visible, design the streak-break moment, clean up the mission ring, celebrate stage crossings.

**Why this is fourth**: cheap to ship and high retention impact within the no-notifications constraint. The mechanic already exists in code; this phase brings it to the surface.

**Tasks**
1. **Streak pill** in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) header — show whenever `streak >= 2`. Right-aligned opposite the `Day N` label. Use existing `calcStreak`.
2. **Update `calcStreak`** in [src/lib/streak.ts](src/lib/streak.ts) to count `entry.rest === true` as a streak-preserving day (alongside both-success). Schema field already added in Phase 3.
3. **Streak shield UI**: when `settings.streakShieldsRemaining > 0`, show `◐ 1` next to the streak pill, tappable. Tap opens a confirm sheet: `Use shield on yesterday?` On confirm, set yesterday's entry to `{ rest: true }` and decrement shields.
4. **Streak-break overlay** (new `src/components/StreakBreakOverlay.tsx`, same shape as [src/components/LevelUpOverlay.tsx](src/components/LevelUpOverlay.tsx)):
   - Triggers on Dashboard mount if (a) yesterday's status is `failed` or `missed`, (b) previous-to-yesterday streak (before the break) was ≥ 2, and (c) we haven't already shown the overlay for this break (use a `localStorage` flag keyed by the break date).
   - If shields > 0, show two buttons: `Use shield` / `Let it go`. Otherwise auto-dismiss at 2s.
5. **Mission ring center cleanup** in [src/components/MissionRing.tsx](src/components/MissionRing.tsx): collapse the three center lines to two — `47 / 105` (5xl, primary) and `45% · 58 left` (sm, muted). Drop the standalone percent on top.
6. **Stage transition overlay** (new `src/components/StageOverlay.tsx`):
   - Triggers on Dashboard mount when today's day-number is the first day of a new stage (day 22, 43, 64, 85) AND we haven't shown it yet for this stage.
   - Same shape as Level-up. `Stage 2` → `Build` → one zen line from DESIGN.md "Microcopy guide".
7. **Halfway banner** (Day 53 for a 15-week mission): non-overlay, in-flow card on Dashboard for that day only: `Halfway. Keep walking.`

**Done when**
- Streak pill appears at `streak === 2` and updates daily.
- Marking yesterday as `rest` keeps a 12-day streak alive instead of breaking it.
- Skipping a day shows the streak-break overlay once on the next open; shield option works if available.
- Mission ring center reads two lines, not three.
- First Dashboard open on day 22 shows the `Stage 2 · Build` overlay.

---

## Phase 5 — Waist measurement + Progress page upgrades

**Goal**: add the measurement that actually tracks body recomp, plus the analysis users want — trendline, adherence, goal pacing.

**Why this is fifth**: depends on schema v3 (goalWeight, waistUnit, measurements). Adds the highest-signal metric for the named goal (abs). Makes Progress page the page worth visiting weekly.

**Tasks**
1. **Waist input on Photos page** in [src/pages/Photos.tsx](src/pages/Photos.tsx): below the current-week slot, a single number input with the user's `waistUnit`. Debounced write to `measurements`. Granted 20 XP per new measurement.
2. **Waist input in Day Editor** ([src/components/DayEditor.tsx](src/components/DayEditor.tsx)): only show for days that are the last day of their week (Sundays for weeks starting Monday, or based on `weekNumberFor`). Same field, same persistence.
3. **Progress page rework** in [src/pages/Progress.tsx](src/pages/Progress.tsx):
   - **Headline pair**: `−4.2 kg · −7 cm waist` (or just weight if no waist data).
   - **Adherence stats card**: above the chart. `Perfect days N / M` (5xl), then `Diet X% · Exercise Y% · Rest Z days` (sm muted).
   - **Trendline projection**: a `Show projection` checkbox below the chart. When on, render a dashed `--text-muted` line extrapolating linearly from the last 14 days of weight to Day 105. Label at the end: `On pace for 70.8 kg.` (or `Pace unclear — log more weights.` if data is too noisy — use a simple variance threshold, no formal r²).
   - **Goal ghost line**: if `settings.goalWeight` is set, render a horizontal `--accent-soft` line on the chart with a small right-aligned label `Goal 70 kg`.
   - **Waist sparkline**: below the weight chart, smaller (h-32), lemon stroke, same XAxis day numbers. Skip entirely if no measurements.
4. **Adherence math** in a new `src/lib/adherence.ts` — pure function: takes `days`, returns `{ perfectDays, totalLogged, dietPct, exercisePct, restCount }`. Only count past days up to today.
5. **XP grant for waist measurement** in [src/lib/xp.ts](src/lib/xp.ts): add `waist: 20` and include in `totalXp`.

**Done when**
- Logging a waist value persists, shows the +20 XP toast, and renders on the Progress waist sparkline.
- Progress page shows the dual-delta headline when waist data exists, weight-only otherwise.
- Adherence card shows correct counts (verify with `console.table(days)`).
- Trendline toggle works without flicker; label updates as data changes.
- Goal ghost line renders when `goalWeight` is set, vanishes when unset.

---

## Phase 6 — Mission completion + rest days + new mission + streak shield refill

**Goal**: the endgame. After 105 days the app must not go dark. Add the completion screen, the archive-and-restart flow, and tie up rest-day UI loose ends.

**Why this is sixth**: serves only the most invested users (those who finish or are close to it), but for them it's the entire point. Builds directly on Phase 5's adherence math.

**Tasks**
1. **Rest day UI** in [src/components/DayEditor.tsx](src/components/DayEditor.tsx): third button alongside Diet/Exercise: `Rest day` (lemon when active). Toggling it on clears any `diet`/`exercise` state and sets `rest: true`; toggling off clears `rest`. Update [src/lib/dayStatus.ts](src/lib/dayStatus.ts) to return `'rest'` when `rest === true`. Add `--rest` / `--rest-bg` Tailwind tokens (already in DESIGN.md tokens) — wire into [tailwind.config.js](tailwind.config.js).
2. **Rest day on Dashboard**: in the Today section, a small `Rest day` link below the per-row controls. Same confirm semantics as the editor button.
3. **Journey rest rendering** in [src/components/JourneyPath.tsx](src/components/JourneyPath.tsx): handle the new `'rest'` status (lemon fill, ☾ glyph from Phase 8's glyph work — for now just lemon).
4. **Mission completion layout** in [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx): when `rawDay > totalDays`, render the completion layout per DESIGN.md "Mission completion":
   - Filled final ring (`105 / 105`, no pulse)
   - Headline: `−4.2 kg · −7 cm waist` (use adherence helpers from Phase 5)
   - Stats: `Perfect days 78 / 105 · Diet 84% · Exercise 79% · Longest streak 31` (compute longest streak with a new walk in `src/lib/streak.ts`)
   - Photos strip: first + last thumbnails with a Compare button linking to `/compare/1/N`
   - Two CTAs: `Export mission archive` and `Begin a new mission`
5. **Mission archive export** in a new `src/lib/archive.ts`:
   - Bundle settings + days + measurements + photos (base64) + final XP into a `MissionArchive` JSON.
   - Download as `mission-archive-YYYYMMDD.json`.
6. **New mission flow**:
   - "Begin a new mission" opens a confirm sheet: `Archive this mission and start fresh? Your goals will carry forward.`
   - On confirm: auto-trigger the archive export, then call a new store action `startNewMission()` that clears `days`, `measurements`, `photos` (and IndexedDB blobs), sets `startDate: todayISO()`, keeps `goalWeight`, `goalWaistCm`, `xp`, `weightUnit`, `waistUnit`, `theme`. Resets `streakShieldsRemaining: 1`.
7. **Longest-streak helper** in [src/lib/streak.ts](src/lib/streak.ts): a `longestStreak(days, startDate, todayLimit)` pure function.

**Done when**
- Marking a day as `rest` on Dashboard or editor renders lemon on the Journey, preserves streak, grants 30 XP.
- Setting the system date past `startDate + totalDays` makes the Dashboard show the completion layout.
- `Export mission archive` produces a valid JSON that round-trips through Settings → Import (test imports back as a new "v3 archive" payload — verify settings, days, measurements, photos all restored).
- `Begin a new mission` shows confirm → exports → resets to Day 1 with goals intact and XP preserved.

---

## Phase 7 — Photos UX

**Goal**: replace the implicit, irreversible compare flow with a discoverable action sheet, fix the missing replace path, handle EXIF, pair photos with weights.

**Why this is seventh**: weekly flow, not daily. Lower frequency than the daily loop, but currently has real friction (can't replace without deleting first; long-press to delete is invisible).

**Tasks**
1. **Action sheet on filled slot** ([src/pages/Photos.tsx](src/pages/Photos.tsx)): tapping a filled slot opens a bottom sheet (reuse [src/components/BottomSheet.tsx](src/components/BottomSheet.tsx)) with options: `View · Replace · Compare with… · Delete`.
2. **Replace flow**: same picker logic as upload, but skip the "isNew" XP grant.
3. **Delete from action sheet**: confirm inside the sheet (`Delete week N photo?`), then call `removePhoto` + `deletePhoto`. Remove the long-press `onContextMenu` path entirely (was undiscoverable).
4. **`Compare with…` flow**: when selected, the sheet shows a slot picker — small grid of other filled slots, tap one to navigate to `/compare/a/b`. No auto-navigate from grid taps.
5. **Pinned `Compare with current`** button in the Photos header when the most recent week has a photo. Tapping it asks for a single counterpart.
6. **Loading state during upload**: while `busy`, the entire target slot pulses with a `--surface-2` shimmer (CSS animation), `Saving…` centered. Currently the spinner text is cramped inside a small slot.
7. **EXIF orientation** in [src/lib/image.ts](src/lib/image.ts): switch from `new Image()` to `createImageBitmap(file, { imageOrientation: 'from-image' })` where supported, fallback to current path. Verify on an iPhone portrait photo (should not render rotated).
8. **Photo-to-weight pairing**: each filled slot shows the paired weight (from the entry on the photo's `date`) underneath the thumb in xs `--text-muted`: `74.3 kg`.
9. **Compare view weight overlay** in [src/pages/Compare.tsx](src/pages/Compare.tsx): show both weights in the bottom bar alongside the week labels.

**Done when**
- Tapping a filled slot opens the action sheet, not the compare-select mode.
- Replacing a photo doesn't grant XP; uploading a new photo to an empty slot does.
- Uploading a photo on a slow throttle (DevTools) shows the slot-wide shimmer for the full duration.
- An iPhone portrait shot uploaded fresh renders portrait (test by uploading a known photo).
- Each filled slot shows the weight on the photo's date below the thumb.

---

## Phase 8 — Journey + Stages polish

**Goal**: real curves, real tap targets, real legibility. Add the color-blind glyphs and the notes indicator.

**Why this is eighth**: browsing flow, not daily. Polish that improves perceived quality but doesn't move retention much. Done after the core loops are right.

**Tasks**
1. **S-curves at row pivots** in [src/components/JourneyPath.tsx](src/components/JourneyPath.tsx): rewrite `pathD` to use quadratic curves (`Q`) at the last node of each row. Pivot control point lives one row-step above/below the row's endpoint. Verify path reads as a continuous walk.
2. **44px tap targets**: replace `Math.max(10, r + 6)` invisible hit radius with `Math.max(22, r + 12)` (22 → 44px diameter). Visual node size unchanged.
3. **Stage label legibility**: change stage `<text>` from `fontSize: 9, fill: var(--text-subtle)` to `fontSize: 11, fill: var(--text-muted)`. Verify WCAG AA contrast against `--surface`.
4. **Color-blind glyphs inside nodes**: render a small inline SVG glyph (✓ / ~ / ✗ / ☾) centered inside non-future nodes when `r >= 5`. White, opacity 0.85, 7px nominal size. Skip on missed (gray) and future (empty).
5. **Notes indicator dot**: a 3px `--accent` filled circle at the top-right of any node whose `entry.notes` is non-empty.
6. **Past-path gradient**: split the path stroke into two `<path>` elements — past portion uses `--border-strong`, future portion uses `--surface-2`. Gives a sense of "how far I've walked."
7. **Real focusable Journey nodes**: each node should be reachable via Tab order. Replace the bare `<circle>` with a `<g role="button" tabindex="0" aria-label="Day N, status">` that responds to `Enter`/`Space` by calling `onSelect`. Order by `dayNum`.

**Done when**
- The Journey reads as a smooth winding path, not switchbacks with vertical jumps.
- Tapping near a node still triggers it from anywhere within ~44px (test with finger on actual device).
- Stage labels readable on light AND dark themes.
- A logged-success day shows a small ✓ inside its node.
- Tab key cycles through nodes in day order; Enter opens the editor.

---

## Phase 9 — Settings hardening + data safety

**Goal**: make the rare-but-irreversible actions safe. Reset, import, weight-unit change, and backup hygiene.

**Why this is ninth**: low frequency. But when these go wrong they go really wrong (15 weeks of data destroyed by a missed tap).

**Tasks**
1. **Two-step reset** in [src/pages/Settings.tsx](src/pages/Settings.tsx): replace the single `confirm()` with a bottom-sheet flow — text input requiring exactly `RESET`, button disabled until match. Final tap performs the reset (existing logic).
2. **Import diff preview**: when an import file is selected, parse it first and show a sheet: `Backup contains: N entries, M photos, K measurements, start date X. Current: …`. Tap `Replace` to commit; cancel discards the file.
3. **`Backed up N days ago` Dashboard nudge**: store `lastExportedAt: string | null` in `Settings` (add to schema migration in Phase 3 or here as a v4 micro-bump). After every successful export, update it. On Dashboard, if `lastExportedAt` is older than 30 days (or null AND user has > 7 entries), show a one-row card: `Backed up 31 days ago. Export?` linking to Settings.
4. **Weight unit conversion**: when toggling `weightUnit` in Settings, show a confirm: `Convert N stored weights from kg to lb?` On confirm, multiply every `entry.weight` by 2.20462 (or divide for lb→kg) and round to 1 decimal. Update the goalWeight too. On cancel, revert the toggle.
5. **Waist unit display**: waist is always stored in cm; the `waistUnit` setting only changes display. Verify all consumers (Photos input, Progress page, Day Editor) convert cm→in for display when needed.

**Done when**
- Reset requires typing `RESET` exactly; case-sensitive.
- Selecting an import file shows a diff before any change happens.
- After 31 simulated days with no export, Dashboard shows the nudge card.
- Toggling kg→lb on a store with 5 weights produces 5 correctly-converted weights (verify in DevTools).
- Setting waist unit to `in` shows all waist values as inches in the UI; storage in localStorage remains cm.

---

## Phase 10 — Performance + self-hosted font + opt-in local analytics

**Goal**: faster cold start, no third-party network dependency, and a privacy-preserving way to learn what users actually do.

**Why this is last**: nothing in this phase is currently broken. App isn't slow. But shipping these as the final layer cleans up real concerns (CDN dependency on first paint contradicts "offline-first") and gives you data for v3 planning.

**Tasks**
1. **Self-host Inter**: remove the `<link>` to `https://rsms.me/inter/inter.css` from [index.html](index.html). Install via `npm install @fontsource-variable/inter`, import the woff2 subset in [src/main.tsx](src/main.tsx) or [src/index.css](src/index.css). Add `font-display: swap`. Verify no network requests to rsms.me on cold load.
2. **Route-level code splitting** in [src/App.tsx](src/App.tsx):
   - `const PhotosPage = lazy(() => import('./pages/Photos'))`
   - Same for `Compare`, `Progress`, and `Settings`.
   - Wrap `<Routes>` in `<Suspense fallback={null}>` (a flash of nothing is fine here; routes are below-the-fold).
3. **Bundle audit**: run `npm run build` and inspect `dist/assets/*.js` sizes. Note recharts is the biggest dep; it should now be in the Progress chunk only.
4. **Opt-in local analytics** (off by default):
   - Add `Settings.analyticsEnabled: boolean` (default false).
   - Add a Settings toggle: `Local analytics (counts only — never leaves device)`.
   - When on, maintain `mission.analytics` in localStorage: `{ sessionsOpened, daysLogged, photosUploaded, measurementsLogged, undosUsed, missionsCompleted }`.
   - Add an `Export analytics` button in Settings → Data that downloads the analytics object as JSON.
   - No automatic sending. No remote endpoints. Purely a local count you can ask the user to export and share.

**Done when**
- DevTools Network tab shows zero requests to `rsms.me` on first paint.
- `dist/assets/` contains separate chunks for the route bundles; entry chunk is smaller than baseline.
- Toggling analytics on → opening Dashboard 3 times → exporting shows `sessionsOpened: 3`.
- All DESIGN.md acceptance criteria check.

---

## After Phase 10

The app is at v2-complete: every recommendation from the May 2026 design review is shipped. Resist mid-build feature creep — anything new goes in a v3 phase plan.

If you're still here on Day 105: the app worked. Take the photo.
