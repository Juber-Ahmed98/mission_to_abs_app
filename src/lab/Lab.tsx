// The direction lab — a dev-only rendering harness for the redesign's
// exploration phase. Directions (Phase 2) build against the real primitives
// here, driven by the pure-props fixtures in fixtures.ts. Zero production
// footprint: the route and its lazy() import are both dev-guarded in App.tsx,
// and nothing in the lab writes the store or the `mission` localStorage key.

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Moon, Sun } from 'lucide-react';
import { DEFAULT_FIXTURE_ID, FIXTURES } from './fixtures';
import type { LabFixture } from './fixtures';
import { dayStatus } from '../lib/dayStatus';
import { addDaysISO, formatNice } from '../lib/date';
import { ember } from './directions/ember';

export type LabDirection = {
  id: string;
  name: string;
  themeIdentity: 'light-first' | 'dark-first' | 'single-theme';
  /** Fully composed Dashboard for this direction, driven by fixture props alone. */
  Dashboard: ComponentType<{ fixture: LabFixture }>;
  /** The nine forked primitives in isolation — the Gate 1 walk-through. */
  Gallery?: ComponentType<{ fixture: LabFixture }>;
};

// Phase 2: forked, freely restyled copies of the nine primitives plus a
// composed Dashboard each, from src/lab/directions/<n>/. Contrast matrix in
// src/lab/directions/README.md.
const DIRECTIONS: LabDirection[] = [ember];

/** Lab-local theme toggle. Flips the `dark` class on <html> directly (the
 * dark tokens live on `html.dark`) and restores whatever the app had when
 * the lab opened. Never touches settings.theme. */
function useLabTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );

  useEffect(() => {
    const original = document.documentElement.classList.contains('dark');
    return () => {
      document.documentElement.classList.toggle('dark', original);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

const STATUS_DOT: Record<string, string> = {
  perfect: 'bg-success',
  partial: 'bg-partial',
  failed: 'bg-failed',
  rest: 'bg-rest',
  missed: 'bg-missed',
};

/** The last 14 days before today as status dots — a quick visual check that
 * a fixture's history has the texture its scenario claims. */
function RecentDays({ fixture }: { fixture: LabFixture }) {
  const from = Math.max(1, fixture.day - 14);
  if (from >= fixture.day) return null;
  const days = [];
  for (let d = from; d < fixture.day; d += 1) {
    const date = addDaysISO(fixture.startDate, d - 1);
    days.push({ d, status: dayStatus(fixture.days[date]) });
  }
  return (
    <div className="flex items-center gap-1.5">
      {days.map(({ d, status }) => (
        <span
          key={d}
          title={`Day ${d}: ${status}`}
          className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`}
        />
      ))}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-text-subtle">{label}</span>
      <span className="text-right text-sm text-text tabular">{value}</span>
    </div>
  );
}

/** Derived facts of the selected fixture — the data reference while building
 * directions, and the proof the fixture math is honest. */
function FixtureInspector({ fixture }: { fixture: LabFixture }) {
  const f = fixture;
  return (
    <section className="rounded-card border border-border bg-surface px-5 py-4">
      <p className="text-sm text-text-muted">{f.scenario}</p>
      <div className="mt-3 divide-y divide-border">
        <Fact
          label="Day"
          value={`${f.day} / ${f.totalDays} · ${f.totalDays - f.day} left`}
        />
        <Fact
          label="Stage"
          value={
            f.stage
              ? `${f.stage.index + 1} · ${f.stage.name} (days ${f.stage.startDay}–${f.stage.endDay})`
              : '—'
          }
        />
        <Fact
          label="XP"
          value={`${f.xp.toLocaleString()} · Level ${f.level.level} ${f.tier} (${f.level.xpInLevel}/${f.level.xpToNext})`}
        />
        <Fact
          label="Streak"
          value={`${f.streak} current · ${f.longestStreak} longest`}
        />
        {f.gap && (
          <Fact
            label={f.gap.gapDays === 1 ? 'Missed' : 'Lapse'}
            value={`last logged day ${f.gap.lastLoggedDay} (${formatNice(f.gap.lastLoggedDate)}) · ${f.gap.gapDays} ${f.gap.gapDays === 1 ? 'day' : 'days'} unlogged · streak stood at ${f.gap.streakBeforeGap}`}
          />
        )}
        {f.gap && f.gap.missedPhotoWeeks > 0 && (
          <Fact label="Photo weeks missed" value={f.gap.missedPhotoWeeks} />
        )}
        <Fact
          label="Weight"
          value={
            f.lastWeight !== null
              ? `${f.lastWeight} ${f.weightUnit} · goal ${f.goalWeight}`
              : '—'
          }
        />
        <Fact label="Shields" value={f.shieldsRemaining} />
        <Fact label="Moment armed" value={f.moment ?? '—'} />
      </div>
      <div className="mt-4">
        <RecentDays fixture={f} />
      </div>
    </section>
  );
}

export default function Lab() {
  const { dark, toggle } = useLabTheme();
  const [fixtureId, setFixtureId] = useState(DEFAULT_FIXTURE_ID);
  const [directionId, setDirectionId] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  const fixture = FIXTURES.find((f) => f.id === fixtureId) ?? FIXTURES[0];
  const direction = DIRECTIONS.find((d) => d.id === directionId) ?? null;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            aria-label="Back to the app"
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-surface text-text-muted"
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </Link>
          <FlaskConical size={16} strokeWidth={1.75} className="text-accent" />
          <h1 className="text-lg font-semibold">Direction lab</h1>
          <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent">
            DEV
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={dark ? 'Lab theme: dark. Switch to light' : 'Lab theme: light. Switch to dark'}
          className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-surface text-text-muted"
        >
          {dark ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
        </button>
      </header>

      <nav aria-label="Fixture state" className="-mx-5 mt-5 overflow-x-auto px-5">
        <div className="flex w-max gap-2">
          {FIXTURES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFixtureId(f.id)}
              aria-pressed={f.id === fixture.id}
              className={[
                'h-9 whitespace-nowrap rounded-pill border px-4 text-sm font-medium transition-colors duration-150 ease-apple',
                f.id === fixture.id
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border bg-surface text-text-muted',
              ].join(' ')}
            >
              {f.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-4">
        <FixtureInspector fixture={fixture} />
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-subtle">
          Directions
        </h2>
        {DIRECTIONS.length === 0 ? (
          <div className="mt-2 rounded-card border border-dashed border-border-strong px-5 py-6 text-sm text-text-muted">
            No directions yet. Phase 2 builds 2–3 contrasting directions in{' '}
            <code className="text-xs">src/lab/directions/</code>, each a full
            Dashboard judged first in the mid-lapse state.
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() =>
                  setDirectionId((cur) => (cur === d.id ? null : d.id))
                }
                aria-pressed={d.id === directionId}
                className={[
                  'flex items-center justify-between rounded-card border px-5 py-3 text-left',
                  d.id === directionId
                    ? 'border-accent bg-accent-soft'
                    : 'border-border bg-surface',
                ].join(' ')}
              >
                <span className="text-base font-medium">{d.name}</span>
                <span className="text-xs text-text-subtle">{d.themeIdentity}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {direction && (
        <section className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {direction.name} · {fixture.name}
          </h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            <direction.Dashboard fixture={fixture} />
          </div>
          {direction.Gallery && (
            <>
              <button
                type="button"
                onClick={() => setShowGallery((s) => !s)}
                aria-expanded={showGallery}
                className="mt-3 h-9 rounded-pill border border-border bg-surface px-4 text-sm font-medium text-text-muted"
              >
                {showGallery ? 'Hide primitives' : 'Show primitives'}
              </button>
              {showGallery && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  <direction.Gallery fixture={fixture} />
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
