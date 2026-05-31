import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const DISMISS_KEY = 'mission.installDismissed';
export const SESSION_KEY = 'mission.sessionCount';

function bumpSessions(): number {
  const current = parseInt(localStorage.getItem(SESSION_KEY) ?? '0', 10) || 0;
  const next = current + 1;
  localStorage.setItem(SESSION_KEY, String(next));
  return next;
}

export type InstallPrompt = {
  canInstall: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
};

// Owns the install eligibility + beforeinstallprompt lifecycle. Call once (the
// Dashboard does) so session counting isn't double-incremented; the banner
// itself is presentational so the Dashboard can priority-gate it.
export function useInstallPrompt(): InstallPrompt {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const sessions = bumpSessions();
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    setEligible(sessions >= 2 && !dismissed);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setEligible(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const result = await evt.userChoice;
    if (result.outcome === 'accepted' || result.outcome === 'dismissed') {
      localStorage.setItem(DISMISS_KEY, '1');
      setEligible(false);
    }
  };

  return { canInstall: !!evt && eligible, install, dismiss };
}

type Props = {
  onInstall: () => void;
  onDismiss: () => void;
};

export default function InstallBanner({ onInstall, onDismiss }: Props) {
  return (
    <div className="mx-5 mb-3 mt-4 flex items-center gap-3 rounded-card border border-border bg-surface p-3">
      <div className="flex-1">
        <div className="text-sm text-text">Install Mission to Abs</div>
        <div className="text-xs text-text-muted">Add to home screen. Works offline.</div>
      </div>
      <button
        type="button"
        onClick={onInstall}
        className="rounded-pill bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
      >
        Install
      </button>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="text-text-muted">
        <X size={18} />
      </button>
    </div>
  );
}
