// The heavy register (DESIGN.md · Celebration overlay). One primitive, thin
// configs: level-up, stage crossing, summit. Stage-soft radial wash + blur,
// the speck drift, a spring card, tap-anywhere dismiss — never auto-dismissed.

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../lib/motion';
import { EASE, SEC, SPRING_CARD } from '../lib/motionTokens';

// ≤8 specks per the Motion spec; positions fixed so renders are deterministic.
const SPECKS = [
  { left: '38%', delay: 0 },
  { left: '46%', delay: 0.08 },
  { left: '54%', delay: 0.16 },
  { left: '62%', delay: 0.05 },
  { left: '42%', delay: 0.22 },
  { left: '58%', delay: 0.12 },
  { left: '50%', delay: 0.28 },
  { left: '66%', delay: 0.2 },
];

type Props = {
  open: boolean;
  onDismiss: () => void;
  /** Glyph inside the stage-hued chip. */
  icon: ReactNode;
  /** Uppercase kicker line (stage hue, 0.2em tracking). */
  kicker: string;
  /** The hero slot — a level number, a stage's zen line, the summit. */
  headline: ReactNode;
  headlineClassName?: string;
  /** Context line under the hero (tier name, day range). */
  context?: ReactNode;
  dismissLabel?: string;
};

export default function CelebrationOverlay({
  open,
  onDismiss,
  icon,
  kicker,
  headline,
  headlineClassName = 'tabular text-6xl font-bold leading-none text-text',
  context,
  dismissLabel = 'Tap anywhere to keep walking',
}: Props) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.button
          type="button"
          aria-label={`${kicker}. ${dismissLabel}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : SEC.base, ease: EASE }}
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center"
          style={{
            background:
              'radial-gradient(90% 65% at 50% 40%, var(--stage-soft) 0%, transparent 72%), color-mix(in srgb, var(--bg) 90%, transparent)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        >
          {!reduced &&
            SPECKS.map((s, i) => (
              <span
                key={i}
                aria-hidden
                className="speck"
                style={{ left: s.left, top: '46%', animationDelay: `${s.delay}s` }}
              />
            ))}
          <motion.span
            initial={reduced ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={reduced ? { duration: SEC.base, ease: EASE } : SPRING_CARD}
            className="block px-6 text-center"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-stage text-surface">
              {icon}
            </span>
            <span className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-stage">
              {kicker}
            </span>
            <span className={`mt-1 block ${headlineClassName}`}>{headline}</span>
            {context && (
              <span className="mt-2 block text-base text-text-muted">{context}</span>
            )}
            <span className="mt-6 block text-xs text-text-subtle">{dismissLabel}</span>
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
