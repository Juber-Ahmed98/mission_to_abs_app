import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotion } from '../lib/motion';

type Props = {
  open: boolean;
  level: number;
  tier: string;
  onDismiss: () => void;
};

const EASE = [0.32, 0.72, 0, 1] as const;

export default function LevelUpOverlay({ open, level, tier, onDismiss }: Props) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Under reduced motion, don't auto-close mid-read — wait for a tap.
    if (!open || reducedMotion) return;
    const t = setTimeout(onDismiss, 1700);
    return () => clearTimeout(t);
  }, [open, onDismiss, reducedMotion]);

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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
          style={{
            background:
              'radial-gradient(circle at center, color-mix(in srgb, var(--tangerine) 14%, var(--bg)) 0%, var(--bg) 70%)',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="text-5xl font-bold tabular"
          >
            Level {level}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE, delay: 0.2 }}
            className="mt-3 text-xl text-text-muted"
          >
            {tier}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
