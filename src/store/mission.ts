import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  DayEntry,
  Settings,
  WeekMeasurement,
  WeekPhoto,
} from '../types';
import { todayISO } from '../lib/date';
import { clearAllPhotos } from '../storage/photos';

type State = {
  settings: Settings;
  days: Record<string, DayEntry>;
  photos: WeekPhoto[];
  measurements: WeekMeasurement[];
};

type Actions = {
  setSettings: (patch: Partial<Settings>) => void;
  setDayEntry: (date: string, patch: Partial<DayEntry>) => void;
  addPhoto: (p: WeekPhoto) => void;
  removePhoto: (weekNumber: number) => void;
  setMeasurement: (m: WeekMeasurement) => void;
  removeMeasurement: (weekNumber: number) => void;
  replaceAll: (next: State) => void;
  resetAll: () => void;
  startNewMission: () => Promise<void>;
};

const makeInitialSettings = (): Settings => ({
  startDate: todayISO(),
  durationWeeks: 15,
  weightUnit: 'kg',
  waistUnit: 'cm',
  theme: 'system',
  onboarded: false,
  streakShieldsRemaining: 1,
  lastExportedAt: null,
  analyticsEnabled: false,
  notifications: { morning: false, evening: false },
});

const makeInitial = (): State => ({
  settings: makeInitialSettings(),
  days: {},
  photos: [],
  measurements: [],
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
      setMeasurement: (m) =>
        set((s) => ({
          measurements: [
            ...s.measurements.filter((x) => x.weekNumber !== m.weekNumber),
            m,
          ].sort((a, b) => a.weekNumber - b.weekNumber),
        })),
      removeMeasurement: (weekNumber) =>
        set((s) => ({
          measurements: s.measurements.filter((m) => m.weekNumber !== weekNumber),
        })),
      replaceAll: (next) =>
        set(() => ({
          settings: { ...makeInitialSettings(), ...next.settings },
          days: next.days,
          photos: next.photos,
          measurements: next.measurements ?? [],
        })),
      resetAll: () => set(() => makeInitial()),
      startNewMission: async () => {
        await clearAllPhotos();
        set((s) => ({
          settings: {
            ...s.settings,
            startDate: todayISO(),
            streakShieldsRemaining: 1,
            onboarded: true,
          },
          days: {},
          photos: [],
          measurements: [],
        }));
      },
    }),
    {
      name: 'mission',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        settings: s.settings,
        days: s.days,
        photos: s.photos,
        measurements: s.measurements,
      }),
      migrate: (persisted, version) => {
        const next = (persisted ?? {}) as Partial<State>;
        if (version < 2) {
          next.settings = {
            ...makeInitialSettings(),
            ...(next.settings ?? {}),
            theme: 'system',
          };
        }
        if (version < 3) {
          const prevSettings = (next.settings ?? {}) as Partial<Settings>;
          next.settings = {
            ...makeInitialSettings(),
            ...prevSettings,
            waistUnit: prevSettings.waistUnit ?? 'cm',
            onboarded: prevSettings.onboarded ?? false,
            streakShieldsRemaining: prevSettings.streakShieldsRemaining ?? 1,
          };
          next.measurements = next.measurements ?? [];
        }
        if (version < 4) {
          const prevSettings = (next.settings ?? {}) as Partial<Settings>;
          next.settings = {
            ...makeInitialSettings(),
            ...prevSettings,
            lastExportedAt: prevSettings.lastExportedAt ?? null,
          };
        }
        if (version < 5) {
          const prevSettings = (next.settings ?? {}) as Partial<Settings>;
          next.settings = {
            ...makeInitialSettings(),
            ...prevSettings,
            analyticsEnabled: prevSettings.analyticsEnabled ?? false,
          };
        }
        if (version < 6) {
          const prevSettings = (next.settings ?? {}) as Partial<Settings>;
          next.settings = {
            ...makeInitialSettings(),
            ...prevSettings,
            notifications: prevSettings.notifications ?? {
              morning: false,
              evening: false,
            },
          };
        }
        return next as State;
      },
    },
  ),
);
