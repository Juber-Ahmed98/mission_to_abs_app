import Dashboard from './Dashboard';
import Gallery from './Gallery';
import Journey from './Journey';

export const waypoint = {
  id: 'waypoint',
  name: 'Waypoint',
  themeIdentity: 'light-first' as const,
  Dashboard,
  Gallery,
  Journey,
};
