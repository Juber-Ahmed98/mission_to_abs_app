// The shared segmented control (DESIGN.md · Segmented control), extracted
// from the Onboarding/Settings duplicates: pill group on --surface-2, active
// segment on --surface with the panel shadow and stage-hue text, 44px targets.

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="inline-flex rounded-pill bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          aria-pressed={opt === value}
          onClick={() => onChange(opt)}
          className={[
            'h-11 min-w-[44px] rounded-pill px-3 text-sm font-medium transition-colors duration-fast ease-apple',
            value === opt ? 'bg-surface text-stage shadow-panel' : 'text-text-muted',
          ].join(' ')}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
