export const routeModules = {
  chores: () => import('../pages/DashboardPage'),
  tests: () => import('../pages/TestsPage'),
  rewards: () => import('../pages/RewardsPage'),
  timeExplorer: () => import('../pages/TimeExplorerPage'),
  manageChildren: () => import('../pages/ManageChildrenPage'),
  protectedData: () => import('./ProtectedDataRoute'),
}

const routeNames = new Map<string, keyof typeof routeModules>([
  ['/', 'chores'],
  ['/tabs', 'chores'],
  ['/today', 'chores'],
  ['/tabs/dashboard', 'chores'],
  ['/tabs/chores', 'chores'],
  ['/settings/manage-chores', 'chores'],
  ['/tabs/tests', 'tests'],
  ['/settings/manage-tests', 'tests'],
  ['/tabs/rewards', 'rewards'],
  ['/settings/manage-rewards', 'rewards'],
  ['/tabs/time-explorer', 'timeExplorer'],
  ['/settings/manage-children', 'manageChildren'],
])

export function getRouteModule(pathname: string) {
  const name = routeNames.get(pathname.replace(/\/$/, '') || '/')
  return name ? routeModules[name] : null
}
