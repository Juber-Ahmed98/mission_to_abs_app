# Redesign brief — make Mission to Abs worth opening

> Charter for a planning session. Written 2026-07-30. Hand this to a fresh session
> in this repo as the first message.

Plan the next phase: a full UI/UX redesign that makes Mission to Abs genuinely
rewarding to open — not a colour repaint.

This is a planning session — plan mode. Follow the project's workflow: read [DESIGN.md](DESIGN.md)
(the v2 spec: tokens, components, microcopy, acceptance criteria) and [PHASES.md](PHASES.md)
(the shipped v2 build sequence), plus [update.md](update.md) / [updatePhases.md](updatePhases.md)
for the current roadmap and `archive/` for what already shipped. The design system in
DESIGN.md — CSS custom properties in [src/index.css](src/index.css) surfaced through
[tailwind.config.js](tailwind.config.js), and the shared components built against them —
is the plumbing this phase builds on. The ten design-overhaul phases are complete and
shipped.

## The brief

I want a full rethink of the UI and UX, not a colour repaint of the existing
"bright, calm, intentional — citrus on near-white" system. Today the app reads like a
very well-made clinical dashboard: restrained, legible, correct, and inert — the citrus
lives in the status dots, not in the room, and the 105-day Journey looks like a grid of
dots on a card rather than a walk. I want it to keep being honest and calm — no hype, no
bodybuilder aesthetics, witness-not-coach, every action reversible — but stop being
unrewarding. Here is the fact that matters most: I stopped opening it for a month
because it wasn't rewarding enough. Real personality, genuinely enjoyable to use, for me
on a bad day — day 62, nothing logged, low motivation, coming back after a lapse — not
for me on a good day. The fun has to live in the experience: interactions, motion,
sound-free feedback, copy voice, empty states, and the key moments — not only in the
palette.

The moments that carry the emotional weight:

1. First open of the day — what greets me before I've done anything
2. Logging a pillar (slide-to-confirm) and the XP that follows
3. Level-up
4. Crossing into a new stage (Foundation → Build → Push → Refine → Reveal)
5. Breaking a streak, and spending the shield
6. Returning after a lapse — days or weeks unlogged. **The app currently has no design
   for this at all. It is the single most important moment in this redesign.**
7. The weekly photo + waist ritual, and seeing the compare
8. Mission complete on Day 105

## What I don't know, and how to handle it

I'm unsure of the actual design direction, and I won't be able to describe it in
adjectives. Don't ask me to. Instead, build 2–3 concrete, deliberately contrasting design
directions and show them to me rendered — a throwaway dev-only route with the real
primitives (`MissionRing`, `SlideToConfirm`, `TodayRow`, `LevelBadge`, `XpToast`,
`BottomSheet` / `DayEditor`, `UndoToast`, `BottomNav`, `WeightInput`) plus one real screen
(the Dashboard, [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) — the screen I open
every day) done fully in each direction — so I react to something real. Render the Journey
page second where a direction lives or dies on it. My first instinct, recorded 2026-06-11,
was "juiced zen" — keep the citrus calm, add springs, haptics, count-ups and glows, make
dark mode the showcase theme; treat that as a mood hint (tactile, warm, physical), not a
locked theme. That direction was decided and never built — no commit since 2026-06-08
touches it — so it is unproven, not rejected: one direction may carry it, but it does not
get a free pass, and I have explicitly opened the door to leaving citrus-on-near-white
behind. The v1 look was already superseded once by the v2 spec in DESIGN.md; don't walk
back into it. Interrogate my reactions, then pin the winner as a written design contract
in DESIGN.md before any production restyling starts.

## Use these skills

- **hallmark** — direction exploration and the anti-generic audit; this is its redesign case
- **ui-ux-pro-max** — palette / typography / style-system options feeding the exploration
- **impeccable** — the production design work: polish, motion, micro-interactions
- **human-copy** — every user-facing string; the app should sound like a person, not a
  well-behaved health form

## Hard constraints (keep)

- The accessibility and usability bars stay and are verified, not eyeballed: contrast
  ratios measured, `prefers-reduced-motion` honoured, ≥44px tap targets, ≥16px inputs, rem
  type scale verified at 130% and 175% system text scale, and offline cold start on an
  installed Android PWA.
- The CSS-custom-property token layer in [src/index.css](src/index.css), surfaced through
  [tailwind.config.js](tailwind.config.js), stays; personality lives in the tokens, the
  shared components, and a small set of hand-crafted moments. No literal values outside
  the token layer.
- Zero new npm dependencies is the default — `framer-motion`, `lucide-react` and `recharts`
  are already in; any dependency is a stop-and-raise with a case, not a quiet install.
  Bundle stays under 350 KB gzipped.
- UI-only phase — no changes to [src/store/mission.ts](src/store/mission.ts),
  [src/types.ts](src/types.ts), the data/logic libs (`xp`, `streak`, `adherence`,
  `dayStatus`, `mergeBodyData`, `renphoClient`, `renphoCsv`),
  [src/storage/photos.ts](src/storage/photos.ts), or the `api/` proxy. Same discipline as
  the last phase.
- Phone-first at 375px, installed Android PWA as the primary surface; verified live in the
  browser preview at that width in both themes, not just in a desktop viewport.
- No hard external date. Ship it when it's right.

## Open for re-decision

- The v2 rules that were direction, not physics: no exclamation marks, no emoji, the
  banned-word list, near-zero radii, restrained shadows, 200ms standard duration, "no
  confetti", light-mode-primary, the single-accent Linear discipline. A rewarding direction
  may want louder celebration, richer depth, a dark-first identity, or a warmer voice; the
  reasoning that was physics (offline precache weight, no third-party fonts on first paint,
  reduced-motion, AA contrast) still applies, the austerity doesn't. What stays
  non-negotiable regardless: witness-not-coach (zero fitness content), honest logging —
  marking failure stays as easy as marking success — and every action reversible.
- Theme model: if the palette or the primary theme changes, the knock-on work is the
  `theme-color` meta tags in [index.html](index.html), the PWA manifest colours in
  [vite.config.ts](vite.config.ts), and `public/app-icon.svg` — name it in the plan, don't
  discover it later.
- The v2 "bright, calm, intentional" direction is explicitly superseded; its
  token/component architecture and its non-negotiables are not.

## Design for where this is going

- Re-entry after a lapse is not an edge case, it is my actual usage pattern — the return
  screen deserves the same design attention as Day 1, and it must not shame me.
- Day 105 and what comes after: mission complete, the archive, and starting mission two
  with XP carried forward. The design language has to still work when the 105 days are
  behind me.
- Portability: the language should carry to a second mission, to a friend running their
  own 105 days, and to renamed pillars — not be a one-context trick.
- Design for me-on-a-bad-day's first five minutes, not my muscle memory. Nothing should
  need my context to feel good.

## Deliverable of this session

A phased plan with checkpoints in the repo root ([update.md](update.md) +
[updatePhases.md](updatePhases.md), matching the existing format, with the current Renpho
roadmap moved to `archive/` if it's done) — direction exploration as its own checkpoint
gated on my sign-off, production restyling only after — plus the new design contract
written into [DESIGN.md](DESIGN.md): keep the non-negotiables, replace the direction
sections, extend the decision log with what was superseded and why. Same rigour as the
last phase: measurable acceptance criteria, live verification at 375px in both themes, a
refresh checkpoint for the docs that describe the current UI (DESIGN.md microcopy +
component sections, PHASES.md acceptance criteria, the `screenshots/` portfolio set, and
onboarding copy in [src/pages/Onboarding.tsx](src/pages/Onboarding.tsx)), and a phase-wide
audit checkpoint at the end.
