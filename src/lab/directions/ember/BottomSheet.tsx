// Ember fork of BottomSheet — warm raised panel, absolute within the lab
// frame (the production sheet is fixed to the viewport; the lab frames it).

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
            transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
            onClick={onClose}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(10, 7, 3, 0.5)' }}
          />
          <motion.div
            key="sheet"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: reduced ? 0.1 : 0.3, ease: EASE }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-y-auto border-t"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              borderTopLeftRadius: 'var(--radius-card)',
              borderTopRightRadius: 'var(--radius-card)',
              boxShadow: 'var(--em-shadow-lift)',
            }}
          >
            <div className="flex justify-center pb-1 pt-3">
              <div
                className="h-1 w-9 rounded-full"
                style={{ background: 'var(--border-strong)' }}
              />
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
