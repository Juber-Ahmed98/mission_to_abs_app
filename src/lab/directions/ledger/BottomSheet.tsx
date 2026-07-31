// Ledger fork of BottomSheet — the footnote. Paper rises under a double
// rule; sharp corners, no handle, no shadow. Absolute within the lab frame.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { EASE } from '../../../lib/motionTokens';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function BottomSheet({ open, onClose, children }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: EASE }}
            onClick={onClose}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(23, 19, 13, 0.45)' }}
          />
          <motion.div
            key="sheet"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: reduced ? 0.1 : 0.26, ease: EASE }}
            className="ld-rule-double absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-y-auto"
            style={{ background: 'var(--bg)' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
