// Waypoint fork of SlideToConfirm — a stretch of trail to walk: the fill is
// stage-hued ground gained, the thumb is the walker. Confirming pops.

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

  useEffect(() => {
    setProgress(confirmed ? 1 : 0);
    if (confirmed) setDragging(false);
  }, [confirmed]);

  const fire = () => {
    setProgress(1);
    setDragging(false);
    vibrate();
    onConfirm();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (confirmed || failed) return;
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
    if (progress >= THRESHOLD) fire();
    else setProgress(0);
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
        aria-label={`${label}, marked failed. ${failedLabel}`}
        onClick={onClear}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onClear) {
            e.preventDefault();
            onClear();
          }
        }}
        className="relative flex h-14 cursor-pointer select-none items-center rounded-card border px-4"
        style={{
          borderColor: 'color-mix(in srgb, var(--failed) 40%, transparent)',
          background: 'var(--failed-bg)',
        }}
      >
        <span
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-pill"
          style={{ background: 'var(--surface)', color: 'var(--failed)' }}
        >
          <X size={16} strokeWidth={2.4} />
        </span>
        <span className="text-base font-medium" style={{ color: 'var(--failed)' }}>
          {label}
        </span>
        <span className="ml-auto text-sm" style={{ color: 'var(--text-subtle)' }}>
          {failedLabel}
        </span>
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
      className="relative h-14 select-none touch-none overflow-hidden rounded-card border"
      style={{
        borderColor: done
          ? 'color-mix(in srgb, var(--stage) 50%, transparent)'
          : 'var(--border)',
        background: 'var(--surface)',
        boxShadow: 'var(--wp-shadow)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${progress * 100}%`,
          background: 'var(--stage-soft)',
          transition: dragging ? 'none' : 'width 340ms var(--ease-apple)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center pl-16"
        style={{ paddingRight: done ? THUMB_PX + 12 : 18 }}
      >
        {icon && (
          <span
            className="mr-3"
            style={{ color: done ? 'var(--stage)' : 'var(--text-muted)' }}
          >
            {icon}
          </span>
        )}
        <span
          className="min-w-0 truncate text-base font-semibold"
          style={{ color: done ? 'var(--stage)' : 'var(--text)' }}
        >
          {label}
        </span>
        <span
          className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap pl-2 text-sm"
          style={{ color: 'var(--text-subtle)' }}
        >
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
          done ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        ].join(' ')}
        style={{
          width: THUMB_PX,
          left: `calc(${TRACK_PAD}px + ${progress} * (100% - ${THUMB_PX + TRACK_PAD * 2}px))`,
          transition: dragging ? 'none' : 'left 340ms var(--ease-apple)',
          background: done ? 'var(--stage)' : 'var(--surface)',
          borderColor: done ? 'var(--stage)' : 'var(--border-strong)',
          color: done ? 'var(--surface)' : 'var(--stage)',
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
