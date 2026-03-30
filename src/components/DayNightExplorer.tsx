import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'
import Clock from './dayNightExplorer/Clock'
import SpinningPlanet from './dayNightExplorer/SpinningPlanet'
import './dayNightExplorer/dayNightExplorer.css'
import { explorerUi } from '../lib/dayNightExplorer/dayNightExplorer.constants'
import useDayNightExplorerModel from './dayNightExplorer/useDayNightExplorerModel'

type DayNightExplorerProps = {
  theme: Theme
}

export default function DayNightExplorer({ theme }: DayNightExplorerProps) {
  const explorer = useDayNightExplorerModel(theme)

  return (
    <div
      className="dne-shell"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: explorerUi.explorerGap,
        width: '100%',
        maxWidth: uiTokens.contentMaxWidth,
        margin: '0 auto',
      }}
    >
      <SpinningPlanet theme={theme} {...explorer.planet} />

      <Clock theme={theme} clock={explorer.clock} />
    </div>
  )
}
