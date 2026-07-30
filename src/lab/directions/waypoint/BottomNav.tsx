// Waypoint fork of BottomNav — the map legend. Active destination sits in a
// stage-soft chip; the bar itself is a surface panel with a hairline.

import { Camera, Home, Map, Settings as SettingsIcon, TrendingUp } from 'lucide-react';

const items = [
  { label: 'Today', icon: Home },
  { label: 'Journey', icon: Map },
  { label: 'Progress', icon: TrendingUp },
  { label: 'Photos', icon: Camera },
  { label: 'Settings', icon: SettingsIcon },
];

export default function BottomNav({ active = 0 }: { active?: number }) {
  return (
    <nav
      className="sticky bottom-0 z-30 mt-auto border-t"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      aria-label="Waypoint navigation (lab preview)"
    >
      <ul className="flex justify-around px-1 py-1">
        {items.map(({ label, icon: Icon }, i) => {
          const isActive = i === active;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                className="mx-auto flex min-h-[54px] w-full flex-col items-center justify-center gap-0.5 rounded-card transition-colors duration-150 ease-apple"
                style={
                  isActive
                    ? { background: 'var(--stage-soft)', color: 'var(--stage)' }
                    : { color: 'var(--text-subtle)' }
                }
              >
                <Icon size={21} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-2xs font-semibold tracking-wide">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
