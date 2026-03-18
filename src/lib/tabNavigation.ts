export const appTabs = [
  {
    id: 'dashboard',
    path: '/tabs/dashboard',
    ariaLabel: 'Dashboard tab',
  },
  {
    id: 'rewards',
    path: '/tabs/rewards',
    ariaLabel: 'Rewards tab',
  },
  {
    id: 'time-explorer',
    path: '/tabs/time-explorer',
    ariaLabel: 'Time Explorer tab',
  },
] as const

export type AppTabId = (typeof appTabs)[number]['id']

export const defaultTabPath = appTabs[0].path

export const getTabIndex = (tabId: AppTabId) =>
  appTabs.findIndex((tab) => tab.id === tabId)

export const getAdjacentTabPath = (tabId: AppTabId, delta: -1 | 1) => {
  const currentIndex = getTabIndex(tabId)
  if (currentIndex === -1) return null

  const nextTab = appTabs[currentIndex + delta]
  return nextTab?.path ?? null
}
