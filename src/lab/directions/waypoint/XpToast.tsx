// Waypoint fork of XpToast — expressive: the XP chip pops in with a spring
// and a flag, then drifts off. The celebratory register, kept honest.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { EASE } from '../../../lib/motionTokens';

export type Toast = { id: number; amount: number; note?: string };

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
          <span
            className="tabular flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-bold"
            style={{
              background: 'var(--stage)',
              color: 'var(--surface)',
              boxShadow: 'var(--wp-shadow)',
            }}
          >
            <Flag size={13} strokeWidth={2.5} />
            +{toast.amount} XP
          </span>
          {toast.note && (
            <div
              className="mt-1 text-right text-xs font-semibold"
              style={{ color: 'var(--stage)' }}
            >
              {toast.note}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
