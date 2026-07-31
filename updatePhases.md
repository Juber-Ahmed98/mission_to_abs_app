# Update Phases — UI/UX redesign: make it worth opening

> **Phase ↔ tier map:** Phases 1–4 = Tier E (exploration, prod untouched) ·
> Phases 5–6 = Tier F (foundation) · Phases 7–10 = Tier M (moments) ·
> Phases 11–12 = Tier S (sweep + voice) · Phases 13–14 = Tier C (checkpoints).
> Stop after any phase and the app is in a good state.
>
> **Status:** Phase 0 (planning + archive) shipped with this document. Phase 1
> ✅ shipped 2026-07-30. Phase 2 ✅ shipped 2026-07-30 — three directions built;
> **Gate 1 ✅ passed 2026-07-30: Waypoint wins outright** (Ember and Ledger
> killed, no merge notes — dated verdict in [update.md](update.md) §9). Phase 3
> ✅ built 2026-07-30; **Gate 2 ✅ passed 2026-07-31: Waypoint pinned on the
> walk, no amendments** (dated verdict in [update.md](update.md) §9). Phase 4
> ✅ shipped 2026-07-31 — DESIGN.md is now the v3 Waypoint design contract with
> the full decision log; **GATE 3 pending** (owner reads and signs the
> contract). **No production file changes until Gate 3 signs.**

Each phase is independently shippable and ends with a single commit (owner pushes).
Sequencing is intentional: exploration is reversible so it goes first; the contract
converts reactions into law before any production cost; tokens → components → moments
because each layer is the next one's vocabulary; re-entry lands before the celebration
arc because the owner's actual pattern is the return, not the streak. Spec and argument
in [update.md](update.md); charter in [redesign-brief.md](redesign-brief.md).

Three hard gates: **Gate 1** (direction reactions, after Phase 2), **Gate 2** (winner
pinned on the Journey render, after Phase 3), **Gate 3** (design contract signed, after
Phase 4). A gate is an owner session at 375px on the phone, mid-lapse fixture first.
The session interrogates reactions — what specifically pulled or repelled — and never
asks the owner to describe a direction in adjectives.

---

## Phase 1 — Direction lab: dev-only route + fixtures — ✅ Shipped 2026-07-30

**Goal** — a throwaway rendering harness where directions get built against the real
primitives, driven by fixture states, with zero production footprint.

**Changes**
- [src/App.tsx](src/App.tsx) — dev-guarded lab route. **Both** the `lazy()` import
  expression and the `<Route>` sit behind `import.meta.env.DEV` (an unconditional
  top-level `lazy()` still emits the chunk even when the route is guarded):
  `const LabPage = import.meta.env.DEV ? lazy(() => import('./lab/Lab')) : null;`
  then `{import.meta.env.DEV && LabPage && <Route path="/lab/*" element={<LabPage />} />}`.
  Add `/lab` to the `hideNav` list.
- New `src/lab/Lab.tsx` — shell: direction index, fixture-state switcher, lab-local
  theme toggle that does **not** write `settings.theme`.
- New `src/lab/fixtures.ts` — pure-props fixture states, no store writes, no
  localStorage: `day62MidLapse` (the default, always listed first), `day1`,
  `day104Eve`, `streakBreak`, `levelUp`, `perfectDay`. The nine primitives are
  pure-props presentational, so fixtures drive them directly; `DayEditor` / `Compare` /
  `MissionCompleted` are store-connected and get thin lab shims only if a direction
  needs them rendered.

**Verification**
- `npm run build` — no `Lab` chunk in the build summary; entry gz within 1 kB of the
  baseline in [update.md](update.md) §5 (instrument: Vite's gzip report).
- `npm run dev` → `/#/lab` renders the shell with the bottom nav hidden;
  `npm run preview` → `/#/lab` renders no route and the app is otherwise unaffected.
- Full lab tour (every fixture, both lab themes), reload → DevTools → Application →
  Local Storage: the `mission` key is byte-identical to before the tour.

**Commit** — `Lab: dev-only direction lab with mid-lapse fixture states`

**Shipped notes (2026-07-30)** — all verifications passed (no lab chunk; entry
126.79 kB gz vs the 126.78 baseline; CSS byte-identical at 5.77 kB gz; `mission`
key byte-identical after a full tour). Two additions beyond the plan:
`src/vite-env.d.ts` (the project had no Vite client types — `import.meta.env`
didn't typecheck), and a prod-scoped Tailwind `content` glob excluding `src/lab`
(without it, lab-only utility classes leak into production CSS — +0.13 kB now,
and growing with every Phase 2 fork). The fixture inspector in the shell doubles
as the data reference while building directions.

---

## Phase 2 — Two to three contrasting directions, rendered — ✅ Shipped 2026-07-30 · **Gate 1 ✅ passed: Waypoint**

**Goal** — 2–3 deliberately contrasting directions, each delivered as the nine real
primitives plus a fully composed Dashboard, judged first in the day-62 mid-lapse state.

**Changes**
- `src/lab/directions/<n>/` per direction — **forked lab-only copies** of the
  primitives, restyled freely (forks are necessary: Tailwind type/shape utilities are
  literal; only colors/radii/easing are `var()`-driven). Palette variation *within* a
  direction may use a wrapper class redefining custom props.
- Each direction delivers: all nine primitives + the composed Dashboard, in all six
  fixture states, **mid-lapse shown first** — and the mid-lapse Dashboard must contain
  that direction's **re-entry answer** (what greets the returning user), not a
  grayed-out ordinary screen.
- Each direction declares its theme identity (light-first / dark-first / single-theme)
  and renders whichever theme(s) it claims.
- Method: ui-ux-pro-max generates palette/type/style-system candidates per direction
  before building; hallmark drives the exploration and enforces the anti-generic bar.
- Contrast enforcement (from [update.md](update.md) §3): every pair of directions
  differs on ≥3 axes; ≥1 direction leaves citrus entirely; ≥1 is dark-first; ≥1 keeps
  a light identity; no direction is v1 in disguise; "juiced zen" seeds at most one
  direction, rebuilt from its mood words (tactile, warm, physical), no free pass.

**Verification**
- Each direction renders all six fixtures at 375px (DevTools device toolbar),
  mid-lapse first; the mid-lapse screen is visually distinct from day-1 (a designed
  re-entry treatment, not a grayed dashboard).
- `npm run build` — still no lab chunk; entry gz unchanged.

**GATE 1** — ✅ passed 2026-07-30: **Waypoint wins outright**; Ember and Ledger
killed, no merge/hybrid notes. Dated verdict in [update.md](update.md) §9;
loser folders stay in the lab until the Phase 14 disposition.

**Commit(s)** — one per direction: `Lab: direction 1 — <working name>` etc.

**Built notes (2026-07-30)** — three directions shipped, one commit each:
**Ember** (dark-first · juiced-zen seed rebuilt from tactile/warm/physical ·
the hearth · quiet-tactile register · focused density), **Ledger** (light-first
· type-led system-serif logbook · **leaves citrus entirely** · statuses as ink
marks · quiet-typographic), **Waypoint** (light-first · the mission as a place
· stage-keyed hues, accent = current stage · expressive-celebratory · the walk
on the Dashboard as a 105-segment trail strip). Contrast matrix + re-entry
answers + Gate 1 session sheet in
[src/lab/directions/README.md](src/lab/directions/README.md). Each direction
ships the nine forked primitives, a locally-interactive Dashboard (slides,
toasts, undo, sheets all work against fixture state), and a primitives gallery
behind "Show primitives". All verifications passed: six fixtures × three
directions walked at 375px in both themes (mid-lapse renders a designed
re-entry surface, distinct from day-1, in all three); every displayed number
derived (mid-lapse: last log Day 41, 20 unlogged, 43 ahead; Waypoint strip:
exactly 20 dotted segments); zero console errors; no store/localStorage
writes; `npm run build` — no lab chunk, entry 126.79 kB gz and CSS 5.77 kB gz
byte-identical to the Phase 1 baseline. Housekeeping in the same window:
`vite.config.ts` dev server now honors `PORT` (dev-only; prod bundle hashes
unchanged) so a second editor session can run the lab alongside the owner's.

---

## Phase 3 — Journey render for the finalist (Waypoint) — ✅ Built 2026-07-30 · **Gate 2 ✅ passed 2026-07-31: pinned**

**Goal** — the Journey page fully rendered in each surviving direction; the core v2
complaint ("a grid of dots on a card rather than a walk") is only testable here, so a
direction that works on the Dashboard and fails on the Journey is dead.

**Changes**
- `src/lab/directions/<finalist>/Journey*` — Journey + path forks per finalist,
  rendered in mid-lapse (the gap must be visible on the walk without being
  scarlet-lettered), day-1, and day-104 states.
- Stage boundaries (Foundation → Build → Push → Refine → Reveal) visible in the
  render — this is stage-crossing's direction-level treatment.
- Any Gate-1 hybrid notes applied to the finalist Dashboards.

**Verification**
- Each finalist Journey renders the 105-day arc at 375px in its claimed theme(s); the
  day-62 state shows the lapse gap legibly, without shame framing.

**GATE 2** — ✅ passed 2026-07-31: **Waypoint pinned on the walk, no
amendments** (owner session at 375px: mid-lapse light first, then day 1,
day 104 eve, and dusk; dated verdict in [update.md](update.md) §9). Losing
directions' folders stay in the lab until Phase 14 disposition.

**Commit** — `Lab: journey renders for finalist directions`

**Built notes (2026-07-30)** — one finalist after Gate 1, so one render:
`src/lab/directions/waypoint/Journey.tsx`, wired through a new optional
`Journey` slot on `LabDirection` and a Dashboard/Journey view toggle in the
lab shell (Waypoint's BottomNav gained an `active` prop so the Journey tab
lights). The walk is a serpentine 7-per-row SVG route through five
stage-soft terrain bands, each opening with a camp flag and its day range —
stage boundaries are the geography, with extra row spacing at every
crossing. Trail texture per the direction's status language: solid
stage-hued stretches where days were logged, the lapse as a literal dotted
stretch (border-strong, never scarlet), rough ground in neutral, tents for
camp days, a faint plotted line ahead, the summit flag at day 105, a pin at
today, and a dashed camp ring on the last-logged day of a lapse. Tapping a
day opens the map-panel sheet; unrecorded days offer "mark the missed
stretch" (walked / camp / rough ground) — lab-local overrides with honest
XP toasts and undo, reset on fixture change, zero store or localStorage
writes. All verifications passed: mid-lapse at 375px shows exactly 21
dotted stretches (days 42–61 + unrecorded today) with "Camp was Day 41"
framing and no shame constructions; day-1 renders the trailhead with 104
plotted segments; day-104 eve shows 103 walked and one to go; both themes
walked clean with zero console errors; `npm run build` — no lab chunk,
entry 126.79 kB gz and CSS 5.77 kB gz byte-identical to the baseline.

---

## Phase 4 — The design contract in DESIGN.md — ✅ Shipped 2026-07-31 → **GATE 3 pending**

**Goal** — the winner becomes law before any production restyling; every later phase
verifies against this document, not against memory.

**Changes** (all in [DESIGN.md](DESIGN.md))
- **Replace** the direction sections: Product feel, Design tokens (light + dark),
  Typography, Motion, Iconography, the Microcopy guide's voice rules, and the visual
  specs inside Core components.
- **Keep** the non-negotiables: Mission, Philosophy (witness-not-coach, honest
  logging, every action reversible), data model, day status, streak, XP, stages,
  failure path, error handling, accessibility bars.
- **Author the decision log** (new section — none exists today; house voice: dated
  headings, "Chose X over Y (reasons)"). Required entries: the winner over each loser;
  an explicit verdict on **every** re-decidable v2 rule (exclamations/emoji/banned
  words, radii, shadows, 200ms standard duration, no-confetti, light-first,
  single-accent); the juiced-zen disposition; the citrus disposition.
- **New contract sections:** the re-entry moment spec (the first this moment has ever
  had); the three-register feedback system (light float / new medium in-flow / heavy
  overlay) with a co-occurrence precedence table (moments stack — re-entry vs
  streak-break vs stage vs level-up vs perfect-day vs photo-nudge needs a pinned
  order); the lapse-vs-streak-break boundary (e.g. ≥2 unlogged days = lapse); the
  net-new token surface names (`--shadow-*`, `--duration-*`, any glow/depth tokens);
  the theme model, including the boot-flip rule for existing installs (`'system'`
  users follow the new default; explicit choosers don't move).
- **Resolve the XP carry-forward contradiction** (spec says XP carries; the store
  zeroes it): pin the UI-only career-XP derivation
  `history.reduce((s, m) => s + m.finalXp, 0) + totalXp(current)` and its
  presentation.

**Verification**
- DESIGN.md has zero references to "bright, calm, intentional" outside the decision
  log; the log covers all eight re-decidable rules with verdicts.
- Every one of the eight moments has a spec section naming its feedback register.
- The carry-forward claim in the completion section matches the pinned derivation.

**GATE 3** — owner reads and signs the contract. Production phases unlock.

**Commit** — `Design contract: pin the <winner> direction in DESIGN.md`

**Shipped notes (2026-07-31)** — DESIGN.md rewritten as the v3 Waypoint
contract. All three phase verifications pass: "bright, calm, intentional"
appears exactly once, inside the decision log; all eight moments carry a
`**Register:**` line; the decision log covers all eight re-decidable rules
(kept ×2, amended ×3, overturned ×2, superseded ×1) plus the juiced-zen and
citrus dispositions and the Gate 1/Gate 2 entries; the completion section's
carry-forward claim cites the pinned career derivation verbatim. Contract
additions beyond the plan, all derived from the built direction rather than
invented: a `--track` token and the `--stage-0..4`(+`-soft`) group with the
`stage-<n>` shell binding; the speck-drift particle bounds (≤8, 1.1s,
reduced-motion: none); the streak-break demotion from heavy to medium
(recorded as its own decision-log entry); a `mission.reentry.*` once-flag
family; the ritual prompt pinned to the mission-week's last day; and two
drift corrections — the tier table now matches `tierName()` (the v2 doc's
1–4/5–9/… boundaries never matched code), and the Out-of-scope list stops
denying the shipped reminder banner and `/history` route (shrinking the
Phase 13 drift list). Gate 3 is the owner's read-and-sign session on this
document; production stays frozen until it signs.

---

## Phase 5 — Token foundation + theme knock-ons + app icon — ⏸ Awaiting Gate 3

**Goal** — the app wears the contract's palette and gains the token surface the
direction needs; every theme knock-on lands here, named, not discovered later.

**Changes**
- [src/index.css](src/index.css) — the contract's palette, both themes; **net-new
  token groups** `--shadow-*` / `--duration-*` (plus any glow/depth tokens); radii and
  spacing revisited per contract.
- [tailwind.config.js](tailwind.config.js) — surface the new groups (`boxShadow`,
  `transitionDuration`) so no literal values leak into components.
- New UI-side motion-token module (e.g. extend [src/lib/motion.ts](src/lib/motion.ts))
  — the single source for ease/duration/spring presets, replacing the
  `[0.32, 0.72, 0, 1]` duplication (five component files + CSS + Tailwind).
- [index.html](index.html) — `theme-color` metas, `apple-mobile-web-app-status-bar-style`,
  and the boot-script default if the primary theme flips.
- [vite.config.ts](vite.config.ts) — manifest `theme_color` / `background_color`
  (dark-first ⇒ `background_color` must change or the Android splash flashes white).
- [public/app-icon.svg](public/app-icon.svg) — redraw on-palette (the current
  crimson/magenta rocket predates the v2 system) with maskable-safe geometry; split
  the single `'any maskable'` manifest entry into separate `any` + `maskable` entries;
  add 192/512 PNG fallbacks.

**Verification**
- `grep -rE '#[0-9a-fA-F]{3,8}' src --include='*.tsx'` returns zero hits.
- `grep -rn '0.32, *0.72' src` returns exactly one hit (the motion-token module).
- Body/bg and accent/bg pairs measure ≥ 4.5:1 in both themes (DevTools contrast
  readout; literal ratios recorded in DESIGN.md).
- Installed Android PWA cold launch: splash matches the manifest `background_color`,
  no white flash; DevTools → Application → Manifest shows the icon uncropped in the
  maskable preview.
- `npm run build` — total gz within +3 kB of the baseline.

**Commit** — `Tokens: <direction> palette, depth + motion tokens, themed shell and icon`

---

## Phase 6 — Shared primitives + one celebration system — ⏸ Awaiting Gate 3

**Goal** — the nine primitives restyled per contract, and the feedback architecture
rebuilt: one celebration primitive replacing three template copies, plus the missing
medium register.

**Changes**
- New celebration primitive replacing [LevelUpOverlay](src/components/LevelUpOverlay.tsx),
  [StageOverlay](src/components/StageOverlay.tsx),
  [StreakBreakOverlay](src/components/StreakBreakOverlay.tsx) (three copies of one
  template). The three become thin configs or are deleted. **The localStorage
  once-flag keys `mission.stageShown.*` and `mission.streakBreak.*` keep their names**
  — shipped users must not get re-fired celebrations after the update.
- New medium-weight in-flow register component — the gap between the XP toast and the
  full-screen overlays; perfect-day, re-entry acknowledgment, and the photo nudge all
  speak through it.
- Restyle per contract: [MissionRing](src/components/MissionRing.tsx),
  [SlideToConfirm](src/components/SlideToConfirm.tsx) (haptic disposition per
  contract), [TodayRow](src/components/TodayRow.tsx),
  [LevelBadge](src/components/LevelBadge.tsx), [BottomNav](src/components/BottomNav.tsx),
  the weight/waist/body-fat inputs, [BottomSheet](src/components/BottomSheet.tsx),
  [XpToast](src/components/XpToast.tsx), [UndoToast](src/components/UndoToast.tsx).
- Extract a shared `SegmentedControl` (currently duplicated verbatim in
  [Onboarding.tsx](src/pages/Onboarding.tsx) and [Settings.tsx](src/pages/Settings.tsx)).

**Verification**
- One overlay implementation: the three old overlay files are deleted or are <20-line
  configs of the shared primitive (`wc -l`).
- The lab renders every restyled primitive against all six fixtures in both themes at
  375px — the lab is now the verification gallery.
- DevTools Rendering → Emulate `prefers-reduced-motion: reduce`: every spring
  collapses to the contract's reduced variant (the CSS kill-switch does not affect
  framer-motion — the JS hook must be wired).
- SlideToConfirm track ≥44px tall; weight/waist inputs compute to ≥16px font-size
  (DevTools computed styles).

**Commit** — `Components: primitives restyled + one celebration system with three registers`

---

## Phase 7 — Dashboard decomposition + the daily loop — ⏸ Awaiting Gate 3

**Goal** — [Dashboard.tsx](src/pages/Dashboard.tsx) (636 lines, six of the eight
moments) becomes a thin composition; the first-open and pillar-log moments land on it.

**Changes**
- Split into `src/pages/dashboard/` section files (greeting, today card, banner stack,
  stats strip) + a `useCelebrations` hook absorbing the XP diff-watcher and overlay
  triggers; the container stays under ~150 lines.
- First-open moment per contract. "Logged today" derives from `dayStatus()` **always**
  — the mount effect auto-creates today's entry, so key presence is meaningless.
  [quotes.ts](src/lib/quotes.ts) deployed per contract instead of only via the
  reminder banner lottery.
- Pillar-log feedback per contract. Backfills via
  [DayEditor](src/components/DayEditor.tsx) stop being silent — XP toast + undo, same
  as live logs.
- **Perfect day becomes reachable**: triggered off day-completion state
  (`dayStatus === 'perfect'`), fired through the medium register, respecting the
  contract's precedence table (level-up can co-occur).

**Verification**
- Completing the second pillar on a fully-logged day fires the perfect-day moment in
  the medium register exactly once; time-travel via Settings startDate re-arms it
  (once-per-day proven).
- Backfilling yesterday in DayEditor shows `+N XP` and the undo pill; undo reverts.
- Perfect day + level-up on the same log fire in the contract's precedence order,
  never simultaneously.
- **Before any on-device fixture test: Settings → Export** (the owner's device holds
  the real mission).

**Commit** — `Dashboard: decomposed shell, first-open greeting, honest logging feedback`

---

## Phase 8 — Re-entry after a lapse + streak break — ⏸ Awaiting Gate 3 — *the flagship*

**Goal** — the single most important moment in the redesign, currently undesigned;
plus the streak-break moment, currently broken for real lapses.

**Changes**
- New re-entry surface per the contract spec, built from UI-derived facts only (no
  store or logic-lib changes): last genuinely-logged day (`dayStatus()` filter over
  `days` — never key presence), lapse length, days remaining, stage drift, missed
  photo weeks, where the level and weight stood. Armed once per return via a
  localStorage flag (same pattern as `mission.streakBreak.*`).
- **Fix streak-break detection in-component** (the streak lib is untouched): today the
  overlay inspects only yesterday and `priorStreak < 2` after a multi-day gap means it
  never fires for an actual lapse. New behaviour per the contract's boundary: a 1-day
  gap → break treatment with the explicit shield offer; a multi-day gap → the re-entry
  treatment, which never shames and never leads with the broken streak.
- Backfill invitation from the re-entry surface into Journey/DayEditor; marking missed
  days stays exactly as easy as backfilling successes; all writes go through existing
  store APIs with undo.

**Verification**
- Time-travel fixture (startDate −62, a multi-week gap) → next open shows the
  re-entry moment with the literal derived facts (e.g. "last logged Day 41"); the copy
  contains none of the contract's shame-banned constructions (grep the strings).
- One-day gap with a shield available → the shield offer appears; spending is explicit
  and undoable.
- The re-entry moment fires once per lapse — reload does not re-fire (flag observed in
  DevTools → Application → Local Storage).
- Reduced-motion emulation → re-entry renders its static variant.

**Commit** — `Re-entry: returning after a lapse is a designed moment`

---

## Phase 9 — The arc: Journey, stages, level-ups, day 105 — ⏸ Awaiting Gate 3

**Goal** — the walk in production, plus every milestone on it.

**Changes**
- [Journey.tsx](src/pages/Journey.tsx) + [JourneyPath.tsx](src/components/JourneyPath.tsx)
  restyled per the Gate-2-proven render.
- Current stage always visible on the Dashboard (today it appears nowhere on it);
  stage overlay fires on first open **at or after** the crossing, not only on the
  exact day (once-flags preserved).
- Level-up moment rework per contract; career XP/level presentation per the pinned
  derivation (a flawless mission tops out at Level 12 — the tiers above are career
  territory).
- Day 105 becomes a moment (today it renders as a normal day;
  [MissionCompleted](src/components/MissionCompleted.tsx) only appears day 106+);
  MissionCompleted restyled, presenting mission two as continuation, not reset.

**Verification**
- Time-travel fixtures: exact crossing day; opening N days after a crossing (overlay
  still fires, once); the day 104 → 105 → 106 sequence.
- The stage indicator is visible on the Dashboard at 375px in both themes.

**Commit** — `Journey: the walk, stage crossings, level-ups, and day 105`

---

## Phase 10 — The weekly ritual: photo + waist + compare — ⏸ Awaiting Gate 3

**Goal** — the ritual stops slipping silently; the compare feels like the payoff.

**Changes**
- A photo/waist entry joins the banner/register precedence (today the precedence list
  has no photo entry — a week slips with zero prompting), on the contract-specified
  day, through the medium register.
- [Photos.tsx](src/pages/Photos.tsx) ritual framing; [Compare.tsx](src/pages/Compare.tsx)
  polish; [Progress.tsx](src/pages/Progress.tsx) restyled with recharts themed via
  tokens (recharts stays — rewriting a 106 kB chunk is a scope trap).

**Verification**
- A week with no photo → the ritual prompt appears on the contract-specified day,
  dismissible, and never outranks re-entry in the precedence table.
- Compare handle ≥44px; chart series measure ≥3:1 against the background in both
  themes.

**Commit** — `Ritual: the weekly photo + waist prompt and the compare payoff`

---

## Phase 11 — Secondary surfaces sweep — ⏸ Awaiting Gate 3

**Goal** — no v2 orphans; every remaining surface joins the new system.

**Changes**
- [History.tsx](src/pages/History.tsx), [Settings.tsx](src/pages/Settings.tsx),
  [Onboarding.tsx](src/pages/Onboarding.tsx) (visual restyle; copy finalized in
  Phase 12 — Onboarding doubles as the portability test: it must read right for a
  friend starting their own 105 days with renamed pillars).
- [InstallBanner](src/components/InstallBanner.tsx), [ReminderBanner](src/components/ReminderBanner.tsx),
  [RouteSkeleton](src/components/RouteSkeleton.tsx), [ErrorBoundary](src/components/ErrorBoundary.tsx),
  the photo trio ([PhotoThumb](src/components/PhotoThumb.tsx),
  [PhotoViewer](src/components/PhotoViewer.tsx),
  [PhotoActionSheet](src/components/PhotoActionSheet.tsx)).
- Every empty state per contract, including the new lapse-aware ones.

**Verification**
- Every route walked at 375px in both themes, live in the browser preview.
- Grep for v2-only token names returns zero hits.

**Commit** — `Surfaces: history, settings, onboarding join the new system`

---

## Phase 12 — Voice pass — ⏸ Awaiting Gate 3

**Goal** — every user-facing string sounds like one person, per the contract's voice
verdicts. Moment copy is written in-phase during Phases 7–10 (a moment is not done
without its words); this phase is the whole-app unification sweep.

**Changes**
- [src/lib/encouragement.ts](src/lib/encouragement.ts) (nine hard-coded strings +
  strict precedence — in scope, not protected) and
  [src/lib/quotes.ts](src/lib/quotes.ts) (40 morning quotes + 10 evening prompts,
  curated/rewritten).
- Settings labels, error strings, onboarding copy, overlay/celebration copy, every
  empty state — via human-copy.
- Non-negotiable register survives any verdict: witness-not-coach, and non-judgmental
  failure copy in the spirit of "Yesterday is closed. Today is open." — even if the
  words change.

**Verification**
- String inventory grep sweep: zero banned constructions per the contract's
  (re-decided) list.
- The eight moments read in sequence on-device sound like the same person.

**Commit** — `Voice: every string sounds like a person`

---

## Phase 13 — Doc-refresh checkpoint — ⏸ Awaiting Gate 3

**Goal** — the docs describe the app that shipped, including drift that predates this
work.

**Changes**
- [DESIGN.md](DESIGN.md) microcopy + component sections synced to shipped reality,
  **including the pre-existing drift list**: `--text-subtle` value, `--accent`
  aliasing, `--radius-lg` undocumented, ten undocumented dark tokens, reminders +
  history still listed "Out of scope" despite shipping, the `/history` route
  undocumented, the fifteen spec-less components (the three old overlays now
  superseded by the celebration-system spec), an Empty-states entry for the lapse.
- [PHASES.md](PHASES.md) acceptance criteria updated where the redesign changed them.
- `screenshots/` — move the v2 set aside (e.g. `screenshots/v2/`) and regenerate the
  "after" portfolio via the `/screenshots` command; the before/after pair is the
  portfolio story.
- [Onboarding.tsx](src/pages/Onboarding.tsx) copy cross-checked against the docs.

**Verification**
- A fresh-session read of DESIGN.md alone is sufficient to describe every shipped
  screen (spot-check three components against the running app).

**Commit** — `Docs: DESIGN.md and PHASES.md match the shipped redesign`

---

## Phase 14 — Phase-wide audit checkpoint — ⏸ Awaiting Gate 3

**Goal** — the hard constraints verified with instruments, not eyeballs; fix forward
inline or record deliberate deferrals in the status blockquote.

**Verification** (this phase *is* its verification list)
- Contrast: every token pairing in both themes measured (DevTools contrast readout /
  CCA), literal ratios recorded in DESIGN.md's accessibility section.
- `prefers-reduced-motion`: every animated moment under DevTools Rendering emulation
  renders its static/reduced variant.
- Tap targets ≥44px and inputs ≥16px on every interactive control (DevTools inspect
  across the key screens).
- Rem scale at 130% and 175% Android system text scale: Dashboard, Journey, and the
  re-entry surface show no clipping or overlap (on-device).
- Offline cold start: installed Android PWA, airplane mode, force-stop, cold launch →
  fully functional. Includes the fonts item: `.woff2` is absent from the Workbox
  precache glob — add the fonts or record why not; confirm all new assets (icon PNGs,
  textures) are in the glob.
- PWA update path: an installed stale shell updates to the redesign without blanking
  (the self-heal in [index.html](index.html) exists because this bit before; a
  whole-app CSS/JS swap is the stress test).
- Bundle: `npm run build` gzip report vs the [update.md](update.md) §5 baseline —
  delta recorded per chunk; < 350 kB gz hard gate.
- Anti-generic audit via hallmark across every screen.
- Every route at 375px, both themes, live.
- Lab disposition decided: keep `src/lab/` as the permanent dev gallery (recommended —
  free in prod, and it is now the verification harness) or delete; either way,
  re-verify dead-code elimination.

**Commit** — `Audit: measured accessibility, offline, and bundle gates pass`

---

## Cross-phase notes

- **The gates are the schedule.** Phases 2–4 cannot complete without a synchronous
  owner session; `⏸ awaiting gate` is an intentional state, not a stall.
- **The mid-lapse fixture is the first screen of every review.** Directions,
  components, and copy are all judged on the bad day before the good day.
- **The owner's device is the test device.** Every on-device playbook that touches
  startDate or once-flags starts with Settings → Export.
- **Once-flag key names are load-bearing** (`mission.stageShown.*`,
  `mission.streakBreak.*`) — renaming them re-fires celebrations for the shipped
  install.
- **Streak semantics are untouchable**: the streak excludes today by design; the
  Dashboard auto-creates today's entry on mount, so "logged" always derives from
  `dayStatus()`, never key presence.
- **Fonts are budget, not vibes.** A new typeface is a stop-and-raise even though it
  isn't a new runtime dependency — it's first-paint and precache weight.
- **Haptics are Android-only** (`navigator.vibrate` is silent on iOS Safari) — fine
  for the primary surface, but no direction may lean on haptics as its identity.
