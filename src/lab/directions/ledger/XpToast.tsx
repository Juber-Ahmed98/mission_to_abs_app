// Ledger fork of XpToast — a marginal note. No float, no glow: it settles
// into the margin in oxblood, then fades. Typographic quiet.

import { AnimatePresence, motion } from 'framer-motion';

export type Toast = { id: number; amount: number; note?: string };

type Props = {
  toast: Toast | null;
};

export default function XpToast({ toast }: Props) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.7, times: [0, 0.12, 0.75, 1] }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute right-0 top-0 z-10 select-none text-right"
        >
          <span className="ld-caps tabular" style={{ color: 'var(--accent)' }}>
            +{toast.amount} XP
          </span>
          {toast.note && (
            <div className="ld-serif mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {toast.note}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
