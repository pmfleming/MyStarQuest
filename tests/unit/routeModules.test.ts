import { expect, it } from 'vitest'
import { getRouteModule, routeModules } from '../../src/routes/routeModules'

it('preserves canonical routes, legacy aliases and trailing slashes', () => {
  const groups = {
    chores: [
      '/',
      '/tabs',
      '/today',
      '/tabs/dashboard',
      '/tabs/chores',
      '/settings/manage-chores',
    ],
    tests: ['/tabs/tests', '/settings/manage-tests'],
    rewards: ['/tabs/rewards', '/settings/manage-rewards'],
    timeExplorer: ['/tabs/time-explorer'],
    manageChildren: ['/settings/manage-children'],
  } as const
  for (const [name, paths] of Object.entries(groups))
    for (const path of paths) {
      expect(getRouteModule(path)).toBe(Reflect.get(routeModules, name))
      expect(getRouteModule(`${path}/`)).toBe(getRouteModule(path))
    }
  for (const unknown of ['/tabs/unknown', '/constructor', '/toString'])
    expect(getRouteModule(unknown)).toBeNull()
})
