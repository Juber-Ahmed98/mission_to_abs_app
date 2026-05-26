import { useSyncExternalStore } from 'react';

const NARROW_MQ = '(max-width: 639px)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mql = window.matchMedia(NARROW_MQ);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(NARROW_MQ).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
