// The map legend (DESIGN.md · Bottom nav): a surface bar with a hairline top;
// the active destination sits in a stage-soft chip in the stage hue.

import { NavLink } from 'react-router-dom';
import { Camera, Home, Map, Settings as SettingsIcon, TrendingUp } from 'lucide-react';

const items = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/journey', label: 'Journey', icon: Map, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
  { to: '/photos', label: 'Photos', icon: Camera, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around px-1 py-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'mx-auto flex min-h-[54px] w-full flex-col items-center justify-center gap-0.5 rounded-card transition-colors duration-fast ease-apple',
                  isActive ? 'bg-stage-soft text-stage' : 'text-text-subtle',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span className="text-2xs font-semibold tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
