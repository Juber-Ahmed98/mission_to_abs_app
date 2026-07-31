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
      <div className="flex-1 min-w-0">
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
          className="h-14 w-11 flex items-center justify-center rounded-card border border-border bg-surface text-text-subtle hover:text-failed hover:border-failed-40 focus:text-failed focus:border-failed-40 transition-colors duration-fast ease-apple"
        >
          <X size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
