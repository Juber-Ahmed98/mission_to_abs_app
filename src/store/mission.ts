import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ArchivedMission,
  DayEntry,
  Settings,
  WeekMeasurement,
  WeekPhoto,
} from '../types';
import { addDaysISO, todayISO, totalDays } from '../lib/date';
import { adherenceFor } from '../lib/adherence';
import { longestStreak } from '../lib/streak';
import { totalXp } from '../lib/xp';
import { deletePhoto } from '../storage/photos';

type State = {
  settings: Settings;
  days: Record<string, DayEntry>;
  photos: WeekPhoto[];
  measurements: WeekMeasurement[];
  history: ArchivedMission[];
};

type Actions = {
  setSettings: (patch: Partial<Settings>) => void;
  setDayEntry: (date: string, patch: Partial<DayEntry>) => void;
  addPhoto: (p: WeekPhoto) => void;
  removePhoto: (weekNumber: number) => void;
  setMeasurement: (m: WeekMeasurement) => void;
  removeMeasurement: (weekNumber: number) => void;
  replaceAll: (next: Omit<State, 'history'> & { history?: ArchivedMission[] }) => void;
  resetAll: () => void;
  startNewMission: () => Promise<void>;
  deleteArchivedMission: (id: string) => Promise<void>;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `mission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Snapshot the current mission into an archive entry with precomputed stats.
function archiveCurrent(s: State): ArchivedMission {
  const { settings, days, photos, measurements } = s;
  const lastDay = addDaysISO(settings.startDate, totalDays(settings.durationWeeks) - 1);
  const adherence = adherenceFor(days, settings.startDate, lastDay);

  const weights = Object.values(days)
    .filter(
      (d) =>
        typeof d.weight === 'number' &&
        d.date >= settings.startDate &&
        d.date <= lastDay,
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightDelta =
    weights.length >= 2
      ? (weights[weights.length - 1].weight as number) - (weights[0].weight as number)
      : undefined;

  const waistList = measurements
    .filter((m) => typeof m.waistCm === 'number')
    .slice()
    .sort((a, b) => a.weekNumber - b.weekNumber);
  const waistDeltaCm =
    waistList.length >= 2
      ? (waistList[waistList.length - 1].waistCm as number) - (waistList[0].waistCm as number)
      : undefined;

  return {
    id: newId(),
    archivedAt: new Date().toISOString(),
    settings,
    days,
    measurements,
    photos,
    finalXp: totalXp(days, photos, measurements),
    stats: {
      perfectDays: adherence.perfectDays,
      longestStreak: longestStreak(days, settings.startDate, lastDay),
      weightDelta,
      waistDeltaCm,
    },
  };
}

const makeInitialSettings = (): Settings => ({
  startDate: todayISO(),
  durationWeeks: 15,
  weightUnit: 'kg',
  waistUnit: 'cm',
  pillarLabels: { diet: 'Diet', exercise: 'Exercise' },
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
  history: [],
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
          // Import is a full replace; history isn't in the payload, so reset it
          // (its photos were just cleared too) unless one is provided.
          history: next.history ?? [],
        })),
      resetAll: () => set(() => makeInitial()),
      startNewMission: async () => {
        // Archive the finished mission instead of wiping it. Its photos stay in
        // IndexedDB under their timestamped keys; the new mission uses fresh keys.
        set((s) => ({
          history: [archiveCurrent(s), ...s.history],
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
      deleteArchivedMission: async (id) => {
        const entry = useMission.getState().history.find((m) => m.id === id);
        set((s) => ({ history: s.history.filter((m) => m.id !== id) }));
        if (entry) {
          await Promise.all(entry.photos.map((p) => deletePhoto(p.photoKey)));
        }
      },
    }),
    {
      name: 'mission',
      version: 8,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        settings: s.settings,
        days: s.days,
        photos: s.photos,
        measurements: s.measurements,
        history: s.history,
      }),
      // Deep-merge settings over the defaults so any field the persisted blob is
      // missing (a newly added one, or a partial import) falls back safely
      // instead of being undefined. Migrations still handle versioned reshapes.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...(p.settings ?? {}) },
        };
      },
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
        if (version < 7) {
          const prevSettings = (next.settings ?? {}) as Partial<Settings>;
          next.settings = {
            ...makeInitialSettings(),
            ...prevSettings,
            pillarLabels: prevSettings.pillarLabels ?? {
              diet: 'Diet',
              exercise: 'Exercise',
            },
          };
        }
        if (version < 8) {
          next.history = next.history ?? [];
        }
        return next as State;
      },
    },
  ),
);
