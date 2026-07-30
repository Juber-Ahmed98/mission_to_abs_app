// Ember fork of TodayRow — slide + a fail affordance that stays honest but
// visually quiet (marking failure must be as easy as success, never louder).

import { X } from 'lucide-react';
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
          className="flex h-16 w-12 items-center justify-center rounded-pill border transition-colors duration-150 ease-apple"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-subtle)',
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
