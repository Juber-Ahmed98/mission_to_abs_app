import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '../lib/motionTokens';

type Toast = { id: number; amount: number; note?: string };

type Props = {
  toast: Toast | null;
};

export default function XpToast({ toast }: Props) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, -28, -48, -72] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1], ease: EASE }}
          className="pointer-events-none absolute right-5 top-0 z-10 select-none"
        >
          <span className="rounded-pill bg-accent-soft px-3 py-1 text-sm font-semibold text-accent tabular">
            +{toast.amount} XP
          </span>
          {toast.note && (
            <div className="mt-1 text-right text-xs text-text-muted">{toast.note}</div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { Toast };
