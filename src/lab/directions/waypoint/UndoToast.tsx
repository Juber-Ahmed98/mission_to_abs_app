// Waypoint fork of UndoToast — a legend chip, bottom center of the frame.

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
        'pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center transition-all duration-200 ease-apple',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      ].join(' ')}
    >
      {entry && (
        <div
          className="wp-panel pointer-events-auto flex items-center gap-3 px-4 py-2"
          style={{ boxShadow: 'var(--wp-shadow-lift)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            {entry.label}
          </span>
          <button
            type="button"
            onClick={entry.undo}
            className="flex h-9 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold"
            style={{ color: 'var(--stage)' }}
          >
            <Undo2 size={14} strokeWidth={2.25} />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
