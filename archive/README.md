# Archived planning docs

Planning docs for work that has **already shipped**. Kept for history. The current
roadmap always lives in `../update.md` and `../updatePhases.md`.

Each subfolder holds the `update.md` (the plan) and `updatePhases.md` (phased
breakdown) for one shipped body of work, newest last:

- **`reminders/`** — Reminders (in-app + notification fallback), photo-library upload,
  duration input fix. Shipped through commit `Reminders: in-app banner fallback for
  unsupported devices`.
- **`polish-pillars-history/`** — the 2026-05-31 design-review batch: polish &
  accessibility pass, custom pillar labels, and in-app mission history (incl.
  cross-mission photo compare). Shipped through commit `Mission history: cross-mission
  photo compare`.
- **`renpho-sync/`** — Renpho body-data sync (weight + body fat): CSV import, serverless
  proxy speaking both Renpho clouds, manual-wins merge. Shipped through commit `Renpho
  sync: drop future-dated readings as a backstop against +1-day drift`. Phase 6 (Tier 3,
  automatic background sync) remains deliberately deferred, not dropped — revisit only
  after the sync flow has proven out in daily use.
