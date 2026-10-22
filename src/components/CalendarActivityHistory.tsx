import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { useSelectedDate } from '../contexts/SelectedDateContext'
import { parseDateKey } from '../lib/today'
import {
  selectCalendarHistory,
  shiftHistoryDate,
  type CalendarHistoryEntry,
  type HistoryPeriod,
  type HistoryView,
} from '../lib/calendarHistory'
import { historyIcon, historyPeriodIcons } from '../ui/calendarHistoryAssets'
import { getThemeAsset } from '../ui/themeAssets'
import { getChoreImage } from '../assets/chores/assets'
import { getRewardImage } from '../assets/rewards/assets'
import starImage from '../assets/global/star.svg'
import SegmentedChoiceControl from './ui/SegmentedChoiceControl'
import ResourceLoadingIcon from './ui/ResourceLoadingIcon'
import ExpandableAgendaItem from './ExpandableAgendaItem'
import AgendaTime from './AgendaTime'
import { uiTokens } from '../tokens'
import './DayAgenda.css'
import './CalendarActivityHistory.css'

// Full descriptions are for assistive technology; the visible UI uses artwork and numbers.
const labels = {
  all: 'Activity history',
  completed: 'Chores & tests completed',
  chores: 'Chores completed',
  tests: 'Tests completed',
  rewards: 'Rewards granted',
}
const formatDay = (key: string) =>
  parseDateKey(key).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
          src={
            (item.kind === 'rewards'
              ? getRewardImage(item.imageKey, theme.id)
              : getChoreImage(item.imageKey, theme.id)) ||
            historyIcon(theme, item.kind)
          }
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
  childId,
  loading,
  error,
  children,
}: {
  theme: Theme
  entries: CalendarHistoryEntry[]
  view: HistoryView
  onViewChange: (view: HistoryView) => void
  childId: string | null
  loading: boolean
  error: boolean
  children?: ReactNode
}) {
  const { selectedDateKey, setSelectedDateKey } = useSelectedDate()
  const [taskPeriod, setTaskPeriod] = useState<HistoryPeriod>('day')
  const [rewardPeriod, setRewardPeriod] = useState<HistoryPeriod>('day')
  const period = view === 'rewards' ? rewardPeriod : taskPeriod
  const filtered = selectCalendarHistory(entries, selectedDateKey, view, period)
  const groups = new Map<string, CalendarHistoryEntry[]>()
  filtered.forEach((entry) =>
    groups.set(entry.dateKey, [...(groups.get(entry.dateKey) ?? []), entry])
  )
  const rewardCount = filtered.filter((item) => item.kind === 'rewards').length
  const stars = filtered.reduce((sum, item) => sum + item.stars, 0)
  const style: CSSProperties & Record<`--${string}`, string> = {
    color: theme.colors.text,
    fontFamily: theme.fonts.heading,
    '--agenda-surface': theme.colors.surface,
    '--agenda-accent': theme.colors.accent,
    '--agenda-heading-font': theme.fonts.heading,
    '--history-tint': `${theme.colors.primary}08`,
    '--history-reward': `${theme.colors.accent}30`,
    '--history-radius': `${uiTokens.listActionRadius}px`,
  }
  return (
    <section
      className="calendar-history"
      aria-label="Activity history"
      style={style}
    >
      <SegmentedChoiceControl
        theme={theme}
        value={view}
        onChange={onViewChange}
        ariaLabel="History type"
        options={(
          ['all', 'completed', 'chores', 'tests', 'rewards'] as const
        ).map((value) => ({
          value,
          label: value === 'all' ? 'All activity' : labels[value],
          icon: historyIcon(theme, value),
        }))}
      />
      <SegmentedChoiceControl<HistoryPeriod>
        theme={theme}
        value={period}
        ariaLabel="History period"
        onChange={view === 'rewards' ? setRewardPeriod : setTaskPeriod}
        options={(view === 'rewards'
          ? (['day', 'month', 'year'] as const)
          : (['day', 'week', 'month'] as const)
        ).map((value) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1),
          icon: historyPeriodIcons[value],
        }))}
      />
      <div
        className="calendar-history__navigation"
        role="group"
        aria-label="Calendar navigation"
      >
        <button
          type="button"
          aria-label={`Previous calendar ${period}`}
          onClick={() =>
            setSelectedDateKey(shiftHistoryDate(selectedDateKey, period, -1))
          }
        >
          ◀
        </button>
        <time
          dateTime={selectedDateKey}
          aria-label="Calendar date"
          aria-live="polite"
        >
          {formatDay(selectedDateKey)}
        </time>
        <button
          type="button"
          aria-label={`Next calendar ${period}`}
          onClick={() =>
            setSelectedDateKey(shiftHistoryDate(selectedDateKey, period, 1))
          }
        >
          ▶
        </button>
      </div>
      {children}
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
              className="calendar-history__totals"
              role="status"
              aria-label={
                filtered.length
                  ? `${filtered.length} history entries`
                  : `No ${view === 'all' ? 'activity recorded' : labels[view].toLowerCase()} this ${period}`
              }
            >
              {view === 'all' ? (
                <>
                  <HistoryCount
                    image={historyIcon(theme, 'completed')}
                    value={filtered.length - rewardCount}
                    label={`${filtered.length - rewardCount} completed activities`}
                  />
                  <HistoryCount
                    image={historyIcon(theme, 'rewards')}
                    value={rewardCount}
                    label={`${rewardCount} rewards granted`}
                  />
                </>
              ) : (
                <>
                  <HistoryCount
                    image={historyIcon(theme, view)}
                    value={filtered.length}
                    label={`${filtered.length} ${labels[view].toLowerCase()}`}
                  />
                  <HistoryStars stars={stars} reward={view === 'rewards'} />
                </>
              )}
            </div>
          )}
          {[...groups].map(([day, items]) => (
            <section key={day} aria-label={`${labels[view]} for ${day}`}>
              {period !== 'day' && (
                <h4 className="calendar-history__day">
                  <time dateTime={day}>{formatDay(day)}</time>
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
