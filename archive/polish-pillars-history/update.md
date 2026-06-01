# Update — Polish Pass, Custom Pillars, Mission History

Three workstreams from the 2026-05-31 design review. Each is independently
shippable; the phased breakdown is in [updatePhases.md](updatePhases.md).

**Context that set these priorities** — Mission to Abs is a **personal / portfolio
build**, primary target **Android installed PWA**, framed as a **discipline /
recomposition** tracker (the terse stoic voice is the brand; "Abs" is just a hook).
It stays **local-first, no backend**. The app remains a *witness, not a coach* — no
fitness content is added anywhere below.

Because it's a portfolio piece, **craft in the first 30 seconds is the product.**
That is why the polish/accessibility pass ships first, ahead of the two features.

---

## 1. Polish & accessibility pass (highest priority)

A reviewer judges a portfolio app on the details that surface immediately. These are
all small, mostly one-file changes.

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Dark-mode cold-start flash** — theme is applied in a React effect after mount, so dark users see a white blink before `html.dark` is toggled. | [src/lib/theme.ts](src/lib/theme.ts), [index.html](index.html) | Inline a pre-paint script in `<head>` that sets `html.dark` from persisted prefs before first paint. |
| 2 | **Slide hint hidden on mobile** — `hidden sm:inline` hides "Slide to confirm" on phones, the primary platform; new users see only a chevron + "+30 XP". | [src/components/SlideToConfirm.tsx](src/components/SlideToConfirm.tsx) (line ~184) | Show an affordance on mobile (text, or a one-time thumb nudge on the first unlogged day). |
| 3 | **Zoom disabled** — `user-scalable=no` is a WCAG 1.4.4 failure and blocks low-vision users on Android. | [index.html](index.html) (line 7) | Remove `user-scalable=no` from the viewport meta. |
| 4 | **Light-mode `--text-subtle` ~2.6:1 contrast** — below the 4.5:1 AA threshold; used for hints, placeholders, "Optional", secondary stats. (`--text-muted` ~4.8:1 is fine.) | [src/index.css](src/index.css) (line ~15) | Darken `--text-subtle` to ~`#6B6B73`, or restrict its use to large text. |
| 5 | **Overlays auto-dismiss in 1.7–2.0s, no focus/announcement** — too fast to read; invisible to screen readers; timer ignores reduced-motion. | [src/components/LevelUpOverlay.tsx](src/components/LevelUpOverlay.tsx), [src/components/StageOverlay.tsx](src/components/StageOverlay.tsx), [src/components/StreakBreakOverlay.tsx](src/components/StreakBreakOverlay.tsx) | Tap-to-dismiss that doesn't race the timer; lengthen/disable the timer under `prefers-reduced-motion`; add `aria-live`. |
| 6 | **Journey legend is colour-only** — nodes carry glyphs (✓ ~ ✗ ☾) but the legend swatches don't, failing colourblind parity (green/red). | [src/pages/Journey.tsx](src/pages/Journey.tsx) (Legend) | Add the matching glyph to each legend swatch. |
| 7 | **Blank screen on lazy routes** — `<Suspense fallback={null}>` shows nothing while Progress/Photos/Compare/Settings load. | [src/App.tsx](src/App.tsx) (line ~74) | Replace `null` with a minimal skeleton. |
| 8 | **Dashboard banner stacking** — up to 6 conditional banners can co-occur and push the logging UI below the fold. | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) | Priority-gate so at most one secondary banner shows at a time. |
| 9 | **No back button in onboarding** — screens only advance or skip. | [src/pages/Onboarding.tsx](src/pages/Onboarding.tsx) | Add a back affordance (3→2, 2→1). |
| 10 | **Streak-shield pill < 44px target** — `px-2 py-1 text-xs`. | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) (line ~316) | Enlarge to a 44px-min touch target. |

---

## 2. Custom pillar labels

The app promises *"bring your own plan"* but hardcodes the two pillars to **Diet**
and **Exercise**. A user whose plan is "10k steps" + "no alcohol" can't represent it.

**Approach** — purely a *presentation* change. The underlying `DayEntry` keys stay
`diet` / `exercise` (no data migration of entries); only the **display labels** become
configurable. This keeps streak/adherence/XP logic untouched.

- `src/types.ts` — `Settings` gains `pillarLabels: { diet: string; exercise: string }`.
- `src/store/mission.ts` — default `{ diet: 'Diet', exercise: 'Exercise' }`; bump store
  **v6 → v7** with a migration that fills the defaults for existing users.
- `src/pages/Settings.tsx` — new **Pillars** section with two short text inputs
  (debounced like [src/components/WeeksInput.tsx](src/components/WeeksInput.tsx);
  trim, cap length, fall back to default when emptied).
- Thread the labels through everywhere the words "Diet"/"Exercise" are rendered:
  [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) (today + yesterday rows, pre-mission
  placeholder rows, undo labels, aria-labels), [src/components/DayEditor.tsx](src/components/DayEditor.tsx)
  (Toggle labels), [src/pages/Progress.tsx](src/pages/Progress.tsx) (adherence line).
- Archive/export already serialise the full `settings`, so the labels are captured
  automatically — important for history (item 3) so a past mission renders with the
  labels it actually used.

Out of scope: a third pillar, per-day custom pillars.

---

## 3. In-app mission history

Starting a new mission currently **archives to a download and wipes everything**
(`startNewMission` in [src/store/mission.ts](src/store/mission.ts)). Completed missions
should stay viewable in the app — the "whole journey" view is the strongest part of the
portfolio narrative.

**Approach**

- On "begin new mission", instead of clearing, **move the finished mission into a
  `history` list** in the store and keep its photos in IndexedDB (photo keys are already
  timestamped, so no collision with the new mission's `week-N-*` keys).
- Each history entry stores `{ id, archivedAt, settings (incl. pillarLabels), days,
  measurements, photos: WeekPhoto[], finalXp }` plus precomputed summary stats
  (perfect days, longest streak, weight/waist delta) so the list renders without
  recomputation.
- A read-only **History** view (reached from Settings and the completion screen — *not*
  a 6th tab) lists past missions with then/now thumbnails; tapping one shows its summary.
- A **delete archived mission** action (with confirm) to reclaim IndexedDB space; surface
  cumulative usage via the existing storage row in [src/pages/Settings.tsx](src/pages/Settings.tsx).

**Follow-up (separate phase):** generalise [src/pages/Compare.tsx](src/pages/Compare.tsx)
to compare photos *across* missions (day-1-ever vs. today) by passing photo keys rather
than current-mission week numbers.

---

## Why this order

Polish first because it's cheap and it's what a portfolio is graded on. Custom pillars
next — small, self-contained, and it sharpens the core promise. History last because it
touches the store schema, IndexedDB lifecycle, and a new view, and benefits from the
pillar-label work landing first (so archived missions capture their labels). Each phase
in [updatePhases.md](updatePhases.md) ends in a single focused commit.
