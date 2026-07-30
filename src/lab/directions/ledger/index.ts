import Dashboard from './Dashboard';
import Gallery from './Gallery';

export const ledger = {
  id: 'ledger',
  name: 'Ledger',
  themeIdentity: 'light-first' as const,
  Dashboard,
  Gallery,
};
