# Mission to Abs — Design Contract (v3 · Waypoint)

> The design contract for a 15-week body-recomposition accountability PWA.
> v3 pins the **Waypoint** direction — chosen at Gate 1 (2026-07-30) and pinned
> on the Journey render at Gate 2 (2026-07-31) — as law for every production
> phase. Every later phase verifies against this document, not against memory.
> Build sequence in [updatePhases.md](updatePhases.md); spec and argument in
> [update.md](update.md); v1/v2 build history in [PHASES.md](PHASES.md).
>
> **Gate 3:** ✅ signed by the owner, 2026-07-31 ("sign all"). This contract is
> law; production phases are unlocked and verify against this document.

---

## Mission
A private, offline-first PWA for a 15-week body-recomposition mission. The user opens it daily, logs weight + diet + exercise, takes a weekly progress photo and a weekly waist measurement, and watches progress along a 105-day journey. The mission is a place: a route walked through five stages of country, light-first, expressive where it counts — a moment the user looks forward to, not a chore. The design target is the owner on a bad day, mid-lapse: day 62, nothing logged for weeks, coming back. The app must feel good to open on that day first; the good days take care of themselves.

## Product feel
- **Tone**: a paper map in daylight. Warm, physical, expressive-celebratory. The color in the room is *where you are* — the current stage's hue is the accent, everywhere.
- **Metaphor**: the mission as a place — a route walked. Days are stretches of trail; rest days are camps; failures are rough ground; a lapse is a dotted stretch already behind you; day 105 is the summit.
- **Inspiration**: trail maps and altimeters for the spatial language; Apple Watch for tactile confirmation; the v2 system's honesty, kept.
- **Voice**: short, declarative, honest, placed. "Camp was Day 41." not "You've got this." Confidence over excitement. **No exclamation marks. No hype.** Expressiveness lives in color, motion, and iconography — never in punctuation.
- **Allowed**: gamification (XP, levels, streak), springs and pops, stage-hued celebration, particles within the sanctioned bounds (see Motion), generosity, everything-visible density.
- **Avoided**: hype copy, shame copy, bodybuilder aesthetics, attributed motivational quotes, scarlet-lettering the past.

## Philosophy
- **The mission is a place.** Every surface answers "where am I on the route?" before anything else. Stage-keyed hues (5) carry the answer; the accent *is* the current stage.
- **The gap is geography, not guilt.** Unrecorded days render as a dotted stretch of trail — visible, legible, never scarlet. The route never left the map.
- **Earned satisfaction.** Logging feels good because of motion, haptics, and visible XP gain. Celebration is proportional, brief, and honest.
- **Honest logging.** Marking failure is as easy as marking success. Rough ground marks as easily as a walked day — the map stays honest either way.
- **Bring your own plan.** The app is the witness, not the coach. It ships zero workouts and zero diet rules. Onboarding sets this expectation.
- **Every interaction is reversible.** Every confirm has an undo. Every destructive action has a two-step.

## Tech stack
- **Build**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS (light mode primary, dark mode opt-in via toggle or `prefers-color-scheme`). Type scale in `rem` for OS-level text-size respect.
- **State**: Zustand (single persisted store, schema v10)
- **Storage**:
  - `localStorage` for entries, settings, photo metadata, measurements, mission history, and the once-flags
  - **IndexedDB** (`idb-keyval`) for photo blobs
- **Charts**: Recharts (line charts only — weight, waist, body fat; themed via tokens, never replaced)
- **Icons**: `lucide-react`
- **Animations**: Framer Motion — purposeful (slide-to-confirm, celebration overlay, map-panel sheets, toasts, page transitions)
- **Dates**: `date-fns`
- **Routing**: hash-based React Router (offline + `file://` compatible)
- **Font**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` — self-hosted (no third-party CDN on first paint). Waypoint rides the shipped Inter Variable; **no new typeface** (a font is budget, not vibes — any addition is a stop-and-raise).
- **PWA**: `vite-plugin-pwa` with offline service worker

Target bundle: < 350 KB gzipped (entry route lazy-splits Compare, Photos, Progress). Regression gate: delta against the measured baseline in [update.md](update.md) §5.

## Data model (schema v10, as shipped — [src/types.ts](src/types.ts))

```ts
type ValueSource = 'manual' | 'renpho';  // provenance: hand-typed values are never clobbered by a sync

type DayEntry = {
  date: string;                       // 'YYYY-MM-DD'
  weight?: number;                    // in user's current unit
  bodyFat?: number;                   // %, optional (Renpho sync or hand-typed)
  diet?: 'success' | 'fail';
  exercise?: 'success' | 'fail';
  rest?: boolean;                     // marks a planned rest day; counts as a win, no XP penalty
  notes?: string;
  weightSource?: ValueSource;         // absent = legacy/unknown, treated as manual
  bodyFatSource?: ValueSource;
};

type WeekMeasurement = {
  weekNumber: number;
  date: string;                       // 'YYYY-MM-DD'
  waistCm?: number;                   // always stored in cm; display converts if needed
};

type WeekPhoto = {
  weekNumber: number;
  date: string;
  photoKey: string;
};

type Settings = {
  startDate: string;                  // 'YYYY-MM-DD'
  durationWeeks: number;              // default 15
  weightUnit: 'kg' | 'lb';            // default 'kg' — toggling converts stored numbers in place
  waistUnit: 'cm' | 'in';             // default 'cm' — display only; storage is always cm
  pillarLabels: { diet: string; exercise: string };  // display-only names; DayEntry keys stay diet/exercise
  theme: 'light' | 'dark' | 'system'; // default 'system'
  goalWeight?: number;                // optional, set in onboarding; in current weightUnit
  goalWaistCm?: number;               // optional, set in onboarding
  onboarded: boolean;                 // gates /onboarding route
  streakShieldsRemaining: number;     // starts at 1, refills on new mission
  lastExportedAt: string | null;      // drives the backup nudge
  analyticsEnabled: boolean;          // opt-in local counters, never leaves device
  notifications: { morning: boolean; evening: boolean };  // in-app reminder banners
  renphoSync: { enabled: boolean; syncToken: string; lastSyncedAt: string | null };
};

// Mission XP is derived, not stored: totalXp(days, photos, measurements).

type ArchivedMission = {                // in-app history entry (startNewMission)
  id: string;
  archivedAt: string;
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements: WeekMeasurement[];
  photos: WeekPhoto[];                  // blobs stay in IndexedDB under their keys
  finalXp: number;
  stats: { perfectDays: number; longestStreak: number; weightDelta?: number; waistDeltaCm?: number };
};
```

**Storage layout**
- `mission` → one persisted Zustand blob (`persist` version 10): `{ settings, days, photos, measurements, history: ArchivedMission[] }`
- `mission.<flag>.*` → the once-flags (separate plain localStorage keys — see below)
- IndexedDB store `mission-photos` → `Blob` keyed by `photoKey` (current mission and archived missions alike)
- The Settings → Export file is a separate shape: full JSON with photos inlined as base64, for off-device backup.

**Migration** — staged in the store's `migrate` (each step defaults new fields so existing users are byte-for-byte unchanged): v3 `onboarded`/shields/waist unit/measurements · v4 `lastExportedAt` · v5 `analyticsEnabled` · v6 `notifications` · v7 `pillarLabels` · v8 `history` · v9 `bodyFat` + source fields · v10 `renphoSync`. A `merge` deep-merges persisted settings over defaults so partial imports never leave fields undefined.

**Once-flag continuity (load-bearing).** The localStorage once-flag key names keep their names through any redesign — renaming them re-fires celebrations for shipped installs. The shipped family:
- `mission.stageShown.<stageIndex>` — stage crossing (passed stages settle silently)
- `mission.streakBreak.<yesterdayISO>` — the 1-day break panel
- `mission.reentry.<lastLoggedISO>` — re-entry, once per return; a new camp re-arms
- `mission.summit.<date>` — the day-105 summit overlay
- `mission.perfectDay.<date>.<dayNum>` — perfect day; the day number lets a startDate time-travel re-arm it
- `mission.ritual.<date>` — the weekly ritual prompt, keyed by the contract day
- `mission.welcomeBack` / `mission.welcomeBackDismissed` — the one-shot migration banner

## Day status logic
The logic is unchanged from v2; the presentation language is the trail. For each past day:

| Status (logic) | Trail reads | Rendered as |
|---|---|---|
| `rest: true` → `rest` | camp day | tent mark, stage-soft fill, stage-hue stroke |
| both success → `perfect` | walked, both pillars | solid stretch in the stage's hue |
| one success + one fail → `partial` | walked, one pillar | stage hue at 55% opacity |
| both fail, or one entry + other empty → `failed` | rough ground | solid stretch in `--border-strong` (neutral — never scarlet) |
| no entry at all → `missed` | unrecorded | dotted stretch in `--border-strong` |
| today | you | map pin in the stage hue + soft pulse ring |
| future | ahead | faint dashed plot in `--track` |

The word **"missed" never appears in user-facing copy** — the trail reads "unrecorded." Failure ("rough ground") is a recorded fact and renders in neutral, not red; the failure *hue* (`--failed`) is reserved for interactive fail-state affordances (the ✗ row state), not for the map.

## Streak
- **Definition**: consecutive past days where (diet AND exercise are both `success`) OR (`rest: true`). The streak excludes today by design — the Dashboard auto-creates today's entry on mount, so "logged today" always derives from `dayStatus()`, never key presence. **Streak semantics are untouchable.**
- **Display**: a persistent pill in the Dashboard header (flag icon in the stage hue + `12 days`) shown whenever streak ≥ 2.
- **Streak break vs lapse**: governed by the boundary rule (see [The lapse boundary](#the-lapse-boundary)). A 1-day gap gets the break treatment with the explicit shelter offer; a multi-day gap routes to re-entry instead.
- **Streak shield — "the shelter"**: a single-use protection per mission. In trail language the shield is a shelter: "pitched, it covers yesterday" — yesterday reads as a camp day and the walk holds. Offered explicitly after a 1-day break (never auto-spent); usable proactively from the Dashboard. Spending is a two-step (sheet confirm) and undoable for 5s. Communicated up front during onboarding so it isn't a surprise.

## XP & Level system

**XP grants** (every win earns; failures and rest days don't deduct — values are `XP` in [src/lib/xp.ts](src/lib/xp.ts), untouched):

| Action | XP |
|---|---|
| Diet success | 30 |
| Exercise success | 30 |
| Perfect-day bonus (both same day) | +40 |
| Rest day logged | 30 |
| Weekly photo upload | 50 |
| Weekly waist measurement | 20 |

**Level formula**: `xpToNext(level) = 500 + (level - 1) × 100`
- Level 1 → 2: 500 XP
- Gentle linear scaling, no hard cap.

**Tier names** (as implemented by `tierName()` — the v2 doc's table drifted from the code; this table is the code's reality):

| Levels | Tier |
|---|---|
| 1–5 | Beginner |
| 6–10 | Steady |
| 11–15 | Disciplined |
| 16–19 | Grounded |
| 20+ | Unshakeable (then Unshakeable II, III, …) |

### Career XP (the carry-forward resolution)

A flawless single mission tops out around 11,550 XP — Level 12. The tiers above are **career territory**: they exist to be reached across missions.

The store zeroes `progression.xp` on `startNewMission`; that stays. Career XP is a **UI-only derivation**, pinned as:

```ts
careerXp = history.reduce((s, m) => s + m.finalXp, 0)
         + totalXp(days, photos, measurements)   // the current mission
```

- **Presentation**: career level and tier are `levelFromXp(careerXp)` / `tierName(...)`. The Dashboard's level badge shows the *current mission's* level (the altitude of this walk); the career number appears on the completion screen and in MissionCompleted's continuation framing ("the walk so far", across missions).
- The store, `src/types.ts`, and the logic libs are untouched. Any surface claiming "XP carries forward" means *this derivation* and nothing else.

## Mission stages
The 105 days are grouped into 5 stages of 21 days each — and in Waypoint each stage is a **country with its own hue**:

| # | Stage | Days | Hue (light / dark) |
|---|---|---|---|
| 0 | Foundation | 1–21 | `#516F99` / `#82A2CE` (slate blue) |
| 1 | Build | 22–42 | `#4C7829` / `#8CBB5C` (moss green) |
| 2 | Push | 43–63 | `#B5501A` / `#E07E42` (canyon orange) |
| 3 | Refine | 64–84 | `#6C51B4` / `#A28BE0` (heather violet) |
| 4 | Reveal | 85–105 | `#866A10` / `#CBA640` (summit gold) |

- The **current stage's hue is the app's accent** — `--accent` aliases `--stage`, bound by a `stage-<n>` class on `<html>` (`useApplyStage` in [src/lib/theme.ts](src/lib/theme.ts)). Crossing a stage recolors the room.
- The current stage is **always visible on the Dashboard** (stage chip in the header: name + day range, stage-soft background) — it appears on every screen's geography, never only in an overlay.
- Stage crossings are a heavy-register moment (see [The moments](#the-moments)).
- Halfway (Day 53 for a 15-week mission) gets a medium-register in-flow note, not an overlay.

## The theme model

- **Light-first.** Light ("daylight" — a paper map) is the primary identity; dark ("dusk" — the same country after sundown) is the secondary, fully supported.
- `settings.theme`: `'light' | 'dark' | 'system'`, default `'system'` — unchanged from v2.
- **Boot-flip rule for existing installs**: `'system'` users follow the app's default resolution (which does not change — the primary identity stays light, so no boot-script flip ships); users who explicitly chose light or dark do not move. If a future contract ever flips the primary, only `'system'` users follow it.
- Theme knock-ons (land in the token phase, named here): `theme-color` metas → `#F4F1E6` light / `#151A16` dark; `apple-mobile-web-app-status-bar-style` stays `default` (light identity); manifest `theme_color` `#F4F1E6`, `background_color` `#F4F1E6` (Android splash must match — no white flash); app icon redrawn on-palette with maskable-safe geometry, split `any` + `maskable` entries, 192/512 PNG fallbacks.

## Design tokens — Light (primary, "daylight")

```css
/* Surfaces & neutrals — map paper */
--bg:            #F4F1E6;
--surface:       #FCFBF4;
--surface-2:     #EBE7D6;
--border:        #DBD5BF;
--border-strong: #AFA689;
--track:         #E3DECB;   /* the unwalked route */

/* Text — ink on paper */
--text:          #23281F;
--text-muted:    #5B6150;
--text-subtle:   #6A7057;   /* amended from the lab's #6C7259 — see decision log */

/* The five stages — the accent is where you are
 * (s0/s1/s4 amended ≤4% darker than the lab values for AA — see decision log) */
--stage-0: #516F99;  --stage-0-soft: #E2E8F2;
--stage-1: #4C7829;  --stage-1-soft: #E4EDD6;
--stage-2: #B5501A;  --stage-2-soft: #F6E3D6;
--stage-3: #6C51B4;  --stage-3-soft: #E9E3F6;
--stage-4: #866A10;  --stage-4-soft: #F2EACC;

/* Bound by the stage-<n> class on the app shell */
--stage:         var(--stage-2);        /* example: Push */
--stage-soft:    var(--stage-2-soft);
--accent:        var(--stage);
--accent-hover:  var(--stage);
--accent-soft:   var(--stage-soft);

/* Semantic statuses — terrain language */
--success:       #4C7829;   --success-bg: #E4EDD6;
--rest:          #866A10;   --rest-bg:    #F2EACC;
--partial:       #B5501A;   --partial-bg: #F6E3D6;
--failed:        #A83226;   --failed-bg:  #F6DCD8;
--missed:        #DBD5BF;

/* Shape */
--radius:        12px;
--radius-card:   14px;
--radius-lg:     16px;   /* large surfaces (sheets, overlays) */
--radius-pill:   9999px;

/* Depth — net-new group */
--shadow-panel:  0 1px 2px rgba(35, 40, 31, 0.07), 0 6px 18px rgba(35, 40, 31, 0.08);
--shadow-lift:   0 2px 4px rgba(35, 40, 31, 0.1), 0 14px 34px rgba(35, 40, 31, 0.14);

/* Motion — net-new group (see Motion) */
--duration-fast:  150ms;
--duration-base:  200ms;
--duration-sheet: 280ms;
--duration-slide: 340ms;
--duration-pop:   450ms;
--duration-fill:  500ms;
```

## Design tokens — Dark (secondary, "dusk")

The same country after sundown: deep green-black ground, hues lifted for contrast.

```css
--bg:            #151A16;
--surface:       #1C231E;
--surface-2:     #253028;
--border:        #33403A;
--border-strong: #4E5F55;
--track:         #2A342D;

--text:          #EDF1E5;
--text-muted:    #A9B39C;
--text-subtle:   #8C9680;

--stage-0: #82A2CE;  --stage-0-soft: #22303F;
--stage-1: #8CBB5C;  --stage-1-soft: #26331A;
--stage-2: #E07E42;  --stage-2-soft: #3D2617;
--stage-3: #A28BE0;  --stage-3-soft: #2C2440;
--stage-4: #CBA640;  --stage-4-soft: #3A3012;

--success:       #8CBB5C;   --success-bg: #26331A;
--rest:          #CBA640;   --rest-bg:    #3A3012;
--partial:       #E07E42;   --partial-bg: #3D2617;
--failed:        #E5766A;   --failed-bg:  #40201B;
--missed:        #33403A;

--shadow-panel:  0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 22px rgba(0, 0, 0, 0.4);
--shadow-lift:   0 2px 5px rgba(0, 0, 0, 0.45), 0 16px 40px rgba(0, 0, 0, 0.5);
```

**Token rules.** All net-new groups (`--shadow-*`, `--duration-*`, `--stage-*`, `--track`) surface through [tailwind.config.js](tailwind.config.js) (`boxShadow`, `transitionDuration`, colors) so no literal values leak into components — `grep -rE '#[0-9a-fA-F]{3,8}' src --include='*.tsx'` must return zero hits after the token phase. Contrast bars: body/bg and stage-hue/bg pairs ≥ 4.5:1 in both themes, measured, with literal ratios recorded in the Accessibility section at the audit phase. **Known limitation (Phase 14 decision pending):** Tailwind `/40`-style alpha modifiers are silent no-ops on the `var()`-based palette — such borders render full-strength; either add `<alpha-value>` plumbing or drop the modifiers at the audit.

**Texture.** The header area carries faint contour lines (`repeating-radial-gradient` of `--border-strong` at 30% via `color-mix` — topography without image assets). Panels are `--surface` cards with `--border` hairlines, `--radius-card`, and `--shadow-panel`.

## Typography

- **Family**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` (self-hosted, shipped Inter Variable — unchanged)
- **Numerals**: `font-variant-numeric: tabular-nums` on every stat
- **Scale** (in `rem` — respects OS text-size preferences; unchanged from v2):

  | Token | Size / Weight | Use |
  |---|---|---|
  | 6xl | 3.75rem / 700 | The level number in the celebration overlay |
  | 3xl | 2rem / 700 | Page headers (`Day 62`, `105 days`) |
  | 2xl | 1.5rem / 600 | Card titles |
  | xl  | 1.25rem / 500 | Subheads |
  | lg  | 1.0625rem / 500–700 | Emphasized body, sheet titles, weight input |
  | base| 0.9375rem / 400–700 | Body, row labels |
  | sm  | 0.8125rem / 400–700 | Captions, secondary lines, buttons |
  | xs  | 0.75rem / 500–700 | Labels, stat captions, section headers |
  | 2xs | 0.6875rem / 600–700 | Nav labels, stage abbreviations, chips |

- **The Waypoint signatures**:
  - Section headers and stage chips are **uppercase, bold, letter-spaced** (`text-xs`/`2xs`, `font-bold`, `tracking-wide`/`wider`; SVG stage flags use `0.08em`; the overlay kicker uses `0.2em`).
  - Hero numbers are `font-bold` (700), tight leading, tabular.
- **Letter spacing**: `-0.02em` on display sizes; normal on body; positive tracking only on the uppercase label voice.
- **Line height**: 1.4 UI, 1.6 prose (`leading-relaxed` on multi-line muted copy).

## Motion

- **Easing**: `cubic-bezier(0.32, 0.72, 0, 1)` (`--ease-apple`) — the single house ease. It is declared in **one** motion-token module (the token phase collapses the seven duplicate declarations); components import it, never restate it.
- **Duration scale** (tokens, not literals):

  | Token | Value | Use |
  |---|---|---|
  | `--duration-fast` | 150ms | color/hover transitions, nav chip |
  | `--duration-base` | 200ms | fades, toasts in/out, backdrop, page transitions (180ms lives here) |
  | `--duration-sheet` | 280ms | bottom sheet slide-up |
  | `--duration-slide` | 340ms | slide-to-confirm fill + thumb snap |
  | `--duration-pop` | 450ms | panel pop-in (`wp-pop` scale 0.6 → 1.08 → 1) |
  | `--duration-fill` | 500ms | XP bar width |

- **Spring presets** (framer-motion, named in the motion module):
  - `spring-panel`: `{ type: 'spring', stiffness: 320, damping: 24 }` — medium-register panels.
  - `spring-card`: `{ type: 'spring', stiffness: 260, damping: 20 }` — the celebration overlay card.
- **The XP toast arc**: 1.6s total — pop in (scale 0.6 → 1.06 → 1) by 18%, hold to 70%, drift up and fade out (y 6 → 0 → −10 → −34).
- **The speck drift** (sanctioned particles): ≤ 8 specks, 5px, stage-hued, rising 64px over 1.1s ease-out with staggered delays ≤ 0.28s. Used by the heavy register only. `display: none` under reduced motion.
- **Slide-to-confirm**: fires on `pointerup` only at progress ≥ 0.8; on release below threshold, snap back at `--duration-slide`; one 15ms haptic (`navigator.vibrate`) on confirm — haptics are Android-only and never load-bearing.
- **Undo toast**: 200ms in/out, holds 5s, single-slot — a new action replaces the old toast.
- **Page transitions**: 180ms opacity + 8px slide-up (unchanged).
- **Reduced motion**: `prefers-reduced-motion` collapses every spring/pop to opacity-only, hides specks entirely, and drops sheet slides to fades. The JS hook (`useReducedMotion`) must be wired everywhere framer-motion lands — the CSS kill-switch alone does not reach it.

**Spacing**: generous. Card padding ≥ 20px (`px-5 py-4` panels). **Touch targets ≥ 44px.** Inputs compute to ≥ 16px font-size.

## Iconography
- Library: `lucide-react`. Base stroke width **1.75**; emphasis/active states 2.25–2.5.
- The terrain set: You/today → `map-pin` · flags (streak, XP, perfect day, level) → `flag` · camp/shelter → `tent` · rest action → `moon` · level badge → `mountain` · Journey nav → `map`
- The utility set (unchanged): Weight → `scale` · Diet → `utensils` · Exercise → `dumbbell` · Waist → `ruler` · Undo → `undo-2` · Nav: `home` / `map` / `trending-up` / `camera` / `settings`
- Flags and pins are also drawn as inline SVG on the Journey map (pole + pennant, the map-pin path) — same silhouette family as the lucide set.

## The three-register feedback system

Every piece of feedback in the app speaks through exactly one of three registers:

| Register | Weight | Vehicle | Lifetime | Used by |
|---|---|---|---|---|
| **Light** | glanceable | XP toast: stage-hued pill + flag, pops and drifts | 1.6s, self-dismissing | every XP grant (live logs *and* backfills — backfills are never silent), plus the undo pill (5s, actionable, single-slot) |
| **Medium** | in-flow | a `wp-pop` panel in the page flow (or the single banner slot): icon chip + title + facts + optional action | persists until acted on or superseded; never blocks | re-entry, streak break + shelter offer, perfect day, halfway note, weekly ritual prompt, shelter confirmation |
| **Heavy** | takeover | the celebration overlay: stage-soft radial wash + blur, speck drift, spring card, tap-anywhere dismiss | until tapped (no auto-dismiss) | level-up, stage crossing, day 105 / mission completion |

**One celebration primitive.** The three v2 overlay copies (`LevelUpOverlay`, `StageOverlay`, `StreakBreakOverlay`) are replaced by one heavy-register primitive plus thin configs; streak break *moves out of the heavy register entirely* (it becomes a medium panel — a broken streak is information, not a takeover). Once-flag keys keep their names.

### Precedence (the co-occurrence table)

When moments land together, this order is law:

1. **Mission completion** (day > 105) — owns the Dashboard outright; nothing else fires.
2. **Re-entry** (lapse ≥ 2 days) — medium panel, always first in flow. It **suppresses** the streak-break treatment (a lapse is not a break) and **defers any pending heavy overlay to the next open** — the return is never greeted with a takeover.
3. **Streak break** (gap of exactly 1 day) — medium panel with the shelter offer. Mutually exclusive with re-entry by the boundary rule.
4. **Stage crossing** — heavy; fires on first open **at or after** the crossing (once per stage, flag preserved), except on a re-entry open (deferred once, above).
5. **Level-up** — heavy; fires on the log that crosses the threshold. If a heavy overlay is already showing, it queues and fires after dismissal. At most one heavy moment per user action; within the heavy queue **summit > stage crossing > level-up** when more than one is pending.
6. **Perfect day** — medium; fires on completion of the second pillar (`dayStatus === 'perfect'`), once per day. When it co-occurs with a level-up, the light XP toast fires immediately, the heavy level-up takes the screen, and the perfect-day panel is present in flow after dismissal — the two never render simultaneously.
7. **Weekly ritual prompt** (photo + waist) — medium, in the banner slot on the contract day. Never outranks re-entry or a streak break.
8. **Housekeeping banners** (backup nudge, install, reminder, migration) — last, one at a time, in the existing single-banner gate.

The banner slot is single-occupancy: an open re-entry or streak-break panel suppresses the whole slot; within it, ritual > welcome-back (migration) > backup > install > reminder. Light-register toasts fire immediately regardless of what else is on screen; the undo pill always accompanies its action.

## The moments

Eight moments, each with its register. These specs are the verification target for the moment phases.

### 1 · First open of the day — *light chrome, no register*
The Dashboard greets before anything is done: the date line, the streak flag (if ≥ 2), `Day N` (3xl/700), and the stage chip — the header knows what day it is and where you're standing. "Logged today" derives from `dayStatus()` **always** — the mount effect auto-creates today's entry, so key presence is meaningless. One quote from [quotes.ts](src/lib/quotes.ts) may surface per the voice-pass curation (morning line), not via the reminder-banner lottery alone. The footer line carries the standing encouragement (`One stretch at a time is the whole way there.`).
**Register:** none (ambient chrome) — the first open must never open with a takeover.

### 2 · Logging a pillar — *light register (+ medium on perfect day)*
The slide stays: walk the stretch, the fill is ground gained in the stage hue, the thumb pops to a check, one 15ms haptic. The XP toast pops with the flag (`+30 XP`). The ✗ affordance marks rough ground with the same weight and its own undo. **Backfills through the DayEditor and the Journey map panel get the identical treatment — XP toast + undo pill, never silent.**
**Perfect day** (second pillar completed, `dayStatus === 'perfect'`): the toast carries the bonus (`+70 XP · Perfect day — flag planted`) and the medium-register panel lands in flow: flag chip in the stage hue, `Flag planted — a perfect day.`, facts line (`Both pillars · +100 XP`, plus `· N-day walk behind it` when the streak ≥ 2). Once per day; re-armed only by a new day.
**Register:** light; perfect day adds medium.

### 3 · Level-up — *heavy register*
"Higher ground." The overlay wash (stage-soft radial + blur), speck drift, spring card: flag chip, kicker `HIGHER GROUND` (uppercase, 0.2em, stage hue), the level number (6xl/700, tabular), tier name, and the dismissal line `Tap anywhere to keep walking`. No auto-dismiss — tap to continue. Career framing appears only at completion (see moment 8), not here.
**Register:** heavy.

### 4 · Stage crossing — *heavy register*
Fires on first open **at or after** the crossing day (not only the exact day), once per stage (`mission.stageShown.*` preserved). Same overlay primitive: the *new* stage's hue floods the wash, camp-flag chip, kicker with the stage name and day range, one zen line. Dismissing it lands you in a recolored room — the accent has already followed the stage. The stage chip on the Dashboard is the permanent trace.
**Register:** heavy.

### 5 · Streak break + the shelter — *medium register*
Exactly 1 unlogged day between the last log and today. In-flow panel: `A gap in yesterday's tracks.` with the fact line (`8 days walked without a break.`) and, if a shelter remains, the explicit offer: `One shelter left in the pack — pitched, it covers yesterday.` Actions: `Pitch the shelter` (stage-hued, opens the confirm sheet — spending is a two-step and undoable) and `Walk on` (dismisses; the streak resets without ceremony). Never auto-spends. If no shelter remains, the panel states it plainly and offers only `Walk on`.
**Register:** medium. The v2 heavy overlay for this moment is retired.

### 6 · Re-entry after a lapse — *medium register — the flagship*

The single most important moment. Trigger: lapse per the boundary rule (≥ 2 unlogged days), on first open of the return.

- **Surface**: the first panel in the Dashboard flow (after the walk strip), `wp-pop` entrance. Tent chip in the stage hue. Title: `Back on the trail.` Body, built **entirely from UI-derived facts**: `Camp was Day {lastLoggedDay} — the dotted stretch is behind you now. You're standing in {stageName} with {daysRemaining} days to the summit.` Then the invitation: `Today's log puts you back on the map.` and the backfill door: `Mark the missed stretch` (link-style, stage hue) → Journey/DayEditor.
- **Derivable facts available to the surface** (no store or logic-lib changes): last genuinely-logged day (`dayStatus()` filter over `days` — never key presence), lapse length, days remaining, stage drift (stage at camp vs stage now), missed photo weeks, where the level and weight stood.
- **The Journey during a lapse**: the gap is a literal dotted stretch of trail; a dashed camp ring marks the last-logged day; the header reads `Camp was Day {n} — the dotted stretch is behind you, {m} days to the summit.`; the footer reads `Every unrecorded stretch can still be drawn in. The route never left the map.` Unrecorded days open the map panel with three equal-weight marks: `Walked it — both pillars` / `Camp day` / `Rough ground` — with XP labels, honest toasts, and undo. Marking rough ground is exactly as easy as marking success.
- **Arming**: once per return, via `mission.reentry.<lastLoggedISO>` (localStorage, same pattern as the existing once-flags). Reload does not re-fire; a new lapse (new last-logged day) re-arms.
- **Never**: leads with the broken streak, shows a red gap, uses a shame construction (see the banned list in Microcopy), or greets the return with a heavy overlay (precedence rule 2).
- **Reduced motion**: the panel renders statically (opacity only).
**Register:** medium.

### 7 · The weekly ritual — photo + waist — *medium register*
The prompt enters the banner precedence on **the last day of each mission week** (startDate-anchored), dismissible for that week: camera chip, `Week {n}'s photo and waist reading.`, one-tap to Photos. A week must never slip silently — but the prompt never outranks re-entry or a streak break. The Photos page frames the weekly slot as the ritual; Compare is the payoff (draggable divider, cross-mission capable) and gets pinned framing (`Compare with current`) whenever the latest week has a photo.
**Register:** medium.

### 8 · Day 105 and mission completion — *heavy register into a page state*
Day 105 itself is a moment: on the final day's open, the summit is one step away on every surface (the day-104 eve panel `The summit is tomorrow.` / `One camp left. Walk in like you walked the rest.`; the summit flag at the pin's side on 105; the standing line reads `The summit is today.`). Completing day 105's log fires the heavy overlay in Reveal gold — the summit. From day 106 (`dayNumber > totalDays`) the Dashboard renders the completion layout:
- Final walk strip (fully drawn), `105 / 105`
- One headline number: `−4.2 kg · −7 cm waist`
- Stats block: `Perfect days 78 / 105 · Diet 84% · Exercise 79% · Longest streak 31`
- **The career line** (the carry-forward, per the pinned derivation): career XP total, career level and tier — the walk so far, across missions.
- Photos strip: first and last thumbnails with `Compare` between
- Two CTAs: `Export mission archive` (full JSON + base64 photos) and `Begin a new mission` — confirm sheet: `Archive this mission and start fresh? Your goals carry forward.` On confirm: archive to history, reset days/photos/measurements, fresh `startDate`. Mission XP re-derives from the new mission's log; the career derivation keeps every archived mission's `finalXp`. **Continuation, not reset.**
**Register:** heavy (the summit overlay), then the completion page state.

### The lapse boundary

**≥ 2 unlogged days between the last genuinely-logged day and today = a lapse** → the re-entry treatment. **Exactly 1 unlogged day = a streak break** → the break treatment with the shelter offer. "Genuinely logged" always means `dayStatus()` on the entry, never key presence. The two treatments are mutually exclusive on any given open.

## Pages

Sticky bottom tab nav, 5 items, thumb-zone:

1. **Dashboard** (`/`) — the walk strip at the top (the route, always), header on contour lines with the date, streak flag, `Day N`, and stage chip; then the moment panels in precedence order; today's ground (slide rows + camp-day action); level badge; weight reading; footer line. Special states: pre-mission countdown, re-entry, completion.
2. **Journey** (`/journey`) — the map: a serpentine trail through five stage-colored bands of country (full spec in Core components). Tap a day → the map panel (bottom sheet) to view or mark it.
3. **Progress** (`/progress`) — contour header with the delta as the headline (`vs. the start of the walk`); weight line chart with optional 7-day moving average and goal ghost line; waist and body-fat series below if logged; adherence stats card (perfect days, diet %, exercise %); trendline projection to Day 105. Recharts, themed via tokens: weight `--stage`, 7-day MA `--stage` dashed, projection `--text-muted` dashed, waist `--rest`, body fat `--success`, goal ghost `--border-strong` dashed. Series contrast: ≥ 3:1 against `--bg` required; the shipped hues measure ≥ 4.5:1 in both themes. Noisy projection reads `Pace unclear — more readings settle the line.`
4. **Photos** (`/photos`) — leads with the ritual card (camera chip, `Week {n} of {m} — one photo, one waist reading.`, the photo CTA / logged row, and the waist input); the grid sits under `The record`. Tap a filled slot → action sheet (View / Replace / Compare / Delete). Two-photo compare via Compare route: draggable divider on a 44×44 handle, `role="slider"` with arrow-key nudging, captions carry the year so cross-mission compares read apart.
5. **Settings** (`/settings`) — sections as shipped: Schedule (start date, duration) · Pillars (display-only rename of the two daily pillars) · Reminders (morning quote / evening reflection in-app banners) · Appearance (theme, weight unit, waist unit) · Analytics (opt-in local counters) · Data (export JSON, import JSON with diff preview, storage usage, history entry point) · Body-data sync (opt-in Renpho proxy: enable, sync token, last synced) · Danger (reset all data, two-step confirm on failed tokens).

Additional non-tabbed routes:
- `/onboarding` — three-screen first-run flow. Guarded by `settings.onboarded`.
- `/compare/:a/:b` — full-screen compare view (hides bottom nav).
- `/history` — past missions (archived), career context.
- `/complete` — mission completion, surfaced automatically when `dayNumber > totalDays`.

---

## Onboarding flow

Three screens, full-bleed, button-stepped (dot progress + a 44px back chevron from screen 2; not swipe-driven). Skippable from screen 2 onward. Sets `settings.onboarded = true` on completion or skip. As shipped:

**Screen 1 — Value prop & commitment**
- Headline over contour lines: `105 days.` / `One yes/no a day.` (two lines, the second muted)
- Sub: `Mission to Abs is a witness, not a coach. Bring your own plan. The app holds you to it.`
- Three feature lines (icon + one phrase): `Daily log` · `Weekly photo + waist` · `Walk your journey`
- The shelter, introduced up front in a panel card (never a surprise at the one-day gap): `One shelter in the pack — pitched, it covers a single missed day and the walk holds.`
- Primary CTA: `Begin`

**Screen 2 — Schedule & goals**
- Headline: `Set your mission.` · Sub: `These can change later in Settings.`
- Start date (date input, default today); duration (default 15 weeks); unit segmented controls; goal weight and waist (optional)
- Skip link: `Set goals later` · Primary CTA: `Continue`

**Screen 3 — Baseline**
- Headline: `Where you are today.` · Sub: `Optional. Set a baseline so you can watch the change.`
- Today's weight, waist, and photo — all optional (photo row reads `Optional` → `Saving…` → `Logged`)
- Future start note: `Starts {date} · N days to go.`
- Skip link: `Skip baseline` · Primary CTA: `Begin Day 1` (or `Begin in N days`)

Onboarding doubles as the portability test — it must read right for a friend starting their own 105 days with renamed pillars.

**Existing-user migration**: users upgrading with `onboarded: false` see a one-shot dismissible banner: `Welcome back. Set your goals?` linking to `/onboarding`.

---

## Failure path

Unchanged in behavior (non-negotiable); trail-voiced in presentation.

### Today card — per-row actions
Each pillar (Diet, Exercise) has its own row with **two affordances**:
- **Slide right to confirm** (success — the walkable stretch)
- **Tap the ✗ at the right edge** to mark rough ground (44px target, `--text-subtle` at rest, `--failed` treatment when active)

A row can be: empty · confirmed · failed · cleared (tap the active state again to clear back to empty). A partial day takes two taps from the Dashboard.

### Slide-to-confirm timing
- Fire only on `pointerup` when progress ≥ 0.8. Mid-drag never fires; a flick that passes 0.8 then returns before release does nothing.
- On release below threshold, snap back at `--duration-slide` with the house ease.

### Undo
Every confirm (success, fail, camp day, photo upload, weight log, backfill mark, shelter spend) shows a 5s `Undo` pill — the legend chip, bottom-center above the nav. Single-slot: a new action replaces the old toast. Tapping undo reverses only the last action.

### Camp day (rest)
Inside the Day Editor and on the Dashboard (`Camp day` action under the rows): marking camp clears any diet/exercise state for that day and grants XP as a win with grace. Active state: `Camp day.` / `Resting is still being on the trail.` with `Break camp` to clear.

### Mark as missed (Dashboard fallback)
Only sets pillars to `fail` if they're currently empty. Never overwrites an existing `success`.

---

## Core components

### Dashboard layout (active mission)

```
┌──────────────────────────────────────┐
│ Thu, Jul 31            ⚑ 12 days     │  ← date · streak flag (stage hue)
│ Day 62            [ PUSH · 43–63 ]   │  ← 3xl/700 · stage chip
│  (faint contour lines behind)        │
│ ┌──────────────────────────────────┐ │
│ │            📍                    │ │  ← the walk strip (pin at today)
│ │ ▬▬▬▬▬▬▬▬▬┄┄┄┄┄┄░░░░░░░░░░       │ │
│ │ FOUN  BUIL  PUSH  REFI  REVE     │ │  ← stage ruler
│ │ 62 of 105 walked   43 to summit  │ │
│ └──────────────────────────────────┘ │
│ [ moment panels, precedence order ]  │
│ TODAY'S GROUND                       │
│ ── walk it ──────────────▸ +30 XP ✗ │
│ ── walk it ──────────────▸ +30 XP ✗ │
│            ☾ Camp day               │
│ ┌ Level 6 · Steady    29% climbed ┐ │
│ │ ▰▰▰▱▱▱▱▱▱▱  290/1000 · 710 to  │ │
│ └──────────────────────────────────┘ │
│ WEIGHT                               │
│ [ 82.5                        kg ]  │
│ One stretch at a time is the whole   │
│ way there.                           │
│ Today Journey Progress Photos  ⚙    │
└──────────────────────────────────────┘
```

### The walk strip (Dashboard's mission ring)
No dial. The 105 days laid out as a walked route in one panel:
- 105 flex segments, 6px tall, 1px gap, 2px radius, colored by the **stage they were walked in**; failed days solid `--border-strong`; unrecorded days a 2px **dotted** underline (height 0 — a gap in the line, not a block); future `--track`; today outlined 2px in the stage hue (fills with the hue once logged — the strip fills in as you log).
- A `map-pin` (18px, stage hue, stage-soft fill) stands above today's position.
- Below: the stage ruler — five bands with 2px stage-hued top rules and 4-char uppercase abbreviations (`2xs`, current stage in its hue, others `--text-subtle`).
- Caption row: `{day} of {total} walked` · `{remaining} to the summit` (xs, tabular, subtle).
- A11y: the strip is `role="img"` with `Day {n} of {total} on the trail`.

### Slide-to-confirm — the walkable stretch
- Track: `h-14` (56px), `--surface`, `--border` hairline, `--radius-card`, `--shadow-panel`. Thumb: 48px, 10px radius, `--surface` with `--border-strong` hairline and a stage-hued chevron.
- Dragging fills the track with `--stage-soft` (ground gained); no transition mid-drag, `--duration-slide` snap on release.
- Confirmed: thumb turns `--stage` with a `--surface` check, label in the stage hue, right slot reads the done label (`Ground gained` / `+30 XP`); border tints to 50% stage. Tap to clear.
- Hint slot: `Walk it` + `+{XP} XP` (tabular).
- Failed state (whole row): `--failed-bg` fill, `--failed` 40% border, ✗ chip, `Tap to clear`.
- Haptic: one 15ms `navigator.vibrate` on confirm. Keyboard: `role="slider"` with value semantics; Enter/Space confirms or clears.

### Today row
The slide plus a separate ✗ button (`w-11 h-14` — 44px), hairline card, `--text-subtle` icon; hidden once the row is confirmed or failed.

### Level badge — the altimeter
Panel card: `mountain` icon (stage hue) · `Level {n}` (lg/600, tabular) · `· {tier}` (muted) · `{pct}% climbed` (xs, subtle, right). Bar: 6px pill, `--track` base, stage-hued fill, `--duration-fill` width transition. Caption: `{xpInLevel} / {xpToNext} XP` · `{remaining} to the next marker` (xs, tabular).

### Bottom nav — the map legend
`--surface` bar, `--border` hairline top, safe-area padded. Five items, `min-h 54px`: icon 21px (stroke 1.75; active 2.25) + `2xs` semibold label. Active item sits in a stage-soft chip with the stage hue; inactive `--text-subtle`. Transition `--duration-fast`.

### Journey page — the map
The page the direction lives on. One panel holds the whole route as SVG (viewBox 360-wide, height derived):
- **Geometry**: serpentine, 7 days per row, alternating direction; row spacing 34px; each stage's first row adds 26px of band gap — **stage boundaries are the geography**.
- **Stage bands**: full-width rounded rects (rx 14) in the stage's soft hue; current stage at 0.6 opacity, others 0.35 — the five countries.
- **Camp flags**: at each band's start, a pole + pennant in the stage hue with `{STAGE} · {start}–{end}` (10px, 700, 0.08em, uppercase), anchored to the row's entry side.
- **The trail, stretch by stretch** (one path per day walked into — each stretch independently textured):
  - walked (perfect/partial/rest day arrival): solid 3px, stage hue, round caps
  - rough ground (failed): solid 3px, `--border-strong` — neutral, never scarlet
  - unrecorded: **dotted** 2.25px (`0.1 7` round caps), `--border-strong` — the lapse is a literal dotted stretch
  - ahead: dashed 2px (`4 6`), `--track`
- **Day marks**: walked 4.5px dot in the stage hue (partial at 0.55 opacity); rough ground 4px `--border-strong` dot; unrecorded 2px hollow ring; camp days a small tent triangle (stage-soft fill, stage stroke); future 2px `--track` dots.
- **Today**: the map pin (drawn, stage hue, `--surface` ring) over a soft pulse ring (10px, 0.25 opacity, `animate-ring-pulse`).
- **The camp ring**: during a lapse, the last-logged day wears a dashed circle (r 8.5, stage hue) — camp, marked on the map.
- **The summit flag**: pole + pennant at day 105 in Reveal gold.
- **Interaction**: every non-future day is a real focusable element (`role="button"`, tab order follows day order, Enter/Space opens); invisible hit area ≥ 44px; focus ring 2px stage hue. Tap → the map panel.
- **The map panel** (bottom sheet): date + `Day {n}` + stage chip. Logged days: fact rows (`Trail reads` / pillar rows as walked·rough·— / weight reading / XP). Unrecorded days: `This stretch is unrecorded — the trail was under your feet either way. Mark it as it was.` then three equal actions with XP labels (`Walked it — both pillars` +100 · `Camp day` +30 · `Rough ground`), and the honesty line: `Rough ground marks as easily as a walked day — the map stays honest either way.` All marks fire the light register + undo.
- **Legend**: route-texture swatches (Walked / Unrecorded / Rough ground / Camp / Ahead / You), xs, muted.
- Header: `Journey` eyebrow, `105 days` (3xl/700), stage chip, one context line (lapse-aware). Footer: the map line (lapse-aware).

### Celebration overlay (the heavy register)
One primitive, three configs (level-up, stage crossing, summit):
- Wash: `radial-gradient(90% 65% at 50% 40%, var(--stage-soft) 0%, transparent 72%)` over `color-mix(in srgb, var(--bg) 90%, transparent)`, `backdrop-filter: blur(5px)`.
- Specks: per the Motion spec. Card: `spring-card` entrance — icon chip (44–56px pill, stage hue, `--surface` glyph), uppercase kicker (xs/700, 0.2em, stage hue), the number (6xl/700, tabular), context line, and the dismissal line (xs, subtle).
- Tap anywhere to dismiss (the whole overlay is the button, labeled for AT). No auto-dismiss. Reduced motion: opacity fade only, no specks.

### XP toast (the light register)
Stage-hued pill (`--stage` bg, `--surface` text, `--shadow-panel`): flag icon + `+{n} XP` (sm/700, tabular), optional note line below (xs/600, stage hue). The 1.6s arc per Motion. Positioned top-right of the acting section, pointer-events none.

### Undo pill
The legend chip: bottom-center, above the nav (`bottom-20`), panel styling + `--shadow-lift`. Label (sm) + `Undo` action (sm/600, stage hue, undo icon). `aria-live="polite"`. 5s, single-slot.

### Bottom sheet — the map panel
Slides from the frame edge: top corners `--radius-card`, `--border` hairline, `--shadow-lift`, grab handle (36×4px, `--border-strong`), max-height 85%, backdrop `rgba(20, 24, 18, 0.45)`. `--duration-sheet` with the house ease; reduced motion fades.

### Weight input — the reading
Panel row, `min-h 52px`: numeric input (lg — computes ≥ 16px, `inputMode="decimal"`, tabular) + unit label (sm, muted). Debounced 350ms. Context line when empty: `Last reading {w} {unit} · heading for {goal}` (xs, subtle, tabular).

### Segmented control
One shared component (extracted from the Onboarding/Settings duplicates): pill group on `--surface-2`, active segment `--surface` with `--shadow-panel` and stage-hue text, ≥ 44px targets.

### Photos card / Photos page
Structure unchanged from v2 (thumbnails 96×128, action sheet, compare flow, EXIF handling, upload shimmer on `--surface-2`, paired weight captions) — restyled onto the panel/token system, with the ritual prompt (moment 7) as its Dashboard presence.

### Quick-log yesterday
If yesterday is unlogged AND current time is before 11:00 local: a single row above today (`Yesterday — log`) with the same two affordances. Disappears once logged or after 11:00.

### Empty states (lapse-aware)
- First open (pre-onboarding): the onboarding flow itself
- Pre-mission: `Begins in 4 days.` — countdown center, `formatNice` date, never raw ISO; the route fully plotted, pin at the trailhead
- Mission day 1, nothing logged: `Trailhead. The whole route is plotted; the first mark is today's log.`
- Nothing logged today: `Today is open.`
- Day after a single miss: `Yesterday is closed. Today is open.`
- Mid-lapse: the re-entry surface (moment 6) — never a grayed-out ordinary screen
- Journey with no logs yet: `The map fills in one stretch at a time.`
- Progress with < 2 weights: `Two readings draw the first line.`
- Photos, no photos yet: `Week 1's photo starts the record.`
- Mission complete: the completion layout (moment 8)

---

## Microcopy guide

### Voice rules
- Short, declarative, honest, **placed** — the trail lexicon carries the register: *walked · rough ground · camp · shelter · unrecorded · stretch · trailhead · the summit · higher ground · ground gained · the map · the route · the walk*.
- Facts before feelings; numbers are dignity (`Camp was Day 41.` — a fact, not an apology).
- **No exclamation marks. No emoji.** Expressiveness is the job of color, motion, and iconography.
- No attributed motivational quotes. No fitness content of any kind (witness, not coach).
- **Banned (hype)**: "Crushing it", "On fire", "Streak!", "Great job!", "Amazing!", "You've got this", "Let's go", any 🔥.
- **Banned (shame — grep list for the re-entry and lapse surfaces)**: "fell off", "broke your", "you broke", "ruined", "wasted", "lost your streak", "gave up", "quit", "get back on track", "don't give up", "it's been N days since you". A day's *status* never reads "missed" — the trail reads "unrecorded"; the word appears only in the backfill invitation ("Mark the missed stretch").
- The failure register survives every verdict: non-judgmental, in the spirit of `Yesterday is closed. Today is open.`

### Moment copy (as pinned; the voice pass may refine within the rules)

| Moment | Copy |
|---|---|
| Header | `Day 62` + stage chip `PUSH · 43–63` |
| Pre-mission countdown | `Begins in 4 days` |
| Today, nothing logged | `Today is open.` |
| Slide hint | `Walk it` · `+30 XP` |
| Slide done | `Ground gained` |
| Rough ground undo | `{Pillar} marked rough ground` |
| Perfect day (toast note) | `Perfect day — flag planted` |
| Perfect day (panel) | `Flag planted — a perfect day.` / `Both pillars · +100 XP · 12-day walk behind it` |
| Camp day active | `Camp day.` / `Resting is still being on the trail.` / `Break camp` |
| Streak flag (≥2) | `12 days` |
| Streak break | `A gap in yesterday's tracks.` / `8 days walked without a break.` |
| Shelter offer | `One shelter left in the pack — pitched, it covers yesterday.` / `Pitch the shelter` / `Walk on` |
| Shelter confirm sheet | `Pitch the shelter over yesterday?` / `Yesterday reads as a camp day. The 8-day walk holds.` / `Pitch it` |
| Shelter undo | `Shelter pitched over yesterday` |
| Re-entry title | `Back on the trail.` |
| Re-entry body | `Camp was Day 41 — the dotted stretch is behind you now. You're standing in Push with 43 days to the summit.` |
| Re-entry invitation | `Today's log puts you back on the map.` / `Mark the missed stretch` |
| Journey lapse header | `Camp was Day 41 — the dotted stretch is behind you, 43 days to the summit.` |
| Journey lapse footer | `Every unrecorded stretch can still be drawn in. The route never left the map.` |
| Journey default footer | `The map fills in one stretch at a time.` |
| Backfill panel | `This stretch is unrecorded — the trail was under your feet either way. Mark it as it was.` |
| Backfill honesty line | `Rough ground marks as easily as a walked day — the map stays honest either way.` |
| Backfill undo | `Day 48 marked walked` (· `marked a camp day` · `marked rough ground`) |
| Level-up | `HIGHER GROUND` / `{level}` / `{tier}` / `Tap anywhere to keep walking` |
| Stage crossing | `{STAGE} · {start}–{end}` + the stage's zen line |
| Halfway (Day 53) | `Halfway.` / `Keep walking.` |
| Day 1 (standing line) | `Trailhead. The first mark is today's log.` |
| Day 1 (Journey header) | `Trailhead. The whole route is plotted; the first mark is today's log.` |
| Final day (standing line) | `The summit is today.` |
| Day 104 eve | `The summit is tomorrow.` / `One camp left. Walk in like you walked the rest.` / footer `Sleep well. Tomorrow you crest.` |
| Mission complete | `The summit. Day 105.` |
| Career line (completion) | `Level 16 · Grounded` / `18,500 XP across 2 missions — carried into the next.` |
| Standing footer | `One stretch at a time is the whole way there.` |
| Photo / weight / waist logged | `Logged.` |
| Weight context | `Last reading 82.5 kg · heading for 78` |
| Level badge caption | `290 / 1,000 XP` · `710 to the next marker` |
| Undo toast | `{Pillar} logged` · `Undo` |
| Ritual prompt | `Week 9's photo and waist reading.` + state-aware facts: `The week closes today — both are still open.` / `The photo is in. The waist reading is still open.` / `The waist is logged. The photo is still open.` |
| No shelter left | `No shelters left in the pack.` |
| Noisy projection (Progress) | `Pace unclear — more readings settle the line.` |
| Onboarding screen 1 | `105 days. One yes/no a day.` |
| Reset confirm prompt | `Type RESET to erase everything.` |
| Import diff header | `Backup contains:` |

**The standing line** ([src/lib/encouragement.ts](src/lib/encouragement.ts) — nine strings, strict precedence, as shipped in the voice pass):

1. Post-mission → `The summit. Day 105.`
2. Pre-mission → `The route is plotted.`
3. Day 1, nothing logged → `Trailhead. The first mark is today's log.`
4. Final day → `The summit is today.`
5. Halfway day → `Halfway. Keep walking.`
6. Both pillars done → `Today is walked.`
7. Streak ≥ 2 → `Steady. {n} days walked.`
8. Yesterday failed/unrecorded → `Yesterday is closed. Today is open.`
9. Nothing logged today → `Today is open.` · fallback → `One stretch at a time is the whole way there.`

**Morning quotes / evening prompts** ([src/lib/quotes.ts](src/lib/quotes.ts)): 40 morning lines and 10 evening prompts, date-hashed, curated in the voice pass — no attributed aphorisms, no fitness content, no collision with the pinned status lines.

**Stage zen lines** (one each, never rotated — voice-pass candidates, register locked):
- Foundation: `Build the floor.`
- Build: `Add the weight.`
- Push: `Lean in.`
- Refine: `Sharpen what's working.`
- Reveal: `Let it show.`

## Accessibility

- Every stage hue and status token verified WCAG AA (≥ 4.5:1 text, ≥ 3:1 graphics) against its intended background in **both** themes. Measured at Phase 5 (relative-luminance formula, shipped token values):

  | Token | Light: on `--bg` / `--surface` | Dark: on `--bg` / `--surface` |
  |---|---|---|
  | `--text` | 13.32 / 14.51 | 15.37 / 14.00 |
  | `--text-muted` | 5.68 / 6.19 | 8.07 / 7.35 |
  | `--text-subtle` | 4.57 / 4.98 | 5.70 / 5.19 |
  | `--stage-0` | 4.55 / 4.96 | 6.72 / 6.12 |
  | `--stage-1` | 4.61 / 5.03 | 7.87 / 7.17 |
  | `--stage-2` | 4.50 / 4.91 | 6.07 / 5.53 |
  | `--stage-3` | 5.35 / 5.83 | 6.13 / 5.58 |
  | `--stage-4` | 4.55 / 4.96 | 7.61 / 6.93 |
  | `--failed` | 5.90 / 6.43 | 5.99 / 5.45 |
- Day status is never color-only — route **texture** is the second channel (solid / dotted / tent / pin), independent of hue.
- Slide-to-confirm: keyboard alternative (Enter/Space), `role="slider"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.
- Journey days are real focusable elements; tab order follows day order; focus ring 2px stage hue, 2px offset, never clipped (inset on overflow-hidden containers).
- The walk strip: `role="img"` with a day-count label. Photo grid buttons: `aria-label` like `Week 3, logged, 74.3 kg`.
- All interactive targets ≥ 44px (including the Journey's invisible hit areas); inputs compute to ≥ 16px.
- `prefers-reduced-motion` respected throughout — the framer-motion JS hook wired everywhere, springs collapse to opacity, specks vanish.
- Dynamic type: all sizes in `rem`; Dashboard, Journey, and the re-entry surface verified at 130% and 175% system text scale.
- Toasts `aria-live="polite"`; overlays are labeled buttons (tap-anywhere is a real control).

---

## Error handling

- Top-level React error boundary wraps `<Routes>`. On error: full-screen card with `Something went wrong. Your data is safe.` and two buttons: `Reload` and `Export current data`. Errors logged to console only.
- Photo decode failure: thumb shows a muted broken-image glyph, single-line caption `Couldn't load this photo.`, long-press still allows delete.
- Storage-quota errors: surface as a banner on Dashboard linking to Settings → Export.

## Acceptance criteria

The v2 behavioral criteria all still hold (onboarding gate, slide threshold semantics, undo everywhere, mark-as-missed never overwrites success, shield once per mission, EXIF, import diff, reset two-step, lazy-split routes, error boundary, offline). The redesign adds:

- [ ] The current stage is visible on the Dashboard at 375px in both themes
- [ ] The accent follows the current stage everywhere (`--accent` aliases `--stage`)
- [ ] Re-entry fires once per lapse (≥ 2 unlogged days), never re-fires on reload, and contains zero banned shame constructions (grep the strings)
- [ ] A 1-day gap gets the shelter offer; spending is explicit, two-step, and undoable
- [ ] Backfills through DayEditor and the Journey map panel fire the XP toast + undo (never silent)
- [ ] Completing the second pillar fires the perfect-day moment (medium register) exactly once per day
- [ ] Perfect day + level-up on the same log fire in precedence order, never simultaneously
- [ ] Stage crossing fires on first open at or after the crossing (once, flags preserved)
- [ ] Day 105 fires the summit moment; day 106+ renders the completion layout with the career line per the pinned derivation
- [ ] The weekly ritual prompt appears on the mission-week's last day, dismissible, and never outranks re-entry
- [ ] Rest day renders as a camp mark on the journey; unrecorded days render as dotted stretches, never red
- [ ] One celebration primitive; `mission.stageShown.*` / `mission.streakBreak.*` key names unchanged
- [ ] Zero hex literals in `src/**/*.tsx`; the house ease declared exactly once
- [ ] Reduced motion collapses every moment to its static variant (JS hook verified)
- [ ] Bundle < 350 kB gz; delta per chunk recorded against the §5 baseline

## Out of scope (deliberately)
- Accounts, login, cloud sync of the mission itself (the opt-in Renpho **body-data** sync ships in-app — Settings → Body-data sync, via the proxy — and stays; the mission record never leaves the device)
- Social / sharing / leaderboards
- Workout plans, meal plans, recipes, video content
- Push notifications (local in-app reminder banner shipped in v2.x and stays)
- Analytics beyond what's surfaced in-app
- Sound effects (haptics + visuals only — an optional chime remains a someday, off by default)
- Custom illustrations or mascot (the map grammar is drawn in CSS/SVG, not assets)
- Multiple simultaneous missions

## Priority order
Simplicity > clarity > consistency > aesthetics > nice-to-haves.

The terrain system serves consistency: one metaphor, five hues, three registers. If an expressive element ever gets in the way of the user actually logging their day — especially on the bad day, mid-lapse — it loses.

---

## Decision log

House rule: dated headings, "Chose X over Y (reasons)." This log is the only place v2's direction language may be quoted.

### 2026-07-30 — Gate 1: Chose Waypoint over Ember and Ledger

Three deliberately contrasting directions rendered in the lab and judged at 375px, mid-lapse first. Owner verdict: **"go with Waypoint"** — a clean pick, no hybrid notes, so nothing from the losers carries forward.

- **Waypoint over Ember** (dark-first hearth, quiet-tactile, the juiced-zen seed rebuilt from "tactile, warm, physical"): the map's everything-visible geography beat the hearth's one-thing-at-a-time focus; the expressive register beat the quiet one. The juiced-zen instinct dies with Ember — it had its shot as a rendered direction and lost.
- **Waypoint over Ledger** (light-first type-led logbook, citrus-free, quiet-typographic): the walk beat the book; color-as-place beat type-as-voice. Ledger's serif stop-and-raise is moot.
- Loser folders stay in `src/lab/directions/` until the Phase 14 disposition.

### 2026-07-31 — Gate 2: Waypoint pinned on the walk

The Journey render (the page the direction lives or dies on) reviewed at 375px: mid-lapse light first, then day 1, day 104 eve, and dusk. Owner verdict: **"pinned"** — no amendments. The serpentine stage-band route, the dotted lapse, the camp/summit/pin grammar, and the map-panel backfill enter this contract exactly as rendered.

### 2026-07-31 — Verdicts on the eight re-decidable v2 rules

The v2 system described itself as "bright, calm, intentional" — citrus accents on a near-white base, Linear-style restraint. That framing produced a well-made but inert app (the month-long lapse is the evidence). Verdicts, rule by rule:

1. **No exclamation marks / no emoji / banned words — KEPT.** Chose keeping the bans over loosening them: Waypoint is expressive through color, motion, and iconography, so punctuation never needs to shout. The hype ban is a hard constraint; the banned list gains the shame constructions (see Microcopy).
2. **10–12px radii — AMENDED.** Chose 12/14/pill over the v2 10/12/pill: the map-panel language wants slightly softer corners. `--radius: 12px`, `--radius-card: 14px`.
3. **No shadows — OVERTURNED.** Chose depth over flatness: panels float on the paper. Two tokens (`--shadow-panel`, `--shadow-lift`), tuned per theme — not a free-for-all; nothing else may cast.
4. **200ms standard duration — AMENDED.** Chose a named duration scale over a single standard: 200ms stays the base for utility transitions, but expressive moments get their own pinned values (`--duration-slide` 340ms, `--duration-pop` 450ms, the 1.6s toast arc). No literal durations outside the token scale.
5. **No confetti — AMENDED.** Chose bounded particles over both extremes: literal confetti stays banned, but the heavy register earns the speck drift (≤ 8 stage-hued specks, 1.1s, gone under reduced motion). Celebration is proportional and brief, never blocking, and honest.
6. **Light-mode-primary — KEPT.** Chose daylight over a dark flip: Waypoint's identity is a paper map in daylight; dusk is the secondary theme. No boot-flip ships (`'system'` users see no change in resolution rules; explicit choosers never move).
7. **Single-accent discipline — OVERTURNED.** Chose stage-keyed accent over one hero accent: the accent *is* the current stage (`--accent` aliases `--stage`, five hues). The discipline survives in a new form — one accent *at a time*; the stage decides, not the screen.
8. **Citrus scoped to data semantics — SUPERSEDED.** Chose terrain semantics over the citrus palette: the lemon/lime/tangerine/coral system is retired with v2. Statuses now speak route texture first (solid/dotted/tent/pin) with stage and terrain hues behind them; the failure hue is reserved for interactive affordances, never the map.

### 2026-07-31 — Dispositions

- **Juiced zen — closed.** Recorded 2026-06-11, seeded Ember at Gate 1, lost. The instinct's real content (tactile, warm, physical) survives inside Waypoint's paper-and-terrain materiality; the citrus-calm-plus-glows formula is retired.
- **Citrus — retired.** The citrus-free door (Ledger) closed at Gate 1, but Waypoint's stage hues keep warmth in the family without the v2 citrus semantics. No token named for a fruit survives.
- **XP carry-forward contradiction — resolved.** The v2 spec claimed XP carries into mission two; the store zeroes it. Chose the UI-only career derivation over a store change (the UI-only fence holds): `history.reduce((s, m) => s + m.finalXp, 0) + totalXp(days, photos, measurements)`, presented as career level/tier at completion. The store stays untouched.
- **Tier table corrected to code.** The v2 doc's tier boundaries (1–4/5–9/10–14/15–19) never matched `tierName()` (1–5/6–10/11–15/16–19/20+). The contract pins the code's reality; the logic libs are untouchable.
- **Streak break demoted from heavy to medium.** Chose an in-flow panel over the v2 full-screen overlay: a broken streak is information plus a decision (the shelter), not a celebration — and a real lapse routes to re-entry, which the v2 overlay never handled (its detection is fixed in-component at the moment phase).

### 2026-07-31 — Phase 13 doc-refresh: the contract synced to shipped reality

Chose describing the app that shipped over preserving the contract's pre-build wording; every delta below was already live and verified in its phase. What moved:

- **Data model** rewritten to [src/types.ts](src/types.ts) / store reality (schema v10): `bodyFat` + value-source provenance, `pillarLabels`, `lastExportedAt`, `analyticsEnabled`, `notifications`, `renphoSync`; XP is derived, never stored; in-app `ArchivedMission` history (photos stay in IndexedDB) distinct from the base64 export file. Storage is one persisted `mission` blob, not per-slice keys.
- **Once-flag family** completed: `summit.<date>`, `perfectDay.<date>.<dayNum>`, `ritual.<date>`, `welcomeBack` join the documented set.
- **Banner slot order** as shipped: ritual > welcome-back > backup > install > reminder (re-entry / streak break suppress the slot outright); the heavy queue pins summit > stage > level-up.
- **The re-entry footer line** (`The trail never left. Yesterday is closed; today is open.`) was a lab-only line that never shipped in the production panel — dropped from the copy table; the standing-line fallback covers the register.
- **Day 1 copy** pinned to the shipped pair: the standing line `Trailhead. The first mark is today's log.` and the Journey header variant; the contract's pre-voice-pass draft (`105 days of country ahead…`) is retired.
- **Onboarding** documented as built: button-stepped (not swipeable), `Set your mission.` on screen 2, all-optional baseline, the shelter card copy on screen 1.
- **Settings / Progress / Photos** page specs expanded to the shipped sections and series tokens (7-day MA, body fat `--success`, goal ghost `--border-strong` dashed; measured ≥ 4.5:1).
- `--radius-lg: 16px` documented; the Tailwind `/alpha` no-op limitation recorded for the Phase 14 decision.

### 2026-07-31 — Phase 5 token amendments (measured AA)

Chose minimally-darkened hues over the lab's literal values where measurement
failed the contract's own 4.5:1 bar on the light `--bg`: `--text-subtle`
#6C7259 → **#6A7057** (4.43 → 4.57), `--stage-0` #52709B → **#516F99**
(4.48 → 4.55), `--stage-1` #4C7829 for #4E7C2A (4.38 → 4.61), `--stage-4`
#866A10 for #8A6D10 (4.34 → 4.55); `--success`/`--rest` follow their stage
hues. Each shift is ≤ 4% per channel — imperceptible against the Gate-approved
renders, and the dark theme needed no changes. The lab folders keep the
original values (throwaway; Phase 14 disposition).
