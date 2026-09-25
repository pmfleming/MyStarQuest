import { getTodayDescriptor } from './today'

// Matches generateDailyTodos: 00:05 in the app's Europe/London timezone.
export const getNightlyResetKey = (now = Date.now()) =>
  getTodayDescriptor(new Date(now - 5 * 60_000)).dateKey
