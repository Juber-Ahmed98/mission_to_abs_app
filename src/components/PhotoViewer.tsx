import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getPhoto } from '../storage/photos';

type Props = {
  open: boolean;
  photoKey: string | null;
  week: number | null;
  onClose: () => void;
};

const EASE = [0.32, 0.72, 0, 1] as const;

export default function PhotoViewer({ open, photoKey, week, onClose }: Props) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!open || !photoKey) {
      setUrl(undefined);
      return;
    }
    let created: string | undefined;
    let cancelled = false;
    (async () => {
      const blob = await getPhoto(photoKey);
      if (cancelled || !blob) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    })();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [open, photoKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed inset-0 z-50 flex flex-col bg-black"
        >
          <div
            className="absolute right-2 z-20"
            style={{ top: 'calc(env(safe-area-inset-top) + 6px)' }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative flex-1">
            {url && (
              <img
                src={url}
                alt={week != null ? `Week ${week} photo` : ''}
                className="absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
            )}
          </div>
          {week != null && (
            <div
              className="px-5 py-3 text-center text-sm text-white/80"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
            >
              Week {week}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
