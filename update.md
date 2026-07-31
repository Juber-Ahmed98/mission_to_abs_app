# Update — UI/UX redesign: make it worth opening

> Spec and argument for the next body of work. Phased breakdown in
> [updatePhases.md](updatePhases.md). Charter: [redesign-brief.md](redesign-brief.md),
> written 2026-07-30. The previous roadmap (Renpho body-data sync) is shipped and
> archived in [archive/renpho-sync/](archive/renpho-sync/); its Phase 6 (automatic
> background sync) stays deliberately deferred.

The fact that drives everything here: the owner stopped opening the app for a month
because it wasn't rewarding enough. The v2 system is restrained, legible, correct — and
inert. This update is a full UI/UX rethink, not a colour repaint. Every design decision
is judged against one acceptance lens: **day 62, nothing logged for weeks, low
motivation, coming back after a lapse.** The app must feel good to open on that day
first; the good days take care of themselves.

---

## 1. The problem: well-made and inert

The v2 "bright, calm, intentional" system put the citrus in the status dots, not in the
room. The 105-day Journey reads as a grid of dots on a card rather than a walk. The
moments that should carry emotional weight either barely register or don't exist:

| # | Moment | Current state | Gap | Verdict |
|---|---|---|---|---|
| 1 | First open of the day | No concept at all. Dashboard renders the same at 7am as at 11pm. Morning quotes exist ([src/lib/quotes.ts](src/lib/quotes.ts), 40 of them) but surface only through the reminder banner lottery. | Nothing greets you before you've done anything. | Design the greeting |
| 2 | Logging a pillar + XP | Slide works, one 15ms haptic, XP toast floats 1.6s. The "Perfect day" toast note requires an XP delta ≥ 100, but a single slide can only produce 30 or 70 — **completing a perfect day has no distinct celebration, ever**. Backfills via DayEditor are silent (no XP toast, no undo). | Unreachable celebration — a bug, not a style choice. | Fix + enrich |
| 3 | Level-up | 1.7s radial wash + two words, auto-dismisses. A flawless mission tops out at Level 12 (11,550 XP); tiers Grounded and Unshakeable are unreachable in one mission. | The biggest number in the app gets the smallest moment. | Rework |
| 4 | Stage crossing | Overlay fires only if the app is opened on the exact crossing day, once ever. The Dashboard never shows the current stage anywhere. | Miss day 22, never see Build begin. | Fix trigger + surface stage |
| 5 | Streak break + shield | Overlay inspects yesterday only; after a multi-day gap `priorStreak` is already 0, so **it never fires for an actual lapse** — only for a single missed day. | The moment breaks exactly when it matters most. | Fix detection |
| 6 | **Return after a lapse** | **Zero design.** The strongest acknowledgement in the app is the line "Yesterday is closed. Today is open." | The owner's actual usage pattern has no design at all. | **The flagship** |
| 7 | Weekly photo + waist | Nothing prompts it — the banner precedence list has no photo or waist entry, so a week slips silently. Compare (split-slider) is good and cross-mission-capable. | The ritual has no ritual. | Prompt + frame |
| 8 | Day 105 / mission complete | Day 105 is a normal day; MissionCompleted renders on day 106+. DESIGN.md claims XP carries into mission two; `startNewMission` zeroes it. | The finish line isn't a moment, and the spec lies. | Make the moment + resolve drift |

Three feedback registers exist today: the XP toast (1.6s float), the undo pill (5s,
actionable), and the full-screen overlay (blocking). There is **no medium-weight,
in-flow celebration register** — which is exactly what a perfect day, a returning-user
welcome, and a photo-day nudge want. And the three overlays (`LevelUpOverlay`,
`StageOverlay`, `StreakBreakOverlay`) are literal copies of one template — same ease,
same radial wash, same auto-dismiss — differing only in copy and hue.

## 2. Decided vs open

**Non-negotiable regardless of direction** (these survive any aesthetic verdict):

- **Witness, not coach** — zero fitness content, zero workouts, zero diet rules.
- **Honest logging** — marking failure stays exactly as easy as marking success.
- **Every action reversible** — every confirm has an undo, every destructive action a two-step.
- The accessibility bars (measured, not eyeballed — see §7).
- The token/component architecture (personality lives in tokens + shared components + hand-crafted moments).

**Open for re-decision at the design contract** (these were direction, not physics):

| v2 rule | Status |
|---|---|
| No exclamation marks, no emoji, banned-word list | Re-decide at contract |
| 10–12px radii, no shadows | Re-decide at contract |
| 200ms standard duration, "no confetti" | Re-decide at contract |
| Light-mode-primary | Re-decide at contract |
| Single-accent Linear discipline; citrus scoped to data semantics | Re-decide at contract |

**The "juiced zen" instinct** (recorded 2026-06-11: keep the citrus calm, add springs,
haptics, count-ups and glows, dark mode as showcase): decided once, never built, so it
is **unproven, not rejected**. It enters the exploration as a mood hint — tactile, warm,
physical — seeding at most one direction, with no free pass and no incumbency. The door
to leaving citrus-on-near-white entirely is explicitly open. The one hard wall: no
walking back into the v1 look that v2 already superseded.

## 3. How the direction gets chosen

The owner is unsure of the direction and won't be able to describe it in adjectives —
so nobody asks. Instead: **2–3 concrete, deliberately contrasting directions, rendered,
reacted to.** The mechanism:

**The lab.** A dev-only route (`/#/lab`) that dead-code-eliminates from the production
build — both the `lazy()` import expression and the `<Route>` sit behind
`import.meta.env.DEV`, because an unconditional top-level `lazy()` emits the chunk even
when the route is guarded. The lab drives the real primitives from pure-props fixtures
(no store writes, no localStorage): day-62 mid-lapse (the default, always shown first),
day 1, day 104 eve, streak break, level-up, perfect day.

**Why forked copies, not token overrides.** Only colors, radii, and one easing curve
are `var()`-driven; Tailwind type and shape utilities are literal values. A direction
that changes typography or shape cannot be expressed as a token override — so each
direction lives in `src/lab/directions/<n>/` as forked, freely restyled copies of the
nine primitives plus a fully composed Dashboard. Throwaway by definition; production
untouched until the contract signs.

**Contrast enforcement.** The directions must be genuinely different, not three
temperatures of one idea. Candidate axes: theme identity (light-first / dark-first),
spatial metaphor (instrument panel vs the mission as a place), feedback register
(quiet-tactile vs expressive-celebratory), personality carrier (type-led vs
surface-led), color model (single accent / stage-keyed hues / warm neutral field),
density (everything-visible vs one-thing-at-a-time). Rules: every pair of directions
differs on **at least three axes**; at least one direction leaves citrus entirely; at
least one is dark-first; at least one keeps a light identity; no direction is v1 in
disguise. The actual direction content is exploration-phase work — it is deliberately
**not** pre-decided here.

**The three gates.** Gate 1: owner reacts to the direction Dashboards at 375px on the
phone, mid-lapse state first; the session interrogates reactions (what specifically
pulled or repelled), never asks for adjectives; kill/keep/merge recorded. Gate 2:
finalists render the Journey page — the page a direction lives or dies on — and the
winner is pinned. Gate 3: the winner becomes a written design contract in
[DESIGN.md](DESIGN.md). **No production file changes until Gate 3 signs.**

**Skill assignments.** hallmark drives the exploration and the anti-generic bar;
ui-ux-pro-max feeds palette/typography/style-system candidates; impeccable owns the
production polish, motion, and micro-interactions; human-copy owns every user-facing
string, throughout.

## 4. The moment inventory — design intent

Per-moment intent production must deliver (specs pinned at the contract, not here):

1. **First open** — a greeting that knows what day it is before you've done anything.
   "Logged today" must derive from `dayStatus()` — never key presence, because the
   Dashboard auto-creates today's entry on mount.
2. **Pillar log** — the slide stays; the feedback around it gets the contract's
   treatment. Backfills stop being silent (XP toast + undo, same as live logs).
   **Perfect day becomes a real, reachable moment** — triggered off day-completion
   state, not the XP-delta threshold that made it unreachable.
3. **Level-up** — a moment proportional to the number. Career XP (see §7) gives levels
   a life beyond one mission.
4. **Stage crossing** — fires on first open **at or after** the crossing, not only on
   the exact day. Current stage always visible on the Dashboard.
5. **Streak break + shield** — a 1-day gap gets the break treatment with the explicit
   shield offer; the multi-day case routes to re-entry instead (see the boundary rule,
   pinned at contract — e.g. ≥2 unlogged days = lapse).
6. **Re-entry** — the flagship. A designed surface built entirely from UI-derivable
   facts (last logged day, lapse length, days remaining, stage drift, missed photo
   weeks, where the level and weight stood). It never shames, never leads with the
   broken streak, and invites backfill — with marking missed days exactly as easy as
   marking successes. Armed once per return via localStorage, same pattern as the
   existing once-flags.
7. **Weekly ritual** — a photo/waist prompt enters the register precedence on the
   contract-specified day; the compare is framed as the payoff it is.
8. **Day 105** — the final day is a moment, not a normal day; MissionCompleted presents
   the career XP story so starting mission two feels like continuation, not reset.

Cross-cutting: one celebration primitive replaces the three overlay copies; a new
medium register fills the gap between toast and takeover; a co-occurrence precedence
table (pinned at contract) decides stacking when perfect-day + level-up + stage-crossing
land on the same slide.

## 5. Architecture of the restyle

- **Net-new token surface.** No shadow, spacing, or duration tokens exist today — only
  colors, four radii, and one easing curve. A direction wanting depth or a motion scale
  adds `--shadow-*` / `--duration-*` (and any glow/depth tokens) to **both**
  [src/index.css](src/index.css) and the [tailwind.config.js](tailwind.config.js)
  `extend` block, or it violates the no-literals rule the charter keeps.
- **Motion dedup.** The ease `[0.32, 0.72, 0, 1]` is declared in five component files,
  CSS, and the Tailwind config. One source (a UI-side motion-tokens module alongside
  [src/lib/motion.ts](src/lib/motion.ts)) replaces all seven.
- **The register system.** Light (toast float) / medium (new, in-flow) / heavy
  (full-screen) with one precedence table. Re-entry and the ritual prompt slot into the
  existing single-banner gate rather than stacking banners.
- **Dashboard decomposition.** [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) is
  636 lines and hosts six of the eight moments, the banner precedence chain, the XP
  diff-watcher, and every once-flag. It splits into section files + a `useCelebrations`
  hook before the moment phases land, so they touch section files, not a monolith.
- **Theme knock-ons** (named now, not discovered later):

  | Surface | What changes |
  |---|---|
  | [index.html](index.html) `:8-9` | `theme-color` metas (light + dark values) |
  | [index.html](index.html) `:11` | `apple-mobile-web-app-status-bar-style` (a dark-first identity wants `black-translucent`) |
  | [index.html](index.html) `:14-25` | boot-script theme default, if the primary theme flips (existing installs: `'system'` users flip, explicit choosers don't) |
  | [vite.config.ts](vite.config.ts) `:16-17` | manifest `theme_color` + `background_color` (Android splash — miss it and every cold launch flashes white) |
  | [public/app-icon.svg](public/app-icon.svg) | redraw on-palette (the current crimson/magenta rocket was never brought into the v2 system); maskable-safe geometry; split `any`/`maskable` entries; add 192/512 PNG fallbacks |

- **Measured bundle baseline (HEAD `66004ff`, fresh `npm run build` 2026-07-30;
  instrument: Vite's gzip report)** — the regression gate is a delta against these
  numbers, not a vibe:

  | Asset | Gzipped |
  |---|---|
  | Entry JS (`index-*.js`) | 126.78 kB |
  | CSS | 5.77 kB |
  | **First paint (entry + CSS)** | **132.55 kB** |
  | Progress chunk (recharts) | 106.51 kB |
  | Settings chunk | 7.72 kB |
  | Photos chunk | 3.99 kB |
  | History chunk | 2.57 kB |
  | Compare chunk | 1.46 kB |
  | icon chunk (`trash-2-*.js`) | 0.49 kB |
  | **All JS** | **249.52 kB** |

  Precache: 13 entries, 849 KiB raw. Budget stays < 350 kB gz — roughly 100 kB of
  headroom, and the Workbox glob precaches every chunk on install, so new assets are
  paid for at install time. The seven Inter `.woff2` files (~218 kB, already
  compressed) are currently **not** in the precache glob (fonts are runtime-fetched);
  the audit phase either adds them or records why not.

## 6. Scope tiers

| Tier | Phases | What it is |
|---|---|---|
| **E** — Exploration | 1–4 | Lab route, directions, Journey renders, design contract. Prod-invisible; fully reversible. Ends at Gate 3. |
| **F** — Foundation | 5–6 | Tokens + theme knock-ons + icon; primitives + the celebration system. |
| **M** — Moments | 7–10 | Dashboard decomposition + daily loop; re-entry (flagship); the arc; the weekly ritual. |
| **S** — Sweep | 11–12 | Secondary surfaces; the whole-app voice pass. |
| **C** — Checkpoints | 13–14 | Doc refresh; the measured audit. |

Stop after any phase and the app is in a good state: Tier E ships nothing visible;
every production phase leaves a coherent whole (a fully-tokened app, a fully-restyled
component set, one more finished moment).

## 7. Cross-cutting decisions

1. **UI-only fence.** No changes to [src/store/mission.ts](src/store/mission.ts),
   [src/types.ts](src/types.ts), the data/logic libs (`xp`, `streak`, `adherence`,
   `dayStatus`, `mergeBodyData`, `renphoClient`, `renphoCsv`),
   [src/storage/photos.ts](src/storage/photos.ts), or `api/`. In scope and explicitly
   *not* protected: `encouragement.ts`, `quotes.ts`, `stage.ts`, `motion.ts`,
   `theme.ts`, `viewport.ts` — the UI-side libs.
2. **Zero new npm dependencies by default.** `framer-motion`, `lucide-react`,
   `recharts` are in. Any dependency is a stop-and-raise with a case. The shadow
   version of this rule: **fonts**. A new typeface isn't an npm dep in spirit even when
   installed as one — it's a first-paint and precache budget line, and gets the same
   stop-and-raise.
3. **Career XP.** DESIGN.md claims XP carries into mission two; the store zeroes it on
   `startNewMission`. Resolution (UI-only): career XP =
   `history.reduce((s, m) => s + m.finalXp, 0) + totalXp(current)`, presented as a
   career level/total. The store stays untouched; the contract pins the presentation.
4. **Once-flag continuity.** Consolidating the three overlays must preserve the
   `mission.stageShown.*` and `mission.streakBreak.*` localStorage keys, or shipped
   users get re-fired celebrations after the update.
5. **The owner's device is the test device.** Every on-device fixture playbook
   (startDate time-travel, once-flag clearing) starts with Settings → Export. Fixture
   states in the lab never write the store.
6. **Haptics are Android-only.** `navigator.vibrate` is silent on iOS Safari. Fine for
   the primary surface (installed Android PWA), but a direction leaning on haptics as
   identity must know the limit.
7. **Recharts stays.** The Progress chunk is 108 KB gz, but a custom chart rewrite is a
   scope trap; it gets themed via tokens, not replaced.
8. **A11y bars are verification, not aspiration.** Contrast measured with instruments;
   `prefers-reduced-motion` honoured (the CSS kill-switch does not affect
   framer-motion — the JS hook must be wired everywhere motion lands); ≥44px targets;
   ≥16px inputs; rem scale verified at 130% and 175% system text scale; offline cold
   start on the installed Android PWA.

## 8. Design for where this is going

- **Re-entry is the usage pattern, not an edge case.** The return screen gets the same
  design attention as Day 1 — it is judged first at every gate.
- **Post-105 and mission two.** The design language must still work when the 105 days
  are behind you: the archive, the career XP story, starting again as continuation.
- **Portability.** The language carries to a second mission, to a friend running their
  own 105 days, and to renamed pillars. Onboarding doubles as the portability test.
- **First five minutes, bad day.** Nothing should need the owner's context or muscle
  memory to feel good.

## 9. Gate decisions

### 2026-07-30 — Gate 1: Waypoint wins outright

Owner verdict after the Phase 2 direction session: **go with Waypoint**. A clean
pick, not a merge — no hybrid notes were recorded, so Phase 3 carries no Gate-1
amendments to the finalist Dashboard.

- **Waypoint — keep (sole finalist).** Light-first (dusk secondary), the mission
  as a place, stage-keyed hues with the accent following the current stage,
  expressive-celebratory register, the walk on the Dashboard.
- **Ember — killed.** The juiced-zen seed dies with it; "tactile, warm, physical"
  had its shot as a rendered direction and lost to the map.
- **Ledger — killed.** The citrus-free door effectively closes with it (Waypoint's
  stage hues keep citrus in the family). Its serif stop-and-raise is moot.
- Folders for both losers stay in `src/lab/directions/` until the Phase 14
  disposition, per the plan.

Knock-ons to carry into Gate 3's re-decision table (noted now, decided at the
contract): Waypoint keeps a light identity, so **light-mode-primary likely
survives**; its expressive-celebratory register puts the **"no confetti" / 200ms
rule under pressure**; stage-keyed hues put the **single-accent Linear
discipline under pressure**. Waypoint rides the shipped Inter Variable — no font
stop-and-raise. Formal verdicts on all eight re-decidable rules still land in
the Phase 4 decision log.

Next: Phase 3 — the Waypoint Journey render (the page the direction lives or
dies on), then **Gate 2** pins the winner on the walk.

### 2026-07-31 — Gate 2: Waypoint pinned on the walk

Owner session on the Phase 3 Journey render (375px, mid-lapse fixture first,
light theme, then day 1, day 104 eve, and dusk). Verdict: **"pinned — go ahead
with Phase 4."** A clean pin, no amendments — the serpentine stage-band route,
the lapse as a dotted stretch, the camp-flag/summit/pin grammar, and the
map-panel backfill all carry into the contract exactly as rendered.

The page the direction could have died on didn't kill it. Phase 4 (the
DESIGN.md design contract) is unblocked; production remains frozen until
**Gate 3** signs the contract.

## 10. Why this order

Exploration goes first because it is reversible — three directions in a dev-only lab
cost nothing in production risk, and the charter's core insight is that reactions to
rendered work beat adjectives every time. The contract converts those reactions into
law *before* any production cost is sunk, so every later phase verifies against a
document, not a memory. Tokens land before components, components before moments,
because each layer is the next one's vocabulary. Re-entry lands before the celebration
arc because the owner's actual pattern is the return, not the streak — if only one
production phase ships, it should be that one. Voice runs last across everything so the
app sounds like one person, not twelve commits. And the audit is last because it
measures the whole: the bars are only meaningful against the finished thing.
