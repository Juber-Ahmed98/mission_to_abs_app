import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DayEntry, Settings, WeekPhoto } from '../types';
import { todayISO } from '../lib/date';

type State = {
  settings: Settings;
  days: Record<string, DayEntry>;
  photos: WeekPhoto[];
};

type Actions = {
  setSettings: (patch: Partial<Settings>) => void;
  setDayEntry: (date: string, patch: Partial<DayEntry>) => void;
  addPhoto: (p: WeekPhoto) => void;
  removePhoto: (weekNumber: number) => void;
  replaceAll: (next: State) => void;
  resetAll: () => void;
};

const makeInitial = (): State => ({
  settings: {
    startDate: todayISO(),
    durationWeeks: 15,
    weightUnit: 'kg',
    theme: 'system',
  },
  days: {},
  photos: [],
});

export const useMission = create<State & Actions>()(
  persist(
    (set) => ({
      ...makeInitial(),
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setDayEntry: (date, patch) =>
        set((s) => {
          const existing = s.days[date] ?? { date };
          const merged: DayEntry = { ...existing, ...patch, date };
          (Object.keys(patch) as (keyof DayEntry)[]).forEach((k) => {
            if (patch[k] === undefined) delete (merged as Record<string, unknown>)[k as string];
          });
          return { days: { ...s.days, [date]: merged } };
        }),
      addPhoto: (p) =>
        set((s) => ({
          photos: [...s.photos.filter((x) => x.weekNumber !== p.weekNumber), p].sort(
            (a, b) => a.weekNumber - b.weekNumber,
          ),
        })),
      removePhoto: (weekNumber) =>
        set((s) => ({ photos: s.photos.filter((p) => p.weekNumber !== weekNumber) })),
      replaceAll: (next) =>
        set(() => ({
          settings: { ...makeInitial().settings, ...next.settings },
          days: next.days,
          photos: next.photos,
        })),
      resetAll: () => set(() => makeInitial()),
    }),
    {
      name: 'mission',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        settings: s.settings,
        days: s.days,
        photos: s.photos,
      }),
      migrate: (persisted, version) => {
        const next = (persisted ?? {}) as Partial<State>;
        if (version < 2) {
          next.settings = {
            ...makeInitial().settings,
            ...(next.settings ?? {}),
            theme: 'system',
          };
        }
        return next as State;
      },
    },
  ),
);
