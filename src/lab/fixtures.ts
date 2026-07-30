// Fixture states for the direction lab (dev-only, see src/lab/Lab.tsx).
//
// Everything here is pure data: no store reads or writes, no localStorage,
// no live clock. "Today" is pinned to LAB_TODAY so every render is
// deterministic, and every displayed number is derived through the real
// logic libs (xp, streak, stage, dayStatus) rather than hand-typed — the
// lab shows honest values or it proves nothing.
//
// Mid-lapse is the default and always listed first: every direction is
// judged on the bad day before the good day.

import type { DayEntry, WeekMeasurement, WeekPhoto } from '../types';
import { addDaysISO, subDaysISO } from '../lib/date';
import { dayStatus } from '../lib/dayStatus';
import { stageForDay, type Stage } from '../lib/stage';
import { levelFromXp, tierName, totalXp, xpForDay, type LevelInfo } from '../lib/xp';
import { calcStreak, longestStreak } from '../lib/streak';

/** The lab's pinned "today". Only ever shown as a label — primitives receive
 * derived numbers, so the real clock moving past this date changes nothing. */
export const LAB_TODAY = '2026-07-30';

export type LabMoment = 'levelUp' | 'streakBreak' | 'perfectDay' | null;

export type LabGap = {
  /** Day number of the last genuinely-logged day (dayStatus filter — never key presence). */
  lastLoggedDay: number;
  lastLoggedDate: string;
  /** Unlogged days strictly between the last logged day and today.
   * 1 = streak-break territory; ≥2 = lapse (the contract's boundary rule). */
  gapDays: number;
  /** Fully-elapsed weeks with no progress photo. */
  missedPhotoWeeks: number;
  /** Where the streak stood when logging stopped. */
  streakBeforeGap: number;
};

export type LabFixture = {
  id: string;
  /** Short label for the fixture switcher. */
  name: string;
  /** One-line scenario the direction is being judged against. */
  scenario: string;
  today: string;
  startDate: string;
  durationWeeks: number;
  totalDays: number;
  /** 1-based mission day number for `today`. */
  day: number;
  stage: Stage | null;
  days: Record<string, DayEntry>;
  photos: WeekPhoto[];
  measurements: WeekMeasurement[];
  xp: number;
  level: LevelInfo;
  tier: string;
  /** Streak as of this morning — excludes today by design, same as the app. */
  streak: number;
  longestStreak: number;
  shieldsRemaining: number;
  pillarLabels: { diet: string; exercise: string };
  weightUnit: 'kg' | 'lb';
  goalWeight: number;
  /** Most recent recorded weight anywhere in the history, if any. */
  lastWeight: number | null;
  /** Present whenever at least one unlogged day sits before today. */
  gap: LabGap | null;
  /** The celebration this fixture arms, if any. */
  moment: LabMoment;
};

type DayKind = 'perfect' | 'partial' | 'fail' | 'rest' | 'skip';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Deterministic ±0.12 wobble so weight lines look human, not synthetic. */
function wobble(day: number): number {
  return ((day * 7) % 5 - 2) * 0.06;
}

function entryFor(date: string, kind: DayKind, weight?: number): DayEntry | null {
  switch (kind) {
    case 'perfect':
      return { date, diet: 'success', exercise: 'success', weight };
    case 'partial':
      return { date, diet: 'success', exercise: 'fail', weight };
    case 'fail':
      return { date, diet: 'fail', exercise: 'fail', weight };
    case 'rest':
      return { date, rest: true, weight };
    case 'skip':
      return null;
  }
}

type FixtureSpec = {
  id: string;
  name: string;
  scenario: string;
  /** Mission day number for the pinned today. */
  day: number;
  durationWeeks?: number;
  /** Day kinds for days 1..day-1. 'skip' = no entry at all. */
  kindFor: (day: number) => DayKind;
  /** Today's entry. 'skip' mirrors the Dashboard's auto-created empty entry. */
  todayKind?: DayKind;
  /** Weight trajectory for logged days: start value and loss per day. */
  weight?: { start: number; ratePerDay: number };
  waistStart?: number;
  /** Photos + waist measurements exist for weeks 1..photosThroughWeek. */
  photosThroughWeek?: number;
  shieldsRemaining?: number;
  moment?: LabMoment;
};

function makeFixture(spec: FixtureSpec): LabFixture {
  const durationWeeks = spec.durationWeeks ?? 15;
  const totalDays = durationWeeks * 7;
  const startDate = subDaysISO(LAB_TODAY, spec.day - 1);
  const dateOf = (day: number) => addDaysISO(startDate, day - 1);

  const days: Record<string, DayEntry> = {};
  const weightAt = (day: number) =>
    spec.weight
      ? round1(spec.weight.start - day * spec.weight.ratePerDay + wobble(day))
      : undefined;
  for (let d = 1; d < spec.day; d += 1) {
    const entry = entryFor(dateOf(d), spec.kindFor(d), weightAt(d));
    if (entry) days[entry.date] = entry;
  }
  // Today: either a bare auto-created entry (what the Dashboard's mount effect
  // does) or a genuinely logged day, per the scenario.
  const todayEntry =
    spec.todayKind && spec.todayKind !== 'skip'
      ? entryFor(LAB_TODAY, spec.todayKind, weightAt(spec.day))
      : { date: LAB_TODAY };
  if (todayEntry) days[LAB_TODAY] = todayEntry;

  const photosThroughWeek = spec.photosThroughWeek ?? 0;
  const photos: WeekPhoto[] = [];
  const measurements: WeekMeasurement[] = [];
  for (let w = 1; w <= photosThroughWeek; w += 1) {
    // photoKeys are synthetic — the lab never resolves them from IndexedDB.
    photos.push({ weekNumber: w, date: dateOf(w * 7), photoKey: `lab/w${w}` });
    measurements.push({
      weekNumber: w,
      date: dateOf(w * 7),
      waistCm: spec.waistStart ? round1(spec.waistStart - w * 0.35) : undefined,
    });
  }

  const xp = totalXp(days, photos, measurements);
  const level = levelFromXp(xp);

  // Last genuinely-logged day strictly before today — dayStatus() filter,
  // never key presence (the auto-created empty entry must not count).
  let lastLoggedDay = 0;
  for (let d = spec.day - 1; d >= 1; d -= 1) {
    if (dayStatus(days[dateOf(d)]) !== 'missed') {
      lastLoggedDay = d;
      break;
    }
  }
  let gap: LabGap | null = null;
  if (lastLoggedDay > 0 && spec.day - 1 - lastLoggedDay > 0) {
    const lastLoggedDate = dateOf(lastLoggedDay);
    let missedPhotoWeeks = 0;
    const elapsedWeeks = Math.floor((spec.day - 1) / 7);
    for (let w = 1; w <= elapsedWeeks; w += 1) {
      if (!photos.some((p) => p.weekNumber === w)) missedPhotoWeeks += 1;
    }
    gap = {
      lastLoggedDay,
      lastLoggedDate,
      gapDays: spec.day - 1 - lastLoggedDay,
      missedPhotoWeeks,
      // calcStreak counts back from the day before its `today` argument.
      streakBeforeGap: calcStreak(days, addDaysISO(lastLoggedDate, 1), startDate),
    };
  }

  let lastWeight: number | null = null;
  for (let d = spec.day; d >= 1; d -= 1) {
    const w = days[dateOf(d)]?.weight;
    if (typeof w === 'number') {
      lastWeight = w;
      break;
    }
  }

  return {
    id: spec.id,
    name: spec.name,
    scenario: spec.scenario,
    today: LAB_TODAY,
    startDate,
    durationWeeks,
    totalDays,
    day: spec.day,
    stage: stageForDay(spec.day, totalDays),
    days,
    photos,
    measurements,
    xp,
    level,
    tier: tierName(level.level),
    streak: calcStreak(days, LAB_TODAY, startDate),
    longestStreak: longestStreak(days, startDate, LAB_TODAY),
    shieldsRemaining: spec.shieldsRemaining ?? 1,
    pillarLabels: { diet: 'Diet', exercise: 'Exercise' },
    weightUnit: 'kg',
    goalWeight: 78,
    lastWeight,
    gap,
    moment: spec.moment ?? null,
  };
}

/** Day 62, three weeks unlogged. The acceptance lens for the whole redesign —
 * always listed first, always judged first. Last logged day is 41. */
const day62MidLapse = makeFixture({
  id: 'day62MidLapse',
  name: 'Day 62 · mid-lapse',
  scenario:
    'Nothing logged since day 41. Low motivation, coming back after three weeks. What greets them?',
  day: 62,
  kindFor: (d) => {
    if (d >= 42) return 'skip'; // the lapse
    if (d % 7 === 0) return 'rest';
    if (d === 23) return 'fail';
    if (d % 11 === 0) return 'partial';
    return 'perfect';
  },
  weight: { start: 86, ratePerDay: 0.085 },
  waistStart: 95,
  photosThroughWeek: 5,
});

/** Day 1, nothing logged yet. Fresh start energy; also the portability test. */
const day1 = makeFixture({
  id: 'day1',
  name: 'Day 1',
  scenario: 'First open ever. Nothing logged, everything ahead.',
  day: 1,
  kindFor: () => 'skip',
});

/** Day 104 evening, both pillars logged, one day left. The eve of the finish. */
const day104Eve = makeFixture({
  id: 'day104Eve',
  name: 'Day 104 · eve',
  scenario: 'Both pillars logged, one day remains. Tomorrow is day 105.',
  day: 104,
  kindFor: (d) => {
    if (d % 7 === 0) return 'rest';
    if (d === 29) return 'fail';
    if (d === 17 || d === 43) return 'partial';
    return 'perfect';
  },
  todayKind: 'perfect',
  weight: { start: 88, ratePerDay: 0.06 },
  waistStart: 96,
  photosThroughWeek: 14,
});

/** Yesterday missed after a 17-day run; a shield is available. The 1-day-gap
 * case — per the boundary rule this is a streak break, not a lapse. */
const streakBreak = makeFixture({
  id: 'streakBreak',
  name: 'Streak break',
  scenario: 'Yesterday slipped after a 17-day streak. One shield available.',
  day: 34,
  kindFor: (d) => {
    if (d === 33) return 'skip'; // yesterday, the single missed day
    if (d % 7 === 0) return 'rest';
    if (d === 9) return 'fail';
    if (d === 4 || d === 15) return 'partial';
    return 'perfect';
  },
  weight: { start: 85, ratePerDay: 0.07 },
  waistStart: 94,
  photosThroughWeek: 4,
  shieldsRemaining: 1,
  moment: 'streakBreak',
});

/** Day 59: today's log tips total XP over the 5,600 boundary into Level 8. */
const levelUp = makeFixture({
  id: 'levelUp',
  name: 'Level-up',
  scenario: 'The log that just landed crossed a level boundary.',
  day: 59,
  kindFor: (d) => {
    if (d % 7 === 0) return 'rest';
    if (d === 31) return 'fail';
    if (d === 11 || d === 26) return 'partial';
    return 'perfect';
  },
  todayKind: 'perfect',
  weight: { start: 86, ratePerDay: 0.07 },
  waistStart: 95,
  photosThroughWeek: 8,
  moment: 'levelUp',
});

/** Day 23: the second slide just completed a perfect day, streak alive. */
const perfectDay = makeFixture({
  id: 'perfectDay',
  name: 'Perfect day',
  scenario: 'Second pillar just slid home — a perfect day, 18-day streak behind it.',
  day: 23,
  kindFor: (d) => {
    if (d % 7 === 0) return 'rest';
    if (d === 4) return 'partial';
    return 'perfect';
  },
  todayKind: 'perfect',
  weight: { start: 84, ratePerDay: 0.06 },
  waistStart: 93,
  photosThroughWeek: 3,
  moment: 'perfectDay',
});

if (import.meta.env.DEV) {
  // The level-up fixture is only honest if today's XP actually crossed the
  // boundary — guard it so a future tweak can't silently break the moment.
  const before = levelFromXp(levelUp.xp - xpForDay(levelUp.days[LAB_TODAY]));
  if (before.level >= levelUp.level.level) {
    console.warn(
      `[lab] levelUp fixture no longer crosses a level boundary ` +
        `(${before.level} → ${levelUp.level.level})`,
    );
  }
}

/** Mid-lapse first — the default fixture of every review session. */
export const FIXTURES: LabFixture[] = [
  day62MidLapse,
  day1,
  day104Eve,
  streakBreak,
  levelUp,
  perfectDay,
];

export const DEFAULT_FIXTURE_ID = day62MidLapse.id;
