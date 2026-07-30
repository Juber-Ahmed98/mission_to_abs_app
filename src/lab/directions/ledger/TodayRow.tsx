// Ledger fork of TodayRow — the stroke plus a fail mark of equal weight.
// In the book, ✕ costs the same motion as ✓; honesty is cheap by design.

import SlideToConfirm from './SlideToConfirm';

type Status = 'success' | 'fail' | undefined;

type Props = {
  label: string;
  icon?: React.ReactNode;
  xpReward?: number;
  status: Status;
  onSuccess: () => void;
  onFail: () => void;
  onClear: () => void;
  doneLabel?: string;
};

export default function TodayRow({
  label,
  icon,
  xpReward,
  status,
  onSuccess,
  onFail,
  onClear,
  doneLabel,
}: Props) {
  const failed = status === 'fail';
  const confirmed = status === 'success';

  return (
    <div className="flex items-stretch gap-2">
      <div className="min-w-0 flex-1">
        <SlideToConfirm
          label={label}
          icon={icon}
          xpReward={xpReward}
          doneLabel={doneLabel}
          confirmed={confirmed}
          failed={failed}
          onConfirm={onSuccess}
          onClear={onClear}
        />
      </div>
      {!failed && !confirmed && (
        <button
          type="button"
          aria-label={`Mark ${label} failed`}
          onClick={onFail}
          className="ld-stroke flex h-14 w-11 items-center justify-center"
          style={{ color: 'var(--text-subtle)' }}
        >
          <span className="ld-serif text-base leading-none" aria-hidden>
            ✕
          </span>
        </button>
      )}
    </div>
  );
}
