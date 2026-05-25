# Mission to Abs — Design Spec (v2)

> Design and behavior spec for a 15-week body-recomposition accountability PWA.
> v2 builds on the shipped v1, closing UX seams without changing the product identity.
> For the build sequence and per-phase tasks, see [PHASES.md](PHASES.md).

---

## Mission
A private, offline-first PWA for a 15-week body-recomposition mission. The user opens it daily, logs weight + diet + exercise, takes a weekly progress photo and a weekly waist measurement, and watches progress along a 105-day journey. Light-mode first, bright but never loud — a moment the user looks forward to, not a chore.

## Product feel
- **Tone**: bright, calm, intentional. Citrus accents on a near-white base.
- **Inspiration**: Linear and Notion for craft and restraint; Apple Watch for the progress ring; Headspace for the calm voice.
- **Voice**: short, declarative, zen. "Day 47." not "Crushing it." Confidence over excitement. **No exclamation marks.**
- **Allowed**: gamification (XP, levels, streak), motion, satisfying interactions, color, generosity.
- **Avoided**: hype copy, bodybuilder aesthetics, attention-grabbing animations, attributed motivational quotes.

## Philosophy
- **Bright, not loud.** Citrus accents on a near-white base. The palette wakes you up; the layout never shouts.
- **Earned satisfaction.** Logging feels good because of motion, haptics, and visible XP gain — not confetti.
- **The grid is a path.** Progress is a walk along a 105-step journey, not a heatmap of squares.
- **Honest logging.** Marking failure is as easy as marking success. The app rewards accuracy, not just wins.
- **Bring your own plan.** The app is the witness, not the coach. It ships zero workouts and zero diet rules. Onboarding sets this expectation.
- **Every interaction is reversible.** Every confirm has an undo. Every destructive action has a two-step.

## Tech stack
- **Build**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS (light mode primary, dark mode opt-in via toggle or `prefers-color-scheme`). Type scale in `rem` for OS-level text-size respect.
- **State**: Zustand (single persisted store, schema v3)
- **Storage**:
  - `localStorage` for entries, settings, photo metadata, progression (XP), measurements
  - **IndexedDB** (`idb-keyval`) for photo blobs
- **Charts**: Recharts (line chart only)
- **Icons**: `lucide-react`
- **Animations**: Framer Motion — purposeful (slide-to-confirm, level-up, stage transition, undo toast, page transitions)
- **Dates**: `date-fns`
- **Routing**: hash-based React Router (offline + `file://` compatible)
- **Font**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` — self-hosted (no third-party CDN on first paint)
- **PWA**: `vite-plugin-pwa` with offline service worker

Target bundle: < 350 KB gzipped (entry route lazy-splits Compare, Photos, Progress).

## Data model (v3)

```ts
type DayEntry = {
  date: string;                       // 'YYYY-MM-DD'
  weight?: number;                    // in user's current unit
  diet?: 'success' | 'fail';
  exercise?: 'success' | 'fail';
  rest?: boolean;                     // marks a planned rest day; counts as a win, no XP penalty
  notes?: string;
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
  theme: 'light' | 'dark' | 'system'; // default 'system'
  goalWeight?: number;                // optional, set in onboarding; in current weightUnit
  goalWaistCm?: number;               // optional, set in onboarding
  onboarded: boolean;                 // gates /onboarding route
  streakShieldsRemaining: number;     // starts at 1, refills on new mission
};

type Progression = {
  xp: number;                         // total XP, monotonically increasing
};

type MissionArchive = {
  archivedAt: string;
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements: WeekMeasurement[];
  photos: Array<WeekPhoto & { base64: string }>;
  finalXp: number;
};
```

**Storage layout**
- `mission.settings` → `Settings`
- `mission.days` → `Record<isoDate, DayEntry>`
- `mission.measurements` → `WeekMeasurement[]`
- `mission.photos` → `WeekPhoto[]`
- `mission.progression` → `Progression`
- IndexedDB store `mission-photos` → `Blob` keyed by `photoKey`

**Migration**
- v2 → v3: add `onboarded: false` (existing users skip onboarding via a one-shot dashboard banner instead), `streakShieldsRemaining: 1`, `waistUnit: 'cm'`, empty `measurements: []`. Stored weights are not converted; users who change units after v3 lands trigger a one-time conversion prompt.

## Day status logic
For each past day:
- `rest: true` → `rest` (lemon)
- both success → `perfect` (lime)
- one success + one fail → `partial` (tangerine)
- both fail, or one entry while the other is empty → `failed` (coral)
- no entry at all → `missed` (neutral gray)
- today → pulsing tangerine ring
- future → outline only, no fill

## Streak
- **Definition**: consecutive past days where (diet AND exercise are both `success`) OR (`rest: true`).
- **Display**: a persistent pill in the Dashboard header (`12 days`) shown whenever streak ≥ 2.
- **Streak break**: full-screen calm overlay on first dashboard open after a missed day: `Streak ended at 12. Day 48 is open.` Auto-dismisses at 2s. Tap to dismiss earlier.
- **Streak shield**: a single-use protection per mission. Used proactively from the Dashboard ("Use shield on yesterday") or automatically offered after a streak break. Communicated up front during onboarding so it isn't a surprise.

## XP & Level system

**XP grants** (every win earns; failures and rest days don't deduct):

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

**Tier names** (rotate every 5 levels):

| Levels | Tier |
|---|---|
| 1–4 | Beginner |
| 5–9 | Steady |
| 10–14 | Disciplined |
| 15–19 | Grounded |
| 20+ | Unshakeable (then Unshakeable II, III, …) |

## Mission stages
The 105 days are grouped into 5 stages of 21 days each:

**Foundation** (1–21) → **Build** (22–42) → **Push** (43–63) → **Refine** (64–84) → **Reveal** (85–105)

- Stage names appear at markers on the journey path.
- On the morning the user crosses into a new stage, the Dashboard opens with a full-viewport calm overlay (radial tangerine gradient, ~8% opacity): stage number, stage name, one zen line. Auto-dismisses at 2s.
- Halfway (Day 53 for a 15-week mission) gets a smaller in-flow banner on the Dashboard, not an overlay.

## Pages

Sticky bottom tab nav, 5 items, thumb-zone:

1. **Dashboard** (`/`) — mission ring, streak pill, level badge with XP bar, today's slide-to-confirm rows for diet and exercise, weight input, encouragement line. Special states: pre-mission countdown, mission complete.
2. **Journey** (`/journey`) — winding SVG path of 105 nodes with real S-curves. Tap a node → bottom sheet to view/edit that day. Stage markers along the path.
3. **Progress** (`/progress`) — weight line chart with optional 7-day moving average and goal ghost line; waist series below if logged; adherence stats card (perfect days, diet %, exercise %); trendline projection to Day 105.
4. **Photos** (`/photos`) — weekly thumbnails timeline + weekly waist input on the current-week slot. Tap a filled slot → action sheet (View / Replace / Compare / Delete). Two-photo compare via Compare route with draggable divider.
5. **Settings** (`/settings`) — start date, duration, weight unit, waist unit, theme, export JSON, import JSON (with diff preview), reset all data (two-step confirm), storage usage.

Additional non-tabbed routes:
- `/onboarding` — three-screen first-run flow. Guarded by `settings.onboarded`. Cannot be re-entered.
- `/compare/:a/:b` — full-screen compare view (hides bottom nav).
- `/complete` — mission completion screen, surfaced automatically when `dayNumber > totalDays`.

---

## Onboarding flow

Three screens, full-bleed, swipeable. Skippable from screen 2 onward (`Set this up later` link, muted). Sets `settings.onboarded = true` on completion or skip.

**Screen 1 — Value prop & commitment**
- Headline: `105 days. One yes/no a day.`
- Sub: `Mission to Abs is a witness, not a coach. Bring your own plan. The app holds you to it.`
- Three feature lines (icon + one phrase): `Daily log` · `Weekly photo + waist` · `Walk your journey`
- Primary CTA: `Begin`

**Screen 2 — Schedule & goals**
- Start date (date input, default today)
- Duration (number, default 15 weeks)
- Goal weight (optional, current `weightUnit`)
- Goal waist (optional, current `waistUnit`)
- Weight unit segmented control (kg/lb)
- Waist unit segmented control (cm/in)
- Skip link: `Set goals later`
- Primary CTA: `Continue`

**Screen 3 — Baseline**
- Headline: `Where you are today.`
- Today's weight input (required if user wants a chart)
- Today's photo (optional, opens camera/picker — same flow as Photos page)
- Today's waist (optional)
- Skip link: `Skip baseline`
- Primary CTA: `Begin Day 1` (or `Begin in N days` if start date is future)

**Existing-user migration**: users upgrading from v2 have `onboarded: false` after migration. The Dashboard shows a one-shot soft banner the first time: `Welcome back. Set your goals?` linking to `/onboarding`. Banner is dismissible permanently.

---

## Failure path

The original v1 model made failure clumsy: slide-to-confirm was success-only, and "Mark as missed" overwrote partial wins. v2 fixes this.

### Today card — per-row actions

Each pillar (Diet, Exercise) has its own row with **two affordances**:

- **Slide right to confirm** (success — existing motion)
- **Tap the small ✗ at the right edge** to mark fail (44px target, `--text-subtle` until hover/focus → `--coral`)

A row can be: empty · confirmed · failed · cleared (tap the active state again to clear back to empty). A partial day (diet ✓, exercise ✗) takes two taps from the Dashboard.

### Slide-to-confirm timing
- Fire only on `pointerup` when progress ≥ 0.8. Mid-drag never fires; an aggressive flick that passes 0.8 then returns to 0 before release does nothing.
- On release below threshold, snap back to 0 with the existing spring.

### Undo
Every confirm (success, fail, photo upload, weight log) shows a 5s `Undo` toast in the bottom-right above the nav. Toast is single-slot: a new action replaces the old toast. Tapping undo reverses only the last action.

### Rest day
Inside the Day Editor (Dashboard quick-action or Journey bottom sheet), a third button alongside Diet/Exercise toggles: `Rest day` (lemon when active). Marking rest clears any diet/exercise state for that day and grants XP as if it were a perfect-with-grace day.

### Mark as missed (Dashboard fallback)
Still available, but now: only sets pillars to `fail` if they're currently empty. Never overwrites an existing `success`.

---

## Mission completion

When `dayNumber > totalDays`, the Dashboard becomes the completion screen (no separate route guard needed — the Dashboard reads completion state and renders the alternate layout). The user lands on it once per browser-restart at minimum.

**Layout**
- Final mission ring (filled, no pulse): `105 / 105`
- One headline number: `−4.2 kg · −7 cm waist`
- Stats block: `Perfect days 78 / 105 · Diet 84% · Exercise 79% · Longest streak 31`
- Photos strip: thumbnails of first and last photo with a small `Compare` button between
- Two CTAs:
  - `Export mission archive` — generates a `mission-archive-YYYYMMDD.json` (full payload + base64 photos)
  - `Begin a new mission` — opens a confirm sheet: `Archive this mission and start fresh? Your goals will carry forward.` On confirm: writes the current state to a `MissionArchive` download, then resets days/photos/measurements and sets a fresh `startDate = today`. XP and level carry forward.

The current mission's data lives until the user explicitly starts a new one. There is no in-app browseable history; the archive JSON is the artifact.

---

## Design tokens — Light (primary)

```css
/* Surfaces & neutrals */
--bg:            #FFFFFF;
--surface:       #FAFAF9;
--surface-2:     #F4F4F2;
--border:        #E8E8E5;
--border-strong: #D4D4D0;

/* Text */
--text:          #18181B;
--text-muted:    #71717A;
--text-subtle:   #A1A1AA;

/* Citrus — semantic data palette */
--lemon:         #FBBF24;   --lemon-soft:     #FEF3C7;
--lime:          #84CC16;   --lime-soft:      #ECFCCB;
--tangerine:     #FB923C;   --tangerine-soft: #FFEDD5;
--coral:         #FB7185;   --coral-soft:     #FECDD3;
--missed:        #E4E4E7;

/* Single hero accent (Linear-style) */
--accent:        #FB923C;
--accent-hover:  #F97316;
--accent-soft:   #FFEDD5;

/* Semantic mapping */
--success:       var(--lime);
--success-bg:    var(--lime-soft);
--rest:          var(--lemon);
--rest-bg:       var(--lemon-soft);
--partial:       var(--tangerine);
--partial-bg:    var(--tangerine-soft);
--failed:        var(--coral);
--failed-bg:     var(--coral-soft);

/* Shape */
--radius:        10px;
--radius-card:   12px;
--radius-pill:   9999px;
```

## Design tokens — Dark (secondary)

Warm dark, not pure black. Citrus hues slightly desaturated.

```css
--bg:            #0F0F0E;
--surface:       #1A1A18;
--surface-2:     #232320;
--border:        #2A2A28;
--text:          #FAFAF9;
--text-muted:    #A1A1AA;
--text-subtle:   #71717A;

--lemon:         #F5C443;
--lime:          #93D34A;
--tangerine:     #FF9A56;
--coral:         #FB7E8B;
--missed:        #2A2A28;
```

## Typography

- **Family**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` (self-hosted)
- **Numerals**: `font-variant-numeric: tabular-nums` on every stat
- **Scale** (in `rem` — respects OS text-size preferences):

  | Token | Size / Weight | Use |
  |---|---|---|
  | 5xl | 4rem / 700 | Hero numbers (Day, Level) |
  | 4xl | 3rem / 700 | Page headers |
  | 3xl | 2rem / 600 | Section headers |
  | 2xl | 1.5rem / 600 | Card titles |
  | xl  | 1.25rem / 500 | Subheads |
  | lg  | 1.0625rem / 500 | Emphasized body |
  | base| 0.9375rem / 400 | Body |
  | sm  | 0.8125rem / 400 | Captions |
  | xs  | 0.75rem / 500 | Labels, tags |
  | 2xs | 0.6875rem / 500 | Nav labels |

- **Letter spacing**: `-0.02em` on display sizes; normal on body
- **Line height**: 1.4 UI, 1.6 prose

## Motion

- **Easing**: `cubic-bezier(0.32, 0.72, 0, 1)`
- **Standard duration**: 200ms
- **Slide-to-confirm**: 350–450ms with a gentle spring on release; fires on pointerup only
- **Number counters**: 600ms ease-out
- **Level-up overlay**: 280ms fade-in → 1500ms hold → 200ms fade-out
- **Stage transition overlay**: same shape as Level-up
- **Streak-break overlay**: same shape; 2s hold; one-shot per break
- **Undo toast**: 200ms in, holds 5s, 200ms out; replaced if a new action lands
- **Page transitions**: 180ms opacity + 8px slide-up
- **Reduced motion**: respect `prefers-reduced-motion`; all motion collapses to opacity-only

**Spacing**: generous. Card padding ≥ 20px. **Touch targets ≥ 44px (was occasionally 28px in v1).**

---

## Core components

### Dashboard layout (active mission)

```
┌──────────────────────────────────────┐
│ Day 47          12 days  ◐ shield 1  │  ← streak pill + shield count
│                                      │
│             ◯                        │
│        47 / 105                      │
│         45% complete                 │
│                                      │
│   ⬤ Level 5 · Steady                 │
│   ▰▰▰▰▰▰▱▱▱▱   420 / 600 XP         │
│                                      │
│   Today                              │
│   ──── slide to log diet ────  ▸  ✗ │
│   ──── slide to log exercise ──  ▸ ✗ │
│                                      │
│   Weight   74.3 kg                   │
│                                      │
│   Consistency over intensity.        │
└──────────────────────────────────────┘
```

### Dashboard layout (pre-mission)
- Mission ring shows `0 / 105`, no pulse, muted stroke
- Center: `Begins in 4 days` (xl) → `Sun, Jun 14` (sm, muted) (formatted with `formatNice`, never raw ISO)
- Preview card: a non-interactive miniature of the Today rows, with a single line: `Your daily log will look like this.`
- CTA: `Open Settings` if the user wants to change the start date

### Dashboard layout (mission complete)
See [Mission completion](#mission-completion).

### Mission ring
- Apple-Watch-style circular progress ring, ~180px diameter
- Stroke 14px, soft tangerine → lemon gradient fill
- Center: `Day 47` (5xl/700) primary, then `45% · 58 left` on one muted sm line below. (v1 stacked three lines; v2 collapses to two.)
- Today's segment pulses gently (1.2s, low amplitude)

### Streak pill
- Top-right of the Dashboard header, opposite the Day label
- Shows only when `streak >= 2`: `12 days` (sm, tabular)
- Shield count appears next to it when `streakShieldsRemaining > 0`: `◐ 1` (xs, muted), tappable to open a confirm: `Use shield on yesterday?`

### Level badge + XP bar
- Pill: `Level 5` (bold) followed by tier name (`Steady`)
- 4px-tall pill progress bar beneath, tangerine fill
- Caption: `420 / 600 XP` (xs, muted)

### Today card — per-row actions
See [Failure path](#failure-path) above.

### Quick-log yesterday
- If yesterday is unlogged AND current time is before 11:00 local, show a single row above today: `Yesterday — log` with the same two affordances as today's rows (slide ✓ / tap ✗). Disappears once yesterday is logged or after 11:00.

### Journey path
- SVG winding path with **105 circular nodes** — real Q-curves at row pivots, not straight switchbacks
- 5 rows, alternating direction
- Tap targets: 44px diameter (invisible hit area extends node)
- Node states:

  | State | Size | Fill | Glyph |
  |---|---|---|---|
  | Future | 8px | outline, no fill | — |
  | Today | 14px | tangerine, pulsing ring | — |
  | Past — perfect | 10px | lime | ✓ |
  | Past — partial | 10px | tangerine | ~ |
  | Past — failed | 10px | coral | ✗ |
  | Past — rest | 10px | lemon | ☾ |
  | Past — missed | 8px | neutral gray | — |

- Glyphs render at 7px inside the node, white with 0.85 opacity — visible without being loud, fixes color-blind ambiguity
- Past path stroke fades to past colors; future path stroke stays `--surface-2`
- Notes indicator: a 3px `--accent` dot at top-right of any node whose entry has non-empty notes
- Stage markers at days 21, 42, 63, 84, 105 — 11px labels in `--text-muted` (was 9px `--text-subtle` in v1; failed contrast)
- Tap a node → bottom sheet with date, weight, diet & exercise toggles, rest toggle, waist input (if it's a Sunday or week-end day), notes
- Mini-legend at the bottom

### Weight + waist card
- Dashboard shows today's weight inline
- Progress page shows both as paired stats: `74.3 kg · 80 cm waist`
- Sparklines for each, Recharts, tangerine for weight, lemon for waist
- Trend chip per metric: `↓ 0.4 kg this week`, `↓ 0.5 cm this week`

### Adherence stats card (Progress page)
- Card above the weight chart
- `Perfect days 32 / 47` (5xl number, sm context)
- Three smaller stats below: `Diet 78%`, `Exercise 70%`, `Rest 4 days`

### Trendline projection (Progress page)
- A third optional line on the chart, dashed `--text-muted`
- Linear extrapolation from the last 14 days of weight to Day 105
- Toggle below chart: `Show projection`
- Label at the end of the line: `On pace for 70.8 kg.` (or `Pace unclear — log more weights.` if r² < 0.3)
- Goal ghost line: a horizontal `--accent-soft` line at `goalWeight` if set, with a small label

### Photos card / Photos page
- Horizontal-scroll thumbnails (96×128, 8px gap) on Dashboard
- Photos page: grid of weekly slots, one per week
- Filled slot tap → action sheet: `View · Replace · Compare with… · Delete`
- "Compare with…" launches a slot-picker (highlights other filled slots; tap to navigate to compare)
- Pinned `Compare with current` button in the Photos header when the most recent week has a photo
- Loading state during upload: whole slot pulses with a `--surface-2` shimmer; "Saving…" centered
- EXIF orientation respected (read with `createImageBitmap({ imageOrientation: 'from-image' })` or fallback)
- Each filled slot shows the paired weight underneath the thumb in xs muted

### Level-up moment
- Unchanged from v1

### Stage transition moment
- Same shape as Level-up overlay
- Background: radial tangerine → lemon at 8% opacity
- Center: `Stage 2` (5xl) → after 200ms `Build` (xl muted) + one zen line (sm muted)
- Auto-dismisses at 2s

### Streak-break moment
- Same shape as Level-up overlay
- Background: radial coral → bg at 6% opacity (more muted than level-up)
- Center: `Streak ended at 12.` (xl) → after 200ms `Day 48 is open.` (sm muted)
- If shield available, third line: `Use shield to keep it?` with `Use` and `Let it go` buttons
- Auto-dismisses at 2s if no shield decision required

### Empty states (zen)
- First open (pre-onboarding): the onboarding flow itself, not a dashboard
- Pre-mission: `Begins in 4 days.`
- Mission day 1, nothing logged: `Begin where you are. Day 1.`
- Nothing logged today: `Today is open.`
- Day after a miss: `Yesterday is closed. Today is open.`
- Mission complete: see [Mission completion](#mission-completion)

---

## Microcopy guide

| Moment | Copy |
|---|---|
| Header | `Day 47` |
| Pre-mission countdown | `Begins in 4 days` |
| Pre-mission date | `Sun, Jun 14` |
| Today, nothing logged | `Today is open.` |
| Both pillars logged | `Today is yours.` |
| Streak intact (≥2) | `Steady. 12 days.` |
| Streak ended | `Streak ended at 12. Day 48 is open.` |
| Shield offer | `Use shield to keep it?` |
| After a miss | `Tomorrow.` |
| Level up | `Level 6 · Steady` |
| Stage transition | `Stage 2 · Build` + one zen line per stage |
| Halfway (Day 53) | `Halfway. Keep walking.` |
| Rest day logged | `Rest is part of the work.` |
| Mission complete | `Mission complete. Day 105.` |
| Photo uploaded | `Logged.` |
| Weight entered | `Logged.` |
| Waist entered | `Logged.` |
| Undo toast | `Undid Diet ✓` (or `Undid Exercise ✗`, etc.) |
| Onboarding screen 1 | `105 days. One yes/no a day.` |
| Onboarding skip baseline | `Skip baseline` |
| Reset confirm prompt | `Type RESET to erase everything.` |
| Import diff header | `Backup contains:` |

**Stage zen lines** (one each, never rotated):
- Foundation: `Build the floor.`
- Build: `Add the weight.`
- Push: `Lean in.`
- Refine: `Sharpen what's working.`
- Reveal: `Let it show.`

**Banned**: "Crushing it", "On fire", "Streak!", "Great job!", "Amazing!", any 🔥, any exclamation marks.

## Iconography
- Library: `lucide-react`
- Weight → `scale` · Diet → `utensils` · Exercise → `dumbbell` · Rest → `moon` · Waist → `ruler`
- Journey → `map` · Level → `award` · Streak shield → `shield`
- Stroke width: **1.75**

## Accessibility

- Every citrus token verified WCAG AA against its intended background (light and dark)
- Slide-to-confirm has both keyboard alternative (Enter/Space) AND a visible tap button (the `✓` thumb area is a tap target when not in slide mode)
- SlideToConfirm exposes `role="slider"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` for switch-control and screen-reader users
- Photo grid buttons carry `aria-label` like `Week 3, logged, 74.3 kg` or `Week 4, empty`
- Journey nodes are real focusable elements (not just `<title>` on SVG circles); tab order follows day order
- Day status is never color-only — paired with a glyph (✓ / ~ / ✗ / ☾) inside the node
- Focus rings: 2px tangerine, 2px offset; not clipped by `overflow-hidden` parents (photo grid: focus ring rendered as inset on overflow-hidden buttons, outset elsewhere)
- `prefers-reduced-motion` respected throughout
- Dynamic type: all sizes in `rem`; UI verified at 130% and 175% system text scale
- All interactive targets ≥ 44px

---

## Error handling

- Top-level React error boundary wraps `<Routes>`. On error: full-screen card with `Something went wrong. Your data is safe.` and two buttons: `Reload` and `Export current data`. Errors logged to console only.
- Photo decode failure: thumb shows a muted broken-image glyph, single-line caption `Couldn't load this photo.`, long-press still allows delete.
- Storage-quota errors: surface as a banner on Dashboard linking to Settings → Export.

## Acceptance criteria
- [ ] Onboarding shows on first run; cannot be re-entered once `onboarded: true`
- [ ] Pre-mission Dashboard shows a friendly countdown, never raw ISO
- [ ] Post-mission Dashboard shows the completion layout with stats and CTAs
- [ ] Slide-to-confirm fires only on `pointerup` at threshold ≥ 0.8
- [ ] Every confirm action has a 5s Undo toast
- [ ] Tapping the ✗ on a row marks that pillar fail without affecting the other
- [ ] Mark-as-missed never overwrites an existing success
- [ ] Streak pill visible whenever `streak >= 2`
- [ ] Streak break triggers the calm overlay on next Dashboard open
- [ ] Streak shield can be used once per mission; refills on new mission start
- [ ] Rest day logged grants XP, counts toward streak, renders as lemon on journey
- [ ] Waist measurement can be logged weekly from Photos page; appears on Progress
- [ ] Goal weight (if set) renders as a ghost line on the weight chart
- [ ] Adherence stats card on Progress shows perfect days, diet %, exercise %, rest count
- [ ] Trendline projection toggles cleanly and labels stop at Day 105
- [ ] Journey nodes are 44px tap targets and have visible color-blind glyphs
- [ ] Journey path uses real curves at row pivots, not straight switchbacks
- [ ] Stage transition overlay fires once per stage crossing
- [ ] Photos: action sheet on filled slot, compare preview before navigating
- [ ] Photos: loading state during upload covers the whole slot
- [ ] EXIF orientation respected on iOS-captured photos
- [ ] Settings → Reset requires typing `RESET`
- [ ] Settings → Import shows a diff preview before replacing
- [ ] Backup nudge appears on Dashboard if `lastExportedAt` is older than 30 days
- [ ] Changing weight unit converts stored weights in place after confirm
- [ ] Inter is self-hosted; no third-party network requests on first paint
- [ ] React.lazy splits Compare, Photos, Progress from the entry bundle
- [ ] Top-level error boundary catches and displays a recovery card
- [ ] All previous v1 acceptance criteria still hold (offline, IndexedDB photos, etc.)

## Out of scope (deliberately, confirmed for v2)
- Accounts, login, cloud sync
- Social / sharing / leaderboards
- Workout plans, meal plans, recipes, video content
- Notifications / reminders (push or local)
- In-app browseable history of past missions (the archive JSON is the artifact)
- Analytics beyond what's surfaced in-app
- Sound effects (an optional level-up chime is allowed, off by default)
- Custom illustrations or mascot
- Multiple simultaneous missions

## Priority order
Simplicity > clarity > consistency > aesthetics > nice-to-haves.

Brightness and gamification serve consistency. If a fun element ever gets in the way of the user actually logging their day, it loses.
