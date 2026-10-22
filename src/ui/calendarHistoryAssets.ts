import type { HistoryPeriod } from '../lib/calendarHistory'
import day from '../assets/calendar/period-day.svg'
import week from '../assets/calendar/period-week.svg'
import month from '../assets/calendar/period-month.svg'
import year from '../assets/calendar/period-year.svg'

import type { Theme } from '../contexts/ThemeContext'
import { getThemeAsset, type ThemeAssetRole } from './themeAssets'

const historyRoles: Record<string, ThemeAssetRole> = {
  completed: 'quizCorrectImage',
  rewards: 'rewardsIcon',
  tests: 'mathsIcon',
  chores: 'choresIcon',
}

export const historyIcon = (theme: Theme, kind: string) =>
  getThemeAsset(theme.id, historyRoles[kind] ?? 'calendarIcon')

export const historyPeriodIcons: Record<HistoryPeriod, string> = {
  day,
  week,
  month,
  year,
}
