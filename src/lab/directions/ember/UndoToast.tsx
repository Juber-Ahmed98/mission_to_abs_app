// Ember fork of UndoToast — lab-local (props-driven, no global emitter):
// the direction Dashboard owns the entry state and passes it down.

import { Undo2 } from 'lucide-react';

export type UndoEntry = {
  id: number;
  label: string;
  undo: () => void;
};

type Props = {
  entry: UndoEntry | null;
};

export default function UndoToast({ entry }: Props) {
  const visible = !!entry;
  return (
    <div
      aria-live="polite"
      className={[
        'pointer-events-none absolute bottom-24 right-4 z-40 transition-all duration-200 ease-apple',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      ].join(' ')}
    >
      {entry && (
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-pill border px-4 py-2"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            boxShadow: 'var(--em-shadow-lift)',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            {entry.label}
          </span>
          <button
            type="button"
            onClick={entry.undo}
            className="flex h-9 items-center gap-1.5 rounded-pill px-3 text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            <Undo2 size={14} strokeWidth={2} />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
