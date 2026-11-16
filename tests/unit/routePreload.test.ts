import { afterEach, expect, it, vi } from 'vitest'
import { preloadRoute, routeModules } from '../../src/routes/routeModules'

afterEach(() => vi.restoreAllMocks())

it('shares repeated navigation intent and retries a failed download', async () => {
  const load = vi
    .spyOn(routeModules, 'tests')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ default: () => null })
  const first = preloadRoute('/tabs/tests')
  expect(preloadRoute('/settings/manage-tests')).toBe(first)
  await first
  await preloadRoute('/tabs/tests')
  await preloadRoute('/tabs/tests')
  expect(load).toHaveBeenCalledTimes(2)
  await preloadRoute('/unknown')
  expect(load).toHaveBeenCalledTimes(2)
})
