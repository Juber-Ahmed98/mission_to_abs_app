import { useEffect, useState } from 'react';
import { ChevronLeft, Eye, GitCompareArrows, RefreshCw, Trash2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import PhotoThumb from './PhotoThumb';
import { useMission } from '../store/mission';

type Mode = 'menu' | 'compare' | 'delete';

type Props = {
  open: boolean;
  week: number | null;
  photoKey: string | null;
  filledWeeks: number[];
  onClose: () => void;
  onView: (week: number) => void;
  onReplace: (week: number) => void;
  onCompare: (a: number, b: number) => void;
  onDelete: (week: number) => void | Promise<void>;
};

export default function PhotoActionSheet({
  open,
  week,
  photoKey,
  filledWeeks,
  onClose,
  onView,
  onReplace,
  onCompare,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<Mode>('menu');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode('menu');
    setDeleting(false);
  }, [open, week]);

  const otherFilled = week == null ? [] : filledWeeks.filter((w) => w !== week);

  const handleDelete = async () => {
    if (week == null) return;
    setDeleting(true);
    try {
      await onDelete(week);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-5 pt-2 pb-5">
        {mode === 'menu' && week != null && (
          <>
            <div className="flex items-center gap-3 pb-3">
              {photoKey && (
                <div className="h-14 w-11 overflow-hidden rounded border border-border">
                  <PhotoThumb photoKey={photoKey} className="h-full w-full" />
                </div>
              )}
              <div>
                <div className="text-lg font-semibold tracking-tight">Week {week}</div>
                <div className="text-xs text-text-muted">Photo options</div>
              </div>
            </div>

            <div className="space-y-1">
              <SheetRow
                icon={<Eye size={18} strokeWidth={1.75} />}
                label="View"
                onClick={() => {
                  onView(week);
                  onClose();
                }}
              />
              <SheetRow
                icon={<RefreshCw size={18} strokeWidth={1.75} />}
                label="Replace"
                onClick={() => {
                  onReplace(week);
                  onClose();
                }}
              />
              <SheetRow
                icon={<GitCompareArrows size={18} strokeWidth={1.75} />}
                label="Compare with…"
                onClick={() => setMode('compare')}
                disabled={otherFilled.length === 0}
                hint={otherFilled.length === 0 ? 'No other photos yet' : undefined}
              />
              <SheetRow
                icon={<Trash2 size={18} strokeWidth={1.75} />}
                label="Delete"
                onClick={() => setMode('delete')}
                tone="danger"
              />
            </div>
          </>
        )}

        {mode === 'compare' && week != null && (
          <>
            <div className="flex items-center gap-2 pb-3">
              <button
                type="button"
                onClick={() => setMode('menu')}
                aria-label="Back"
                className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:text-text"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  Compare week {week} with…
                </div>
                <div className="text-xs text-text-muted">Tap a photo</div>
              </div>
            </div>
            <PhotoPickerGrid
              weeks={otherFilled}
              onPick={(other) => {
                const [a, b] = [week, other].sort((x, y) => x - y);
                onCompare(a, b);
                onClose();
              }}
            />
          </>
        )}

        {mode === 'delete' && week != null && (
          <>
            <div className="text-lg font-semibold tracking-tight">
              Delete week {week} photo?
            </div>
            <div className="mt-1 text-sm text-text-muted">
              This removes the photo from your mission. You can re-upload later.
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                disabled={deleting}
                className="h-11 flex-1 rounded-card border border-border bg-surface text-text disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="h-11 flex-1 rounded-card bg-coral text-white hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

type SheetRowProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  tone?: 'default' | 'danger';
};

function SheetRow({ icon, label, onClick, disabled, hint, tone = 'default' }: SheetRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex w-full items-center gap-3 rounded-card px-3 py-3 text-left transition-colors duration-150 ease-apple',
        disabled
          ? 'opacity-50'
          : tone === 'danger'
            ? 'text-coral hover:bg-coral-soft/60'
            : 'text-text hover:bg-surface',
      ].join(' ')}
    >
      <span
        className={tone === 'danger' ? 'text-coral' : 'text-text-muted'}
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-text-subtle">{hint}</span>}
    </button>
  );
}

function PhotoPickerGrid({
  weeks,
  onPick,
}: {
  weeks: number[];
  onPick: (week: number) => void;
}) {
  const photos = useMission((s) => s.photos);
  if (weeks.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
        No other photos to compare yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      {weeks.map((w) => {
        const photo = photos.find((p) => p.weekNumber === w);
        return (
          <button
            key={w}
            type="button"
            onClick={() => onPick(w)}
            aria-label={`Compare with week ${w}`}
            className="relative aspect-[3/4] overflow-hidden rounded-card border border-border bg-surface active:opacity-80"
          >
            {photo ? (
              <PhotoThumb photoKey={photo.photoKey} className="absolute inset-0 h-full w-full" />
            ) : (
              <div className="absolute inset-0 bg-surface-2" />
            )}
            <div className="absolute left-1.5 top-1.5 rounded bg-black/45 px-1 py-0.5 text-2xs font-medium tracking-wide text-white">
              W{w}
            </div>
          </button>
        );
      })}
    </div>
  );
}
