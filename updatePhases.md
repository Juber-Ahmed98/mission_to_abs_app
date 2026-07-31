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
> the full decision log; **Gate 3 ✅ signed 2026-07-31** (dated entry in
> [update.md](update.md) §9). **Production is unlocked**; the contract is the
> verification target for every phase from 5 on. Pacing per the owner:
> **one phase per session.** Phase 5 ✅ shipped 2026-07-31 (tokens, themed
> shell, new icon; four light tokens amended for measured AA — see the
> DESIGN.md decision log). Phase 6 ✅ shipped 2026-07-31 (primitives restyled,
> one celebration primitive + the medium register, shared SegmentedControl;
> the lab gained the shared-primitives verification gallery). Phase 7 ✅
> shipped 2026-07-31 (Dashboard decomposed to a 127-line container, app-wide
> XP toast watcher, first-open greeting per contract, perfect day reachable,
> DayEditor backfills honest). Phase 8 ✅ shipped 2026-07-31 (the flagship:
> re-entry after a lapse, the lapse boundary in production, streak-break
> detection fixed). Phase 9 ✅ shipped 2026-07-31 (the arc: the Gate-2 map in
> production, at-or-after stage crossings, the summit as a moment, the career
> line at completion). Phase 10 ✅ shipped 2026-07-31 (the weekly ritual in the
> banner precedence, the Photos ritual card, Compare at 44px + keyboard, Progress
> off the fruit tokens). Phase 11 ✅ shipped 2026-07-31 (secondary surfaces sweep:
> History/Settings/Onboarding restyled, the fruit aliases deleted, the photo trio
> hardened, the contract empty states). Phase 12 ✅ shipped 2026-07-31 (voice
> pass: encouragement.ts onto the trail lexicon with precedence intact, the 40
> morning quotes + 10 evening prompts curated — attributed aphorisms and the one
> fitness line replaced, banned-construction greps all zero). Phase 13 ✅ shipped
> 2026-07-31 (doc-refresh: DESIGN.md synced to shipped reality with a dated
> decision-log entry, PHASES.md headed as historical with the v3 supersessions,
> v2 screenshots archived to `screenshots/v2/` and the after-portfolio
> regenerated). Phase 14 ✅ shipped 2026-07-31 (the audit checkpoint: measured
> contrast with a second round of token amendments, the alpha-modifier fix as
> color-mix veils, offline fonts + a deterministic precache, reduced-motion and
> tap-target/text-scale verification by instrument, bundle gate passed with
> ~94 kB headroom, hallmark audit clean, lab kept as the permanent gallery).
> **The redesign is complete.** What remains is the on-device checklist
> deferred in the Phase 14 notes — owner's phone required.

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

**GATE 3** — ✅ signed 2026-07-31. Production phases unlocked.

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

## Phase 5 — Token foundation + theme knock-ons + app icon — ✅ Shipped 2026-07-31

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

**Shipped notes (2026-07-31)** — all verifications pass: zero hex literals in
`src/**/*.tsx`; the ease literal has exactly one src hit
([src/lib/motionTokens.ts](src/lib/motionTokens.ts) — the CSS side is emitted
as `:root { --ease-apple }` from a tailwind.config.js base plugin, outside the
grep scope, and six production + seven lab files now import `EASE`); entry
126.86 kB gz (+0.07) and CSS 6.19 kB gz (+0.42) — first paint +0.49 kB against
the +3 kB budget; manifest carries `#F4F1E6` theme/background, split
`any`/`maskable` icon entries, and 192/512 PNG fallbacks (precache 19 entries
including the PNGs). Beyond the plan: the `stage-<n>` shell binding shipped
here (`useApplyStage` in [src/lib/theme.ts](src/lib/theme.ts) — without it the
stage-keyed accent is inert), the v2 citrus token names survive as deprecated
aliases onto the new palette so unmigrated components render correctly until
the Phase 6–11 sweep retires them, and four light-theme values were amended
≤4%/channel to clear the contract's measured 4.5:1 bar (`--text-subtle`,
`--stage-0/1/4` — dated entry in DESIGN.md's decision log; ratios recorded in
its accessibility table). PNGs rasterized from the SVG via headless Edge (no
new dependencies). **Deferred to on-device time:** Android cold-launch splash
color and maskable-preview crop check (needs the installed PWA on the owner's
phone; DevTools manifest section verified in lieu).

---

## Phase 6 — Shared primitives + one celebration system — ✅ Shipped 2026-07-31

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

**Shipped notes (2026-07-31)** — all verifications pass. One heavy primitive:
new [CelebrationOverlay](src/components/CelebrationOverlay.tsx) (stage-soft
radial wash + blur, ≤8 specks via a production `.speck`/`drift` block in
index.css, `spring-card` entrance, labeled tap-anywhere button, **no
auto-dismiss** — the v2 copies auto-closed at 1.7–2s); LevelUpOverlay and
StageOverlay are now 18/19-line configs (`wc -l`), StreakBreakOverlay is
deleted and the moment speaks through the new medium register:
[MomentPanel](src/components/MomentPanel.tsx) (`spring-panel`, icon chip +
title + facts + actions). The streak-break panel sits in the Dashboard flow
with the shelter offer, and "Pitch the shelter" now opens the two-step
confirm sheet (the v2 overlay spent the shield on one tap — the contract
requires the two-step); once-flag keys `mission.stageShown.*` /
`mission.streakBreak.*` untouched. StageOverlay takes the full `Stage` (day
range in the kicker, zen line as the hero — `STAGE_ZEN` moved to
[src/lib/stage.ts](src/lib/stage.ts)). All nine primitives ported from the
Gate-approved waypoint forks: MissionRing is the walk strip (105 segs, dotted
unrecorded, pin, stage ruler, caption row) with its two call sites
(Dashboard, MissionCompleted) updated to pass `days`/`startDate`;
SlideToConfirm keeps production logic (nudge, keyboard, 0.8 threshold) under
the stretch-to-walk skin with `--duration-slide` tokens; BottomSheet gained
the missing `useReducedMotion` wiring (fades, drag disabled); XpToast is the
stage pill + flag with a reduced variant; UndoToast is the bottom-center
legend chip; inputs are 52px panel rows at 17px. Shared
[SegmentedControl](src/components/SegmentedControl.tsx) (44px targets,
stage-hue active) replaced the Onboarding/Settings duplicates via aliased
imports. The lab gained [SharedGallery](src/lab/SharedGallery.tsx) — the
production primitives against every fixture, the permanent verification
harness. Verified live at 375px: all six fixtures × both themes, zero console
errors, `mission` key untouched by the lab; measured: track 56px, inputs
17px/52px, segments 44px, 8 specks, blur(5px), stage-keyed hues correct in
all twelve combinations. Build: no lab chunk; entry 127.85 kB gz (+0.99 vs
Phase 5), CSS 6.50 kB gz (+0.31). **Deferred:** DevTools reduced-motion
emulation couldn't be driven from this session's browser pane (no
compositing while hidden) — the JS hook is wired in every framer component
and specks are `display: none` under the media query; Phase 14 re-verifies
with instruments per its checklist.

---

## Phase 7 — Dashboard decomposition + the daily loop — ✅ Shipped 2026-07-31

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

**Shipped notes (2026-07-31)** — the container is 127 lines
([Dashboard.tsx](src/pages/Dashboard.tsx)), pure composition; derivations live
in `src/pages/dashboard/useDashboardData.ts`, the triggers in
`useCelebrations.ts` (with the precedence queue: at most one heavy overlay,
stage crossing outranks level-up, the pending one fires after dismissal), and
the sections in `Greeting` / `MomentStack` / `BannerStack` / `TodayCard` /
`StatsStrip` / `ShelterSheet`. **The XP diff-watcher left the Dashboard
entirely**: [XpToastHost](src/components/XpToastHost.tsx) mounts in the app
shell and diffs the store, so a DayEditor backfill on the Journey, a photo
upload, or a shelter spend fires the same toast with zero per-callsite wiring
(Photos' local toast copy removed). The perfect-day note is exact — a changed
day whose `dayStatus()` crossed into `perfect` — replacing the old ≥100-delta
heuristic that missed live second-pillar perfects; a Settings backup import
suppresses the one restored-history jump. First-open per contract: date line,
streak flag, stage chip, contour lines, and a `quotes.ts` morning line while
today's status is still `missed` (always `dayStatus()`-derived). Perfect day
fires through the medium panel with the pinned facts, armed by
`mission.perfectDay.<date>.<dayNum>` — the day number in the key is what lets
a startDate time-travel re-arm it, and the date keeps a future mission's
early days from colliding with this one's flags. DayEditor confirms (pillars,
camp day, weight, body fat, waist) all carry the undo pill; undo labels moved
to the pinned copy (`Diet logged`, `marked rough ground`); rest became camp
throughout; the banner slot follows the contract order (welcome-back →
backup > install > reminder, suppressed under a streak break, welcome-back
now linking `/onboarding`), and halfway moved from the banner slot into the
medium register. Verified live at 375px on the dev server (seeded Day-62
state engineered so the second pillar crossed both a level boundary and a
perfect day): +30 toast on first pillar; on the second, the `+70 XP · Perfect
day — flag planted` toast fired immediately, the heavy level-up took the
screen with the perfect-day panel absent from the DOM, and the panel stood in
flow after dismissal; overlay survives 6s idle (no auto-dismiss); reload
re-fires nothing; startDate −1 re-armed the panel at Day 63; Journey → Day 40
backfill fired toast + `Diet logged` undo, and undo reverted the entry; zero
console errors. Build: entry 129.33 kB gz (+1.48 vs Phase 6), CSS 6.58 kB
(+0.08), no lab chunk; hex-literal grep 0, house-ease grep 1. **Deferred:**
real-gesture slide and reduced-motion emulation (hidden browser pane can't
composite; the keyboard/a11y path was exercised instead — Phase 14
re-verifies with instruments).

---

## Phase 8 — Re-entry after a lapse + streak break — ✅ Shipped 2026-07-31 — *the flagship*

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

**Shipped notes (2026-07-31)** — the lapse boundary is now production law, in
`useDashboardData`: `lastLogged` is the max date with `dayStatus() !== 'missed'`
(never key presence), `gapDays` counts from it, `isLapse` (≥ 2) and `isBreak`
(exactly 1, prior streak ≥ 2) are mutually exclusive by construction, and a
never-logged mission has no camp so neither fires. The re-entry surface is the
Gate-approved Waypoint panel ported verbatim into `MomentStack` through the
shared `MomentPanel` (tent chip, `Back on the trail.`, the derived-facts body,
`Today's log puts you back on the map.`, `Mark the missed stretch` →
`/journey` at a 44px target); it renders first in flow, suppresses the banner
slot, and stands down the moment today's status leaves `missed` — any honest
log counts, including rough ground. Armed once per return via
`mission.reentry.<lastLoggedISO>`; a new camp re-arms. Per precedence rule 2
the stage takeover is deferred on a re-entry open **without consuming its
once-flag**, so Phase 9's at-or-after trigger can still fire it later. The
streak-break effect now keys off `isBreak` (the v2 yesterday-only check that
never fired for a real lapse is gone); the panel, shelter two-step, and undo
are unchanged. Verified live at 375px (dev server, seeded fixtures): mid-lapse
Day 62 shows `Camp was Day 41 — … standing in Push with 43 days to the
summit.` with the literal derived facts; marking rough ground on today closed
the panel and fired the `Diet marked rough ground` undo; reload with the flag
set re-fires nothing (flag observed in localStorage); the 1-day-gap fixture
fired `A gap in yesterday's tracks. / 60 days walked without a break.` with
the shelter offer — spend was two-step, yesterday became a camp, shields 1→0,
and Undo reverted both; zero console errors; the banned-constructions grep
over the dashboard surfaces returns nothing. Build: entry 129.74 kB gz
(+0.41 vs Phase 7), CSS 6.61 kB (+0.03), no lab chunk. **Deferred:**
reduced-motion emulation (hidden browser pane; the panel's static variant is
the already-wired `MomentPanel` reduced path — Phase 14 re-verifies with
instruments).

---

## Phase 9 — The arc: Journey, stages, level-ups, day 105 — ✅ Shipped 2026-07-31

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

**Shipped notes (2026-07-31)** — the Gate-2-pinned map is production:
[JourneyPath.tsx](src/components/JourneyPath.tsx) rewritten as the serpentine
7-per-row route through the five stage-soft bands (camp flags with day ranges,
per-stretch trail texture, tent marks, hollow unrecorded rings, the dashed
camp ring during a lapse, the summit flag in Reveal gold, the drawn pin over a
pulse ring — pre-mission it waits at the trailhead as a non-control), with day
hit areas raised to r=25 (≈45px at 375). [Journey.tsx](src/pages/Journey.tsx)
carries the contoured header (`105 days`, stage chip, lapse-aware context),
the route-texture legend, the lapse-aware footer, and the map panel: fact rows
for logged days, the three equal-weight marks with XP labels + the honesty
line for unrecorded ones — store writes with the pinned undo labels
(`Day 51 marked a camp day`), the app-level toast, and `Open the full record`
→ DayEditor for partial/weight backfills. The lapse derivation moved to
[src/lib/lapse.ts](src/lib/lapse.ts) so Dashboard and Journey read one camp;
ContourLines extracted to a shared component; the dead `useIsNarrow` viewport
lib deleted. Stage crossings now fire on first open **at or after** the
crossing (earlier passed stages settle their `mission.stageShown.*` flags
silently — the takeover belongs to the country you're standing in); the
re-entry deferral still leaves flags unconsumed. Day 105: summit-eve panel +
`Sleep well. Tomorrow you crest.` footer on day 104, the summit flag at the
pin's side on the walk strip, and completing the final day's log fires the new
[SummitOverlay](src/components/SummitOverlay.tsx) (heavy, `mission.summit.<date>`
once-flag, summit > stage > level-up in the queue).
[MissionCompleted](src/components/MissionCompleted.tsx) restyled: `The summit.`
header on contours, and the career line per the pinned derivation (`Level 16 ·
Grounded · 18,500 XP across 2 missions — carried into the next.` in the
two-mission fixture; store untouched). Verified live at 375px on the dev
server: mid-lapse Day 62 map (21 dotted stretches, camp ring on Day 41, 5
bands, 62 focusable days), rough-ground + camp marks with toast/undo/revert,
re-entry → deferred Push takeover next open with stage-1 settling silently,
exact-day Build crossing, the 104 → 105 → 106 sequence (eve panel; summit
fires once on the completing log with the perfect-day panel held until
dismissal; reload re-fires nothing; completion layout with the career line),
pre-mission dusk trailhead; zero console errors. Build: entry 131.51 kB gz
(+1.77 vs Phase 8), CSS 6.68 (+0.07), no lab chunk; hex-grep 0, house-ease
grep 1, shame-grep 0. **Deferred:** screenshots and reduced-motion emulation
(hidden browser pane can't composite — Phase 14 re-verifies with instruments).

---

## Phase 10 — The weekly ritual: photo + waist + compare — ✅ Shipped 2026-07-31

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

**Shipped** — the ritual prompt now leads the banner slot
([BannerStack](src/pages/dashboard/BannerStack.tsx)): on the last day of each
mission week (startDate-anchored, `dayNum % 7 === 0`) while the week's photo or
waist is still open, a MomentPanel (camera chip, `Week {n}'s photo and waist
reading.`, state-aware facts line) with `Open Photos` + `Skip this week`;
dismissal writes the `mission.ritual.<date>` once-flag, and the existing
`suppressed` gate keeps it below re-entry and streak break per the precedence
table. [Photos](src/pages/Photos.tsx) leads with the ritual card — camera chip,
`Week {n} of {m} — one photo, one waist reading.`, the photo CTA / logged-state
row, and the waist input moved up from the page foot; the grid now sits under
`The record`. [Compare](src/pages/Compare.tsx): 44×44 handle and back button,
`role="slider"` with arrow-key nudging, fixed white-on-black type (the theme
tokens went invisible in light mode on the always-black lightbox), captions
carry the year so cross-mission compares read apart.
[Progress](src/pages/Progress.tsx) restyled: contour header with the delta as
the headline (`vs. the start of the walk`), and every recharts series onto
tokens per contract — weight `--stage`, 7-day MA `--stage` dashed, projection
`--text-muted` dashed, waist `--rest`, body fat `--success`, goal ghost
`--border-strong` dashed; the page's `--tangerine`/`--lemon`/`--lime` uses were
the last fruit tokens outside Phase-11 surfaces. Verified live at 375px:
contract-day prompt (day 7) with dismiss + no reload re-fire, partial-state
facts line, lapse-on-contract-day shows re-entry and no ritual, non-contract
day silent, waist logging fires toast + undo, compare handle/back measured
44px with keyboard + drag both moving the divider, dark + light chart strokes
resolve to stage/rest hues, empty state (`No readings yet`); zero console
errors. Series contrast computed: all ≥4.5:1 vs `--bg` in both themes (3:1
required). Build: entry 131.78 kB gz (+0.27 vs Phase 9), CSS 6.72 (+0.04);
hex-grep 0, house-ease grep 1, shame-grep 0. **Deferred:** screenshots and
reduced-motion emulation (hidden browser pane — Phase 14 re-verifies with
instruments).

---

## Phase 11 — Secondary surfaces sweep — ✅ Shipped 2026-07-31

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

**Shipped** — the fruit-token aliases are gone: the deprecated citrus vars
deleted from [index.css](src/index.css) and [tailwind.config.js](tailwind.config.js)
after the last uses (History/Settings/PhotoActionSheet delete + danger flows)
moved onto `--failed`/`--failed-bg` with `--surface` text; every
`bg-accent text-white`/`text-bg` primary is now `text-surface` (white text
failed contrast on the lifted dark-theme hues).
[History](src/pages/History.tsx): contour-line header, shadow-panel cards,
44×44 back + delete targets. [Settings](src/pages/Settings.tsx): failed-token
danger zone and storage warnings. [Onboarding](src/pages/Onboarding.tsx):
contours behind the screen-1 headline, the shelter introduced up front in a
panel card (per contract — never a surprise at the one-day gap), 44px
back/skip targets; copy still Phase-12 scope. Housekeeping banners
([Install](src/components/InstallBanner.tsx) /
[Reminder](src/components/ReminderBanner.tsx)) onto the panel idiom with 44×44
dismiss; [ErrorBoundary](src/components/ErrorBoundary.tsx) on tokens;
RouteSkeleton needed nothing. The photo trio:
[PhotoThumb](src/components/PhotoThumb.tsx) gained the contract's decode-failure
state (muted `ImageOff` glyph + `Couldn't load this photo.`, delete still
reachable), [PhotoViewer](src/components/PhotoViewer.tsx) close at 44×44,
[PhotoActionSheet](src/components/PhotoActionSheet.tsx) rows ≥44px. Empty
states completed per contract: Photos `Week 1's photo starts the record.`,
Progress `Two readings draw the first line.` for < 2 readings (both live-verified).
Verified live at 375px, daylight + dusk, via DOM/computed-style instruments
(hidden browser pane again — no compositing, so screenshots defer to Phase 14):
onboarding flow end-to-end, Settings danger/primaries both themes, History with
a seeded archive (row, summary sheet, delete confirm on failed tokens, and the
broken-photo state exercised by the ghost key), Photos ritual + record line,
photo action sheet in dusk; zero console errors; zero sub-40px targets on the
swept pages. Greps: hex 0, fruit 0 (all of src, lab included), shame 0,
house-ease 1. Build: entry 132.23 kB gz (+0.45 vs Phase 10), CSS 6.64 (−0.08 —
the alias deletion). **Noted for Phase 14:** Tailwind `/40`-style alpha
modifiers are silent no-ops on the var()-based palette (pre-existing,
system-wide — borders render full-strength); decide whether to add
`<alpha-value>` plumbing or drop the modifiers.

---

## Phase 12 — Voice pass — ✅ Shipped 2026-07-31

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

> **Shipped 2026-07-31.** The whole-app sweep found the Phases 7–11 surfaces
> already in-voice (moments written in-phase); the off-contract remnants were
> exactly the two in-scope libs plus one Progress footnote.
> [encouragement.ts](src/lib/encouragement.ts): all nine strings onto the trail
> lexicon, precedence untouched — post-mission `The summit. Day 105.`, pre-mission
> `The route is plotted.`, Day 1 `Trailhead. The first mark is today's log.`,
> final day `The summit is today.`, perfect day `Today is walked.`, streak
> `Steady. {n} days walked.`, fallback = the pinned standing footer `One stretch
> at a time is the whole way there.` (the pinned lines — halfway, yesterday-closed,
> today-open — kept verbatim). [quotes.ts](src/lib/quotes.ts): 28 of the 40
> morning lines kept, 12 replaced — the attributed aphorisms (`Discipline is
> freedom`, `Choose the harder right`, `Stay in the boat`), the fitness content
> (`Eat well. Move well. Rest well.`, `Move first. Think second.`, `Strength is a
> habit`), and `Today is open.` (collided with the pinned status line) — with
> trail-placed lines (`Every morning is a trailhead.`, `Slow ground is still
> ground.`, `The map only asks for the truth.`); two evening prompts reworked
> (`Mark today as it was.`, `Today still takes a mark.`). Progress:
> `Pace unclear — log more weights.` → `more readings settle the line.`
> Verification: banned-construction greps (hype, shame, exclamation-in-string,
> emoji) zero across src; six encouragement branches + a curated morning quote
> read live via seeded localStorage on the dev preview (Day 62 streak, perfect
> day, fallback, pre-mission, Day 1, Day 105), zero console errors. Build: entry
> 132.25 kB gz (+0.02), CSS 6.64 (unchanged).

---

## Phase 13 — Doc-refresh checkpoint — ✅ Shipped 2026-07-31

**Goal** — the docs describe the app that shipped, including drift that predates this
work.

**Shipped notes (2026-07-31)** — the audit diffed the contract against the shipped
code surface by surface; every delta found was already live and verified in its
phase, so the docs moved, not the code. [DESIGN.md](DESIGN.md): the data model
rewritten to [src/types.ts](src/types.ts)/store reality (schema **v10** — `bodyFat`
+ value-source provenance, `pillarLabels`, `lastExportedAt`, `analyticsEnabled`,
`notifications`, `renphoSync`; XP derived, never stored; in-app `ArchivedMission`
history distinct from the base64 export; storage is one persisted `mission` blob,
not the five per-slice keys the doc claimed); the once-flag family completed
(`summit.<date>`, `perfectDay.<date>.<dayNum>`, `ritual.<date>`, `welcomeBack`);
banner-slot order pinned as shipped (ritual > welcome-back > backup > install >
reminder) and the heavy queue as summit > stage > level-up; the moment-copy table
corrected to production strings (the lab-only re-entry footer line dropped, Day 1
pinned to the shipped pair, career line + ritual facts + no-shelter + noisy-projection
rows added) plus the nine-string standing-line precedence written out; Onboarding
documented as built (button-stepped, `Set your mission.`, all-optional baseline,
the shelter card); Progress/Photos/Settings page specs expanded to shipped
(MA/body-fat/goal-ghost series tokens, ritual card, the eight Settings sections);
`--radius-lg` documented; the Tailwind `/alpha` no-op recorded for Phase 14; all of
it logged as a dated decision-log entry. [PHASES.md](PHASES.md): headed as
historical with the v3 supersessions listed (citrus tokens, StreakBreakOverlay,
streak copy, ring→walk strip, Journey rewrite, shelter language). This file's
Phase 13 heading restored (Phase 12's shipped note had clobbered it).
`screenshots/`: the v2 set moved to `screenshots/v2/` and the after-portfolio
regenerated — 8 shots at 402×874 @3× (matching the v2 set) via headless Edge +
playwright-core in a scratch profile, against a seeded day-47 Push mission
(13-day streak, one pillar walked, 6 ritual photos as generated silhouettes,
body-fat series, an archived mission with thumbnails for History, fresh profile
for the onboarding shot). Verification: contract vs code spot-checks covered the
re-entry panel, banner stack, onboarding, Progress series, and Settings sections;
the captures themselves are the fresh-session read of every screen.

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

## Phase 14 — Phase-wide audit checkpoint — ✅ Shipped 2026-07-31

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

**Shipped notes (2026-07-31)** — instruments: a Node relative-luminance script
over the token source for contrast, and a playwright-core + headless-Edge
harness (scratch profile, seeded day-47 / mid-lapse / fresh fixtures) for
everything live. What the instruments caught, all fixed forward inline:

- **Contrast (the wider net):** measuring every pairing the UI actually uses —
  not just hue-on-`--bg` — failed the light theme wherever a hue is text on its
  own soft tint (BottomNav active, stage chips, Toggle/DayEditor actives, the
  install CTA: 4.09–4.32), plus `--text-subtle` on `--surface-2` in both themes
  and the `--stage-2`-on-`--bg` 4.4966 rounding edge. Amended hue+soft in
  lock-step ≤ 5.5%/channel (stage-3 needed nothing), statuses mirroring their
  stage hues; every used pairing now ≥ 4.5:1 in both themes, full tables + the
  pairing-boundary notes in DESIGN.md's accessibility section, dated
  decision-log entry alongside.
- **The Tailwind `/alpha` no-op (Phase 11's flag) was worse than recorded:**
  the `/NN` classes were never emitted at all — rest-state sites leaked the
  preflight default `#e5e7eb` (an off-token gray, glaring in dusk) and hover
  tints simply didn't exist. Resolved as named `color-mix` **veil colors**
  (`border-accent-40`…) at the authored percentages, 18 call sites swapped,
  `borderColor.DEFAULT` pinned to `var(--border)`, `/NN` on tokens banned —
  decision-log entry with the full story.
- **Offline fonts + precache:** the latin Inter woff2 (48 kB — every string
  the app itself draws) joined the Workbox glob; the other six subsets stay
  runtime-fetched (user-typed non-Latin notes fall back to system fonts
  offline — recorded why-not per the checklist). Also found the plugin's
  `includeManifestIcons` default silently duplicating all four icon entries
  (benign while revisions match, install-breaking if they drift, and the
  source of the historical 19/20-entry wobble) — disabled; the precache is a
  deterministic 16 entries, icons and PNGs verified in the manifest.
- **Reduced motion, by instrument at last:** under emulation the stage
  takeover renders static — specks 8 → 0 (`display: none` confirmed via
  computed style), overlay present with no auto-dismiss, CSS kill-switch
  active. The deferred item from Phases 6–10 is closed.
- **Tap targets / inputs:** fixed the Dashboard `Camp day` link (76×17 →
  44px), Photos' `Compare with current` pill (29px → 44px), and the four
  Settings + one Onboarding compact inputs (`h-10`/13px → `h-11`/17px,
  WeeksInput shared). The weight/waist/body-fat 25px `<input>` readings are
  false positives — each sits inside its 52px `<label>` row, which is the
  target.
- **Text scale:** 130% clean everywhere. 175% had real breaks — the input
  rows blew out to 510px (flexbox `min-width:auto`; fixed with `min-w-0` on
  the three shared inputs), the BottomNav overflowed 7px (li `min-w-0` +
  label truncate), and the LevelBadge header row clipped 2px (flex-wrap).
  All three fixed; 175% now renders without horizontal overflow on Dashboard,
  Journey, and the re-entry surface. On-device confirmation at Android system
  scale stays deferred below.
- **Bundle vs the §5 baseline (Vite gzip report):** entry 132.28 (+5.50 over
  the whole redesign, +0.03 this phase), CSS 6.77 (+1.00 / +0.13), Progress
  106.66 (+0.15), Settings 7.59 (−0.13), Photos 4.28 (+0.29), History 2.62
  (+0.05), Compare 1.63 (+0.17), icon chunk 0.49 (0). **All JS 255.53 kB gz
  against the < 350 kB hard gate** — ~94 kB headroom. No lab chunk:
  dead-code elimination re-verified.
- **Every route walked at 375px, both themes, live** — dashboard, journey,
  progress, photos, history, settings, compare, onboarding, plus the
  mid-lapse re-entry state: zero console errors anywhere; the audit
  screenshot set covers all of it in both themes.
- **Hallmark anti-generic audit:** 0 critical · 0 major · 3 minor, all
  recorded not churned (onboarding's circle-chip feature rows are the
  stock-est pattern in the set; Progress's square checkboxes sit slightly off
  the pill-toggle idiom; History's dashed empty-state box is common, though
  it rhymes with the unwalked-route texture). No design-system drift on any
  screen; the walk strip and serpentine map carry a genuinely distinctive
  structural fingerprint.
- **Lab disposition: kept in full** — `src/lab/` stays as the permanent dev
  gallery and verification harness, including the Ember/Ledger loser folders
  (the Gate-1 record and the directions README's contrast matrix reference
  them; zero production cost, re-proven this session). Note their token
  values predate the Phase 5/14 amendments — the lab renders the Gate-era
  palette, production renders the contract.

**Deferred to on-device time (owner's phone, Settings → Export first):**
Android system text scale at 130%/175% (emulated-clean here, real-device
confirmation outstanding); installed-PWA offline cold start (airplane mode,
force-stop — the precache now carries the fonts, so this should just pass);
the stale-shell → redesign update path (the whole-app CSS/JS swap stress
test); and Phase 5's Android splash-color + maskable-crop check.

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
