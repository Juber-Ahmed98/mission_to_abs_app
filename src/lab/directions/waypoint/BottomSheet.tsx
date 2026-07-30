// Waypoint fork of BottomSheet — a map panel sliding up from the frame edge.

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

const EASE = [0.32, 0.72, 0, 1] as const;

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
            style={{ background: 'rgba(20, 24, 18, 0.45)' }}
          />
          <motion.div
            key="sheet"
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ duration: reduced ? 0.1 : 0.28, ease: EASE }}
            className="absolute inset-x-0 bottom-0 z-50 max-h-[85%] overflow-y-auto border-t"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface)',
              borderTopLeftRadius: 'var(--radius-card)',
              borderTopRightRadius: 'var(--radius-card)',
              boxShadow: 'var(--wp-shadow-lift)',
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
