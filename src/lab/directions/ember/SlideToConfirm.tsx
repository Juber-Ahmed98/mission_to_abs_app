// Ember fork of SlideToConfirm — taller, warmer, physical. The fill is an
// ember wash, the thumb carries a soft glow, and confirming leaves the row
// gently lit rather than flatly recolored. Interaction logic mirrors the
// production primitive (pointer-drag, threshold, keyboard confirm).

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
const THUMB_PX = 52;
const TRACK_PAD = 5;

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
  hint = 'Slide',
  doneLabel = 'Done',
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
        className="relative flex h-16 cursor-pointer select-none items-center rounded-pill border px-5"
        style={{
          borderColor: 'color-mix(in srgb, var(--failed) 40%, transparent)',
          background: 'var(--failed-bg)',
        }}
      >
        <span
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-pill"
          style={{ background: 'var(--surface)', color: 'var(--failed)' }}
        >
          <X size={18} strokeWidth={2.4} />
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
      className={[
        'em-slide relative h-16 select-none touch-none overflow-hidden',
        done ? 'em-slide-done cursor-pointer' : '',
      ].join(' ')}
    >
      <div
        className="em-slide-fill absolute inset-y-0 left-0"
        style={{
          width: `${progress * 100}%`,
          opacity: done ? 0.55 : 1,
          transition: dragging ? 'none' : 'width 380ms var(--ease-apple)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center pl-[4.5rem]"
        style={{ paddingRight: done ? THUMB_PX + 14 : 20 }}
      >
        {icon && (
          <span
            className="mr-3"
            style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}
          >
            {icon}
          </span>
        )}
        <span
          className="min-w-0 truncate text-base font-semibold"
          style={{ color: done ? 'var(--success)' : 'var(--text)' }}
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
          'em-slide-thumb absolute bottom-1.5 top-1.5 flex items-center justify-center rounded-pill',
          done ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        ].join(' ')}
        style={{
          width: THUMB_PX,
          left: `calc(${TRACK_PAD}px + ${progress} * (100% - ${THUMB_PX + TRACK_PAD * 2}px))`,
          transition: dragging ? 'none' : 'left 380ms var(--ease-apple)',
        }}
      >
        {done ? (
          <Check size={20} strokeWidth={2.4} style={{ color: 'var(--success)' }} />
        ) : (
          <ChevronRight size={20} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        )}
      </div>
    </div>
  );
}
