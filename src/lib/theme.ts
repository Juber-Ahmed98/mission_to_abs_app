import { useEffect } from 'react';
import type { ThemePreference } from '../types';
import { stageForDay } from './stage';

export function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

export function applyTheme(pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function useApplyTheme(pref: ThemePreference): void {
  useEffect(() => {
    applyTheme(pref);
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(pref);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [pref]);
}

const STAGE_CLASSES = ['stage-0', 'stage-1', 'stage-2', 'stage-3', 'stage-4'];

/** Bind the stage-<n> class on <html> — the accent IS the current stage
 * (DESIGN.md · Mission stages). Pre-mission clamps to Foundation, post-105
 * to Reveal, so the room always has a hue. */
export function useApplyStage(dayNumber: number, totalDays: number): void {
  const clamped = Math.min(Math.max(dayNumber, 1), totalDays);
  const index = stageForDay(clamped, totalDays)?.index ?? 0;
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove(...STAGE_CLASSES.filter((c) => c !== STAGE_CLASSES[index]));
    el.classList.add(STAGE_CLASSES[index]);
  }, [index]);
}
