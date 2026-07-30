# Directions — Phase 2 (Gate 1 session sheet)

Three deliberately contrasting directions, each a full fork of the nine primitives
plus a composed Dashboard, driven only by the lab fixtures. Judged at 375px,
mid-lapse first. Built 2026-07-30 for Gate 1; throwaway until a winner is pinned.

## The contrast matrix

| Axis | 1 · Ember | 2 · Ledger | 3 · Waypoint |
|---|---|---|---|
| Theme identity | **dark-first** (light secondary) | **light-first** (lamplight secondary) | **light-first** (dusk secondary) |
| Spatial metaphor | a warm instrument / the hearth | the mission as a logbook | the mission as a place — a route walked |
| Personality carrier | surface-led (glow, depth, springs) | type-led (serif, hairlines, marks) | color/terrain-led (stage hues, the ribbon) |
| Color model | single warm ember accent; citrus kept calm | **no citrus** — ink + paper + oxblood | stage-keyed hues (5), accent follows the stage |
| Feedback register | quiet-tactile (glow pulses, count-ups) | quiet-typographic (marks, marginal notes) | **expressive-celebratory** (flags, bursts) |
| Density | focused, one thing at a time | document — the ledger is visible | everything-visible — the walk on the Dashboard |
| Shape language | soft, deep radii, layered shadow | sharp, flat, rule-drawn | map-panel, moderate radii, grain |
| Status language | colored glow dots | ink marks (✓ ✗ — · blank) | route texture (solid / dotted / camp flags) |

Pair checks: Ember↔Ledger differ on theme, carrier, metaphor, density, shape.
Ember↔Waypoint on theme, color model, register, metaphor, density.
Ledger↔Waypoint on carrier, color model, register, metaphor, status language.
Rules from update.md §3: ≥1 leaves citrus (Ledger) · ≥1 dark-first (Ember) ·
≥1 light identity (Ledger, Waypoint) · juiced zen seeds at most one (Ember —
rebuilt from "tactile, warm, physical", no free pass) · none is v1 in disguise.

## The re-entry answer (mid-lapse Dashboard, the first screen judged)

- **Ember** — "The light's kept on." The hearth doesn't go cold because you
  stepped out. Last log named plainly (Day 41), days remaining ahead of the gap,
  today's slides immediately underneath. Backfill is a quiet secondary door.
- **Ledger** — the twenty unlogged days collapse into one line: "Days 42–61 —
  unwritten." Blank space is the honest witness; the book stays open and today
  is simply the next line. Backfill = "amend earlier entries".
- **Waypoint** — "Camp was Day 41." The gap is a dotted stretch of trail on the
  ribbon, already behind you; the marker stands at Day 62 and the summit is
  ahead. Backfill = marking the missed stretch on the map.

## Font-budget note

No new webfonts. Ember and Waypoint ride the shipped Inter Variable; Ledger's
serif display is a system stack (Georgia / Iowan Old Style / Times) — zero
bytes. If Ledger wins, licensing a real text serif is a Gate 3 stop-and-raise.

## Where things live

Each direction: `src/lab/directions/<name>/` — nine forked primitives,
`Dashboard.tsx` (fixture-driven, locally interactive so the register can be
*felt*), `Gallery.tsx` (each primitive in isolation), `<name>.css` (scoped
tokens + bespoke classes under `.dir-<name>`), `index.ts` (the LabDirection).
Nothing here touches the store, localStorage, or production CSS.
