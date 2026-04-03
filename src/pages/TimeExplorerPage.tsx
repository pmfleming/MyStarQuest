import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import TabContent from '../components/TabContent'
import TopIconButton from '../components/ui/TopIconButton'
import SchoolCalendar from '../components/SchoolCalendar'
import { getSurfaceWidthConstraints, uiTokens } from '../tokens'
import {
  princessCalendarIcon,
  princessClockIcon,
  princessThermometerIcon,
} from '../assets/themes/princess/assets'
import SpinningPlanet from '../components/dayNightExplorer/SpinningPlanet'
import Clock from '../components/dayNightExplorer/Clock'
import useDayNightExplorerModel from '../components/dayNightExplorer/useDayNightExplorerModel'
import '../components/dayNightExplorer/dayNightExplorer.css'

type ExplorerPanel = 'clock' | 'calendar'

const TimeExplorerPage = () => {
  const { theme } = useTheme()
  const [activePanel, setActivePanel] = useState<ExplorerPanel>('clock')
  const explorer = useDayNightExplorerModel(theme)

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
        <div className="flex items-center gap-2">
          <TopIconButton
            theme={theme}
            ariaLabel="Show clock"
            onClick={() => setActivePanel('clock')}
            selected={activePanel === 'clock'}
            icon={renderIcon('clock')}
          />

          <TopIconButton
            theme={theme}
            ariaLabel="Show calendar"
            onClick={() => setActivePanel('calendar')}
            selected={activePanel === 'calendar'}
            icon={renderIcon('calendar')}
          />

          <TopIconButton
            theme={theme}
            ariaLabel="Temperature view coming later"
            onClick={() => undefined}
            icon={renderIcon('thermometer')}
          />
        </div>
      }
    >
      <div
        className="mx-auto flex w-full flex-col"
        style={{
          ...getSurfaceWidthConstraints(),
          gap: `${uiTokens.singleVerticalSpace}px`,
          paddingBottom: '96px',
        }}
      >
        <SpinningPlanet theme={theme} {...explorer.planet} />

        <div
          style={{
            width: '100%',
          }}
        >
          <div style={{ minWidth: 0, width: '100%' }}>
            {activePanel === 'clock' ? (
              <Clock theme={theme} clock={explorer.clock} />
            ) : (
              <SchoolCalendar theme={theme} />
            )}
          </div>
        </div>
      </div>
    </TabContent>
  )
}

export default TimeExplorerPage
