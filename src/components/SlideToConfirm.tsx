// The walkable stretch (DESIGN.md · Slide-to-confirm): the fill is ground
// gained in the stage hue, the thumb is the walker. Fires on pointerup only
// at progress ≥ 0.8; one 15ms haptic on confirm.

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, X } from 'lucide-react';

type Props = {
  label: string;
  hint?: string;
  doneLabel?: string;
  failedLabel?: string;
  xpReward?: number;
  icon?: React.ReactNode;
  confirmed: boolean;
  failed?: boolean;
  onConfirm: () => void;
  onClear?: () => void;
};

const THRESHOLD = 0.8;
const THUMB_PX = 48;
const TRACK_PAD = 4;

// A one-time, once-per-day "nudge": the first unlogged slider to mount gently
// peeks its thumb to the right so a first-time phone user sees it can be slid.
const NUDGE_KEY = 'mission:slideNudge';
let nudgedThisSession = false;

function vibrate() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(15);
  } catch {
    /* ignore */
  }
}

export default function SlideToConfirm({
  label,
  hint = 'Walk it',
  doneLabel = 'Ground gained',
  failedLabel = 'Tap to clear',
  xpReward,
  icon,
  confirmed,
  failed = false,
  onConfirm,
  onClear,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(confirmed ? 1 : 0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startProgressRef = useRef(0);
  const usableRef = useRef(0);
  const nudgeTimers = useRef<number[]>([]);

  useEffect(() => {
    setProgress(confirmed ? 1 : 0);
    if (confirmed) setDragging(false);
  }, [confirmed]);

  // One-time discoverability nudge for the first unlogged row of the day.
  useEffect(() => {
    if (confirmed || failed) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (nudgedThisSession) return;
    let last: string | null = null;
    try {
      last = localStorage.getItem(NUDGE_KEY);
    } catch {
      /* ignore */
    }
    const today = new Date().toDateString();
    if (last === today) return;
    nudgedThisSession = true;
    try {
      localStorage.setItem(NUDGE_KEY, today);
    } catch {
      /* ignore */
    }
    nudgeTimers.current.push(
      window.setTimeout(() => setProgress(0.14), 450),
      window.setTimeout(() => setProgress(0), 1050),
    );
    return () => {
      nudgeTimers.current.forEach(clearTimeout);
      nudgeTimers.current = [];
    };
    // Runs once on mount; intentionally no deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fire = () => {
    setProgress(1);
    setDragging(false);
    vibrate();
    onConfirm();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (confirmed || failed) return;
    nudgeTimers.current.forEach(clearTimeout);
    nudgeTimers.current = [];
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const t = trackRef.current;
    if (!t) return;
    usableRef.current = Math.max(1, t.getBoundingClientRect().width - THUMB_PX - TRACK_PAD * 2);
    startXRef.current = e.clientX;
    startProgressRef.current = progress;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || confirmed || failed) return;
    const delta = e.clientX - startXRef.current;
    setProgress(
      Math.max(0, Math.min(1, startProgressRef.current + delta / usableRef.current)),
    );
  };

  const onPointerUp = () => {
    if (!dragging || confirmed || failed) return;
    setDragging(false);
    if (progress >= THRESHOLD) {
      fire();
    } else {
      setProgress(0);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (failed) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (confirmed) onClear?.();
    else fire();
  };

  if (failed) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}, marked rough ground. ${failedLabel}`}
        onClick={onClear}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClear) {
            e.preventDefault();
            onClear();
          }
        }}
        className="relative flex h-14 cursor-pointer select-none items-center rounded-card border bg-failed-bg px-4"
        style={{ borderColor: 'color-mix(in srgb, var(--failed) 40%, transparent)' }}
      >
        <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-pill bg-surface text-failed">
          <X size={16} strokeWidth={2.4} />
        </span>
        <span className="text-base font-medium text-failed">{label}</span>
        <span className="ml-auto text-sm text-text-subtle">{failedLabel}</span>
      </div>
    );
  }

  const done = confirmed;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={`${label}, ${done ? 'done' : 'slide to confirm'}`}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={1}
      onKeyDown={onKeyDown}
      onClick={() => done && onClear?.()}
      className="relative h-14 select-none touch-none overflow-hidden rounded-card border bg-surface shadow-panel"
      style={{
        borderColor: done
          ? 'color-mix(in srgb, var(--stage) 50%, transparent)'
          : 'var(--border)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 bg-stage-soft"
        style={{
          width: `${progress * 100}%`,
          transition: dragging ? 'none' : 'width var(--duration-slide) var(--ease-apple)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center pl-16"
        style={{ paddingRight: done ? THUMB_PX + 12 : 18 }}
      >
        {icon && (
          <span className={done ? 'mr-3 text-stage' : 'mr-3 text-text-muted'}>
            {icon}
          </span>
        )}
        <span
          className={[
            'min-w-0 truncate text-base font-semibold',
            done ? 'text-stage' : 'text-text',
          ].join(' ')}
        >
          {label}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap pl-2 text-sm text-text-subtle">
          {done ? (
            doneLabel
          ) : (
            <>
              <span>{hint}</span>
              {xpReward !== undefined && (
                <span className="tabular text-xs">+{xpReward} XP</span>
              )}
            </>
          )}
        </span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={[
          'absolute bottom-1 top-1 flex items-center justify-center rounded-[10px] border',
          done
            ? 'cursor-default border-stage bg-stage text-surface'
            : 'cursor-grab border-border-strong bg-surface text-stage active:cursor-grabbing',
        ].join(' ')}
        style={{
          width: THUMB_PX,
          left: `calc(${TRACK_PAD}px + ${progress} * (100% - ${THUMB_PX + TRACK_PAD * 2}px))`,
          transition: dragging ? 'none' : 'left var(--duration-slide) var(--ease-apple)',
        }}
      >
        {done ? (
          <Check size={20} strokeWidth={2.6} />
        ) : (
          <ChevronRight size={20} strokeWidth={2.25} />
        )}
      </div>
    </div>
  );
}
