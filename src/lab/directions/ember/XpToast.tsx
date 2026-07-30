// Ember fork of XpToast — the XP count rises like a spark: warm pill,
// soft glow, gentle count-up on the number (quiet-tactile register).

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type Toast = { id: number; amount: number; note?: string };

type Props = {
  toast: Toast | null;
};

function CountUp({ to, enabled }: { to: number; enabled: boolean }) {
  const [n, setN] = useState(enabled ? 0 : to);
  useEffect(() => {
    if (!enabled) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 550;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // ease-out cubic
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, enabled]);
  return <>{n}</>;
}

export default function XpToast({ toast }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 0 }}
          animate={
            reduced
              ? { opacity: [0, 1, 1, 0] }
              : { opacity: [0, 1, 1, 0], y: [0, -26, -46, -70] }
          }
          exit={{ opacity: 0 }}
          transition={{ duration: 1.7, times: [0, 0.15, 0.7, 1], ease: [0.32, 0.72, 0, 1] }}
          className="pointer-events-none absolute right-5 top-0 z-10 select-none"
        >
          <span
            className="tabular rounded-pill px-3 py-1 text-sm font-semibold"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              boxShadow: '0 0 16px var(--em-glow)',
            }}
          >
            +<CountUp to={toast.amount} enabled={!reduced} /> XP
          </span>
          {toast.note && (
            <div
              className="mt-1 text-right text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {toast.note}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
