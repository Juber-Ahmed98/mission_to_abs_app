# Update — Reminders, Photo Upload, Duration Input

Three improvements planned for the Mission to Abs PWA. Each one is independently shippable; phased breakdown is in [updatePhases.md](updatePhases.md).

## 1. Reminders (push notifications)

Two opt-in daily reminders so the app can reach the user when it matters most.

- **Morning (07:00 local)** — a short motivating quote.
- **Evening (20:00 local)** — a gentle prompt to log today. Phrased so it never assumes the user *hasn't* logged ("How was today?", "Close today out.", "A small note before sleep.").
- The user picks **none, one, or both** in Settings.

**Approach** — no backend exists for this app, so the design is layered:

| Platform | Mechanism |
|---|---|
| Chromium / Android installed PWA | **Notification Triggers API** (`TimestampTrigger`) — true background reminder, fires even when the app is closed. Batched 7 days ahead and refreshed on app open. |
| iOS Safari / iOS PWA / Firefox | **In-app banner** on the Dashboard when the user opens the app inside the morning (06:30–10:00) or evening (19:30–22:00) window. Dismissible once per day. |

iOS does not support Notification Triggers and reliable background push there would require a server with VAPID + a cron — explicitly out of scope for v1. The Settings screen will say so plainly: *"On this device, reminders show when you open the app."*

**New files**
- `src/lib/quotes.ts` — ~40 curated morning quotes + ~10 evening prompts, date-deterministic rotation (same date → same quote).
- `src/lib/notifications.ts` — permission helpers, Trigger support detection, `scheduleAll()` / `cancelAll()`, `maybeShowInAppReminder()`.
- `src/components/ReminderBanner.tsx` — in-app fallback banner, styled to match the existing `InstallBanner`.

**Settings changes**
- New `Reminders` section in `src/pages/Settings.tsx` with two toggles.
- Permission flow: prompt browser only on first enable; revert toggle if denied.
- `Settings` type gains `notifications: { morning: boolean; evening: boolean }`.
- Store schema bump **v5 → v6** with safe defaults (`false` / `false`) so no existing user gets surprise notifications post-update.

## 2. Photo upload from library

The two photo-capture flows currently use `<input type="file" capture="environment">`, which forces the rear camera on mobile and hides the library picker.

**Fix** — remove the `capture` attribute. The OS-native chooser then offers *Take Photo / Photo Library / Choose File* on both iOS and Android. No new UI, no permission code, no chooser sheet (the OS already does it better).

**Files**
- `src/pages/Photos.tsx` — the file input on line 174.
- `src/pages/Onboarding.tsx` — the baseline photo input on line 145.

Existing flow downstream (resize, IndexedDB write via `src/storage/photos.ts`, Zustand `addPhoto`) is unchanged.

## 3. Duration (weeks) input

`<input type="number">` on the Duration field in Onboarding (screen 2) and Settings clamps on every keystroke:

```ts
const n = parseInt(e.target.value, 10);
if (Number.isFinite(n) && n > 0) p.setDurationWeeks(n);
```

When the user backspaces a value like `15` toward empty, `parseInt('')` is `NaN`, the condition fails, and the input snaps back. There's no intermediate empty state, so retyping a single-digit value (e.g. `8`) requires caret-editing between the existing digits.

**Fix** — extract a `WeeksInput` component that mirrors the existing `src/components/WeightInput.tsx` pattern:
- Value held as a **string** in local state via `useState`.
- `onChange` updates local state unconditionally (empty allowed).
- A 350ms debounced `useEffect` commits the value only when `1 ≤ n ≤ 52`.
- On blur with empty local state, restore the last valid value.

**Files**
- New `src/components/WeeksInput.tsx`.
- `src/pages/Onboarding.tsx` (line 297) — swap inline input for `<WeeksInput …>`.
- `src/pages/Settings.tsx` (line 300) — same swap.

---

## Why this order

The phases in [updatePhases.md](updatePhases.md) ship the **bug fix and quick wins first** (weeks input, photo upload) and the **larger feature last** (reminders, which touches schema, settings UI, the service worker, and a new component). Each phase ends in a single focused commit so anything can be reverted in isolation.
