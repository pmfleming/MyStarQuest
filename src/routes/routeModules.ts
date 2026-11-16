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

const preloads = new Map<
  NonNullable<ReturnType<typeof getRouteModule>>,
  Promise<unknown>
>()

// Hover, keyboard focus and touch can announce the same navigation. Share work
// and allow a later attempt to recover if the connection drops.
export function preloadRoute(pathname: string): Promise<unknown> {
  const load = getRouteModule(pathname)
  if (!load) return Promise.resolve()
  const pending = preloads.get(load)
  if (pending) return pending
  const request = load().catch(() => {
    preloads.delete(load)
  })
  preloads.set(load, request)
  return request
}
