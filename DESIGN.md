# Mission to Abs — Design Spec

> Design and behavior spec for a 15-week body-recomposition accountability PWA.
> For the build sequence and per-phase tasks, see [PHASES.md](PHASES.md).

---

## Mission
A private, offline-first PWA for a 15-week body-recomposition mission. The user opens it daily, logs weight + diet + exercise, takes a weekly progress photo, and watches progress along a 105-day journey. Light-mode first, bright but never loud — designed to be a moment the user looks forward to, not a chore.

## Product feel
- **Tone**: bright, calm, intentional. Citrus accents on a near-white base.
- **Inspiration**: Linear and Notion for craft and restraint; Apple Watch for the progress ring; Headspace for the calm voice.
- **Voice**: short, declarative, zen. "Day 47." not "Crushing it." Confidence over excitement. **No exclamation marks.**
- **Allowed**: gamification (XP, levels), motion, satisfying interactions, color, generosity.
- **Avoided**: hype copy, bodybuilder aesthetics, attention-grabbing animations, attributed motivational quotes.

## Philosophy
- **Bright, not loud.** Citrus accents on a near-white base. The palette wakes you up; the layout never shouts.
- **Earned satisfaction.** Logging feels good because of motion, haptics, and visible XP gain — not confetti.
- **The grid is a path.** Progress is a walk along a 105-step journey, not a heatmap of squares.

## Tech stack
- **Build**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS (light mode primary, dark mode opt-in via toggle or `prefers-color-scheme`)
- **State**: Zustand (single persisted store)
- **Storage**:
  - `localStorage` for entries, settings, photo metadata, progression (XP)
  - **IndexedDB** (`idb-keyval`) for photo blobs — `localStorage`'s 5 MB cap will not survive 15 weeks of photos
- **Charts**: Recharts (line chart only)
- **Icons**: `lucide-react`
- **Animations**: Framer Motion — used purposefully (slide-to-confirm, level-up overlay, XP counter, page transitions)
- **Dates**: `date-fns`
- **Routing**: hash-based React Router (offline + `file://` compatible)
- **Font**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **PWA**: `vite-plugin-pwa` with offline service worker

Target bundle: < 350 KB gzipped.

## Data model

```ts
type DayEntry = {
  date: string;                       // 'YYYY-MM-DD'
  weight?: number;                    // in user's unit
  diet?: 'success' | 'fail';
  exercise?: 'success' | 'fail';
  notes?: string;
};

type WeekPhoto = {
  weekNumber: number;                 // 1..durationWeeks
  date: string;                       // 'YYYY-MM-DD'
  photoKey: string;                   // key in IndexedDB
};

type Settings = {
  startDate: string;                  // 'YYYY-MM-DD'
  durationWeeks: number;              // default 15
  weightUnit: 'kg' | 'lb';            // default 'kg'
  theme: 'light' | 'dark' | 'system'; // default 'system'
};

type Progression = {
  xp: number;                         // total XP, monotonically increasing
};
// level is derived from xp via a pure function — never stored
```

**Storage layout**
- `mission.settings` → `Settings`
- `mission.days` → `Record<isoDate, DayEntry>`
- `mission.photos` → `WeekPhoto[]`
- `mission.progression` → `Progression`
- IndexedDB store `mission-photos` → `Blob` keyed by `photoKey`

## Day status logic
For each past day:
- both success → `perfect` (lime)
- one success + one fail → `partial` (tangerine)
- both fail, or one entry while the other is empty → `failed` (coral)
- no entry at all → `missed` (neutral gray)
- today → pulsing tangerine ring
- future → outline only, no fill

Streak = consecutive past days where diet AND exercise are both `success`. Shown only when ≥ 2, with the zen-voice label (see microcopy).

## XP & Level system

**XP grants** (every win earns; failures don't deduct):

| Action | XP |
|---|---|
| Diet success | 30 |
| Exercise success | 30 |
| Perfect-day bonus (both same day) | +40 |
| Weekly photo upload | 50 |

**Level formula**: `xpToNext(level) = 500 + (level - 1) × 100`
- Level 1 → 2: 500 XP
- Level 2 → 3: 600 XP
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

Stage names appear at markers on the journey path and at stage transitions on the dashboard.

## Pages

Sticky bottom tab nav, 5 items, thumb-zone:

1. **Dashboard** — mission ring (Day N / 105), level badge with XP bar, today's slide-to-confirm rows for diet and exercise, weight input, single zen line.
2. **Journey** — winding SVG path of 105 nodes (replaces the heatmap grid). Tap a node → bottom sheet to view/edit that day. Stage markers along the path.
3. **Progress** — weight line chart, toggle for 7-day moving average. One headline number: current vs. start delta.
4. **Photos** — weekly thumbnails timeline. Tap two → side-by-side compare with a draggable divider.
5. **Settings** — start date, duration, weight unit, theme (light/dark/system), export JSON, import JSON, reset all data (with confirm).

---

## Design tokens — Light (primary)

```css
/* Surfaces & neutrals */
--bg:            #FFFFFF;
--surface:       #FAFAF9;   /* warm off-white */
--surface-2:     #F4F4F2;
--border:        #E8E8E5;
--border-strong: #D4D4D0;

/* Text */
--text:          #18181B;   /* near-black, slight warmth */
--text-muted:    #71717A;
--text-subtle:   #A1A1AA;

/* Citrus — semantic data palette */
--lemon:         #FBBF24;   --lemon-soft:     #FEF3C7;
--lime:          #84CC16;   --lime-soft:      #ECFCCB;
--tangerine:     #FB923C;   --tangerine-soft: #FFEDD5;
--coral:         #FB7185;   --coral-soft:     #FECDD3;
--missed:        #E4E4E7;

/* Single hero accent (Linear-style) */
--accent:        #FB923C;   /* tangerine */
--accent-hover:  #F97316;
--accent-soft:   #FFEDD5;

/* Semantic mapping */
--success:       var(--lime);
--success-bg:    var(--lime-soft);
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

Warm dark, not pure black. Citrus hues slightly desaturated for night viewing.

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

- **Family**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
- **Numerals**: `font-variant-numeric: tabular-nums` on every stat (Day, XP, weight, level)
- **Scale**:

  | Token | Size / Weight | Use |
  |---|---|---|
  | 5xl | 64 / 700 | Hero numbers (Day, Level) |
  | 4xl | 48 / 700 | Page headers |
  | 3xl | 32 / 600 | Section headers |
  | 2xl | 24 / 600 | Card titles |
  | xl  | 20 / 500 | Subheads |
  | lg  | 17 / 500 | Emphasized body |
  | base| 15 / 400 | Body |
  | sm  | 13 / 400 | Captions |
  | xs  | 12 / 500 | Labels, tags |

- **Letter spacing**: `-0.02em` on display sizes; normal on body
- **Line height**: 1.4 UI, 1.6 prose

## Motion

- **Easing**: `cubic-bezier(0.32, 0.72, 0, 1)` (Apple's standard)
- **Standard duration**: 200ms
- **Slide-to-confirm**: 350–450ms with a gentle spring on release
- **Number counters** (XP gained): 600ms ease-out
- **Level-up overlay**: 280ms fade-in → 1500ms hold → 200ms fade-out
- **Page transitions**: 180ms opacity + 8px slide-up
- **Reduced motion**: respect `prefers-reduced-motion`; all motion collapses to opacity-only

**Spacing**: generous. Card padding ≥ 20px. Touch targets ≥ 44px.

---

## Core components

### Dashboard layout

```
┌──────────────────────────────────────┐
│        ◯  Day 47 / 105               │
│           45% complete               │
│                                      │
│   ⬤ Level 5 · Steady                 │
│   ▰▰▰▰▰▰▱▱▱▱   420 / 600 XP         │
│                                      │
│   Today                              │
│   ──── slide to log diet ───────  ▸ │
│   ──── slide to log exercise ───  ▸ │
│                                      │
│   Consistency over intensity.        │
└──────────────────────────────────────┘
```

### Mission ring
- Apple-Watch-style circular progress ring, ~180px diameter
- Stroke 14px, soft tangerine → lemon gradient fill
- Center: `Day 47` (5xl/700) with `/ 105` muted below
- Below ring: `45% complete · 58 days to go` (sm, muted)
- Today's segment pulses gently (1.2s, low amplitude)

### Level badge + XP bar
- Pill: `Level 5` (bold) followed by tier name (`Steady`)
- 4px-tall pill progress bar beneath, tangerine fill
- Caption: `420 / 600 XP` (xs, muted)

### Today card — slide to confirm
Two stacked rows (Diet, Exercise):
- Track: 56px-tall rounded pill, neutral surface, chevron hint on the right, faded `Slide to confirm`
- On slide:
  - Track fills lime as the thumb travels
  - At 80% travel: locks, thumb springs, checkmark animates in (180ms), label flips to `Done · +30 XP`
  - `+30 XP` floats up into the Level badge area; XP bar animates its fill
  - Haptic: single soft tap on confirm
- If both pillars done that day:
  - Mission ring pulses once
  - Subtle line: `+40 XP perfect day` (muted, fades after 3s)
- Failure logging: small `Mark as missed` link beneath the card — deliberately understated; failures should be a conscious act, not a casual tap

### Journey path (replaces the calendar heatmap grid)
- SVG winding path with **105 circular nodes**, one per mission day
- Layout: gentle S-curves; horizontally scrollable on mobile, fits viewport on desktop
- Node states:

  | State | Size | Fill |
  |---|---|---|
  | Future | 8px | outline, no fill |
  | Today | 14px | tangerine, pulsing ring |
  | Past — perfect | 10px | lime |
  | Past — partial | 10px | tangerine |
  | Past — failed | 10px | coral |
  | Past — missed | 8px | neutral gray |

- Stage markers at days 21, 42, 63, 84, 105 — small flag icons with stage names
- Tap a node → bottom sheet with date, weight, diet & exercise outcomes (editable)
- Mini-legend at the bottom

### Weight card
- Today's weight as a large tabular number, unit small after (`74.3 kg`)
- Sparkline below (Recharts, tangerine line, lime/coral dots on weekly checkpoints)
- Trend chip: `↓ 0.4 kg this week` — lime if trending toward goal, coral if away

### Photos card
- Horizontal-scroll thumbnails (96×128, 8px gap)
- Most recent has a 2px tangerine border
- `+50 XP` chip appears briefly on upload

### Level-up moment
- Full-viewport overlay (tap anywhere to dismiss)
- Background: tangerine → lemon radial gradient at 8% opacity
- Center: `Level 6` (5xl) → after 200ms, `Steady` (xl, muted) appears below
- Auto-dismisses at 1.5s. No confetti, no sound — presence is the reward.

### Empty states (zen)
- First open: `Begin where you are. Day 1.`
- Nothing logged today: `Today is open.`
- Day after a miss: `Yesterday is closed. Today is open.`

---

## Microcopy guide

| Moment | Copy |
|---|---|
| Header | `Day 47` |
| Today, nothing logged | `Today is open.` |
| Both pillars logged | `Today is yours.` |
| Streak intact | `Steady. 12 days.` |
| After a miss | `Tomorrow.` |
| Level up | `Level 6 · Steady` |
| Halfway (Day 53) | `Halfway. Keep walking.` |
| Mission complete | `Mission complete. Day 105.` |
| Photo uploaded | `Logged.` |
| Weight entered | `Logged.` |

**Banned**: "Crushing it", "On fire", "Streak!", "Great job!", "Amazing!", any 🔥, any exclamation marks.

## Iconography
- Library: `lucide-react`
- Weight → `scale` · Diet → `utensils` · Exercise → `dumbbell`
- Journey → `map` · Level → `award`
- Stroke width: **1.75** (slightly lighter than default for refinement)

## Accessibility
- Every citrus token verified WCAG AA against its intended background (light and dark)
- Slide-to-confirm has a tap-alternative button for non-gesture users
- `prefers-reduced-motion` respected throughout
- Semantic states never color-only — always paired with an icon or label
- Focus rings: 2px tangerine, 2px offset

---

## Acceptance criteria
- [ ] Works fully offline after first load (service worker installed).
- [ ] Data, photos, and XP persist across reloads and browser restarts.
- [ ] Optimized for 412×915 viewport (Galaxy S24 Ultra) — no horizontal scroll, all targets ≥ 44px.
- [ ] `npm run build` produces a deployable PWA bundle.
- [ ] Lighthouse: installable, no console errors.
- [ ] Settings → Export produces a JSON file containing entries, settings, progression, and base64-encoded photos.
- [ ] Settings → Reset wipes `localStorage` AND IndexedDB after a confirmation prompt.
- [ ] Light and dark themes both pass WCAG AA contrast.
- [ ] `prefers-reduced-motion` disables all non-essential animation.

## Out of scope (do not build)
- Accounts, login, cloud sync
- Social / sharing
- Workout plans, meal plans, recipes
- Notifications / reminders
- Multiple missions, history of past missions
- Analytics beyond the weight chart
- Sound effects (an optional level-up chime is allowed, off by default)
- Custom illustrations or mascot
- Leaderboards

## Priority order
Simplicity > clarity > consistency > aesthetics > nice-to-haves.

Brightness and gamification serve consistency. If a fun element ever gets in the way of the user actually logging their day, it loses.
