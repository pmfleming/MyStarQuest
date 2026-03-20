import {
  princessCalendarIcon,
  princessChoresIcon,
  princessRewardsIcon,
} from '../assets/themes/princess/assets'

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

export const getTabIcon = (tabId: AppTabId) => {
  if (tabId === 'dashboard') return princessChoresIcon
  if (tabId === 'rewards') return princessRewardsIcon
  if (tabId === 'time-explorer') return princessCalendarIcon
  return princessCalendarIcon
}

export const defaultTabPath = appTabs[0].path

export const getTabIndex = (tabId: AppTabId) =>
  appTabs.findIndex((tab) => tab.id === tabId)

export const getAdjacentTabPath = (tabId: AppTabId, delta: -1 | 1) => {
  const currentIndex = getTabIndex(tabId)
  if (currentIndex === -1) return null

  const nextTab = appTabs[currentIndex + delta]
  return nextTab?.path ?? null
}
