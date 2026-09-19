export const routeModules = {
  chores: () => import('../pages/DashboardPage'),
  tests: () => import('../pages/TestsPage'),
  rewards: () => import('../pages/RewardsPage'),
  timeExplorer: () => import('../pages/TimeExplorerPage'),
  manageChildren: () => import('../pages/ManageChildrenPage'),
  protectedData: () => import('./ProtectedDataRoute'),
}

export function getRouteModule(pathname: string) {
  switch (pathname.replace(/\/$/, '') || '/') {
    case '/':
    case '/tabs':
    case '/today':
    case '/tabs/dashboard':
    case '/tabs/chores':
    case '/settings/manage-chores':
      return routeModules.chores
    case '/tabs/tests':
    case '/settings/manage-tests':
      return routeModules.tests
    case '/tabs/rewards':
    case '/settings/manage-rewards':
      return routeModules.rewards
    case '/tabs/time-explorer':
      return routeModules.timeExplorer
    case '/settings/manage-children':
      return routeModules.manageChildren
    default:
      return null
  }
}
