import { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';

type UndoEntry = {
  id: number;
  label: string;
  undo: () => void;
};

const TOAST_LIFETIME_MS = 5000;
const listeners = new Set<(entry: UndoEntry | null) => void>();
let current: UndoEntry | null = null;
let lifeTimer: ReturnType<typeof setTimeout> | null = null;

function emit(entry: UndoEntry | null) {
  current = entry;
  listeners.forEach((l) => l(entry));
}

export function showUndo(label: string, undo: () => void) {
  if (lifeTimer) clearTimeout(lifeTimer);
  const entry: UndoEntry = { id: Date.now() + Math.random(), label, undo };
  emit(entry);
  lifeTimer = setTimeout(() => {
    if (current?.id === entry.id) emit(null);
    lifeTimer = null;
  }, TOAST_LIFETIME_MS);
}

export function clearUndo() {
  if (lifeTimer) {
    clearTimeout(lifeTimer);
    lifeTimer = null;
  }
  emit(null);
}

export default function UndoToast() {
  const [entry, setEntry] = useState<UndoEntry | null>(current);

  useEffect(() => {
    listeners.add(setEntry);
    return () => {
      listeners.delete(setEntry);
    };
  }, []);

  const visible = !!entry;

  return (
    <div
      aria-live="polite"
      className={[
        'pointer-events-none fixed right-4 z-40 transition-all duration-200 ease-apple',
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-2 opacity-0',
      ].join(' ')}
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
    >
      {entry && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-pill border border-border bg-surface px-4 py-2 shadow-sm">
          <span className="text-sm text-text">{entry.label}</span>
          <button
            type="button"
            onClick={() => {
              entry.undo();
              clearUndo();
            }}
            className="flex h-9 items-center gap-1.5 rounded-pill px-3 text-sm font-medium text-accent hover:text-accent-hover"
          >
            <Undo2 size={14} strokeWidth={2} />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
