import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useMission } from '../store/mission';
import {
  getPermission,
  isTriggerSupported,
  markInAppShown,
  maybeShowInAppReminder,
} from '../lib/notifications';

export type Reminder = { kind: 'morning' | 'evening'; text: string };

// Owns the in-app reminder fallback decision (used when system reminders aren't
// supported/granted). Returns the active reminder, if any, plus a dismiss action.
// Call once so the Dashboard can priority-gate it against the other banners.
export function useInAppReminder(): {
  reminder: Reminder | null;
  dismiss: () => void;
} {
  const notifications = useMission((s) => s.settings.notifications);
  const [reminder, setReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    const compute = () => {
      const supported = isTriggerSupported();
      const granted = getPermission() === 'granted';
      if (supported && granted) {
        setReminder(null);
        return;
      }
      const next = maybeShowInAppReminder();
      if (!next) {
        setReminder(null);
        return;
      }
      if (!notifications[next.kind]) {
        setReminder(null);
        return;
      }
      setReminder(next);
    };

    compute();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') compute();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [notifications]);

  const dismiss = () => {
    if (reminder) markInAppShown(reminder.kind);
    setReminder(null);
  };

  return { reminder, dismiss };
}

type Props = {
  reminder: Reminder;
  onDismiss: () => void;
};

export default function ReminderBanner({ reminder, onDismiss }: Props) {
  const label = reminder.kind === 'morning' ? 'Morning' : 'Evening';

  return (
    <div className="mx-5 mb-3 mt-4 flex items-center gap-2 rounded-card border border-border bg-surface py-2 pl-4 pr-1 shadow-panel">
      <div className="flex-1 py-1">
        <div className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
          {label}
        </div>
        <div className="mt-0.5 text-sm leading-relaxed text-text">{reminder.text}</div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-text-muted hover:text-text"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
