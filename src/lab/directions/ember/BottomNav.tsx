// Ember fork of BottomNav — a floating warm dock instead of an edge bar.
// Lab-only: sticky inside the direction frame, no router links.

import { Camera, Home, Map, Settings as SettingsIcon, TrendingUp } from 'lucide-react';

const items = [
  { label: 'Today', icon: Home },
  { label: 'Journey', icon: Map },
  { label: 'Progress', icon: TrendingUp },
  { label: 'Photos', icon: Camera },
  { label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav() {
  return (
    <nav className="sticky bottom-3 z-30 mx-4 mt-auto" aria-label="Ember navigation (lab preview)">
      <ul
        className="flex justify-around rounded-pill border px-2 py-1.5 backdrop-blur"
        style={{
          borderColor: 'var(--border)',
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
          boxShadow: 'var(--em-shadow-lift)',
        }}
      >
        {items.map(({ label, icon: Icon }, i) => {
          const active = i === 0;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                className="flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-pill transition-colors duration-150 ease-apple"
                style={
                  active
                    ? { color: 'var(--accent)' }
                    : { color: 'var(--text-subtle)' }
                }
              >
                <Icon size={21} strokeWidth={active ? 2 : 1.75} />
                <span className="text-2xs font-medium tracking-wide">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
