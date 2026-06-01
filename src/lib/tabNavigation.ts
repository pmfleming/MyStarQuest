import {
  princessCalendarIcon,
  princessChoresIcon,
  princessMathsIcon,
  princessRewardsIcon,
} from '../assets/themes/princess/assets'

export type AppTabId = 'chores' | 'tests' | 'rewards' | 'time-explorer'

type AppTab = {
  id: AppTabId
  path: string
  ariaLabel: string
}

export const appTabs: AppTab[] = [
  {
    id: 'chores',
    path: '/tabs/chores',
    ariaLabel: 'Chores tab',
  },
  {
    id: 'tests',
    path: '/tabs/tests',
    ariaLabel: 'Tests tab',
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
]

export const getTabIcon = (tabId: AppTabId) => {
  if (tabId === 'chores') return princessChoresIcon
  if (tabId === 'tests') return princessMathsIcon
  if (tabId === 'rewards') return princessRewardsIcon
  if (tabId === 'time-explorer') return princessCalendarIcon
  return princessCalendarIcon
}

export const defaultTabPath = appTabs[0].path

export const getTabIndex = (tabId: AppTabId) =>
  appTabs.findIndex((tab) => tab.id === tabId)

export const getTabIdForPath = (pathname: string): AppTabId | null => {
  const matchedTab = appTabs.find((tab) => pathname === tab.path)
  return matchedTab?.id ?? null
}

export const getAdjacentTabPath = (tabId: AppTabId, delta: -1 | 1) => {
  const currentIndex = getTabIndex(tabId)
  if (currentIndex === -1) return null

  const nextTab = appTabs[currentIndex + delta]
  return nextTab?.path ?? null
}
