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
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-[color:var(--bg)]/90 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors duration-150 ease-apple',
                  isActive ? 'text-accent' : 'text-text-muted',
                ].join(' ')
              }
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="text-2xs font-medium tracking-wide">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
