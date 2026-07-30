// Ledger fork of UndoToast — an amendment line above the footer rule.
// Props-driven; the Dashboard owns the entry state.

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
        'pointer-events-none absolute inset-x-0 bottom-16 z-40 flex justify-center transition-opacity duration-200 ease-apple',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {entry && (
        <div
          className="ld-rule-t pointer-events-auto flex items-baseline gap-3 px-4 pb-1 pt-2"
          style={{ background: 'var(--bg)' }}
        >
          <span className="ld-serif text-sm" style={{ color: 'var(--text)' }}>
            {entry.label}
          </span>
          <button
            type="button"
            onClick={entry.undo}
            className="ld-caps min-h-[36px] underline underline-offset-4"
            style={{ color: 'var(--accent)' }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
