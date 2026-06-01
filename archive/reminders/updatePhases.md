# Update Phases

Each phase is independently shippable and ends with a single commit. Sequencing is intentional: smallest, safest wins first.

---

## Phase 1 — Weeks input fix

**Goal** — let the user delete all digits in the Duration field to retype a single-digit value (e.g. `8`).

**Changes**
- New `src/components/WeeksInput.tsx`. Mirrors the pattern in [src/components/WeightInput.tsx](src/components/WeightInput.tsx):
  - `value: number`, `onChange: (n: number) => void`.
  - Local string state via `useState`, synced from prop in a `useEffect`.
  - `onChange` updates local unconditionally — empty allowed.
  - 350ms debounced `useEffect` commits when `1 ≤ parseInt(local) ≤ 52`.
  - On blur with empty local, restore the last valid value.
  - `min={1}` / `max={52}` / `inputMode="numeric"` retained for native keyboards.
- `src/pages/Onboarding.tsx` line 297 — replace inline `<input type="number">` with `<WeeksInput value={p.durationWeeks} onChange={p.setDurationWeeks} />`.
- `src/pages/Settings.tsx` line 300 — same replacement against `settings.durationWeeks` / `setSettings`.

**Verification**
- Edit `15` → backspace to empty → input shows empty without snapping → type `8` → after ~350ms, value persists as `8`.
- Edit to `0`, blur → reverts to last valid value.
- Edit to `99`, blur → reverts (out of max).
- Edit to `12`, blur → persists.
- Verify in both Onboarding screen 2 and Settings → Schedule.

**Commit** — `Fix duration input: allow transient empty during edit`

---

## Phase 2 — Photo upload from library

**Goal** — let the user pick from the photo library instead of being forced to the camera.

**Changes**
- `src/pages/Photos.tsx` line 178 — delete `capture="environment"` from the file input.
- `src/pages/Onboarding.tsx` line 149 — delete `capture="environment"` from the baseline photo input.
- No other changes needed. Downstream resize / IndexedDB save / Zustand `addPhoto` flow is source-agnostic.

**Verification**
- iOS Safari: tap a photo slot → OS sheet shows *Photo Library / Take Photo / Choose File*.
- Android Chrome: same, with *Camera / Files* options.
- Pick from library → image resizes, saves to IndexedDB, thumbnail renders.
- Take with camera → unchanged behavior.

**Commit** — `Photos: allow choosing from library, not only camera`

---

## Phase 3 — Reminders foundation

**Goal** — wire in the building blocks for both the background-push path and the in-app fallback. No UI yet.

**Changes**
- New `src/lib/quotes.ts`:
  - `MORNING_QUOTES: string[]` — ~40 short lines in the existing terse voice of [src/lib/encouragement.ts](src/lib/encouragement.ts). No exclamation marks, no clichés.
  - `EVENING_PROMPTS: string[]` — ~10 lines that never assume the user hasn't logged ("How was today?", "Close today out.", "A small note before sleep.").
  - `getMorningQuote(iso: string): string` / `getEveningPrompt(iso: string): string` — deterministic selection via a simple hash of the date so the same day always shows the same line.
- New `src/lib/notifications.ts`:
  - `isTriggerSupported(): boolean` — feature-detects `'showTrigger' in Notification.prototype` plus `navigator.serviceWorker` readiness.
  - `getPermission()` / `requestPermission()` — thin wrappers around `Notification.permission` and `Notification.requestPermission()`.
  - `scheduleAll(prefs: { morning: boolean; evening: boolean })` — cancels any existing `tag: 'mission-reminder-*'` via `registration.getNotifications({ includeTriggered: false })`, then schedules the next 7 days of enabled reminders using `TimestampTrigger`. (Triggers don't auto-repeat — we batch a week ahead and reschedule on every app open.)
  - `cancelAll()` — cancels all pending `mission-reminder-*` notifications.
  - `maybeShowInAppReminder(): { kind: 'morning' | 'evening'; text: string } | null` — for fallback platforms; checks current time against morning/evening windows and `localStorage` flags (`mission.reminder.morningShown.<iso>`, `mission.reminder.eveningShown.<iso>`).
- `src/types.ts` — extend `Settings`:
  ```ts
  notifications: {
    morning: boolean;
    evening: boolean;
  };
  ```
- `src/store/mission.ts`:
  - Add `notifications: { morning: false, evening: false }` to `makeInitialSettings()`.
  - Bump store `version: 5` → `6`.
  - Add `if (version < 6)` block in `migrate()` that fills `notifications` with safe defaults for existing users.

**Verification**
- `npm run typecheck` passes.
- Open the app on existing v5 data → store hydrates to v6, `settings.notifications` is `{ morning: false, evening: false }`.
- Devtools console: `import('./src/lib/notifications').then(m => m.isTriggerSupported())` returns expected boolean per platform.

**Commit** — `Reminders foundation: prefs schema + quote source + scheduler skeleton`

---

## Phase 4 — Reminders UI + scheduling lifecycle

**Goal** — let the user actually turn reminders on, request permission, and schedule them.

**Changes**
- `src/pages/Settings.tsx` — new `<Section title="Reminders">` placed after `Schedule`, before `Appearance`. Two `<Row>`s:
  - "Morning quote — 7:00 AM" with a toggle bound to `settings.notifications.morning`.
  - "Evening reflection — 8:00 PM" with a toggle bound to `settings.notifications.evening`.
- Permission handling at toggle time:
  - If toggling **on** and `Notification.permission === 'default'` → call `requestPermission()`. If granted, persist; if denied, revert toggle and show a one-line hint.
  - If toggling **on** and permission was previously denied → show hint, leave toggle off.
  - If toggling **off** → call `cancelAll()` if no reminder remains enabled.
- A small subtext under the section: when `!isTriggerSupported()`, render *"On this device, reminders show when you open the app."*
- `src/App.tsx` — in `Shell`, add a `useEffect` that, on mount and whenever `settings.notifications` changes, calls `scheduleAll(prefs)` (no-op if permission isn't granted).

**Verification**
- Toggle morning on → permission prompt → grant → toggle stays on, `scheduleAll` runs, `registration.getNotifications()` shows scheduled `mission-reminder-morning-*` entries.
- Toggle morning off → entries cleared from `getNotifications()`.
- Deny permission → toggle reverts, hint appears, no schedule.
- On Firefox / iOS, the subtext appears under the section.
- `npm run typecheck` and `npm run build` pass.

**Commit** — `Reminders: settings UI + scheduling lifecycle`

---

## Phase 5 — In-app reminder banner

**Goal** — surface the morning quote / evening prompt to users on platforms without Notification Triggers.

**Changes**
- New `src/components/ReminderBanner.tsx`:
  - Calls `maybeShowInAppReminder()` on mount and on `visibilitychange`.
  - Renders nothing if `null` or if reminder kind's toggle is off in settings.
  - Otherwise, light dismissible card styled like [src/components/InstallBanner.tsx](src/components/InstallBanner.tsx). Title is the quote/prompt; dismiss button writes the `mission.reminder.{morning,evening}Shown.<iso>` flag so it doesn't reappear today.
  - Only renders on platforms where `!isTriggerSupported()` *or* where permission is not granted (so users with working background notifications don't see the in-app banner too).
- `src/pages/Dashboard.tsx` — mount `<ReminderBanner />` above the existing top content.

**Verification**
- On iOS Safari with morning reminder on, open the app at 07:05 → banner appears with the day's quote.
- Dismiss → banner disappears, doesn't return that day.
- Reload tomorrow → fresh banner with the new day's quote.
- Toggle both reminders off → banner never appears.
- On a Chromium/Android installed PWA with granted permission, banner does NOT appear (background notifications cover it).
- `npm run typecheck` and `npm run build` pass.

**Commit** — `Reminders: in-app banner fallback for unsupported devices`

---

## Cross-phase notes

- **Migration safety** — Phase 3's schema bump must default reminders to `false` so updating users don't get notifications they didn't opt into.
- **No backend, no surprises** — every reminder code path is no-op when permission is not granted; the in-app banner is no-op when Triggers are supported and permission is granted, avoiding double-notification.
- **Service worker** — `vite-plugin-pwa` is configured with `registerType: 'autoUpdate'` and no custom SW. Notification Triggers work through the auto-registered Workbox service worker; no manual SW editing required for v1.
