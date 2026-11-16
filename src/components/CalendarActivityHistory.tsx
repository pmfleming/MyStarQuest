import { type CSSProperties, type ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import { parseDateKey } from '../lib/today'
import {
  selectCalendarHistory,
  type CalendarHistoryEntry,
  type HistoryPeriod,
  type HistoryView,
} from '../lib/calendarHistory'
import { historyIcon } from '../ui/calendarHistoryAssets'
import { getThemeAsset } from '../ui/themeAssets'
import { getChoreImage } from '../assets/chores/assets'
import { getPresetChoreOverviewImage } from '../ui/choreOverviewAssets'
import { getRewardImage } from '../assets/rewards/assets'
import starImage from '../assets/global/star.svg'
import CalendarDateControl from './CalendarDateControl'
import ResourceLoadingIcon from './ui/ResourceLoadingIcon'
import ExpandableAgendaItem from './ExpandableAgendaItem'
import AgendaTime from './AgendaTime'
import { uiTokens } from '../tokens'
import './DayAgenda.css'
import './CalendarActivityHistory.css'

// Full descriptions are for assistive technology; the visible UI uses artwork and numbers.
const labels = {
  all: 'Activity history',
  completed: 'Chores & tasks completed',
  chores: 'Chores completed',
  tests: 'Tests completed',
  rewards: 'Rewards received',
}
const formatDay = (key: string) =>
  parseDateKey(key).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  })
function HistoryCount({
  image,
  value,
  label,
}: {
  image: string
  value: number | string
  label: string
}) {
  return (
    <span className="calendar-history__count" role="img" aria-label={label}>
      <img src={image} alt="" />
      <strong aria-hidden="true">{value}</strong>
    </span>
  )
}

function HistoryStars({ stars, reward }: { stars: number; reward: boolean }) {
  const sign = stars > 0 ? (reward ? '−' : '+') : ''
  return (
    <HistoryCount
      image={starImage}
      value={`${sign}${stars}`}
      label={`${stars} stars ${reward ? 'spent' : 'earned'}`}
    />
  )
}

function HistoryEntry({
  item,
  theme,
}: {
  item: CalendarHistoryEntry
  theme: Theme
}) {
  const artwork =
    item.kind === 'rewards'
      ? getRewardImage(item.imageKey, theme.id)
      : item.taskType === 'eating' || item.taskType === 'watertoiletcheck'
        ? getPresetChoreOverviewImage(item.taskType, theme.id)
        : getChoreImage(item.imageKey, theme.id)

  return (
    <ExpandableAgendaItem
      className="day-agenda__item calendar-history__item"
      ariaLabel={`${item.title}, ${item.kind === 'rewards' ? 'reward granted' : 'completed'}, ${item.stars} stars${item.pending ? ', waiting to sync' : ''}`}
      style={{
        background:
          item.kind === 'rewards'
            ? 'var(--history-reward)'
            : 'var(--history-tint)',
        borderColor: `${theme.colors.accent}70`,
      }}
    >
      {item.time ? (
        <AgendaTime value={item.time} label="At" />
      ) : (
        <span
          className="calendar-history__unknown"
          role="img"
          aria-label="Time not recorded"
        >
          —
        </span>
      )}
      <div className="calendar-history__artwork">
        <img
          src={artwork || historyIcon(theme, item.kind)}
          alt=""
          loading="lazy"
          decoding="async"
        />
        {item.pending && (
          <span className="calendar-history__pending">
            <ResourceLoadingIcon
              src={getThemeAsset(theme.id, 'clockIcon')}
              loading
              label="Waiting to sync"
              size={24}
            />
          </span>
        )}
      </div>
      <HistoryStars stars={item.stars} reward={item.kind === 'rewards'} />
    </ExpandableAgendaItem>
  )
}

export default function CalendarActivityHistory({
  theme,
  entries,
  view,
  onViewChange,
  period,
  onPeriodChange,
  childId,
  loading,
  error,
  children,
  agenda,
}: {
  theme: Theme
  entries: CalendarHistoryEntry[]
  view: HistoryView
  onViewChange: (view: HistoryView) => void
  period: HistoryPeriod
  onPeriodChange: (period: HistoryPeriod) => void
  childId: string | null
  loading: boolean
  error: boolean
  children?: ReactNode
  agenda?: ReactNode
}) {
  const { selectedDateKey } = useSelectedDate()
  const resultPeriod = view === 'all' ? 'day' : period
  const filtered = selectCalendarHistory(
    entries,
    selectedDateKey,
    view,
    resultPeriod
  )
  const periodEntries = selectCalendarHistory(
    entries,
    selectedDateKey,
    'all',
    period
  )
  const groups = new Map<string, CalendarHistoryEntry[]>()
  filtered.forEach((entry) =>
    groups.set(entry.dateKey, [...(groups.get(entry.dateKey) ?? []), entry])
  )
  const rewardCount = periodEntries.filter(
    (item) => item.kind === 'rewards'
  ).length
  const style: CSSProperties & Record<`--${string}`, string> = {
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    '--agenda-surface': theme.colors.surface,
    '--agenda-accent': theme.colors.accent,
    '--agenda-heading-font': theme.fonts.heading,
    '--history-tint': `${theme.colors.primary}08`,
    '--history-primary': theme.colors.primary,
    '--history-secondary': theme.colors.secondary,
    '--history-reward': `${theme.colors.accent}30`,
    '--history-radius': `${uiTokens.listActionRadius}px`,
  }
  return (
    <section
      className="calendar-history"
      aria-label="Activity history"
      style={style}
    >
      <CalendarDateControl
        theme={theme}
        period={period}
        onPeriodChange={onPeriodChange}
      >
        {children}
      </CalendarDateControl>
      <div
        className="calendar-history__views"
        role="group"
        aria-label="Calendar views"
      >
        {(
          [
            { value: 'all', label: 'Calendar', count: undefined },
            {
              value: 'completed',
              label: 'Chores/Tasks',
              count: periodEntries.length - rewardCount,
            },
            { value: 'rewards', label: 'Rewards', count: rewardCount },
          ] as const
        ).map(({ value, label, count }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={view === value}
            onClick={() => onViewChange(value)}
            style={{
              background:
                view === value ? theme.colors.primary : 'var(--history-tint)',
              color: view === value ? '#fff' : theme.colors.text,
            }}
          >
            <img src={historyIcon(theme, value)} alt="" />
            {count !== undefined && childId && !loading && !error && (
              <strong aria-hidden="true">{count}</strong>
            )}
          </button>
        ))}
      </div>
      {view === 'all' && agenda}
      {!childId ? (
        <div
          className="calendar-history__notice"
          role="status"
          aria-label="Select a child to see their history"
        >
          <img src={getThemeAsset(theme.id, 'childrenIcon')} alt="" />
          <span aria-hidden="true">?</span>
        </div>
      ) : loading ? (
        <div className="calendar-history__notice">
          <ResourceLoadingIcon
            src={historyIcon(theme, 'all')}
            loading
            label="Loading history"
            size={64}
          />
        </div>
      ) : (
        <>
          {error && (
            <div
              className="calendar-history__notice"
              role="alert"
              aria-label="History could not be loaded. Reopen the calendar to try again."
            >
              <img src={getThemeAsset(theme.id, 'quizIncorrectImage')} alt="" />
              <span aria-hidden="true">Unavailable</span>
            </div>
          )}
          {(!error || filtered.length > 0) && (
            <div
              className="sr-only"
              role="status"
              aria-label={
                filtered.length
                  ? `${filtered.length} history entries`
                  : `No ${view === 'all' ? 'activity recorded' : labels[view].toLowerCase()} this ${resultPeriod}`
              }
            />
          )}
          {[...groups].map(([day, items]) => (
            <section key={day} aria-label={`${labels[view]} for ${day}`}>
              {resultPeriod !== 'day' && (
                <h4 className="calendar-history__day">
                  <img
                    src={getThemeAsset(theme.id, 'storyProgressIcon')}
                    alt=""
                    aria-hidden="true"
                  />
                  <time dateTime={day}>{formatDay(day)}</time>
                  <span
                    className="calendar-history__day-sparkle"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </h4>
              )}
              <ul className="day-agenda__list">
                {items.map((item) => (
                  <HistoryEntry key={item.id} item={item} theme={theme} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  )
}
