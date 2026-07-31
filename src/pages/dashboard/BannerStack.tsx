// The single-occupancy banner slot (DESIGN.md · precedence 7–8): the weekly
// ritual prompt first (medium register, contract day only), then housekeeping —
// welcome-back (migration), backup > install > reminder. Moment panels outrank
// the whole slot — an open re-entry or streak-break panel suppresses it, so
// the ritual never outranks either.

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Download, X } from 'lucide-react';
import { useMission } from '../../store/mission';
import { dayNumberFor, todayISO, totalDays } from '../../lib/date';
import MomentPanel from '../../components/MomentPanel';
import InstallBanner, { useInstallPrompt } from '../../components/InstallBanner';
import ReminderBanner, { useInAppReminder } from '../../components/ReminderBanner';

const BACKUP_NUDGE_THRESHOLD_DAYS = 30;
const BACKUP_NUDGE_MIN_ENTRIES = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function BannerStack({ suppressed }: { suppressed: boolean }) {
  const days = useMission((s) => s.days);
  const settings = useMission((s) => s.settings);
  const photos = useMission((s) => s.photos);
  const measurements = useMission((s) => s.measurements);
  const lastExportedAt = useMission((s) => s.settings.lastExportedAt);
  const navigate = useNavigate();
  const { canInstall, install, dismiss: dismissInstall } = useInstallPrompt();
  const { reminder, dismiss: dismissReminder } = useInAppReminder();

  // The weekly ritual (DESIGN.md · moment 7): the prompt enters the slot on
  // the last day of each mission week (startDate-anchored) while the week's
  // photo or waist reading is still open. Dismissible for that week — the
  // once-flag is keyed by the contract date, so a new week re-arms it.
  const today = todayISO();
  const rawDay = dayNumberFor(today, settings.startDate);
  const inMission = rawDay >= 1 && rawDay <= totalDays(settings.durationWeeks);
  const ritualWeek = inMission && rawDay % 7 === 0 ? rawDay / 7 : null;
  const hasPhoto =
    ritualWeek !== null && photos.some((p) => p.weekNumber === ritualWeek);
  const hasWaist =
    ritualWeek !== null &&
    measurements.some(
      (m) => m.weekNumber === ritualWeek && typeof m.waistCm === 'number',
    );
  const ritualKey = `mission.ritual.${today}`;
  const [ritualDismissed, setRitualDismissed] = useState(false);
  const ritualOpen =
    ritualWeek !== null &&
    !(hasPhoto && hasWaist) &&
    !ritualDismissed &&
    localStorage.getItem(ritualKey) !== '1';
  const dismissRitual = () => {
    localStorage.setItem(ritualKey, '1');
    setRitualDismissed(true);
  };

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

  if (ritualOpen && ritualWeek !== null) {
    return (
      <div className="mx-5 mb-3">
        <MomentPanel
          icon={<Camera size={18} strokeWidth={2} />}
          title={`Week ${ritualWeek}'s photo and waist reading.`}
          actions={[
            {
              label: 'Open Photos',
              onClick: () => navigate('/photos'),
              primary: true,
            },
            { label: 'Skip this week', onClick: dismissRitual },
          ]}
        >
          {hasPhoto
            ? 'The photo is in. The waist reading is still open.'
            : hasWaist
              ? 'The waist is logged. The photo is still open.'
              : 'The week closes today — both are still open.'}
        </MomentPanel>
      </div>
    );
  }

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
