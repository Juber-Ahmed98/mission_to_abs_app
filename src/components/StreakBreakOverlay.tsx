import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../lib/motion';

type Props = {
  open: boolean;
  brokenAt: number;
  shieldAvailable: boolean;
  onUseShield?: () => void;
  onDismiss: () => void;
};

const EASE = [0.32, 0.72, 0, 1] as const;
const AUTO_DISMISS_MS = 2000;

export default function StreakBreakOverlay({
  open,
  brokenAt,
  shieldAvailable,
  onUseShield,
  onDismiss,
}: Props) {
  const [showSubline, setShowSubline] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) {
      setShowSubline(false);
      return;
    }
    const reveal = setTimeout(() => setShowSubline(true), 200);
    // Shield prompt waits for a choice; under reduced motion, wait for a tap.
    if (shieldAvailable || reducedMotion) return () => clearTimeout(reveal);
    const auto = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(reveal);
      clearTimeout(auto);
    };
  }, [open, shieldAvailable, onDismiss, reducedMotion]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          onClick={shieldAvailable ? undefined : onDismiss}
          role="status"
          aria-live="polite"
          className={[
            'fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center',
            shieldAvailable ? '' : 'cursor-pointer',
          ].join(' ')}
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--coral) 10%, var(--bg)) 0%, var(--bg) 70%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="text-xl font-semibold tabular"
          >
            Streak ended at {brokenAt}.
          </motion.div>
          {showSubline && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="mt-3 text-sm text-text-muted"
            >
              Today is open.
            </motion.div>
          )}
          {shieldAvailable && showSubline && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: EASE, delay: 0.1 }}
              className="mt-8 flex flex-col items-center gap-3"
            >
              <div className="text-sm text-text-muted">
                Use shield to keep it?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUseShield?.();
                  }}
                  className="h-11 rounded-pill bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Use shield
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="h-11 rounded-pill border border-border bg-surface px-5 text-sm font-medium text-text-muted"
                >
                  Let it go
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
