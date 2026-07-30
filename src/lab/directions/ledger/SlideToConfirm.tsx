// Ledger fork of SlideToConfirm — the pen stroke. Dragging draws an ink
// underline across the row; releasing past the threshold sets the mark.
// Same pointer mechanics as production; entirely different voice.

import { useEffect, useRef, useState } from 'react';

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
const THUMB_PX = 44;
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
  hint = 'Draw the line',
  doneLabel = 'Marked',
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
        className="ld-stroke ld-stroke-done relative flex h-14 cursor-pointer select-none items-center px-4"
      >
        <span className="ld-serif mr-2 text-base" aria-hidden>
          ✕
        </span>
        <span className="ld-serif text-base" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span className="ml-auto text-sm" style={{ color: 'var(--text-subtle)' }}>
          {failedLabel}
        </span>
        <span
          className="absolute inset-x-4 top-1/2 h-px"
          style={{ background: 'var(--text-muted)' }}
          aria-hidden
        />
      </div>
    );
  }

  const done = confirmed;

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={`${label}, ${done ? 'marked' : 'slide to mark'}`}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={1}
      onKeyDown={onKeyDown}
      onClick={() => done && onClear?.()}
      className={[
        'ld-stroke relative h-14 select-none touch-none overflow-hidden',
        done ? 'ld-stroke-done cursor-pointer' : '',
      ].join(' ')}
    >
      <div
        className="ld-stroke-fill absolute inset-y-0 left-0"
        style={{
          width: `${progress * 100}%`,
          transition: dragging ? 'none' : 'width 320ms var(--ease-apple)',
        }}
      />
      <div
        className="ld-stroke-underline"
        style={{
          width: `${progress * 100}%`,
          transition: dragging ? 'none' : 'width 320ms var(--ease-apple)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 flex items-center pl-14"
        style={{ paddingRight: done ? THUMB_PX + 12 : 16 }}
      >
        {icon && (
          <span className="mr-2.5" style={{ color: 'var(--text-muted)' }}>
            {icon}
          </span>
        )}
        <span className="ld-serif min-w-0 truncate text-base">{label}</span>
        <span
          className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap pl-2 text-sm"
          style={{ color: 'var(--text-subtle)' }}
        >
          {done ? (
            <>
              <span className="ld-serif" aria-hidden>
                ✓
              </span>
              {doneLabel}
            </>
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
          'ld-stroke-thumb absolute bottom-1 top-1 flex items-center justify-center',
          done ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        ].join(' ')}
        style={{
          width: THUMB_PX,
          left: `calc(${TRACK_PAD}px + ${progress} * (100% - ${THUMB_PX + TRACK_PAD * 2}px))`,
          transition: dragging ? 'none' : 'left 320ms var(--ease-apple)',
        }}
      >
        <span
          className="ld-serif text-lg leading-none"
          style={{ color: done ? 'var(--text)' : 'var(--accent)' }}
          aria-hidden
        >
          {done ? '✓' : '›'}
        </span>
      </div>
    </div>
  );
}
