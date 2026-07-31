// The light register (DESIGN.md · XP toast): a stage-hued pill with the flag,
// pops in and drifts off on the 1.6s arc. Every XP grant speaks through it.

import { AnimatePresence, motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useReducedMotion } from '../lib/motion';
import { EASE } from '../lib/motionTokens';

type Toast = { id: number; amount: number; note?: string };

type Props = {
  toast: Toast | null;
};

export default function XpToast({ toast }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 6 }}
          animate={
            reduced
              ? { opacity: [0, 1, 1, 0] }
              : {
                  opacity: [0, 1, 1, 0],
                  scale: [0.6, 1.06, 1, 1],
                  y: [6, 0, -10, -34],
                }
          }
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, times: [0, 0.18, 0.7, 1], ease: EASE }}
          className="pointer-events-none absolute right-4 top-0 z-10 select-none"
        >
          <span className="tabular flex items-center gap-1.5 rounded-pill bg-stage px-3 py-1.5 text-sm font-bold text-surface shadow-panel">
            <Flag size={13} strokeWidth={2.5} />
            +{toast.amount} XP
          </span>
          {toast.note && (
            <div className="mt-1 text-right text-xs font-semibold text-stage">
              {toast.note}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { Toast };
