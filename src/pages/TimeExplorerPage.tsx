import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import DayNightExplorer from '../components/DayNightExplorer'
import TopIconButton from '../components/TopIconButton'
import SchoolCalendar from '../components/SchoolCalendar'
import { clearSchoolCalendarCache } from '../lib/schoolCalendarCache'
import { uiTokens } from '../ui/tokens'
import { princessResetIcon } from '../assets/themes/princess/assets'

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const [calendarKey, setCalendarKey] = useState(0)

  return (
    <PageShell
      theme={theme}
      activeTabId="time-explorer"
      title="Time Explorer"
      headerRight={
        <TopIconButton
          theme={theme}
          onClick={() => {
            clearSchoolCalendarCache()
            setCalendarKey((currentKey) => currentKey + 1)
          }}
          ariaLabel="Refresh calendar"
          icon={
            theme.id === 'princess' ? (
              <img
                src={princessResetIcon}
                alt="Refresh calendar"
                className="h-10 w-10 object-contain"
              />
            ) : (
              <span className="text-2xl" role="img" aria-hidden="true">
                🔄
              </span>
            )
          }
        />
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          maxWidth: `${uiTokens.contentMaxWidth}px`,
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        <SchoolCalendar key={calendarKey} theme={theme} />

        <DayNightExplorer theme={theme} />
      </div>
    </PageShell>
  )
}

export default TimeExplorerPage
