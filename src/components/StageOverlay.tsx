import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../lib/motion';
import { EASE } from '../lib/motionTokens';

type Props = {
  open: boolean;
  stageIndex: number;
  stageName: string;
  onDismiss: () => void;
};
const AUTO_DISMISS_MS = 2000;

const ZEN_LINES: Record<string, string> = {
  Foundation: 'Build the floor.',
  Build: 'Add the weight.',
  Push: 'Lean in.',
  Refine: "Sharpen what's working.",
  Reveal: 'Let it show.',
};

export default function StageOverlay({
  open,
  stageIndex,
  stageName,
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
    // Under reduced motion, don't auto-close mid-read — wait for a tap.
    if (reducedMotion) return () => clearTimeout(reveal);
    const auto = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(reveal);
      clearTimeout(auto);
    };
  }, [open, onDismiss, reducedMotion]);

  const zen = ZEN_LINES[stageName];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
          onClick={onDismiss}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center cursor-pointer"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--tangerine) 12%, var(--bg)) 0%, var(--bg) 70%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="text-5xl font-bold tabular"
          >
            Stage {stageIndex + 1}
          </motion.div>
          {showSubline && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="mt-3 text-xl text-text-muted"
              >
                {stageName}
              </motion.div>
              {zen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: EASE, delay: 0.1 }}
                  className="mt-2 text-sm text-text-muted"
                >
                  {zen}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
