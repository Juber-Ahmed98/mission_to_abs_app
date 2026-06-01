# Update Phases

Each phase is independently shippable and ends with a single commit. Sequencing is
intentional: smallest, safest, highest-visibility wins first (this is a portfolio piece —
see [update.md](update.md) for context). `npm run typecheck` and `npm run build` must
pass at the end of every phase.

---

## Phase 1 — Kill the dark-mode cold-start flash

**Goal** — dark-mode users never see a white flash before the app paints.

**Changes**
- [index.html](index.html) — add a blocking inline script in `<head>` **before**
  `<script type="module" src="/src/main.tsx">`:
  ```html
  <script>
    (function () {
      try {
        var raw = localStorage.getItem('mission');
        var pref = raw ? (JSON.parse(raw).state.settings.theme) : 'system';
        var dark = pref === 'dark' ||
          (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
        if (dark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  </script>
  ```
- Leave [src/lib/theme.ts](src/lib/theme.ts) as-is — `applyTheme` is idempotent and keeps
  the class correct after hydration and on system-theme changes.

**Verification**
- Set theme to Dark, hard-reload → no white flash; first paint is dark.
- Theme = System with OS in dark → same.
- Light theme → no regression.
- Toggling theme in Settings still works live.

**Commit** — `Fix cold-start theme flash: resolve theme before first paint`

---

## Phase 2 — Slide-to-confirm discoverability

**Goal** — a first-time user on a phone can tell how to mark a pillar done.

**Changes**
- [src/components/SlideToConfirm.tsx](src/components/SlideToConfirm.tsx) — the hint span is
  `hidden sm:inline`; make an affordance visible on mobile. Either drop `hidden sm:` so the
  hint always shows, or render the hint text and keep the `+XP` chip. Optionally add a
  one-time thumb "nudge" animation (a small left→right translate) on the first unlogged row
  per day, gated by a `localStorage` flag and disabled under `prefers-reduced-motion`.
- No prop/contract changes to [src/components/TodayRow.tsx](src/components/TodayRow.tsx).

**Verification**
- Narrow viewport (<640px): the slide affordance/text is visible on an unlogged row.
- Sliding past threshold still confirms; keyboard Enter/Space still confirms.
- Confirmed and failed states unchanged.

**Commit** — `Slide-to-confirm: show affordance on mobile`

---

## Phase 3 — Accessibility baseline

**Goal** — clear the concrete WCAG defects.

**Changes**
- [index.html](index.html) line 7 — remove `user-scalable=no` from the viewport meta
  (keep `viewport-fit=cover`).
- [src/index.css](src/index.css) — light-mode `--text-subtle: #A1A1AA` → ~`#6B6B73`
  (verify ≥ 4.5:1 on `--bg` and `--surface`). Dark mode already passes; leave it.
- [src/pages/Journey.tsx](src/pages/Journey.tsx) — add the status glyph (✓ ~ ✗ ☾) to each
  `Legend` swatch so meaning isn't colour-only.
- Overlays — [src/components/StageOverlay.tsx](src/components/StageOverlay.tsx),
  [src/components/LevelUpOverlay.tsx](src/components/LevelUpOverlay.tsx),
  [src/components/StreakBreakOverlay.tsx](src/components/StreakBreakOverlay.tsx): wrap content
  in `role="status"` / `aria-live="polite"`; when `prefers-reduced-motion` is set, drop the
  auto-dismiss timer and rely on tap-to-dismiss (don't auto-close mid-read).
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) ~line 316 — bump the streak-shield pill
  to a 44px-min target (e.g. `h-11`, adjust padding).

**Verification**
- Android Chrome: pinch-to-zoom works.
- Contrast checker: subtle text ≥ 4.5:1 in light mode.
- Journey legend shows glyphs; readable in greyscale.
- With reduced-motion on, an overlay stays until tapped.
- Shield pill hit area ≥ 44px.

**Commit** — `A11y: enable zoom, fix subtle-text contrast, overlay + legend semantics`

---

## Phase 4 — Remaining polish (skeletons, banner gate, onboarding back)

**Goal** — finish the quick-win batch.

**Changes**
- [src/App.tsx](src/App.tsx) ~line 74 — replace `<Suspense fallback={null}>` with a minimal
  skeleton component (page-shaped placeholder using existing tokens).
- [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — priority-gate the secondary banners
  (reminder, welcome-back, backup nudge, install, halfway, quick-log-yesterday) so **at most
  one** renders, by a defined precedence; the daily logging UI always stays above the fold.
- [src/pages/Onboarding.tsx](src/pages/Onboarding.tsx) — add a back control on screens 2 and 3
  (`setScreen(screen - 1)`); screen 0 unchanged.

**Verification**
- Throttle network → lazy routes show a skeleton, not a blank screen.
- Force multiple banner conditions → only one shows; logging rows stay above the fold.
- Onboarding: advance to screen 3, go back to 2 and 1, values preserved.

**Commit** — `Polish: lazy-route skeletons, single-banner gate, onboarding back`

---

## Phase 5 — Custom pillar labels

**Goal** — users can rename the two pillars; the rest of the app uses those names.

**Changes**
- [src/types.ts](src/types.ts) — `Settings` gains
  `pillarLabels: { diet: string; exercise: string }`. Data keys on `DayEntry` stay
  `diet`/`exercise` (no entry migration).
- [src/store/mission.ts](src/store/mission.ts) — add
  `pillarLabels: { diet: 'Diet', exercise: 'Exercise' }` to `makeInitialSettings()`; bump
  `version: 6 → 7`; add an `if (version < 7)` migration filling the defaults.
- [src/pages/Settings.tsx](src/pages/Settings.tsx) — new `<Section title="Pillars">` after
  `Schedule`. Two short text inputs (debounced like
  [src/components/WeeksInput.tsx](src/components/WeeksInput.tsx)): trim, cap at ~16 chars,
  restore the default if emptied.
- Thread `settings.pillarLabels` through every rendered "Diet"/"Exercise":
  - [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — today rows, yesterday quick-log rows,
    pre-mission placeholder rows, `pillarHandlers` undo labels, aria-labels.
  - [src/components/DayEditor.tsx](src/components/DayEditor.tsx) — the two `Toggle` labels.
  - [src/pages/Progress.tsx](src/pages/Progress.tsx) — the adherence summary line.

**Verification**
- `npm run typecheck` passes; existing v6 data migrates to v7 with default labels.
- Rename "Diet" → "Steps": Dashboard, DayEditor, Progress adherence, undo toasts, and
  aria-labels all reflect it. Streaks/adherence/XP unchanged.
- Empty a label, blur → reverts to default.
- Export JSON → `settings.pillarLabels` present.

**Commit** — `Custom pillar labels: rename the two daily pillars`

---

## Phase 6 — In-app mission history

**Goal** — completed missions stay viewable in the app instead of being wiped.

### 6a — Store: archive instead of wipe
**Changes**
- [src/types.ts](src/types.ts) — add an `ArchivedMission` type:
  `{ id, archivedAt, settings, days, measurements, photos: WeekPhoto[], finalXp, stats: { perfectDays, longestStreak, weightDeltaKg?, waistDeltaCm? } }`.
- [src/store/mission.ts](src/store/mission.ts) — `State` gains `history: ArchivedMission[]`;
  `startNewMission` **pushes** the current mission (computed summary + retained photo keys)
  onto `history` instead of clearing photos; bump store version + migration (`history: []`).
  Add `deleteArchivedMission(id)` that removes the entry **and** its IndexedDB photos.
- Storage note: photos now accumulate — keep the existing storage row in
  [src/pages/Settings.tsx](src/pages/Settings.tsx) visible; show count of archived missions.

### 6b — History view
**Changes**
- New `src/pages/History.tsx` (lazy route `/history`, nav hidden like Compare). Lists archived
  missions newest-first: date range, headline delta, then/now thumbnails; tap → read-only
  summary (reuse the layout from [src/components/MissionCompleted.tsx](src/components/MissionCompleted.tsx)).
  Each row has a delete action (confirm via `BottomSheet`).
- Entry points: a "Past missions" link in [src/pages/Settings.tsx](src/pages/Settings.tsx) (Data
  section) and on [src/components/MissionCompleted.tsx](src/components/MissionCompleted.tsx).
- [src/App.tsx](src/App.tsx) — register `/history`; add to the `hideNav` check.

### 6c — Cross-mission compare (follow-up)
**Changes**
- Generalise [src/pages/Compare.tsx](src/pages/Compare.tsx) to accept photo **keys** (or
  `missionId + week`) instead of only current-mission week numbers, enabling
  day-1-ever vs. today. Add a "compare with very first photo" affordance in History.

**Verification**
- Complete a mission, begin a new one → old mission appears in History with correct stats and
  thumbnails; new mission starts clean; old photos still load.
- Delete an archived mission → entry gone, its photos removed from IndexedDB, storage usage drops.
- Archived missions render with the pillar labels they used (Phase 5 interplay).
- (6c) Compare a current photo against a previous mission's first photo.

**Commits**
- `Mission history: archive completed missions instead of wiping`
- `Mission history: read-only history view + delete`
- `Mission history: cross-mission photo compare`

---

## Cross-phase notes

- **Schema bumps** — Phases 5 and 6 each bump the persisted store version; every migration
  must default new fields safely so existing users lose nothing.
- **Local-first, no backend** — unchanged. Nothing here adds network calls, accounts, or
  fitness content; the app stays a *witness, not a coach*.
- **Storage pressure** — history retains photos indefinitely; the delete action and the
  existing storage estimate/eviction warnings in [src/pages/Settings.tsx](src/pages/Settings.tsx)
  are the pressure-release valve.
