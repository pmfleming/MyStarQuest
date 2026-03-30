import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/ui/TopIconButton'
import SchoolCalendar from '../components/SchoolCalendar'
import { clearSchoolCalendarCache } from '../lib/schoolCalendarCache'
import { uiTokens } from '../tokens'
import {
  princessCalendarIcon,
  princessClockIcon,
  princessResetIcon,
  princessThermometerIcon,
} from '../assets/themes/princess/assets'
import SpinningPlanet from '../components/dayNightExplorer/SpinningPlanet'
import Clock from '../components/dayNightExplorer/Clock'
import useDayNightExplorerModel from '../components/dayNightExplorer/useDayNightExplorerModel'
import '../components/dayNightExplorer/dayNightExplorer.css'

type ExplorerPanel = 'clock' | 'calendar'

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const [calendarKey, setCalendarKey] = useState(0)
  const [activePanel, setActivePanel] = useState<ExplorerPanel>('clock')
  const explorer = useDayNightExplorerModel(theme)

  const sharedButtonStyle = {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    border: `3px solid ${theme.colors.accent}`,
    background: theme.colors.surface,
    boxShadow: `0 12px 28px ${theme.colors.accent}22`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition:
      'transform 180ms ease, box-shadow 180ms ease, background 180ms ease',
  } as const

  const renderIcon = (kind: 'clock' | 'calendar' | 'thermometer') => {
    if (theme.id === 'princess') {
      const source =
        kind === 'clock'
          ? princessClockIcon
          : kind === 'calendar'
            ? princessCalendarIcon
            : princessThermometerIcon

      return (
        <img
          src={source}
          alt=""
          aria-hidden="true"
          style={{
            width: '27px',
            height: '27px',
            objectFit: 'contain',
          }}
        />
      )
    }

    return (
      <span
        aria-hidden="true"
        style={{
          fontSize: '2rem',
          lineHeight: 1,
        }}
      >
        {kind === 'clock' ? '🕒' : kind === 'calendar' ? '📅' : '🌡️'}
      </span>
    )
  }

  return (
    <TabContent
      theme={theme}
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
        <SpinningPlanet theme={theme} {...explorer.planet} />

        <div
          style={{
            width: '100%',
            position: 'relative',
            paddingTop: '21px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: '6px',
              transform: 'translateY(-50%)',
              zIndex: 10,
            }}
          >
            <button
              type="button"
              aria-label="Show clock"
              aria-pressed={activePanel === 'clock'}
              onClick={() => setActivePanel('clock')}
              style={{
                ...sharedButtonStyle,
                background:
                  activePanel === 'clock'
                    ? `${theme.colors.accent}22`
                    : theme.colors.surface,
                boxShadow:
                  activePanel === 'clock'
                    ? `0 14px 32px ${theme.colors.accent}33`
                    : sharedButtonStyle.boxShadow,
                transform:
                  activePanel === 'clock' ? 'translateY(-2px)' : 'none',
              }}
            >
              {renderIcon('clock')}
            </button>

            <button
              type="button"
              aria-label="Show calendar"
              aria-pressed={activePanel === 'calendar'}
              onClick={() => setActivePanel('calendar')}
              style={{
                ...sharedButtonStyle,
                background:
                  activePanel === 'calendar'
                    ? `${theme.colors.accent}22`
                    : theme.colors.surface,
                boxShadow:
                  activePanel === 'calendar'
                    ? `0 14px 32px ${theme.colors.accent}33`
                    : sharedButtonStyle.boxShadow,
                transform:
                  activePanel === 'calendar' ? 'translateY(-2px)' : 'none',
              }}
            >
              {renderIcon('calendar')}
            </button>

            <button
              type="button"
              aria-label="Temperature view coming later"
              onClick={() => undefined}
              style={sharedButtonStyle}
            >
              {renderIcon('thermometer')}
            </button>
          </div>

          {activePanel === 'clock' ? (
            <Clock theme={theme} clock={explorer.clock} />
          ) : (
            <SchoolCalendar key={calendarKey} theme={theme} />
          )}
        </div>
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
