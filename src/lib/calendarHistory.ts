import { buildDateKey, getTodayDescriptor, parseDateKey } from './today'

export type HistoryKind = 'chores' | 'tests' | 'rewards' | 'activity'
export type HistoryView = 'all' | 'completed' | 'chores' | 'tests' | 'rewards'
export type HistoryPeriod = 'day' | 'week' | 'month' | 'year'
export type HistoryDocument = { id: string; data: Record<string, unknown> }
export type CalendarHistoryEntry = {
  id: string
  kind: HistoryKind
  title: string
  dateKey: string
  time?: string
  timestamp: number
  stars: number
  imageKey: string
  taskType: string
  pending: boolean
  outcome: string
}

const hasDateConverter = (value: object): value is { toDate: () => unknown } =>
  'toDate' in value && typeof value.toDate === 'function'

function asDate(value: unknown): Date | undefined {
  if (typeof value === 'number') value = new Date(value)
  if (value && typeof value === 'object' && hasDateConverter(value))
    value = value.toDate()
  return value instanceof Date && Number.isFinite(value.getTime())
    ? value
    : undefined
}
const finite = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0
const text = (value: unknown) => (typeof value === 'string' ? value : '')
const fallbackTitles: Record<HistoryKind, string> = {
  rewards: 'Granted reward',
  tests: 'Completed test',
  chores: 'Completed chore',
  activity: 'Completed activity',
}

export function buildCalendarHistory(
  events: HistoryDocument[],
  redemptions: HistoryDocument[],
  chores: HistoryDocument[],
  tests: HistoryDocument[],
  rewards: HistoryDocument[],
  timeZone: string
): CalendarHistoryEntry[] {
  const choreMap = new Map(chores.map((item) => [item.id, item.data]))
  const testMap = new Map(tests.map((item) => [item.id, item.data]))
  const rewardMap = new Map(rewards.map((item) => [item.id, item.data]))
  return [
    ...events.map((item) => ({ ...item, reward: false })),
    ...redemptions.map((item) => ({ ...item, reward: true })),
  ]
    .flatMap(({ id, data, reward }) => {
      const taskId = text(data.taskId)
      const kind: HistoryKind = reward
        ? 'rewards'
        : data.taskCollection === 'tests' ||
            (!data.taskCollection && testMap.has(taskId))
          ? 'tests'
          : data.taskCollection === 'chores' ||
              (!data.taskCollection && choreMap.has(taskId))
            ? 'chores'
            : 'activity'
      const definition = reward
        ? rewardMap.get(text(data.rewardId))
        : kind === 'tests'
          ? testMap.get(taskId)
          : choreMap.get(taskId)
      const date = asDate(data.occurredAt) ?? asDate(data.createdAt)
      const storedDay = text(data.dateKey)
      const dateKey =
        /^\d{4}-\d{2}-\d{2}$/.test(storedDay) &&
        buildDateKey(parseDateKey(storedDay)) === storedDay
          ? storedDay
          : date
            ? getTodayDescriptor(date, timeZone).dateKey
            : ''
      if (!dateKey) return []
      return [
        {
          id: `${reward ? 'reward' : 'task'}-${id}`,
          kind,
          title:
            text(reward ? (data.rewardTitle ?? data.title) : data.taskTitle) ||
            text(definition?.title) ||
            fallbackTitles[kind],
          dateKey,
          time: date?.toLocaleTimeString('en-GB', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          timestamp: date?.getTime() ?? 0,
          stars: finite(reward ? data.costStars : data.delta),
          imageKey: text(data.imageKey ?? definition?.imageKey),
          taskType: text(data.taskType ?? definition?.taskType),
          pending: data.pending === true,
          outcome: text(data.outcome) || 'success',
        },
      ]
    })
    .sort(
      (a, b) =>
        b.dateKey.localeCompare(a.dateKey) ||
        b.timestamp - a.timestamp ||
        a.id.localeCompare(b.id)
    )
}

export function historyRange(dateKey: string, period: HistoryPeriod) {
  const start = parseDateKey(dateKey)
  const end = parseDateKey(dateKey)
  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 6)
  } else if (period === 'month') {
    start.setDate(1)
    end.setMonth(end.getMonth() + 1, 0)
  } else if (period === 'year') {
    start.setMonth(0, 1)
    end.setMonth(11, 31)
  }
  return { start: buildDateKey(start), end: buildDateKey(end) }
}

export function shiftHistoryDate(
  dateKey: string,
  period: HistoryPeriod,
  delta: number
) {
  const date = parseDateKey(dateKey)
  if (period === 'day' || period === 'week')
    date.setDate(date.getDate() + delta * (period === 'week' ? 7 : 1))
  else {
    const day = date.getDate()
    date.setDate(1)
    date.setMonth(date.getMonth() + delta * (period === 'year' ? 12 : 1))
    date.setDate(
      Math.min(
        day,
        new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      )
    )
  }
  return buildDateKey(date)
}

export function selectCalendarHistory(
  entries: CalendarHistoryEntry[],
  dateKey: string,
  view: HistoryView,
  period: HistoryPeriod
) {
  const { start, end } = historyRange(dateKey, period)
  return entries.filter(
    (entry) =>
      entry.dateKey >= start &&
      entry.dateKey <= end &&
      (view === 'all' ||
        (view === 'completed' ? entry.kind !== 'rewards' : entry.kind === view))
  )
}
