import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useMission } from '../store/mission';
import {
  getPermission,
  isTriggerSupported,
  markInAppShown,
  maybeShowInAppReminder,
} from '../lib/notifications';

type Reminder = { kind: 'morning' | 'evening'; text: string };

export default function ReminderBanner() {
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

  if (!reminder) return null;

  const dismiss = () => {
    markInAppShown(reminder.kind);
    setReminder(null);
  };

  const label = reminder.kind === 'morning' ? 'Morning' : 'Evening';

  return (
    <div className="mx-5 mb-3 mt-4 flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      <div className="flex-1">
        <div className="text-xs text-text-muted">{label}</div>
        <div className="mt-0.5 text-sm text-text">{reminder.text}</div>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="text-text-muted">
        <X size={18} />
      </button>
    </div>
  );
}
