import { Check, X } from 'lucide-react';

type Value = 'success' | 'fail' | undefined;

type Props = {
  label: string;
  value: Value;
  onChange: (v: Value) => void;
};

export default function Toggle({ label, value, onChange }: Props) {
  const set = (v: 'success' | 'fail') => onChange(value === v ? undefined : v);
  return (
    <div className="flex items-center justify-between">
      <span className="text-base text-text">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label={`${label} success`}
          aria-pressed={value === 'success'}
          onClick={() => set('success')}
          className={[
            'flex h-11 w-11 items-center justify-center rounded-pill border transition-colors duration-150 ease-apple',
            value === 'success'
              ? 'border-success-40 bg-success-bg text-success'
              : 'border-border bg-surface-2 text-text-muted',
          ].join(' ')}
        >
          <Check size={20} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          aria-label={`${label} fail`}
          aria-pressed={value === 'fail'}
          onClick={() => set('fail')}
          className={[
            'flex h-11 w-11 items-center justify-center rounded-pill border transition-colors duration-150 ease-apple',
            value === 'fail'
              ? 'border-failed-40 bg-failed-bg text-failed'
              : 'border-border bg-surface-2 text-text-muted',
          ].join(' ')}
        >
          <X size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
