// The housekeeping banner slot (DESIGN.md · precedence 8): single-occupancy,
// welcome-back (migration) then backup > install > reminder. Moment panels
// outrank the whole slot — an open streak-break panel suppresses it.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, X } from 'lucide-react';
import { useMission } from '../../store/mission';
import InstallBanner, { useInstallPrompt } from '../../components/InstallBanner';
import ReminderBanner, { useInAppReminder } from '../../components/ReminderBanner';

const BACKUP_NUDGE_THRESHOLD_DAYS = 30;
const BACKUP_NUDGE_MIN_ENTRIES = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function BannerStack({ suppressed }: { suppressed: boolean }) {
  const days = useMission((s) => s.days);
  const lastExportedAt = useMission((s) => s.settings.lastExportedAt);
  const { canInstall, install, dismiss: dismissInstall } = useInstallPrompt();
  const { reminder, dismiss: dismissReminder } = useInAppReminder();

  const [welcomeBackDismissed, setWelcomeBackDismissed] = useState(false);
  const welcomeBack =
    !welcomeBackDismissed && localStorage.getItem('mission.welcomeBack') === '1';
  const dismissWelcomeBack = () => {
    localStorage.removeItem('mission.welcomeBack');
    localStorage.setItem('mission.welcomeBackDismissed', '1');
    setWelcomeBackDismissed(true);
  };

  const backupNudge = useMemo(() => {
    const entries = Object.keys(days).length;
    if (lastExportedAt === null) {
      if (entries < BACKUP_NUDGE_MIN_ENTRIES) return null;
      return { label: 'Never backed up.' };
    }
    const ms = Date.now() - new Date(lastExportedAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const daysSince = Math.floor(ms / MS_PER_DAY);
    if (daysSince < BACKUP_NUDGE_THRESHOLD_DAYS) return null;
    return { label: `Backed up ${daysSince} days ago.` };
  }, [days, lastExportedAt]);

  if (suppressed) return null;

  if (welcomeBack) {
    return (
      <section className="mx-5 mb-3 flex items-center gap-3 rounded-card border border-accent/30 bg-accent-soft p-3">
        <div className="flex-1">
          <div className="text-sm text-text">Welcome back.</div>
          <Link
            to="/onboarding"
            className="text-xs text-accent hover:text-accent-hover"
          >
            Set your goals?
          </Link>
        </div>
        <button
          type="button"
          onClick={dismissWelcomeBack}
          aria-label="Dismiss"
          className="text-text-muted"
        >
          <X size={18} />
        </button>
      </section>
    );
  }

  if (backupNudge) {
    return (
      <Link
        to="/settings"
        className="mx-5 mb-3 flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 text-sm hover:border-accent/40"
      >
        <span className="flex items-center gap-2 text-text-muted">
          <Download size={14} strokeWidth={1.75} />
          {backupNudge.label}
        </span>
        <span className="text-accent">Export</span>
      </Link>
    );
  }

  if (canInstall) {
    return <InstallBanner onInstall={install} onDismiss={dismissInstall} />;
  }

  if (reminder) {
    return <ReminderBanner reminder={reminder} onDismiss={dismissReminder} />;
  }

  return null;
}
