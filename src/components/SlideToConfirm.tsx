import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';

type Props = {
  label: string;
  hint?: string;
  doneLabel?: string;
  icon?: React.ReactNode;
  confirmed: boolean;
  onConfirm: () => void;
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
  hint = 'Slide to confirm',
  doneLabel,
  icon,
  confirmed,
  onConfirm,
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
    if (confirmed) return;
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
    if (!dragging || confirmed) return;
    const delta = e.clientX - startXRef.current;
    const pct = Math.max(
      0,
      Math.min(1, startProgressRef.current + delta / usableRef.current),
    );
    setProgress(pct);
    if (pct >= THRESHOLD) fire();
  };

  const onPointerUp = () => {
    if (!dragging || confirmed) return;
    setDragging(false);
    setProgress(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (confirmed) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fire();
    }
  };

  const done = confirmed;

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={done ? -1 : 0}
      aria-label={`${label}, ${done ? 'done' : hint}`}
      aria-pressed={done}
      onKeyDown={onKeyDown}
      className={[
        'relative h-14 rounded-pill bg-surface border overflow-hidden select-none touch-none',
        done ? 'border-success/40' : 'border-border',
      ].join(' ')}
    >
      <div
        className="absolute inset-y-0 left-0 bg-success-bg"
        style={{
          width: `${progress * 100}%`,
          transition: dragging ? 'none' : 'width 350ms var(--ease-apple)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center pl-16 pr-5">
        {icon && (
          <span className={done ? 'mr-3 text-success' : 'mr-3 text-text-muted'}>
            {icon}
          </span>
        )}
        <span
          className={[
            'text-base font-medium',
            done ? 'text-success' : 'text-text',
          ].join(' ')}
        >
          {label}
        </span>
        <span className="ml-auto text-sm text-text-subtle">
          {done ? doneLabel : hint}
        </span>
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={[
          'absolute top-1 bottom-1 flex items-center justify-center rounded-pill border shadow-sm bg-bg',
          done ? 'border-success/40 cursor-default' : 'border-border cursor-grab active:cursor-grabbing',
        ].join(' ')}
        style={{
          width: THUMB_PX,
          left: `calc(${TRACK_PAD}px + ${progress} * (100% - ${THUMB_PX + TRACK_PAD * 2}px))`,
          transition: dragging ? 'none' : 'left 350ms var(--ease-apple)',
        }}
      >
        {done ? (
          <Check size={20} strokeWidth={2.4} className="text-success" />
        ) : (
          <ChevronRight size={20} strokeWidth={2} className="text-text-muted" />
        )}
      </div>
    </div>
  );
}
