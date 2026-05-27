import { getEveningPrompt, getMorningQuote } from './quotes';
import { addDaysISO, todayISO } from './date';

export type ReminderPrefs = {
  morning: boolean;
  evening: boolean;
};

type ReminderKind = 'morning' | 'evening';

const TAG_PREFIX = 'mission-reminder-';
const SCHEDULE_DAYS = 7;
const MORNING_HOUR = 7;
const EVENING_HOUR = 20;

const MORNING_WINDOW = { start: 6 * 60 + 30, end: 10 * 60 }; // 06:30–10:00
const EVENING_WINDOW = { start: 19 * 60 + 30, end: 22 * 60 }; // 19:30–22:00

type ShowTriggerNotificationOptions = NotificationOptions & {
  showTrigger?: unknown;
  tag?: string;
};

type TimestampTriggerCtor = new (timestamp: number) => unknown;

function getTimestampTrigger(): TimestampTriggerCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as unknown as { TimestampTrigger?: TimestampTriggerCtor })
    .TimestampTrigger;
  return ctor ?? null;
}

export function isTriggerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  if (!('showTrigger' in (Notification.prototype as object))) return false;
  if (!getTimestampTrigger()) return false;
  return true;
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function reminderTime(iso: string, kind: ReminderKind): number {
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setHours(kind === 'morning' ? MORNING_HOUR : EVENING_HOUR, 0, 0, 0);
  return date.getTime();
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function clearPendingReminders(
  reg: ServiceWorkerRegistration,
): Promise<void> {
  type GetNotificationsExtended = (options?: {
    tag?: string;
    includeTriggered?: boolean;
  }) => Promise<Notification[]>;
  const getter = reg.getNotifications as unknown as GetNotificationsExtended;
  try {
    const pending = await getter.call(reg, { includeTriggered: false });
    for (const n of pending) {
      if (n.tag && n.tag.startsWith(TAG_PREFIX)) n.close();
    }
  } catch {
    try {
      const pending = await reg.getNotifications();
      for (const n of pending) {
        if (n.tag && n.tag.startsWith(TAG_PREFIX)) n.close();
      }
    } catch {
      // ignore
    }
  }
}

export async function cancelAll(): Promise<void> {
  const reg = await getRegistration();
  if (!reg) return;
  await clearPendingReminders(reg);
}

export async function scheduleAll(prefs: ReminderPrefs): Promise<void> {
  if (!isTriggerSupported()) return;
  if (getPermission() !== 'granted') return;
  if (!prefs.morning && !prefs.evening) {
    await cancelAll();
    return;
  }
  const reg = await getRegistration();
  if (!reg) return;
  await clearPendingReminders(reg);

  const TimestampTrigger = getTimestampTrigger();
  if (!TimestampTrigger) return;

  const now = Date.now();
  const start = todayISO();
  for (let i = 0; i < SCHEDULE_DAYS; i += 1) {
    const iso = addDaysISO(start, i);
    if (prefs.morning) {
      const ts = reminderTime(iso, 'morning');
      if (ts > now) {
        const options: ShowTriggerNotificationOptions = {
          body: getMorningQuote(iso),
          tag: `${TAG_PREFIX}morning-${iso}`,
          showTrigger: new TimestampTrigger(ts),
        };
        try {
          await reg.showNotification('Mission to Abs', options);
        } catch {
          // ignore
        }
      }
    }
    if (prefs.evening) {
      const ts = reminderTime(iso, 'evening');
      if (ts > now) {
        const options: ShowTriggerNotificationOptions = {
          body: getEveningPrompt(iso),
          tag: `${TAG_PREFIX}evening-${iso}`,
          showTrigger: new TimestampTrigger(ts),
        };
        try {
          await reg.showNotification('Mission to Abs', options);
        } catch {
          // ignore
        }
      }
    }
  }
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function shownKey(kind: ReminderKind, iso: string): string {
  return `mission.reminder.${kind}Shown.${iso}`;
}

export function markInAppShown(kind: ReminderKind, iso: string = todayISO()): void {
  try {
    localStorage.setItem(shownKey(kind, iso), '1');
  } catch {
    // ignore
  }
}

export function maybeShowInAppReminder():
  | { kind: ReminderKind; text: string }
  | null {
  if (typeof window === 'undefined') return null;
  const now = new Date();
  const m = minutesOfDay(now);
  const iso = todayISO();
  if (m >= MORNING_WINDOW.start && m < MORNING_WINDOW.end) {
    if (localStorage.getItem(shownKey('morning', iso)) === '1') return null;
    return { kind: 'morning', text: getMorningQuote(iso) };
  }
  if (m >= EVENING_WINDOW.start && m < EVENING_WINDOW.end) {
    if (localStorage.getItem(shownKey('evening', iso)) === '1') return null;
    return { kind: 'evening', text: getEveningPrompt(iso) };
  }
  return null;
}
