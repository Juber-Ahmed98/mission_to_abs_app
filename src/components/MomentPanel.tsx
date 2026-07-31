// The medium register (DESIGN.md · The three-register feedback system): an
// in-flow panel — icon chip + title + facts + optional actions. Persists until
// acted on or superseded; never blocks. Re-entry, streak break + shelter,
// perfect day, the halfway note, and the ritual prompt all speak through it.

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from '../lib/motion';
import { EASE, SEC, SPRING_PANEL } from '../lib/motionTokens';

export type MomentAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
};

type Props = {
  icon?: ReactNode;
  /** 'soft' = stage-soft chip, stage glyph. 'solid' = stage chip, surface glyph. */
  iconTone?: 'soft' | 'solid';
  title: string;
  /** Facts and body copy — numbers are dignity. */
  children?: ReactNode;
  actions?: MomentAction[];
  className?: string;
};

export default function MomentPanel({
  icon,
  iconTone = 'soft',
  title,
  children,
  actions,
  className = '',
}: Props) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 8 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      transition={reduced ? { duration: SEC.base, ease: EASE } : SPRING_PANEL}
      className={`rounded-card border border-border bg-surface px-5 py-4 shadow-panel ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={[
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill',
              iconTone === 'solid'
                ? 'bg-stage text-surface'
                : 'bg-stage-soft text-stage',
            ].join(' ')}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-text">{title}</h2>
          {children && (
            <div className="mt-1 text-sm leading-relaxed text-text-muted">
              {children}
            </div>
          )}
          {actions && actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={a.onClick}
                  className={[
                    'h-11 flex-1 rounded-card px-3 text-sm',
                    a.primary
                      ? 'bg-stage font-bold text-surface'
                      : 'border border-border font-medium text-text-muted',
                  ].join(' ')}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
