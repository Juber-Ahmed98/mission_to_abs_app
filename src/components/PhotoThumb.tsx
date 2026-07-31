import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getPhoto } from '../storage/photos';

type Props = {
  photoKey: string;
  className?: string;
  alt?: string;
};

export default function PhotoThumb({ photoKey, className, alt = '' }: Props) {
  const [url, setUrl] = useState<string | undefined>();
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let created: string | undefined;
    let cancelled = false;
    setBroken(false);
    (async () => {
      const blob = await getPhoto(photoKey);
      if (cancelled) return;
      if (!blob) {
        // The blob is gone or unreadable — the muted broken-image state
        // (DESIGN.md · Error handling); the surrounding sheet still allows delete.
        setBroken(true);
        return;
      }
      created = URL.createObjectURL(blob);
      setUrl(created);
    })();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [photoKey]);

  if (broken) {
    return (
      <div
        role="img"
        aria-label="Couldn't load this photo."
        className={[
          'flex flex-col items-center justify-center gap-1 bg-surface-2 text-text-subtle',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <ImageOff size={18} strokeWidth={1.75} aria-hidden />
        <span className="px-1 text-center text-2xs leading-tight">
          Couldn&rsquo;t load this photo.
        </span>
      </div>
    );
  }
  if (!url) return <div className={['bg-surface-2', className].filter(Boolean).join(' ')} />;
  return (
    <img
      src={url}
      alt={alt}
      onError={() => setBroken(true)}
      className={['object-cover', className].filter(Boolean).join(' ')}
    />
  );
}
