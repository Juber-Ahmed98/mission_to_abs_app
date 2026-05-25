import { useEffect, useState } from 'react';
import { getPhoto } from '../storage/photos';

type Props = {
  photoKey: string;
  className?: string;
  alt?: string;
};

export default function PhotoThumb({ photoKey, className, alt = '' }: Props) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
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
  }, [photoKey]);

  if (!url) return <div className={['bg-surface-2', className].filter(Boolean).join(' ')} />;
  return <img src={url} alt={alt} className={['object-cover', className].filter(Boolean).join(' ')} />;
}
